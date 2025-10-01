# apt-get update -y
# apt install tmux
# pip install unsloth
# pip install transformers==4.55.4
# pip install wandb

import argparse
import os

import torch
from datasets import load_dataset
from unsloth import FastLanguageModel, PatchDPOTrainer, is_bfloat16_supported
from trl import DPOConfig, DPOTrainer


def main(args):
    PatchDPOTrainer()

    bf16_available = is_bfloat16_supported()

    output_dir = args.output_dir or "dpo_outputs"
    os.makedirs(output_dir, exist_ok=True)

    hub_model_id = args.hub_model_id
    if args.push_to_hub and hub_model_id is None:
        hub_model_id = os.path.basename(os.path.normpath(output_dir)) or "dpo-model"

    eval_steps = args.eval_steps if args.eval_strategy == "steps" else None

    training_args = DPOConfig(
        output_dir=output_dir,
        learning_rate=args.learning_rate,
        per_device_train_batch_size=args.per_device_train_batch_size,
        per_device_eval_batch_size=args.per_device_eval_batch_size,
        lr_scheduler_type="cosine",
        bf16=bf16_available and not args.disable_bf16,
        fp16=not bf16_available,
        gradient_accumulation_steps=args.gradient_accumulation_steps,
        num_train_epochs=args.num_train_epochs,
        max_steps=args.max_steps,
        save_strategy="epoch",
        report_to=args.report_to,
        eval_strategy=args.eval_strategy,
        eval_steps=eval_steps,
        logging_steps=args.logging_steps,
        push_to_hub=False,
        hub_model_id=None,
        hub_strategy="end",
        hub_token=None,
        hub_private_repo=None,
    )

    dtype = torch.bfloat16 if bf16_available and not args.disable_bf16 else None

    model, tokenizer = FastLanguageModel.from_pretrained(
        model_name=args.model_name_or_path,
        max_seq_length=args.max_length,
        dtype=dtype,
        load_in_4bit=False,
        device_map=args.device_map,
    )

    if not tokenizer.pad_token:
        tokenizer.pad_token = tokenizer.eos_token
        tokenizer.pad_token_id = tokenizer.eos_token_id
    # tokenizer.padding_side = "right"
    tokenizer.model_max_length = args.max_length

    if args.dataset_name:
        dataset_dict = load_dataset(args.dataset_name)
        train_split_name = args.train_split_name or "train"

        if train_split_name not in dataset_dict:
            raise ValueError(f"Split '{train_split_name}' not found in dataset {args.dataset_name}")

        if args.eval_split_name:
            if args.eval_split_name not in dataset_dict:
                raise ValueError(f"Split '{args.eval_split_name}' not found in dataset {args.dataset_name}")
            train_dataset = dataset_dict[train_split_name]
            eval_dataset = dataset_dict[args.eval_split_name]
        else:
            base_split = dataset_dict[train_split_name]
            if not 0 < args.eval_ratio < 1:
                raise ValueError("--eval_ratio must be between 0 and 1 when creating a validation split")
            split_dataset = base_split.train_test_split(test_size=args.eval_ratio,
                                                        seed=args.seed)
            train_dataset = split_dataset["train"]
            eval_dataset = split_dataset["test"]
    else:
        if not args.train_data_path or not args.eval_data_path:
            raise ValueError("Provide either --dataset_name or both --train_data_path and --eval_data_path")

        train_dataset = load_dataset('json', data_files=args.train_data_path, split="train")
        eval_dataset = load_dataset('json', data_files=args.eval_data_path, split="train")

    required_columns = (args.prompt_column, args.chosen_column, args.rejected_column)

    for column in required_columns:
        if column not in train_dataset.column_names:
            raise ValueError(f"Column '{column}' not found in training dataset")
        if column not in eval_dataset.column_names:
            raise ValueError(f"Column '{column}' not found in evaluation dataset")

    def format_record(samples):
        return {
            "prompt": samples[args.prompt_column],
            "chosen": samples[args.chosen_column],
            "rejected": samples[args.rejected_column],
        }

    train_cols = train_dataset.column_names
    eval_cols = eval_dataset.column_names

    train_dataset = train_dataset.map(format_record,
                                      batched=True,
                                      remove_columns=train_cols)

    eval_dataset = eval_dataset.map(format_record,
                                    batched=True,
                                    remove_columns=eval_cols)

    model = FastLanguageModel.get_peft_model(
        model,
        r=args.lora_r,
        target_modules=[
            "q_proj",
            "k_proj",
            "v_proj",
            "o_proj",
            "gate_proj",
            "up_proj",
            "down_proj",
        ],
        lora_alpha=args.lora_alpha,
        lora_dropout=args.lora_dropout,
        bias="none",
        use_gradient_checkpointing="unsloth" if args.use_gradient_checkpointing else False,
        random_state=args.seed,
        max_seq_length=args.max_length,
    )

    model.print_trainable_parameters()
    model.config.use_cache = False
    model.enable_input_require_grads()

    ref_model, _ = FastLanguageModel.from_pretrained(
        model_name=args.model_name_or_path,
        max_seq_length=args.max_length,
        dtype=dtype,
        load_in_4bit=False,
        device_map=args.device_map,
    )

    ref_model.config.eos_token_id = tokenizer.eos_token_id
    ref_model.config.pad_token_id = tokenizer.pad_token_id

    trainer = DPOTrainer(model=model,
                         ref_model=ref_model,
                         args=training_args,
                         train_dataset=train_dataset,
                         eval_dataset=eval_dataset,
                         tokenizer=tokenizer,
                         beta=args.beta,
                         max_length=args.max_length,
                         max_target_length=args.max_target_length,
                         max_prompt_length=args.max_prompt_length)
    trainer.train()

    eval_metrics = None
    if eval_dataset is not None and args.eval_strategy != "no":
        eval_metrics = trainer.evaluate()
        trainer.log_metrics("eval", eval_metrics)
        trainer.save_metrics("eval", eval_metrics)

    adapter_dir = os.path.join(output_dir, "adapter")
    os.makedirs(adapter_dir, exist_ok=True)
    trainer.model.save_pretrained(adapter_dir)
    tokenizer.save_pretrained(adapter_dir)

    merged_model = trainer.model.merge_and_unload()

    merged_dir = os.path.join(output_dir, "merged")
    os.makedirs(merged_dir, exist_ok=True)
    merged_model.save_pretrained(merged_dir, safe_serialization=True)
    tokenizer.save_pretrained(merged_dir)

    if args.push_to_hub:
        print(f"\nUploading merged model to {hub_model_id}...")
        merged_model.push_to_hub(
            hub_model_id,
            token=args.hub_token,
            private=args.hub_private_repo,
            commit_message=args.hub_commit_message,
        )
        tokenizer.push_to_hub(
            hub_model_id,
            token=args.hub_token,
            private=args.hub_private_repo,
            commit_message=args.hub_commit_message,
        )
        print("✅ Merged model uploaded successfully.")


if __name__ == "__main__":
    parser = argparse.ArgumentParser()

    parser.add_argument("--model_name_or_path", type=str, required=True)
    parser.add_argument("--output_dir", type=str, default=None)

    parser.add_argument("--dataset_name", type=str, default=None)
    parser.add_argument("--train_split_name", type=str, default=None)
    parser.add_argument("--eval_split_name", type=str, default=None)
    parser.add_argument("--eval_ratio", type=float, default=0.1)

    parser.add_argument("--push_to_hub", action="store_true")
    parser.add_argument("--hub_model_id", type=str, default=None)
    parser.add_argument("--hub_strategy", type=str, default="end")
    parser.add_argument("--hub_token", type=str, default=None)
    parser.add_argument("--hub_private_repo", action="store_true")
    parser.add_argument("--hub_commit_message", type=str, default="Add DPO fine-tuned model")

    parser.add_argument("--per_device_train_batch_size", type=int, default=1)
    parser.add_argument("--per_device_eval_batch_size", type=int, default=1)
    parser.add_argument("--gradient_accumulation_steps", type=int, default=1)
    parser.add_argument("--max_length", type=int, default=4096)
    parser.add_argument("--max_prompt_length", type=int, default=512)
    parser.add_argument("--max_target_length", type=int, default=1024)
    parser.add_argument("--num_train_epochs", type=int, default=1)
    parser.add_argument("--max_steps", type=int, default=-1)
    parser.add_argument("--eval_strategy", type=str, default="epoch", choices=["no", "steps", "epoch"])
    parser.add_argument("--eval_steps", type=int, default=100)
    parser.add_argument("--logging_steps", type=int, default=50)
    parser.add_argument("--lora_r", type=int, default=16)
    parser.add_argument("--lora_alpha", type=int, default=16)
    parser.add_argument("--lora_dropout", type=float, default=0.0)
    parser.add_argument("--learning_rate", type=float, default=1e-6)
    parser.add_argument("--beta", type=float, default=0.1)
    parser.add_argument("--report_to", type=str, default="wandb")
    parser.add_argument("--use_gradient_checkpointing", action="store_true")
    parser.add_argument("--seed", type=int, default=3407)
    parser.add_argument("--disable_bf16", action="store_true")
    parser.add_argument("--device_map", type=str, default="auto")
    parser.add_argument("--prompt_column", type=str, default="prompt")
    parser.add_argument("--chosen_column", type=str, default="chosen")
    parser.add_argument("--rejected_column", type=str, default="rejected")

    args, _ = parser.parse_known_args()
    main(args)
