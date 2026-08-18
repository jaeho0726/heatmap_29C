# Importing necessary libraries
import pandas as pd

# Loading csv files with necessary columns for model training
district_population_df = pd.read_csv('./data/preprocessed_data/district_population.csv', encoding='utf-8-sig')
green_ratio_df = pd.read_csv('./data/preprocessed_data/green_ratio.csv', encoding='utf-8-sig')

# Creating one combined dataframe
five_years_df = pd.merge(
    district_population_df,
    green_ratio_df,
    on=['district', 'year'],
    how='inner'
)

# Exporting the combined dataframe to a csv file
five_years_df.to_csv(
    './data/preprocessed_data/five_years_combined.csv',
    index=False,
    encoding='utf-8-sig'
)