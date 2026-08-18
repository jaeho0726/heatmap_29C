import os
import math
import requests
from dotenv import load_dotenv

load_dotenv()

API_KEY = os.getenv("SEOUL_API_KEY")


def calculate_distance(lat1, lon1, lat2, lon2):
    """
    두 위도/경도 사이의 거리를 km 단위로 계산
    """

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


# 임시 사용자 위치
user_lat = 37.573
user_lon = 126.988


url = (
    f"http://openapi.seoul.go.kr:8088/"
    f"{API_KEY}/json/TbGtnHwcwP/1/1000/"
)

response = requests.get(url)

data = response.json()

rows = data["TbGtnHwcwP"]["row"]


nearest_shelter = None
nearest_distance = float("inf")


for shelter in rows:

    # 위도 또는 경도가 없는 데이터는 건너뜀
    if not shelter["LAT"] or not shelter["LON"]:
        continue

    shelter_lat = float(shelter["LAT"])
    shelter_lon = float(shelter["LON"])

    distance = calculate_distance(
        user_lat,
        user_lon,
        shelter_lat,
        shelter_lon
    )

    if distance < nearest_distance:
        nearest_distance = distance
        nearest_shelter = shelter


print("가장 가까운 쉼터")
print("--------------------")

print("쉼터명:", nearest_shelter["R_AREA_NM"])
print("주소:", nearest_shelter["R_DETL_ADD"])
print("위도:", nearest_shelter["LAT"])
print("경도:", nearest_shelter["LON"])
print("거리:", round(nearest_distance, 2), "km")