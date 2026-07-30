from datetime import date, datetime

import pandas as pd
from sklearn.compose import ColumnTransformer
from sklearn.linear_model import LinearRegression
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder

MIN_TRAINING_RECORDS = 10


def calculate_days_until_due(
    created_at: str,
    due_date: str,
) -> int:
    created_date = datetime.strptime(
        created_at[:10],
        "%Y-%m-%d"
    ).date()

    due_date_value = datetime.strptime(
        due_date[:10],
        "%Y-%m-%d"
    ).date()

    days_until_due = (
        due_date_value - created_date
    ).days

    return max(days_until_due, 0)


def build_training_dataframe(
    assignments: list[dict],
) -> pd.DataFrame:
    rows = []

    for assignment in assignments:
        rows.append(
            {
                "assignment_type": assignment["assignment_type"],
                "difficulty": assignment["difficulty"],
                "days_until_due": calculate_days_until_due(
                    created_at=assignment["created_at"],
                    due_date=assignment["due_date"],
                ),
                "preferred_session_length": assignment[
                    "preferred_session_length"
                ],
                "actual_minutes": assignment["actual_minutes"],
            }
        )

    return pd.DataFrame(rows)


def build_regression_pipeline() -> Pipeline:
    categorical_features = ["assignment_type"]

    numeric_features = [
        "difficulty",
        "days_until_due",
        "preferred_session_length",
    ]

    preprocessor = ColumnTransformer(
        transformers=[
            (
                "assignment_type",
                OneHotEncoder(handle_unknown="ignore"),
                categorical_features,
            ),
            (
                "numeric",
                "passthrough",
                numeric_features,
            ),
        ]
    )

    return Pipeline(
        steps=[
            ("preprocessor", preprocessor),
            ("regressor", LinearRegression()),
        ]
    )


def train_regression_model(
    assignments: list[dict],
) -> Pipeline:
    training_data = build_training_dataframe(assignments)

    if len(training_data) < MIN_TRAINING_RECORDS:
        raise ValueError(
            f"At least {MIN_TRAINING_RECORDS} completed assignments are required."
        )

    feature_columns = [
        "assignment_type",
        "difficulty",
        "days_until_due",
        "preferred_session_length",
    ]

    X = training_data[feature_columns]
    y = training_data["actual_minutes"]

    model = build_regression_pipeline()
    model.fit(X, y)

    return model


def predict_assignment_minutes(
    model: Pipeline,
    assignment: dict,
) -> int:
    input_data = pd.DataFrame(
        [
            {
                "assignment_type": assignment["assignment_type"],
                "difficulty": assignment["difficulty"],
                "days_until_due": calculate_days_until_due(
                    created_at=assignment["created_at"],
                    due_date=assignment["due_date"],
                ),
                "preferred_session_length": assignment[
                    "preferred_session_length"
                ],
            }
        ]
    )

    prediction = model.predict(input_data)[0]

    minimum_minutes = assignment["preferred_session_length"]

    maximum_minutes = 8 * 60

    return max(
        minimum_minutes,
        min(round(prediction), maximum_minutes)
    )


def get_predicted_minutes(
    completed_assignments: list[dict],
    new_assignment: dict,
    fallback_minutes: int,
) -> tuple[int, str]:
    if len(completed_assignments) < MIN_TRAINING_RECORDS:
        return fallback_minutes, "heuristic"

    model = train_regression_model(completed_assignments)

    predicted_minutes = predict_assignment_minutes(
        model=model,
        assignment=new_assignment,
    )

    return predicted_minutes, "regression"
