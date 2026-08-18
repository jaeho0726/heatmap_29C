import os
import requests
from datetime import datetime, timedelta
from dotenv import load_dotenv

load_dotenv()

API_KEY = os.getenv("KMA_API_KEY")

print("키 존재 여부:", API_KEY is not None)

now = datetime.now() - timedelta(minutes=40)

base_date = now.strftime("%Y%m%d")
base_time = now.strftime("%H00")

url = (
    "https://apis.data.go.kr/1360000/"
    "VilageFcstInfoService_2.0/"
    "getUltraSrtNcst"
)

params = {
    "serviceKey": API_KEY,
    "pageNo": "1",
    "numOfRows": "100",
    "dataType": "JSON",
    "base_date": base_date,
    "base_time": base_time,
    "nx": "60",
    "ny": "127"
}

response = requests.get(
    url,
    params=params,
    timeout=10
)

print("상태 코드:", response.status_code)
print("응답:", response.text)