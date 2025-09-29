import joblib
import numpy as np
import pandas as pd
import logging

logger = logging.getLogger(__name__)

# ML 모델 로드
try:
    PERSONAL_MODEL = joblib.load('ml_models/personal_loan_lgbm.pkl')
    PERSONAL_SCALER = joblib.load('ml_models/personal_loan_scaler.pkl')
    CORPORATE_MODEL = joblib.load('ml_models/corporate_loan_lgbm.pkl')
    CORPORATE_SCALER = joblib.load('ml_models/corporate_loan_scaler.pkl')
    logger.info("ML 모델 로딩 성공")
except Exception as e:
    logger.error(f"ML 모델 로드 실패: {e}")
    PERSONAL_MODEL = None
    PERSONAL_SCALER = None
    CORPORATE_MODEL = None
    CORPORATE_SCALER = None


def get_credit_rating_by_probability(probability):
    """ML 예측 확률에 따른 여신 신용 등급 반환"""
    if probability >= 0.9:
        return '최우수'
    elif probability >= 0.8:
        return '우수'
    elif probability >= 0.7:
        return '양호'
    elif probability >= 0.6:
        return '보통'
    else:
        return '위험'

def get_credit_rating(score):
    """신용점수에 따른 등급 반환"""
    if score >= 900: return 'AAA'
    if score >= 800: return 'AA'
    if score >= 700: return 'A'
    if score >= 600: return 'B'
    if score >= 500: return 'C'
    return 'D'

def calculate_recommended_limit(score, requested_amount):
    """신용점수에 따른 추천 한도 계산"""
    if score >= 800:
        return min(requested_amount * 1.2, 100000000)
    elif score >= 700:
        return min(requested_amount * 1.1, 80000000)
    elif score >= 600:
        return min(requested_amount * 1.0, 50000000)
    else:
        return min(requested_amount * 0.8, 30000000)

def map_categorical_features(customer_data):
    """범주형 데이터를 숫자형으로 변환"""
    education_map = {'고등학교': 1, '대학교': 2, '대학원': 3}
    housing_map = {'전/월세': 1, '자가': 2}

    customer_data['education_level_encoded'] = education_map.get(customer_data.get('education_level'), 1)
    customer_data['housing_status_encoded'] = housing_map.get(customer_data.get('housing_status'), 1)
    return customer_data

def predict_credit_score(customer_data, loan_data, customer_type='personal'):
    """ML 모델을 사용한 신용점수 예측"""
    try:
        if customer_type == 'personal' and PERSONAL_MODEL and PERSONAL_SCALER:
            # 개인 고객 특성 추출
            # 1. 모델이 학습한 순서대로 13개 기본 특성을 구성합니다.
            
            try:
                annual_income = float(str(customer_data.get('annual_income', '1')).replace(',', '')) / 10000
            except (ValueError, TypeError):
                annual_income = 1.0

            loan_amount = float(loan_data.get('amount', 0)) / 10000

            # 2. DataFrame 생성
            input_data = {
                'person_age': float(customer_data.get('age', 30)),
                'person_gender': 'male' if customer_data.get('gender') == '남성' else 'female',
                'person_education': customer_data.get('education_level', 'Bachelor'),
                'person_income': float(annual_income),
                'person_emp_exp': int(customer_data.get('years_of_service', 0)),
                'person_home_ownership': customer_data.get('housing_status', 'RENT'),
                'loan_amnt': float(loan_amount),
                'loan_intent': loan_data.get('purpose', 'PERSONAL'),
                'loan_int_rate': float(loan_data.get('interest_rate', 5.0)),
                'loan_percent_income': float((loan_amount / annual_income) if annual_income > 0 else 0),
                'cb_person_cred_hist_length': float(customer_data.get('credit_history_length', 5)), # 신용 이력 길이
                'previous_loan_defaults_on_file': 1 if customer_data.get('has_delinquency', False) else 0
            }
            df = pd.DataFrame([input_data])
            
            # 신용점수를 기반으로 신용 등급(1~7)을 계산하여 'credit_score' 컬럼에 할당
            # customer_data에 credit_score가 없으면 기본값 750 사용
            raw_score = int(customer_data.get('credit_score', 750))
            credit_rating_map = {'A': 1, 'B': 2, 'C': 3, 'D': 4, 'E': 5, 'F': 6, 'G': 7}
            credit_rating_str = get_credit_rating(raw_score) # 'AAA', 'AA' 등
            df['credit_score'] = credit_rating_map.get(credit_rating_str[0], 3) # 첫 글자(A,B,C...)로 등급 매핑
            
            # 3. 로그 변환 적용
            df['person_income'] = np.log1p(df['person_income'])

            # 4. 원-핫 인코딩 적용
            categorical_cols = ['person_gender', 'person_education', 'person_home_ownership', 'loan_intent']
            df_encoded = pd.get_dummies(df, columns=categorical_cols, drop_first=True)
            
            # 5. 훈련 시점의 컬럼 순서와 동일하게 맞추기 (학습에 사용된 22개 특성)
            model_columns = [
                'person_age', 'person_income', 'person_emp_exp', 'loan_amnt', 'loan_int_rate',
                'loan_percent_income', 'cb_person_cred_hist_length', 'credit_score',
                'previous_loan_defaults_on_file', 'person_gender_male',
                'person_education_Bachelor', 'person_education_Doctorate', 'person_education_High School',
                'person_education_Master',
                'person_home_ownership_OTHER', 'person_home_ownership_OWN',
                'person_home_ownership_RENT', 'loan_intent_EDUCATION',
                'loan_intent_HOMEIMPROVEMENT', 'loan_intent_MEDICAL', 'loan_intent_PERSONAL',
                'loan_intent_VENTURE'
            ]
            
            # 현재 데이터에 없는 컬럼은 0으로 채워서 추가
            for col in model_columns:
                if col not in df_encoded.columns:
                    df_encoded[col] = 0 # 숫자 0으로 채움
            
            # 컬럼 순서 맞추기
            features_df = df_encoded[model_columns] # .values를 제거하여 DataFrame을 유지
            
            # 스케일러 적용 시 numpy 배열로 변환되므로, 다시 DataFrame으로 만들어 컬럼명을 유지
            scaled_features_array = PERSONAL_SCALER.transform(features_df)
            scaled_features_df = pd.DataFrame(scaled_features_array, columns=model_columns)

            # predict 대신 predict_proba를 사용하여 '승인' 확률(class 1)을 가져옴
            prediction_prob = PERSONAL_MODEL.predict_proba(scaled_features_df)[0][1]
            
        else:
            # 모델이 없을 경우 기본값
            prediction_prob = 0.75
        
        # 0-1000 점수로 변환
        credit_score = max(0, min(1000, int(prediction_prob * 1000)))
        
        return {
            'credit_score': credit_score,
            'credit_rating': get_credit_rating(credit_score),
            'approval_status': 'approved' if credit_score >= 600 else 'rejected',
            'recommended_limit': calculate_recommended_limit(credit_score, loan_data.get('amount', 0))
        }
        
    except Exception as e:
        logger.error(f"신용점수 예측 중 오류: {e}")
        # 오류 발생 시 기본값 반환
        return {
            'credit_score': 750,
            'credit_rating': 'B', # 숫자 반환으로 타입 오류 방지
            'approval_status': 'approved',
            'recommended_limit': loan_data.get('amount', 30000000)
        }