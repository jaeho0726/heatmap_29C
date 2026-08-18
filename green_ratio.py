import pandas as pd

green_area = pd.read_csv('./data/raw_data/서울시_녹지현황.csv')

district_area = pd.read_csv('./data/raw_data/서울시_자치구별_면적.csv')

green = green_area.iloc[2:].copy()

# Rename district column
green = green.rename(columns={
    '구분별(2)': 'district'
})

# Keep only the 25 districts, removing the "소계" row
green = green[green['district'] != '소계']

# Select district + green-area columns only
# 2021, 2022, ... appear to be number of green spaces
# 2021.1, 2022.1, ... appear to be area in m²
green = green[
    ['district', '2021.1', '2022.1', '2023.1', '2024.1', '2025.1']
].copy()

green.columns = [
    'district',
    '2021',
    '2022',
    '2023',
    '2024',
    '2025'
]

# Convert values to numeric
for year in ['2021', '2022', '2023', '2024', '2025']:
    green[year] = pd.to_numeric(green[year], errors='coerce')


# -----------------------------
# 2. Clean district_area
# -----------------------------

area = district_area.iloc[2:].copy()

area = area.rename(columns={
    '자치구별(2)': 'district'
})

# Remove Seoul total row
area = area[area['district'] != '소계']

# In district_area:
# 2021, 2022, ... = area in km²
# 2021.1, 2022.1, ... = composition ratio
area = area[
    ['district', '2021', '2022', '2023', '2024', '2025']
].copy()

for year in ['2021', '2022', '2023', '2024', '2025']:
    area[year] = pd.to_numeric(area[year], errors='coerce')


# -----------------------------
# 3. Merge the two dataframes
# -----------------------------

merged = green.merge(
    area,
    on='district',
    suffixes=('_green', '_district')
)


# -----------------------------
# 4. Calculate green ratio (%)
# -----------------------------

green_ratio = pd.DataFrame()
green_ratio['district'] = merged['district']

for year in ['2021', '2022', '2023', '2024', '2025']:

    green_ratio[year] = (
        merged[f'{year}_green']
        /
        (merged[f'{year}_district'] * 1_000_000)
        * 100
    )


# -----------------------------
# 5. Convert wide format to long format
# -----------------------------

green_ratio = green_ratio.melt(
    id_vars='district',
    var_name='year',
    value_name='green_ratio'
)

green_ratio['year'] = green_ratio['year'].astype(int)



# -----------------------------
# 6. Export
# -----------------------------

green_ratio.to_csv(
    './data/preprocessed_data/green_ratio.csv',
    index=False,
    encoding='utf-8-sig'
)