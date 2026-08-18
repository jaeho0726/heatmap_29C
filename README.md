# HeatMap 29C

AI 기반 서울시 폭염 위험 예측 및 무더위쉼터 안내 서비스입니다. 사용자의 연령대와 현재 위치를 기반으로 기상청 날씨 데이터, 자치구별 녹지율, XGBoost 예측 모델을 결합해 개인 맞춤형 폭염 위험도와 가까운 무더위쉼터를 제공합니다.

## 주요 기능

- 현재 위치 기반 서울 자치구 자동 판별
- 기상청 초단기실황 API 기반 현재 기온, 습도, 풍속, 강수량 조회
- 기상청 단기예보 API 기반 시간대별 예보 위험도 계산
- XGBoost 기반 온열질환 환자 수 예측
- 연령대별 취약도 가중치 반영
- 서울 자치구별 폭염 위험 지도
- 가까운 무더위쉼터 3개 안내
- 앱 내부 간단 길찾기 화면 제공

## 프로젝트 구조

```text
heatmap_29c/
├─ back_/
│  ├─ main.py
│  ├─ model/
│  │  ├─ train.py
│  │  ├─ predict.py
│  │  └─ heat_model.pkl
│  ├─ data/
│  │  └─ processed/
│  │     ├─ age_factor.csv
│  │     ├─ daily_train.csv
│  │     └─ five_years_with_patient_count.csv
│  └─ requirements.txt
│
└─ front/
   ├─ src/
   ├─ package.json
   └─ vite config files
```

## 사용 데이터

- 기상청 초단기실황 API
  - 현재 기온 `T1H`
  - 습도 `REH`
  - 풍속 `WSD`
  - 1시간 강수량 `RN1`
- 기상청 단기예보 API
  - 예보 기온 `TMP`
  - 습도 `REH`
  - 풍속 `WSD`
  - 강수량 `PCP`
  - 최고기온 `TMX`
- 서울시 자치구별 녹지율
- 서울시 무더위쉼터 위치 데이터
- 2021-2025년 온열질환 환자 수 데이터
- 연령대별 취약도 가중치 `age_factor.csv`

## 모델 학습 방식

시간 단위 기상 데이터를 날짜와 자치구 기준으로 일 단위 집계한 뒤, 일 단위 온열질환 환자 수를 정답값으로 사용해 XGBoost 모델을 학습했습니다.

모델 입력값:

```text
temperature
max_temperature
rainfall
wind_speed
humidity
green_ratio
```

모델 정답값:

```text
patient_count
```

`patient_count`는 학습 정답으로만 사용하며, 실제 예측 입력에는 포함하지 않습니다.

## 백엔드 실행

```powershell
cd "C:\Users\leesu\OneDrive\바탕 화면\heatmap_29c\back_"
```

가상환경 생성이 필요한 경우:

```powershell
python -m venv venv
```

가상환경 Python으로 패키지 설치:

```powershell
& ".\venv\Scripts\python.exe" -m pip install -U pip
& ".\venv\Scripts\python.exe" -m pip install fastapi uvicorn pandas requests python-dotenv scikit-learn xgboost joblib
```

서버 실행:

```powershell
& ".\venv\Scripts\python.exe" -m uvicorn main:app --reload
```

서버 주소:

```text
http://127.0.0.1:8000
```

## 프론트엔드 실행

```powershell
cd "C:\Users\leesu\OneDrive\바탕 화면\heatmap_29c\front"
npm install
npm run dev
```

프론트 주소:

```text
http://localhost:5173
```

## 환경변수

백엔드 폴더 `back_` 안에 `.env` 파일을 생성해야 합니다.

```env
SEOUL_API_KEY=your_seoul_open_data_api_key
KMA_API_KEY=your_kma_api_key
KAKAO_REST_API_KEY=your_kakao_rest_api_key
```

주의: `.env` 파일은 GitHub에 올리면 안 됩니다.

## 주요 API

### 위험도 예측

```text
POST /api/risk
```

요청 예시:

```json
{
  "age": 75,
  "lat": 37.5729,
  "lon": 126.9794
}
```

### 자치구 조회

```text
GET /api/district?lat=37.5729&lon=126.9794
```

### 가까운 무더위쉼터 3개

```text
GET /api/shelters?lat=37.5729&lon=126.9794
```

### 시간대별 예보 위험도

```text
GET /api/forecast-risk?lat=37.5729&lon=126.9794&age=75&district=종로구
```

### 서울 자치구별 폭염 지도 데이터

```text
GET /api/seoul-heatmap?age=75
```

## GitHub 업로드 시 제외할 것

다음 파일과 폴더는 올리지 않습니다.

```text
.env
venv/
__pycache__/
*.pyc
node_modules/
dist/
back_/data/raw/
```

## 시연 흐름

1. 사용자가 연령대를 선택합니다.
2. 브라우저 위치 권한을 허용합니다.
3. 서울 밖 위치인 경우 시연용으로 종로구 좌표를 사용합니다.
4. 백엔드가 기상청 API, 카카오 주소 API, 녹지율, 무더위쉼터 데이터를 결합합니다.
5. XGBoost 모델이 예상 환자 수를 예측합니다.
6. 연령대별 취약도 가중치를 반영해 최종 위험도를 계산합니다.
7. 프론트에서 위험도, 위험 요인, 시간대별 예보 위험도, 가까운 쉼터를 보여줍니다.
