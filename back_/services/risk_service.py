def calculate_risk(age):

    base_score = 80

    if age >= 75:
        age_factor = 1.2
    elif age >= 65:
        age_factor = 1.1
    else:
        age_factor = 1.0

    score = base_score * age_factor

    if score > 100:
        score = 100

    return round(score)