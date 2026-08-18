# Importing necessary libraries
import pandas as pd

# Loading csv files with necessary columns for model training
district_population_df = pd.read_csv('./data/preprocessed_data/district_population.csv', encoding='utf-8-sig')
green_ratio_df = pd.read_csv('./data/preprocessed_data/green_ratio.csv', encoding='utf-8-sig')
weather_df = pd.read_csv('./data/preprocessed_data/district_weather.csv', encoding='utf-8-sig')

# Creating one combined dataframe
time_col = 'time' if 'time' in weather_df.columns else '일시'
weather_df['year'] = pd.to_datetime(weather_df[time_col]).dt.year

annual_features = pd.merge(district_population_df, 
                           green_ratio_df, 
                           on=['district', 'year'], 
                           how='inner'
                           )

five_years_df = pd.merge(
    weather_df,
    annual_features,
    on=['district', 'year'], 
    how='right' 
)

# Exporting the combined dataframe to a csv file
five_years_df.to_csv(
    './data/five_years_combined.csv',
    index=False,
    encoding='utf-8-sig'
)