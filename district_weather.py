import pandas as pd
import numpy as np

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
    "./data/raw_data/서울시_자치구별_날씨_first_filter.csv",
    index=False,
    encoding="utf-8-sig"
)


weather_df = pd.read_csv('./data/raw_data/서울시_자치구별_날씨_first_filter.csv')

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

# Filling in remaining null values in 풍속 and 3시간평균기온 
wind_secondary_mapping = {
    411: 510,  # 마포구 -> 영등포구
    412: 419,  # 서대문구 -> 중구
    416: 424,  # 은평구 -> 강북구
}

print("풍속 처리 전 null:",
      weather_df["풍속(m/s)"].isna().sum())


for target_station, source_station in wind_secondary_mapping.items():

    # 현재도 풍속이 null인 target row만 선택
    target_mask = (
        (weather_df["지점"] == target_station)
        & weather_df["풍속(m/s)"].isna()
    )

    if target_mask.sum() == 0:
        continue

    # source district의 timestamp별 풍속
    source_wind = (
        weather_df[
            weather_df["지점"] == source_station
        ]
        .set_index("일시")["풍속(m/s)"]
    )

    # target의 timestamp
    target_times = weather_df.loc[
        target_mask,
        "일시"
    ]

    # 동일 timestamp의 source 풍속 가져오기
    mapped_values = target_times.map(source_wind)

    # null인 target만 채움
    weather_df.loc[
        target_mask,
        "풍속(m/s)"
    ] = mapped_values.values


print("풍속 처리 후 null:",
      weather_df["풍속(m/s)"].isna().sum())


print(
    "3시간평균기온 처리 전 null:",
    weather_df["3시간평균기온(℃)"].isna().sum()
)


# 각 구별로 현재 시각 포함 직전 3시간의 기온 평균 계산
weather_df["_calculated_3h_temp"] = (
    weather_df
    .groupby("지점")["기온(℃)"]
    .transform(
        lambda x: x.rolling(
            window=3,
            min_periods=3
        ).mean()
    )
)


# 기존 3시간평균기온이 null인 곳만 선택
three_hour_null_mask = (
    weather_df["3시간평균기온(℃)"].isna()
)


# 계산값으로 null인 곳만 채움
weather_df.loc[
    three_hour_null_mask,
    "3시간평균기온(℃)"
] = weather_df.loc[
    three_hour_null_mask,
    "_calculated_3h_temp"
]


# 임시 컬럼 삭제
weather_df = weather_df.drop(
    columns=["_calculated_3h_temp"]
)


print(
    "3시간평균기온 처리 후 null:",
    weather_df["3시간평균기온(℃)"].isna().sum()
)

# Filling in humidity null values 
humidity_secondary_mapping = {
    400: 413,  # 강남구 -> 광진구
    401: 415,  # 서초구 -> 용산구
    403: 413,  # 송파구 -> 광진구
    405: 410,  # 양천구 -> 동작구
    510: 411,  # 영등포구 -> 마포구
}

print(
    "Secondary mapping 전 습도 null:",
    weather_df["습도(%)"].isna().sum()
)


for target_station, source_station in humidity_secondary_mapping.items():

    # target district에서 아직도 습도가 null인 row만 선택
    target_mask = (
        (weather_df["지점"] == target_station)
        & weather_df["습도(%)"].isna()
    )

    target_count = target_mask.sum()

    if target_count == 0:
        continue

    print(
        f"{target_station} <- {source_station}: "
        f"{target_count}개 null 처리 시도"
    )

    # secondary district의 timestamp별 습도 데이터
    source_humidity = (
        weather_df[
            weather_df["지점"] == source_station
        ]
        .set_index("일시")["습도(%)"]
    )

    # target의 결측 timestamp
    target_times = weather_df.loc[
        target_mask,
        "일시"
    ]

    # 같은 timestamp의 secondary district 습도 가져오기
    mapped_values = target_times.map(
        source_humidity
    )

    # 값이 존재하는 경우에만 채우기
    fillable_mask = mapped_values.notna()

    target_indices = weather_df.loc[
        target_mask
    ].index

    fill_indices = target_indices[
        fillable_mask.values
    ]

    weather_df.loc[
        fill_indices,
        "습도(%)"
    ] = mapped_values[
        fillable_mask
    ].values

humidity_donors = {
    404: [405, 423, 510],  # 강서구 <- 양천, 구로, 영등포
    415: [419, 411, 421],  # 용산구 <- 중구, 마포, 성동
    419: [415, 421, 411],  # 중구   <- 용산, 성동, 마포
    509: [417, 410, 423],  # 관악구 <- 금천, 동작, 구로

    # 짧게 남아 있는 결측 처리용
    401: [415, 400, 419],  # 서초구
    423: [405, 510, 410],  # 구로구
}

humidity_col = "습도(%)"

station_names = {
    400: "강남구",
    401: "서초구",
    402: "강동구",
    403: "송파구",
    404: "강서구",
    405: "양천구",
    406: "도봉구",
    407: "노원구",
    408: "동대문구",
    409: "중랑구",
    410: "동작구",
    411: "마포구",
    412: "서대문구",
    413: "광진구",
    414: "성북구",
    415: "용산구",
    416: "은평구",
    417: "금천구",
    419: "중구",
    421: "성동구",
    423: "구로구",
    424: "강북구",
    509: "관악구",
    510: "영등포구",
}


print("처리 전 humidity null:",
      weather_df[humidity_col].isna().sum())

def get_donor_median(df, donor_stations):

    donor_df = df[
        df["지점"].isin(donor_stations)
    ][["지점", "일시", humidity_col]].copy()

    donor_pivot = donor_df.pivot(
        index="일시",
        columns="지점",
        values=humidity_col
    )

    # 존재하는 donor들 가운데 median
    donor_median = donor_pivot.median(
        axis=1,
        skipna=True
    )

    return donor_median

district_bias = {}

for target_station, donor_stations in humidity_donors.items():

    donor_median = get_donor_median(
        weather_df,
        donor_stations
    )

    target_data = weather_df[
        weather_df["지점"] == target_station
    ][["일시", humidity_col]].copy()

    target_data["year"] = (
        target_data["일시"].dt.year
    )

    # 2023~2025만 calibration에 사용
    calibration = target_data[
        target_data["year"].isin([2023, 2024, 2025])
    ].copy()

    calibration["donor_median"] = (
        calibration["일시"].map(donor_median)
    )

    calibration = calibration.dropna(
        subset=[humidity_col, "donor_median"]
    )

    if len(calibration) > 0:

        differences = (
            calibration[humidity_col]
            - calibration["donor_median"]
        )

        # 이상치에 덜 민감하도록 median difference 사용
        bias = differences.median()

    else:
        bias = 0.0

    district_bias[target_station] = bias

    print(
        f"{station_names[target_station]} "
        f"bias = {bias:.2f}%p "
        f"(n={len(calibration)})"
    )

    for station in weather_df["지점"].unique():

        station_mask = (
            weather_df["지점"] == station
        )

        station_indices = weather_df.index[
            station_mask
        ]

        humidity = weather_df.loc[
            station_indices,
            humidity_col
        ]

        null_mask = humidity.isna()

        if not null_mask.any():
            continue

        # null/non-null 상태가 바뀔 때마다 새로운 그룹
        group_id = (
            null_mask.ne(null_mask.shift())
            .cumsum()
        )

        null_groups = (
            humidity[null_mask]
            .groupby(group_id[null_mask])
        )

        for _, group in null_groups:

            gap_indices = group.index
            gap_length = len(gap_indices)


            # ====================================================
            # CASE A: 단독 1시간 결측
            # ====================================================

            if gap_length == 1:

                idx = gap_indices[0]

                prev_idx = idx - 1
                next_idx = idx + 1

                # 같은 station 내부인지 확인
                valid_prev = (
                    prev_idx in weather_df.index
                    and weather_df.loc[
                        prev_idx, "지점"
                    ] == station
                )

                valid_next = (
                    next_idx in weather_df.index
                    and weather_df.loc[
                        next_idx, "지점"
                    ] == station
                )

                if valid_prev and valid_next:

                    prev_time = weather_df.loc[
                        prev_idx, "일시"
                    ]

                    curr_time = weather_df.loc[
                        idx, "일시"
                    ]

                    next_time = weather_df.loc[
                        next_idx, "일시"
                    ]

                    prev_value = weather_df.loc[
                        prev_idx, humidity_col
                    ]

                    next_value = weather_df.loc[
                        next_idx, humidity_col
                    ]

                    correct_time_interval = (
                        curr_time - prev_time
                        == pd.Timedelta(hours=1)
                        and
                        next_time - curr_time
                        == pd.Timedelta(hours=1)
                    )

                    if (
                        correct_time_interval
                        and pd.notna(prev_value)
                        and pd.notna(next_value)
                    ):

                        weather_df.loc[
                            idx,
                            humidity_col
                        ] = (
                            prev_value + next_value
                        ) / 2

                        continue


            # ====================================================
            # CASE B: 2~23시간 결측
            # donor median 사용 (bias 없이)
            # ====================================================

            if 2 <= gap_length < 24:

                if station not in humidity_donors:
                    continue

                donor_median = get_donor_median(
                    weather_df,
                    humidity_donors[station]
                )

                for idx in gap_indices:

                    timestamp = weather_df.loc[
                        idx,
                        "일시"
                    ]

                    value = donor_median.get(
                        timestamp,
                        np.nan
                    )

                    if pd.notna(value):

                        weather_df.loc[
                            idx,
                            humidity_col
                        ] = value


            # ====================================================
            # CASE C: 24시간 이상 장기 결측
            # donor median + target district bias
            # ====================================================

            elif gap_length >= 24:

                if station not in humidity_donors:
                    continue

                donor_median = get_donor_median(
                    weather_df,
                    humidity_donors[station]
                )

                bias = district_bias.get(
                    station,
                    0.0
                )

                for idx in gap_indices:

                    timestamp = weather_df.loc[
                        idx,
                        "일시"
                    ]

                    median_value = donor_median.get(
                        timestamp,
                        np.nan
                    )

                    if pd.notna(median_value):

                        imputed_value = (
                            median_value + bias
                        )

                        # 습도는 반드시 0~100
                        imputed_value = np.clip(
                            imputed_value,
                            0,
                            100
                        )

                        weather_df.loc[
                            idx,
                            humidity_col
                        ] = imputed_value

print(
    "\n처리 후 humidity null:",
    weather_df[humidity_col].isna().sum()
)

remaining = (
    weather_df[
        weather_df[humidity_col].isna()
    ]
    .groupby("지점")
    .size()
    .sort_values(ascending=False)
)

print("\n지점별 남은 humidity null:")
print(remaining)

weather_columns = [
    "기온(℃)",
    "풍속(m/s)",
    "습도(%)",
    "3시간평균기온(℃)"
]

print("\n전체 null:")
print(
    weather_df[
        weather_columns
    ].isna().sum()
)


# Create 'district' column by mapping '지점'
weather_df['district'] = weather_df['지점'].map(station_names)

# Duplicate '중구' rows to create '종로구' rows
jongno_rows = weather_df[weather_df['district'] == '중구'].copy()
jongno_rows['district'] = '종로구'
weather_df = pd.concat([weather_df, jongno_rows], ignore_index=True) 

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