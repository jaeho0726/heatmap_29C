import pandas as pd

weather_raw_df = pd.read_csv('./data/raw_data/서울시_자치구별_날씨.csv', encoding='utf-8-sig')

# Handling Null values 
null_counts = weather_raw_df.isnull().sum()
print("Null values per column:")
print(null_counts)

# Creating expected dataframe with no missing times
stations = sorted(weather_raw_df["지점"].unique())

weather_raw_df["일시"] = pd.to_datetime(weather_raw_df["일시"])
years = sorted(weather_raw_df["일시"].dt.year.unique())

expected_rows = []

for year in years:
    expected_times = pd.date_range(
        start=f"{year}-05-20 00:00:00",
        end=f"{year}-09-25 23:00:00",
        freq="h"
    )

    for station in stations:
        temp = pd.DataFrame({
            "지점": station,
            "일시": expected_times
        })

        expected_rows.append(temp)

expected_df = pd.concat(expected_rows, ignore_index=True)

# Figuring out which times are missing in the original dataframe
missing_times = (
    expected_df
    .merge(
        weather_raw_df[["지점", "일시"]],
        on=["지점", "일시"],
        how="left",
        indicator=True
    )
)

missing_times = missing_times[
    missing_times["_merge"] == "left_only"
][["지점", "일시"]]

df_complete = expected_df.merge(
    weather_raw_df,
    on=["지점", "일시"],
    how="left"
)

df_complete = (
    df_complete
    .sort_values(["지점", "일시"])
    .reset_index(drop=True)
)

df_complete.to_csv(
    "./data/raw_data/서울시_자치구별_날씨_complete.csv",
    index=False,
    encoding="utf-8-sig"
)


weather_df = pd.read_csv('./data/raw_data/서울시_자치구별_날씨_complete.csv')

weather_df["일시"] = pd.to_datetime(weather_df["일시"])
weather_df["지점"] = pd.to_numeric(weather_df["지점"])


# target -> nearby source
nearby_station_mapping = {
    400: 401,  # 강남구 -> 서초구
    401: 400,  # 서초구 -> 강남구
    402: 413,  # 강동구 -> 광진구
    403: 400,  # 송파구 -> 강남구
    404: 405,  # 강서구 -> 양천구
    405: 510,  # 양천구 -> 영등포구
    406: 424,  # 도봉구 -> 강북구
    407: 409,  # 노원구 -> 중랑구
    408: 409,  # 동대문구 -> 중랑구
    409: 408,  # 중랑구 -> 동대문구
    410: 417,  # 동작구 -> 금천구
    411: 412,  # 마포구 -> 서대문구
    412: 411,  # 서대문구 -> 마포구
    413: 421,  # 광진구 -> 성동구
    414: 424,  # 성북구 -> 강북구
    415: 419,  # 용산구 -> 중구
    416: 412,  # 은평구 -> 서대문구
    417: 410,  # 금천구 -> 동작구
    419: 415,  # 중구 -> 용산구
    421: 413,  # 성동구 -> 광진구
    423: 405,  # 구로구 -> 양천구
    424: 414,  # 강북구 -> 성북구
    509: 417,  # 관악구 -> 금천구
    510: 405,  # 영등포구 -> 양천구
}

weather_columns = [
    "기온(℃)",
    "풍속(m/s)",
    "습도(%)",
    "3시간평균기온(℃)"
]


# ========================================
# 새로 생성된 1744개 row만 선택
# ========================================

new_row_mask = weather_df["원본파일"].isna()

print("새 row 개수:", new_row_mask.sum())


# ========================================
# nearby district 데이터로 채우기
# ========================================

for target_station, source_station in nearby_station_mapping.items():

    target_mask = (
        (weather_df["지점"] == target_station)
        & new_row_mask
    )

    target_count = target_mask.sum()

    if target_count == 0:
        continue

    print(
        f"{target_station} <- {source_station}: "
        f"{target_count} rows"
    )

    source_data = (
        weather_df[
            weather_df["지점"] == source_station
        ]
        .set_index("일시")[weather_columns]
    )

    target_times = weather_df.loc[
        target_mask,
        "일시"
    ]

    for col in weather_columns:

        mapped_values = target_times.map(
            source_data[col]
        )

        weather_df.loc[
            target_mask,
            col
        ] = mapped_values.values

print("\n=== Mapping 이후 ===")

print(
    weather_df.loc[
        new_row_mask,
        weather_columns
    ].isna().sum()
)

# Filling in the remaining Null values

def fill_missing_values(df, column, station_mapping):

    # 원본 보존
    result = df.copy()

    # station + timestamp로 source 값 빠르게 찾기 위한 lookup
    lookup = (
        result
        .set_index(["지점", "일시"])[column]
    )

    for station in result["지점"].unique():

        station_mask = result["지점"] == station
        station_indices = result.index[station_mask]

        values = result.loc[station_indices, column]

        # null 여부
        is_null = values.isna()

        if not is_null.any():
            continue

        # 연속 null group 구분
        group_id = (
            is_null.ne(is_null.shift())
            .cumsum()
        )

        null_groups = (
            values[is_null]
            .groupby(group_id[is_null])
        )

        for _, group in null_groups:

            group_indices = group.index
            gap_length = len(group_indices)

            # =====================================
            # CASE 1: 단독 1시간 null
            # =====================================
            if gap_length == 1:

                idx = group_indices[0]

                prev_idx = idx - 1
                next_idx = idx + 1

                # 같은 station 안에서 앞뒤 row인지 확인
                valid_prev = (
                    prev_idx in result.index
                    and result.loc[prev_idx, "지점"] == station
                )

                valid_next = (
                    next_idx in result.index
                    and result.loc[next_idx, "지점"] == station
                )

                if valid_prev and valid_next:

                    prev_time = result.loc[prev_idx, "일시"]
                    curr_time = result.loc[idx, "일시"]
                    next_time = result.loc[next_idx, "일시"]

                    # 정말 앞뒤 1시간 간격인지 확인
                    correct_interval = (
                        curr_time - prev_time == pd.Timedelta(hours=1)
                        and next_time - curr_time == pd.Timedelta(hours=1)
                    )

                    prev_value = result.loc[prev_idx, column]
                    next_value = result.loc[next_idx, column]

                    if (
                        correct_interval
                        and pd.notna(prev_value)
                        and pd.notna(next_value)
                    ):
                        result.loc[idx, column] = (
                            prev_value + next_value
                        ) / 2

                        continue

                # 앞뒤 평균을 못 쓰면 nearby district fallback
                source_station = station_mapping.get(station)

                if source_station is not None:
                    timestamp = result.loc[idx, "일시"]

                    try:
                        source_value = lookup.loc[
                            (source_station, timestamp)
                        ]

                        if pd.notna(source_value):
                            result.loc[idx, column] = source_value

                    except KeyError:
                        pass

            # =====================================
            # CASE 2: 2시간 이상 연속 null
            # =====================================
            else:

                source_station = station_mapping.get(station)

                if source_station is None:
                    continue

                for idx in group_indices:

                    timestamp = result.loc[idx, "일시"]

                    try:
                        source_value = lookup.loc[
                            (source_station, timestamp)
                        ]

                        if pd.notna(source_value):
                            result.loc[idx, column] = source_value

                    except KeyError:
                        pass

    return result

for col in weather_columns:

    print(f"\nProcessing: {col}")

    before = weather_df[col].isna().sum()

    weather_df = fill_missing_values(
        weather_df,
        col,
        nearby_station_mapping
    )

    after = weather_df[col].isna().sum()

# Check remaining null values
print("\nRemaining null values:")
print(
    weather_df[weather_columns]
    .isna()
    .sum()
)

weather_df.to_csv(
    "./data/raw_data/서울시_자치구별_날씨_complete2.csv",
    index=False,
    encoding="utf-8-sig"
)



# Changing column names to match for merging 
# district_code_name = {
#     400:'강남구',
#     401:'서초구',
#     402:'강동구',
#     403:'송파구',
#     404:'강서구',
#     405:'양천구',
#     406:'도봉구',
#     407:'노원구',
#     408:'동대문구',
#     409:'중랑구',
#     410:'동작구',
#     411:'마포구',
#     412:'서대문구',
#     413:'광진구',
#     414:'성북구',
#     415:'용산구',
#     416:'은평구',
#     417:'금천구',
#     419:'중구',
#     421:'성동구',
#     423:'구로구',
#     424:'강북구',
#     509:'관악구',
#     510:'영등포구'
# }

# Create 'district' column by mapping '지점'
# weather_raw_df['district'] = weather_raw_df['지점'].map(district_code_name)

# # Duplicate '중구' rows to create '종로구' rows
# jongno_rows = weather_raw_df[weather_raw_df['district'] == '중구'].copy()
# jongno_rows['district'] = '종로구'
# weather_df = pd.concat([weather_raw_df, jongno_rows], ignore_index=True) 

# weather_df = weather_df.drop(columns = ['원본파일', '지점'])

# # Changing column names to match for merging
# weather_df = weather_df.rename(columns={'일시' : 'date_time',
#                                         '기온(℃)' : 'temperature',
#                                         '풍속(m/s)' : 'wind_speed',
#                                         '습도(%)' : 'humidity',
#                                         '3시간평균기온(℃)' : 'avg_temperature_3h'
#                                         }
#                                 )

# weather_df.to_csv(
#     './data/preprocessed_data/district_weather.csv', 
#     index=False, 
#     encoding='utf-8-sig'
# )