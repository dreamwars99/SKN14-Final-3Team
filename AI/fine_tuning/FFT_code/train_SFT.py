# apt-get update -y
# apt install tmux
# pip install unsloth
# pip install transformers==4.55.4
# pip install wandb
# export HF_TOKEN="자신의 API 넣기!"
# export WANDB_API_KEY="자신의 API 넣기!"
# train_full_model.py

import os
import torch
from datasets import load_dataset
from unsloth import FastLanguageModel
from trl import SFTTrainer, SFTConfig
from huggingface_hub import login
from transformers import AutoTokenizer

# ===================================================================================
# 1. 설정 (CONFIGURATION)
# ===================================================================================
# Hugging Face Hub 사용자 이름 또는 조직 이름
HF_USERNAME = "sssssungjae" # <--- 🙋‍♂️ 여기에 본인의 Hugging Face ID를 입력하세요.

# 🌟 WandB 설정
WANDB_PROJECT_NAME = "qwen2.5-7b-finance-full-finetune-v4" # <--- 🙋‍♂️ WandB에 표시될 프로젝트 이름

# 모델 및 토크나이저 설정
BASE_MODEL_NAME = "unsloth/Qwen2.5-7B-Instruct" # <--- 🌟 Instruct 모델로 변경
MAX_SEQ_LENGTH = 4096


# 데이터셋 설정
DATASET_REPO_NAME = "sssssungjae/combined-dataset-40K-krx"
DATASET_SPLIT = "train"
DATASET_TEXT_FIELD = "text"  # 실제 컬럼명과 다르면 수정하세요.

# 평가 데이터셋 설정 (옵션)
# 환경변수로 덮어쓰기 가능: EVAL_DATASET_REPO, EVAL_DATASET_SPLIT
EVAL_DATASET_REPO_NAME = os.environ.get("EVAL_DATASET_REPO", "sssssungjae/combined-dataset-40K-krx")
EVAL_DATASET_SPLIT = os.environ.get("EVAL_DATASET_SPLIT", "test")
EVAL_EVERY_STEPS = int(os.environ.get("EVAL_EVERY_STEPS", "0"))  # 0이면 epoch 또는 비활성화

# 학습 하이퍼파라미터
TRAINING_EPOCHS = 3
BATCH_SIZE = 4
GRADIENT_ACCUMULATION = 8
LEARNING_RATE = 1e-5
# H100에서는 8-bit 옵티마이저보다 fused AdamW가 일반적으로 더 빠릅니다.
OPTIMIZER = "adamw_torch_fused"


# GGUF 양자화 타입 제어.
ENV_GGUF_QUANT = os.environ.get("GGUF_QUANT", "q4_k_m")

# 저장 및 업로드 설정
LOCAL_FULL_MODEL_PATH = "full_model"
LOCAL_GGUF_PATH = "model_gguf"
HUB_FULL_REPO = f"{HF_USERNAME}/qwen2_5-7b-finance-full-final-hard-20_20"
HUB_GGUF_REPO = f"{HF_USERNAME}/qwen2_5-7b-finance-full-gguf-final-hard-20_20"

# ===================================================================================
# 1.5. 데이터 전처리 유틸
# ===================================================================================
def tokenize_dataset(dataset, tokenizer, text_field: str):
    """Unsloth의 fix_untrained_tokens가 `input_ids`를 기대하므로 사전 토크나이즈합니다."""
    def _map_fn(batch):
        texts = batch[text_field]
        return tokenizer(
            texts,
            truncation=True,
            max_length=MAX_SEQ_LENGTH,
            padding=False,
            add_special_tokens=True,
        )

    remove_cols = dataset.column_names
    return dataset.map(
        _map_fn,
        batched=True,
        remove_columns=remove_cols,
        desc="Tokenizing dataset",
    )

# ===================================================================================
# 2. 모델 학습 함수
# ===================================================================================
def train_model(model, tokenizer, train_dataset, eval_dataset=None):
    """준비된 모델/토크나이저로 학습만 수행합니다."""
    print("\n step 2: Full-Finetuning 학습 시작...")
    # 학습 안정성을 위한 필수 설정 (안전 차원에서 한 번 더)
    if hasattr(model, "config"):
        model.config.use_cache = False

    # SFTTrainer 설정 (동적)
    training_kwargs = dict(
        per_device_train_batch_size=BATCH_SIZE,
        gradient_accumulation_steps=GRADIENT_ACCUMULATION,
        warmup_ratio=0.1,
        learning_rate=LEARNING_RATE,
        logging_steps=100,
        optim=OPTIMIZER,
        weight_decay=0.01,
        lr_scheduler_type="cosine",
        seed=3407,
        output_dir="outputs",
        report_to="wandb",
        bf16=True,
        fp16=False,
        gradient_checkpointing=True,
        gradient_checkpointing_kwargs={"use_reentrant": False},
    )
    # 평가 전략 (eval 데이터가 있을 때만)
    if eval_dataset is not None:
        if EVAL_EVERY_STEPS > 0:
            training_kwargs.update({
                "eval_strategy": "steps",
                "eval_steps": EVAL_EVERY_STEPS,
                "per_device_eval_batch_size": BATCH_SIZE,
            })
        else:
            training_kwargs.update({
                "eval_strategy": "epoch",
                "per_device_eval_batch_size": BATCH_SIZE,
            })
    # 진짜 학습: 에폭 기반으로 고정
    training_kwargs.update({"num_train_epochs": TRAINING_EPOCHS})

    trainer = SFTTrainer(
        model=model,
        tokenizer=tokenizer,
        train_dataset=train_dataset,
        eval_dataset=eval_dataset,
        max_seq_length=MAX_SEQ_LENGTH,
        args=SFTConfig(**training_kwargs),
    )

    # 🌟 WandB 프로젝트 이름 환경 변수 설정
    os.environ["WANDB_PROJECT"] = WANDB_PROJECT_NAME

    # 학습 실행
    trainer.train()
    # 최종 평가 한 번 더 (eval 데이터가 있을 경우)
    if eval_dataset is not None:
        try:
            eval_metrics = trainer.evaluate()
            print(f"✅ Final eval metrics: {eval_metrics}")
        except Exception as e:
            print(f"⚠️ Final evaluate failed: {e}")
    
    print("✅ 모델 학습 완료.")
    return model, tokenizer

# ===================================================================================
# 3. 모델 저장 및 업로드 함수
# ===================================================================================
def save_and_upload_models(model, tokenizer):
    """학습된 전체 모델을 저장하고 Hub에 업로드합니다."""
    print("\n step 3: 모델 저장 및 업로드 시작...")

    try:
        login(token=os.environ.get("HF_TOKEN"))
    except Exception as e:
        print("Hugging Face 로그인이 필요합니다. export HF_TOKEN='내토큰' 명령어로 토큰을 설정해주세요.")
        print(f"로그인 오류: {e}")
        return

    # 1. Full-Finetuning된 모델 저장 및 업로드 (16비트)
    print("\n(1/2) Full-Finetuning 모델 저장 및 업로드 중...")
    model.save_pretrained(LOCAL_FULL_MODEL_PATH) # 로컬에 저장
    tokenizer.save_pretrained(LOCAL_FULL_MODEL_PATH)
    model.push_to_hub(HUB_FULL_REPO, token=True) # Hub에 업로드
    tokenizer.push_to_hub(HUB_FULL_REPO, token=True)
    print(f"✅ 전체 모델 업로드 완료: {HUB_FULL_REPO}")

    # 2. GGUF 모델 저장 및 업로드 (모델/버전에 따라 미지원일 수 있음)
    try:
        print("\n(2/2) GGUF 모델 저장 및 업로드 중...")
        model.push_to_hub_gguf(
            HUB_GGUF_REPO,
            tokenizer,
            quantization_method=ENV_GGUF_QUANT,
            token=True,
        )
        print(f"✅ GGUF 모델 업로드 완료: {HUB_GGUF_REPO} ({ENV_GGUF_QUANT})")
    except Exception as e1:
        print(f"⚠️ GGUF({ENV_GGUF_QUANT}) 실패: {e1}. 'q8_0'으로 재시도합니다...")
        try:
            model.push_to_hub_gguf(
                HUB_GGUF_REPO,
                tokenizer,
                quantization_method="q8_0",
                token=True,
            )
            print(f"✅ GGUF 모델 업로드 완료: {HUB_GGUF_REPO} (q8_0)")
        except Exception as e2:
            print(f"⚠️ GGUF 내보내기/업로드가 지원되지 않거나 실패했습니다: {e2}")

# ===================================================================================
# 4. 메인 실행 블록
# ===================================================================================
if __name__ == "__main__":
    # WandB 프로젝트 이름 먼저 설정
    os.environ["WANDB_PROJECT"] = WANDB_PROJECT_NAME

    # 1. 토크나이저: Instruct 모델 토크나이저를 그대로 사용 (템플릿 이식 불필요)
    print("  step 0: Instruct 토크나이저 로딩 중...")
    base_tokenizer = AutoTokenizer.from_pretrained(BASE_MODEL_NAME, use_fast=True)
    print("✅ Instruct 토크나이저 로딩 완료.")
    
    # 데이터 전처리 간소화
    print("\n✅ Step 1: Loading dataset...")
    dataset = load_dataset(DATASET_REPO_NAME, split=DATASET_SPLIT)
    # 선택: 평가 데이터셋 로드 (환경 변수로 지정된 경우)
    eval_dataset = None ######
    if EVAL_DATASET_REPO_NAME:
        try:
            print("✅ Loading eval dataset...")
            eval_dataset = load_dataset(EVAL_DATASET_REPO_NAME, split=EVAL_DATASET_SPLIT)
        except Exception as e:
            print(f"⚠️ Eval dataset load failed: {e}. Proceeding without eval.")
    
    # 2. 모델/토크나이저 준비 (학습 시작 전 동기화)
    # - 모델 로드
    model, _ = FastLanguageModel.from_pretrained(
        model_name=BASE_MODEL_NAME,
        max_seq_length=MAX_SEQ_LENGTH,
        load_in_4bit=False,
        full_finetuning=True,
        torch_dtype=torch.bfloat16,
    )
    # - special tokens 설정을 모델 config에도 반영
    print("Updating model config with special tokens from the tokenizer...")
    if base_tokenizer.eos_token_id is not None:
        model.config.eos_token_id = base_tokenizer.eos_token_id
        model.generation_config.eos_token_id = base_tokenizer.eos_token_id
    if base_tokenizer.pad_token_id is not None:
        model.config.pad_token_id = base_tokenizer.pad_token_id
        model.generation_config.pad_token_id = base_tokenizer.pad_token_id
    print("✅ Model config updated successfully.")
    
    # - lm-eval-harness 대비: 토크나이저 vocab을 모델 임베딩 크기에 맞춰 선제 정렬
    model_vocab = model.get_input_embeddings().weight.shape[0]
    tok_vocab = len(base_tokenizer)
    if tok_vocab < model_vocab:
        need = model_vocab - tok_vocab
        filler = [f"<unused_{i}>" for i in range(need)]
        base_tokenizer.add_tokens(filler, special_tokens=False)
        print(f"🔧 Added {need} filler tokens to tokenizer. New vocab size: {len(base_tokenizer)} (model: {model_vocab})")
    elif tok_vocab == model_vocab:
        print(f"✅ Tokenizer vocab already matches model embeddings: {tok_vocab}")
    else:
        print(f"⚠️ Tokenizer vocab ({tok_vocab}) > model embeddings ({model_vocab}). Consider resizing model if needed.")

    # 3. 데이터 토크나이즈 및 학습
    dataset = tokenize_dataset(dataset, base_tokenizer, DATASET_TEXT_FIELD)
    if eval_dataset is not None:
        eval_dataset = tokenize_dataset(eval_dataset, base_tokenizer, DATASET_TEXT_FIELD)

    trained_model, trained_tokenizer = train_model(
        model=model,
        tokenizer=base_tokenizer,
        train_dataset=dataset,
        eval_dataset=eval_dataset,
    )
    
    # 3. 모델 저장 및 업로드
    save_and_upload_models(model=trained_model, tokenizer=trained_tokenizer)
    
    print("\n🎉 The entire full fine-tuning process is complete!")
