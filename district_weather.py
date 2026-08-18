import pandas as pd

weather_raw_df = pd.read_csv('./data/raw_data/서울시_자치구별_날씨.csv', encoding='utf-8-sig')

# Changing column names to match for merging 
district_code_name = {
    400:'강남구',
    401:'서초구',
    402:'강동구',
    403:'송파구',
    404:'강서구',
    405:'양천구',
    406:'도봉구',
    407:'노원구',
    408:'동대문구',
    409:'중랑구',
    410:'동작구',
    411:'마포구',
    412:'서대문구',
    413:'광진구',
    414:'성북구',
    415:'용산구',
    416:'은평구',
    417:'금천구',
    419:'중구',
    421:'성동구',
    423:'구로구',
    424:'강북구',
    509:'관악구',
    510:'영등포구'
}

# Create 'district' column by mapping '지점'
weather_raw_df['district'] = weather_raw_df['지점'].map(district_code_name)

# Duplicate '중구' rows to create '종로구' rows
jongno_rows = weather_raw_df[weather_raw_df['district'] == '중구'].copy()
jongno_rows['district'] = '종로구'
weather_df = pd.concat([weather_raw_df, jongno_rows], ignore_index=True) 

weather_df = weather_df.drop(columns = ['원본파일', '지점'])

# Changing column names to match for merging
weather_df = weather_df.rename(columns={'일시' : 'date_time',
                                        '기온(℃)' : 'temperature',
                                        '풍속(m/s)' : 'wind_speed',
                                        '습도(%)' : 'humidity',
                                        '3시간평균기온(℃)' : 'avg_temperature_3h'
                                        }
                                )


weather_df.to_csv(
    './data/preprocessed_data/district_weather.csv', 
    index=False, 
    encoding='utf-8-sig'
)