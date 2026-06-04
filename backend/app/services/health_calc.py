from app.models.diagnostic import HealthRecord, HealthRecordResponse


def compute_bmi(record: HealthRecord) -> HealthRecordResponse:
    bmi = record.weight_kg / ((record.height_cm / 100) ** 2)
    bmi = round(bmi, 2)

    if bmi < 18.5:
        category = "Underweight"
    elif bmi < 25.0:
        category = "Normal"
    elif bmi < 30.0:
        category = "Overweight"
    else:
        category = "Obese"

    return HealthRecordResponse(
        **record.model_dump(),
        bmi=bmi,
        bmi_category=category,
    )