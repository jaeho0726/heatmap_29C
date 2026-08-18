from pathlib import Path

import joblib
import pandas as pd


MODEL_PATH = Path(__file__).with_name("heat_model.pkl")
model = joblib.load(MODEL_PATH)


def predict_patient_count(
    temperature: float,
    max_temperature: float,
    rainfall: float,
    wind_speed: float,
    humidity: float,
    green_ratio: float = 0.585919
):
    input_data = pd.DataFrame(
        [
            {
                "temperature": temperature,
                "max_temperature": max_temperature,
                "rainfall": rainfall,
                "wind_speed": wind_speed,
                "humidity": humidity,
                "green_ratio": green_ratio
            }
        ]
    )

    prediction = model.predict(input_data)[0]

    if prediction < 0:
        prediction = 0

    return round(float(prediction), 2)
