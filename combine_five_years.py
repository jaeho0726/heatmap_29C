# Importing necessary libraries
import pandas as pd

# Loading csv files with necessary columns for model training
district_population_df = pd.read_csv('./data/preprocessed_data/district_population.csv', encoding='utf-8-sig')
green_ratio_df = pd.read_csv('./data/preprocessed_data/green_ratio.csv', encoding='utf-8-sig')
weather_df = pd.read_csv('./data/preprocessed_data/district_weather.csv', encoding='utf-8-sig')

# Creating one combined dataframe
weather_df['date_time'] = pd.to_datetime(weather_df['date_time'])
weather_df['year'] = pd.to_datetime(weather_df['date_time']).dt.year

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

five_years_df = five_years_df.drop(columns=['year'])

five_years_df = (
    five_years_df
    .sort_values(['district', 'date_time'])
    .reset_index(drop=True)
)

print("Weather rows:", len(weather_df))
print("Final rows:", len(five_years_df))

print("\nFinal columns:")
print(five_years_df.columns.tolist())


# Exporting the combined dataframe to a csv file
five_years_df.to_csv(
    './data/five_years_combined.csv',
    index=False,
    encoding='utf-8-sig'
)