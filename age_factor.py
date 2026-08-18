import pandas as pd 

# Heat Illness Rates by Age Group for Each Year (2021 ~ 2025)
heat_illness_2021 = {'0-9': 1,
                     '10-19': 39,
                     '20-29': 141,
                     '30-39': 120,
                     '40-49': 215,
                     '50-59': 330,
                     '60-69': 245,
                     '70-79': 127,
                     '80+': 158}

heat_illness_2022 = {'0-9': 3,
                     '10-19': 42,
                     '20-29': 168,
                     '30-39': 176,
                     '40-49': 246,
                     '50-59': 344,
                     '60-69': 281,
                     '70-79': 163,
                     '80+': 141}

heat_illness_2023 = {'0-9': 16,
                     '10-19': 95,
                     '20-29': 291,
                     '30-39': 323,
                     '40-49': 385,
                     '50-59': 601,
                     '60-69': 514,
                     '70-79': 325,
                     '80+': 268}

heat_illness_2024 = {'0-9': 0.3,
                     '10-19': 2.8,
                     '20-29': 10.0,
                     '30-39': 12.9,
                     '40-49': 14.5,
                     '50-59': 19.3,
                     '60-69': 18.3,
                     '70-79': 11.7,
                     '80+': 10.1}

heat_illness_2025 = {'0-9': 0.2,
                     '10-19': 3.0,
                     '20-29': 10.0,
                     '30-39': 13.6,
                     '40-49': 13.5,
                     '50-59': 19.4,
                     '60-69': 18.7,
                     '70-79': 10.9,
                     '80+': 10.7}       

heat_illness_df = pd.DataFrame(
    [
        heat_illness_2021,
        heat_illness_2022,
        heat_illness_2023,
        heat_illness_2024,
        heat_illness_2025
    ],
    index=[2021, 2022, 2023, 2024, 2025]
)

heat_illness_df.index.name = 'year'



# Population Data by Age Group
# ======================================================
population_by_age_group = pd.read_csv('./data/raw_data/전국_연령별_추계인구.csv')

# Filtering
population_by_age_group = population_by_age_group.drop(columns = ['가정별'])
population_by_age_group = population_by_age_group[population_by_age_group['성별'] == '전체']
population_by_age_group = population_by_age_group.drop(columns = ['성별'])
population_by_age_group = population_by_age_group.set_index('연령별')

# Regrouping based on age groups and changing the structure of the dataframe
year_cols = ['2021', '2022', '2023', '2024', '2025']

population_by_age_group[year_cols] = population_by_age_group[year_cols].apply(
    pd.to_numeric,
    errors='coerce'
)

# Create a new dataframe for the desired age groups
age_group_data = pd.DataFrame(index=year_cols)

age_group_data['0-9'] = (
    population_by_age_group.loc['0 - 4세', year_cols]
    + population_by_age_group.loc['5 - 9세', year_cols]
)

age_group_data['10-19'] = (
    population_by_age_group.loc['10 - 14세', year_cols]
    + population_by_age_group.loc['15 - 19세', year_cols]
)

age_group_data['20-29'] = (
    population_by_age_group.loc['20 - 24세', year_cols]
    + population_by_age_group.loc['25 - 29세', year_cols]
)

age_group_data['30-39'] = (
    population_by_age_group.loc['30 - 34세', year_cols]
    + population_by_age_group.loc['35 - 39세', year_cols]
)

age_group_data['40-49'] = (
    population_by_age_group.loc['40 - 44세', year_cols]
    + population_by_age_group.loc['45 - 49세', year_cols]
)

age_group_data['50-59'] = (
    population_by_age_group.loc['50 - 54세', year_cols]
    + population_by_age_group.loc['55 - 59세', year_cols]
)

age_group_data['60-69'] = (
    population_by_age_group.loc['60 - 64세', year_cols]
    + population_by_age_group.loc['65 - 69세', year_cols]
)

age_group_data['70-79'] = (
    population_by_age_group.loc['70 - 74세', year_cols]
    + population_by_age_group.loc['75 - 79세', year_cols]
)

age_group_data['80+'] = (
    population_by_age_group.loc['80 - 84세', year_cols]
    + population_by_age_group.loc['85 - 89세', year_cols]
    + population_by_age_group.loc['90 - 94세', year_cols]
    + population_by_age_group.loc['95 - 99세', year_cols]
    + population_by_age_group.loc['100세 이상', year_cols]
)

# Put year back as a normal column
age_group_data = age_group_data.reset_index()

age_group_data = age_group_data.rename(
    columns={'index': 'year'}
)



# Cacluating the age factor for each age group
# ======================================================
age_groups = [
    '0-9', '10-19', '20-29', '30-39', '40-49',
    '50-59', '60-69', '70-79', '80+'
]

age_factor = pd.DataFrame(
    {
        'factor': (
            heat_illness_df[age_groups].sum(axis=0)
            /
            age_group_data[age_groups].sum(axis=0)
        )
    }
)

age_factor = age_factor.reset_index().rename(columns={'index': 'age_group'})

age_factor.to_csv(
    './data/preprocessed_data/age_factor.csv',
    index=False,
    encoding='utf-8-sig'
)