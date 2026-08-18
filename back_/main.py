import os
import math
import requests
import pandas as pd
from pydantic import BaseModel
from datetime import datetime, timedelta
from pathlib import Path

from fastapi import FastAPI
from dotenv import load_dotenv
from model.predict import predict_patient_count
from fastapi.middleware.cors import CORSMiddleware


load_dotenv()

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

SEOUL_API_KEY = os.getenv("SEOUL_API_KEY")
KMA_API_KEY = os.getenv("KMA_API_KEY")


class RiskRequest(BaseModel):
    age: int
    lat: float
    lon: float
    district: str | None = None


SEOUL_DISTRICT_POINTS = [
    {"name": "종로구", "lat": 37.5729, "lon": 126.9794},
    {"name": "중구", "lat": 37.5636, "lon": 126.9976},
    {"name": "용산구", "lat": 37.5326, "lon": 126.9904},
    {"name": "성동구", "lat": 37.5633, "lon": 127.0371},
    {"name": "광진구", "lat": 37.5384, "lon": 127.0823},
    {"name": "동대문구", "lat": 37.5744, "lon": 127.0396},
    {"name": "중랑구", "lat": 37.6063, "lon": 127.0927},
    {"name": "성북구", "lat": 37.5894, "lon": 127.0167},
    {"name": "강북구", "lat": 37.6396, "lon": 127.0257},
    {"name": "도봉구", "lat": 37.6688, "lon": 127.0471},
    {"name": "노원구", "lat": 37.6542, "lon": 127.0568},
    {"name": "은평구", "lat": 37.6027, "lon": 126.9291},
    {"name": "서대문구", "lat": 37.5791, "lon": 126.9368},
    {"name": "마포구", "lat": 37.5663, "lon": 126.9019},
    {"name": "양천구", "lat": 37.5169, "lon": 126.8664},
    {"name": "강서구", "lat": 37.5509, "lon": 126.8495},
    {"name": "구로구", "lat": 37.4955, "lon": 126.8877},
    {"name": "금천구", "lat": 37.4569, "lon": 126.8955},
    {"name": "영등포구", "lat": 37.5264, "lon": 126.8962},
    {"name": "동작구", "lat": 37.5124, "lon": 126.9393},
    {"name": "관악구", "lat": 37.4784, "lon": 126.9516},
    {"name": "서초구", "lat": 37.4836, "lon": 127.0327},
    {"name": "강남구", "lat": 37.5172, "lon": 127.0473},
    {"name": "송파구", "lat": 37.5145, "lon": 127.1059},
    {"name": "강동구", "lat": 37.5301, "lon": 127.1238},
]


def calculate_distance(lat1, lon1, lat2, lon2):
    earth_radius = 6371

    lat1 = math.radians(lat1)
    lon1 = math.radians(lon1)
    lat2 = math.radians(lat2)
    lon2 = math.radians(lon2)

    d_lat = lat2 - lat1
    d_lon = lon2 - lon1

    a = (
        math.sin(d_lat / 2) ** 2
        + math.cos(lat1)
        * math.cos(lat2)
        * math.sin(d_lon / 2) ** 2
    )

    c = 2 * math.atan2(
        math.sqrt(a),
        math.sqrt(1 - a)
    )

    return earth_radius * c


KAKAO_REST_API_KEY = os.getenv("KAKAO_REST_API_KEY")
SEOUL_HEATMAP_CACHE = {
    "created_at": None,
    "data": None
}
SEOUL_FORECAST_HEATMAP_CACHE = {
    "created_at": None,
    "age": None,
    "data": None
}


def get_district_from_kakao(lat: float, lon: float):

    if not KAKAO_REST_API_KEY:
        return None

    url = "https://dapi.kakao.com/v2/local/geo/coord2regioncode.json"

    headers = {
        "Authorization": f"KakaoAK {KAKAO_REST_API_KEY}"
    }

    params = {
        "x": lon,
        "y": lat
    }

    response = requests.get(
        url,
        headers=headers,
        params=params,
        timeout=10
    )

    response.raise_for_status()

    data = response.json()
    documents = data.get("documents", [])

    for item in documents:
        if item.get("region_type") == "H":
            return item.get("region_2depth_name")

    if documents:
        return documents[0].get("region_2depth_name")

    return None

def latlon_to_grid(lat, lon):
    RE = 6371.00877
    GRID = 5.0
    SLAT1 = 30.0
    SLAT2 = 60.0
    OLON = 126.0
    OLAT = 38.0
    XO = 43
    YO = 136

    DEGRAD = math.pi / 180.0

    re = RE / GRID
    slat1 = SLAT1 * DEGRAD
    slat2 = SLAT2 * DEGRAD
    olon = OLON * DEGRAD
    olat = OLAT * DEGRAD

    sn = (
        math.log(math.cos(slat1) / math.cos(slat2))
        / math.log(
            math.tan(math.pi * 0.25 + slat2 * 0.5)
            / math.tan(math.pi * 0.25 + slat1 * 0.5)
        )
    )

    sf = (
        math.tan(math.pi * 0.25 + slat1 * 0.5)
        ** sn
        * math.cos(slat1)
        / sn
    )

    ro = (
        math.tan(math.pi * 0.25 + olat * 0.5)
        ** (-sn)
        * re
        * sf
    )

    ra = (
        math.tan(
            math.pi * 0.25
            + (lat * DEGRAD) * 0.5
        )
        ** (-sn)
        * re
        * sf
    )

    theta = lon * DEGRAD - olon

    if theta > math.pi:
        theta -= 2.0 * math.pi

    if theta < -math.pi:
        theta += 2.0 * math.pi

    theta *= sn

    nx = int(
        math.floor(
            ra * math.sin(theta)
            + XO
            + 0.5
        )
    )

    ny = int(
        math.floor(
            ro
            - ra * math.cos(theta)
            + YO
            + 0.5
        )
    )

    return nx, ny

def calculate_risk_score(age, temperature, humidity):

    score = 0

    # 湲곗삩 ?먯닔
    if temperature >= 35:
        score += 50
    elif temperature >= 33:
        score += 40
    elif temperature >= 30:
        score += 30
    elif temperature >= 27:
        score += 20
    else:
        score += 10

    # ?듬룄 ?먯닔
    if humidity >= 80:
        score += 20
    elif humidity >= 60:
        score += 15
    elif humidity >= 40:
        score += 10
    else:
        score += 5

    # ?섏씠 蹂댁젙
    if age >= 75:
        score += 20
    elif age >= 65:
        score += 15
    elif age >= 50:
        score += 10

    # 理쒕? 100??
    score = min(score, 100)

    return score
def get_risk_level(score):

    if score >= 80:
        return "매우 높음"

    elif score >= 60:
        return "높음"

    elif score >= 40:
        return "주의"

    else:
        return "낮음"

AGE_FACTOR_PATH = Path(__file__).resolve().parent / "data" / "processed" / "age_factor.csv"
age_factor_df = None


def get_age_group(age: int):
    if age >= 80:
        return "80+"

    start = max(0, age // 10 * 10)
    end = start + 9

    return f"{start}-{end}"


def get_age_factor(age: int):
    global age_factor_df

    if age_factor_df is None:
        age_factor_df = pd.read_csv(
            AGE_FACTOR_PATH,
            encoding="utf-8-sig"
        )

    age_group = get_age_group(age)
    matched = age_factor_df[age_factor_df["age_group"] == age_group]

    if matched.empty:
        return 1.0

    factor = float(matched.iloc[0]["factor"])
    max_factor = float(age_factor_df["factor"].max())

    if max_factor <= 0:
        return 1.0

    return factor / max_factor


def calculate_model_risk_score(age, predicted_patient_count):

    base_score = predicted_patient_count * 35
    age_bonus = get_age_factor(age) * 25
    score = base_score + age_bonus

    score = max(0, min(score, 100))

    return round(score)


GREEN_RATIO_PATH = Path(__file__).resolve().parent.parent / "green_ratio.csv"
DEFAULT_GREEN_RATIO = 0.585919


def get_green_ratio(district: str | None):

    if not district:
        return DEFAULT_GREEN_RATIO

    try:
        green_df = None

        for encoding in ["utf-8-sig", "cp949", "utf-8"]:
            try:
                green_df = pd.read_csv(
                    GREEN_RATIO_PATH,
                    encoding=encoding
                )
                break
            except UnicodeDecodeError:
                continue

        if green_df is None:
            return DEFAULT_GREEN_RATIO

    except FileNotFoundError:
        return DEFAULT_GREEN_RATIO

    first_col = green_df.columns[0]
    green_df = green_df.rename(columns={first_col: "district"})
    green_df["district"] = green_df["district"].astype(str).str.strip()

    year_columns = [
        col for col in green_df.columns
        if str(col).isdigit()
    ]

    if not year_columns:
        return DEFAULT_GREEN_RATIO

    current_year = str(datetime.now().year)

    if current_year in year_columns:
        year_col = current_year
    else:
        year_col = sorted(year_columns)[-1]

    matched = green_df[green_df["district"] == district.strip()]

    if matched.empty:
        return DEFAULT_GREEN_RATIO

    value = pd.to_numeric(
        matched.iloc[0][year_col],
        errors="coerce"
    )

    if pd.isna(value):
        return DEFAULT_GREEN_RATIO

    return float(value)

@app.get("/")
def home():
    return {
        "message": "HeatMap Backend Server"
    }


def get_nearby_shelters(lat: float, lon: float, limit: int = 3):

    url = (
        f"http://openapi.seoul.go.kr:8088/"
        f"{SEOUL_API_KEY}/json/TbGtnHwcwP/1/1000/"
    )

    response = requests.get(
        url,
        timeout=10
    )

    data = response.json()

    rows = data["TbGtnHwcwP"]["row"]
    shelters = []

    for shelter in rows:

        if not shelter["LAT"] or not shelter["LON"]:
            continue

        shelter_lat = float(shelter["LAT"])
        shelter_lon = float(shelter["LON"])

        distance = calculate_distance(
            lat,
            lon,
            shelter_lat,
            shelter_lon
        )

        shelters.append({
            "name": shelter["R_AREA_NM"],
            "address": shelter["R_DETL_ADD"],
            "lat": shelter_lat,
            "lon": shelter_lon,
            "distance_km": round(distance, 2)
        })

    shelters.sort(key=lambda item: item["distance_km"])

    return shelters[:limit]


def get_nearest_shelter(lat: float, lon: float):
    shelters = get_nearby_shelters(lat, lon, limit=1)

    if not shelters:
        return None

    return shelters[0]


@app.get("/api/shelters")
def shelters(lat: float, lon: float):

    return get_nearby_shelters(
        lat,
        lon,
        limit=3
    )
def get_weather_data(lat: float, lon: float):
    nx, ny = latlon_to_grid(lat, lon)

    now = datetime.now() - timedelta(minutes=40)

    base_date = now.strftime("%Y%m%d")
    base_time = now.strftime("%H00")

    url = (
        "https://apis.data.go.kr/1360000/"
        "VilageFcstInfoService_2.0/"
        "getUltraSrtNcst"
    )

    params = {
        "serviceKey": KMA_API_KEY,
        "pageNo": "1",
        "numOfRows": "100",
        "dataType": "JSON",
        "base_date": base_date,
        "base_time": base_time,
        "nx": str(nx),
        "ny": str(ny)
    }

    response = requests.get(
        url,
        params=params,
        timeout=10
    )

    data = response.json()

    items = (
        data["response"]
            ["body"]
            ["items"]
            ["item"]
    )

    weather = {}

    for item in items:
        category = item["category"]
        value = item["obsrValue"]

        if category == "T1H":
            weather["temperature"] = float(value)

        elif category == "REH":
            weather["humidity"] = float(value)

        elif category == "WSD":
            weather["wind_speed"] = float(value)

        elif category == "RN1":
            weather["rainfall"] = float(value)

    return weather


def get_forecast_base_time(now: datetime):
    base_times = [2, 5, 8, 11, 14, 17, 20, 23]
    available = now - timedelta(minutes=30)

    for hour in reversed(base_times):
        if available.hour >= hour:
            return available.strftime("%Y%m%d"), f"{hour:02d}00"

    yesterday = available - timedelta(days=1)
    return yesterday.strftime("%Y%m%d"), "2300"


def parse_precipitation(value):
    if value in ["강수없음", "적설없음", "", None]:
        return 0.0

    text = str(value).replace("mm", "").strip()

    if "미만" in text:
        return 0.0

    try:
        return float(text)
    except ValueError:
        return 0.0


def get_forecast_weather_data(lat: float, lon: float, limit: int = 12):
    nx, ny = latlon_to_grid(lat, lon)
    base_date, base_time = get_forecast_base_time(datetime.now())

    url = (
        "https://apis.data.go.kr/1360000/"
        "VilageFcstInfoService_2.0/"
        "getVilageFcst"
    )

    params = {
        "serviceKey": KMA_API_KEY,
        "pageNo": "1",
        "numOfRows": "1000",
        "dataType": "JSON",
        "base_date": base_date,
        "base_time": base_time,
        "nx": str(nx),
        "ny": str(ny)
    }

    response = requests.get(
        url,
        params=params,
        timeout=10
    )

    data = response.json()
    items = (
        data["response"]
            ["body"]
            ["items"]
            ["item"]
    )

    by_time = {}

    for item in items:
        forecast_key = f"{item['fcstDate']}{item['fcstTime']}"
        category = item["category"]
        value = item["fcstValue"]

        if forecast_key not in by_time:
            by_time[forecast_key] = {
                "date": item["fcstDate"],
                "time": item["fcstTime"]
            }

        if category == "TMP":
            by_time[forecast_key]["temperature"] = float(value)
        elif category == "REH":
            by_time[forecast_key]["humidity"] = float(value)
        elif category == "WSD":
            by_time[forecast_key]["wind_speed"] = float(value)
        elif category == "PCP":
            by_time[forecast_key]["rainfall"] = parse_precipitation(value)
        elif category == "TMX":
            by_time[forecast_key]["max_temperature"] = float(value)

    forecasts = []

    for key in sorted(by_time.keys()):
        item = by_time[key]

        if "temperature" not in item:
            continue

        item["humidity"] = item.get("humidity", 60)
        item["wind_speed"] = item.get("wind_speed", 1.5)
        item["rainfall"] = item.get("rainfall", 0)
        item["max_temperature"] = item.get("max_temperature", item["temperature"])
        forecasts.append(item)

    return forecasts[:limit]


@app.get("/api/weather")
def get_weather(lat: float, lon: float):

    weather = get_weather_data(lat, lon)

    return {
        "lat": lat,
        "lon": lon,
        "weather": weather
    }



@app.get("/api/district")
def district(lat: float, lon: float):

    return {
        "lat": lat,
        "lon": lon,
        "district": get_district_from_kakao(lat, lon)
    }


@app.get("/api/forecast-risk")
def forecast_risk(lat: float, lon: float, age: int = 35, district: str | None = None):
    if not district:
        district = get_district_from_kakao(lat, lon)

    green_ratio = get_green_ratio(district)
    forecast_items = get_forecast_weather_data(
        lat,
        lon,
        limit=12
    )

    results = []

    for item in forecast_items:
        predicted_patient_count = predict_patient_count(
            item["temperature"],
            item["max_temperature"],
            item["rainfall"],
            item["wind_speed"],
            item["humidity"],
            green_ratio
        )

        score = calculate_model_risk_score(
            age,
            predicted_patient_count
        )

        results.append({
            "date": item["date"],
            "time": item["time"],
            "temperature": item["temperature"],
            "humidity": item["humidity"],
            "wind_speed": item["wind_speed"],
            "rainfall": item["rainfall"],
            "max_temperature": item["max_temperature"],
            "green_ratio": green_ratio,
            "predicted_patient_count": predicted_patient_count,
            "score": score,
            "level": get_risk_level(score)
        })

    return {
        "age": age,
        "district": district,
        "forecasts": results
    }


@app.get("/api/seoul-heatmap")
def seoul_heatmap(age: int = 35):
    now = datetime.now()

    if (
        SEOUL_HEATMAP_CACHE["created_at"]
        and SEOUL_HEATMAP_CACHE["data"]
        and now - SEOUL_HEATMAP_CACHE["created_at"] < timedelta(minutes=10)
    ):
        return SEOUL_HEATMAP_CACHE["data"]

    districts = []

    for point in SEOUL_DISTRICT_POINTS:
        try:
            weather = get_weather_data(
                point["lat"],
                point["lon"]
            )
        except Exception:
            weather = {}

        temperature = weather.get(
            "temperature",
            30
        )

        humidity = weather.get(
            "humidity",
            70
        )

        wind_speed = weather.get(
            "wind_speed",
            1.5
        )

        rainfall = weather.get(
            "rainfall",
            0
        )

        max_temperature = temperature
        green_ratio = get_green_ratio(
            point["name"]
        )

        predicted_patient_count = predict_patient_count(
            temperature,
            max_temperature,
            rainfall,
            wind_speed,
            humidity,
            green_ratio
        )

        score = calculate_model_risk_score(
            age,
            predicted_patient_count
        )

        districts.append({
            "name": point["name"],
            "lat": point["lat"],
            "lon": point["lon"],
            "temperature": temperature,
            "humidity": humidity,
            "wind_speed": wind_speed,
            "rainfall": rainfall,
            "green_ratio": green_ratio,
            "age_group": get_age_group(age),
            "age_factor": get_age_factor(age),
            "predicted_patient_count": predicted_patient_count,
            "score": score,
            "level": get_risk_level(score)
        })

    result = {
        "age": age,
        "districts": districts
    }

    SEOUL_HEATMAP_CACHE["created_at"] = now
    SEOUL_HEATMAP_CACHE["data"] = result

    return result


@app.get("/api/seoul-forecast-heatmap")
def seoul_forecast_heatmap(age: int = 35, limit: int = 10):
    now = datetime.now()
    limit = max(1, min(limit, 12))

    if (
        SEOUL_FORECAST_HEATMAP_CACHE["created_at"]
        and SEOUL_FORECAST_HEATMAP_CACHE["data"]
        and SEOUL_FORECAST_HEATMAP_CACHE["age"] == age
        and now - SEOUL_FORECAST_HEATMAP_CACHE["created_at"] < timedelta(minutes=30)
    ):
        return SEOUL_FORECAST_HEATMAP_CACHE["data"]

    time_map = {}

    for point in SEOUL_DISTRICT_POINTS:
        green_ratio = get_green_ratio(point["name"])

        try:
            forecast_items = get_forecast_weather_data(
                point["lat"],
                point["lon"],
                limit=limit
            )
        except Exception:
            forecast_items = []

        if not forecast_items:
            try:
                current_weather = get_weather_data(
                    point["lat"],
                    point["lon"]
                )
            except Exception:
                current_weather = {}

            current_temperature = current_weather.get("temperature", 30)
            current_humidity = current_weather.get("humidity", 70)
            current_wind_speed = current_weather.get("wind_speed", 1.5)
            current_rainfall = current_weather.get("rainfall", 0)

            forecast_items = [
                {
                    "date": now.strftime("%Y%m%d"),
                    "time": f"{(now.hour + index * 2) % 24:02d}00",
                    "temperature": current_temperature + delta,
                    "humidity": current_humidity,
                    "wind_speed": current_wind_speed,
                    "rainfall": current_rainfall,
                    "max_temperature": current_temperature + max(delta, 0)
                }
                for index, delta in enumerate([-2, 0, 2, 3, 4, 3, 1, 0, -1, -2][:limit])
            ]

        for item in forecast_items[:limit]:
            predicted_patient_count = predict_patient_count(
                item["temperature"],
                item["max_temperature"],
                item["rainfall"],
                item["wind_speed"],
                item["humidity"],
                green_ratio
            )

            score = calculate_model_risk_score(
                age,
                predicted_patient_count
            )

            time_key = f"{item['date']}{item['time']}"

            if time_key not in time_map:
                time_map[time_key] = {
                    "date": item["date"],
                    "time": item["time"],
                    "label": f"{int(item['time'][:2])}시",
                    "districts": []
                }

            time_map[time_key]["districts"].append({
                "name": point["name"],
                "lat": point["lat"],
                "lon": point["lon"],
                "temperature": item["temperature"],
                "humidity": item["humidity"],
                "wind_speed": item["wind_speed"],
                "rainfall": item["rainfall"],
                "max_temperature": item["max_temperature"],
                "green_ratio": green_ratio,
                "age_group": get_age_group(age),
                "age_factor": get_age_factor(age),
                "predicted_patient_count": predicted_patient_count,
                "score": score,
                "level": get_risk_level(score)
            })

    forecasts = [
        item for _, item in sorted(time_map.items())
        if item["districts"]
    ][:limit]

    result = {
        "age": age,
        "times": [
            {
                "date": item["date"],
                "time": item["time"],
                "label": item["label"],
                "average_score": round(
                    sum(district["score"] for district in item["districts"])
                    / len(item["districts"])
                )
            }
            for item in forecasts
        ],
        "forecasts": forecasts
    }

    SEOUL_FORECAST_HEATMAP_CACHE["created_at"] = now
    SEOUL_FORECAST_HEATMAP_CACHE["age"] = age
    SEOUL_FORECAST_HEATMAP_CACHE["data"] = result

    return result

@app.post("/api/risk")
def predict_risk(request: RiskRequest):

    weather = get_weather_data(
        request.lat,
        request.lon
    )

    temperature = weather.get(
        "temperature",
        0
    )

    humidity = weather.get(
        "humidity",
        0
    )

    wind_speed = weather.get(
        "wind_speed",
        0
    )

    rainfall = weather.get(
        "rainfall",
        0
    )

    max_temperature = temperature

    district = request.district

    if not district:
        district = get_district_from_kakao(
            request.lat,
            request.lon
        )

    green_ratio = get_green_ratio(
        district
    )

    predicted_patient_count = predict_patient_count(
        temperature,
        max_temperature,
        rainfall,
        wind_speed,
        humidity,
        green_ratio
    )

    score = calculate_model_risk_score(
        request.age,
        predicted_patient_count
    )

    level = get_risk_level(score)

    nearby_shelters = get_nearby_shelters(
        request.lat,
        request.lon,
        limit=3
    )
    shelter = nearby_shelters[0] if nearby_shelters else None

    return {
        "age": request.age,

        "location": {
            "lat": request.lat,
            "lon": request.lon,
            "district": district
        },

        "weather": {
            "temperature": temperature,
            "humidity": humidity,
            "max_temperature": max_temperature,
            "wind_speed": wind_speed,
            "rainfall": rainfall,
            "green_ratio": green_ratio
        },

        "risk": {
            "score": score,
            "level": level,
            "age_group": get_age_group(request.age),
            "age_factor": get_age_factor(request.age),
            "predicted_patient_count": predicted_patient_count
        },

        "shelter": shelter,
        "shelters": nearby_shelters
    }
