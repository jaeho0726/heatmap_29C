from pathlib import Path

import joblib
import pandas as pd
from sklearn.metrics import mean_absolute_error
from sklearn.model_selection import train_test_split
from xgboost import XGBRegressor


BASE_DIR = Path(__file__).resolve().parents[1]
DATA_PATH = BASE_DIR / "data" / "processed" / "daily_train.csv"
MODEL_PATH = Path(__file__).with_name("heat_model.pkl")

FEATURE_COLUMNS = [
    "temperature",
    "max_temperature",
    "rainfall",
    "wind_speed",
    "humidity",
    "green_ratio",
]


def main():
    df = pd.read_csv(DATA_PATH, encoding="utf-8-sig")

    df["date"] = pd.to_datetime(df["date"], errors="coerce")
    df["patient_count"] = df["patient_count"].fillna(0)

    df = df.dropna(
        subset=[
            "date",
            "temperature",
            "max_temperature",
            "rainfall",
            "wind_speed",
            "humidity",
            "green_ratio",
            "patient_count",
        ]
    )

    X = df[FEATURE_COLUMNS]
    y = df["patient_count"]

    X_train, X_test, y_train, y_test = train_test_split(
        X,
        y,
        test_size=0.2,
        random_state=42,
    )

    model = XGBRegressor(
        n_estimators=300,
        max_depth=4,
        learning_rate=0.05,
        subsample=0.9,
        colsample_bytree=0.9,
        random_state=42,
    )

    model.fit(X_train, y_train)

    predictions = model.predict(X_test)
    mae = mean_absolute_error(y_test, predictions)

    joblib.dump(model, MODEL_PATH)

    print("dataset:", DATA_PATH)
    print("rows:", len(df))
    print("features:", FEATURE_COLUMNS)
    print("target: patient_count")
    print("MAE:", round(mae, 4))
    print("model saved:", MODEL_PATH)


if __name__ == "__main__":
    main()
