import pandas as pd

data = pd.read_csv('./data/raw_data/서울시_자치구별_인구.csv')

data_filtered = data[['동별(2)', '2021', '2022', '2023', '2024', '2025']]
data_filtered = data_filtered.iloc[3:]
data_filtered = data_filtered.rename(columns={'동별(2)': 'district'})


district_population_df = data_filtered.melt(
    id_vars='district',
    value_vars=['2021', '2022', '2023', '2024', '2025'],
    var_name='year',
    value_name='district_population'
)

# Make sure year has the same datatype as five_years_data['year']
district_population_df['year'] = district_population_df['year'].astype(int)

# Make sure population is numeric
district_population_df['district_population'] = pd.to_numeric(
    district_population_df['district_population'],
    errors='coerce'
)

# Optional: remove spaces from district names
district_population_df['district'] = district_population_df['district'].str.strip()

district_population_df.to_csv(
    './data/preprocessed_data/district_population.csv',
    index=False,
    encoding='utf-8-sig'
)