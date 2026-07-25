import math

def estimate_total_minutes(
    assignment_type: str,
    difficulty: int,
) -> int:
    base_minutes_by_type = {
        "Research Paper": 360,
        "Essay": 240,
        "Programming Project": 480,
        "Presentation": 180,
        "Homework": 120,
        "Other": 180,
    }

    base_minutes = base_minutes_by_type.get(
        assignment_type,
        base_minutes_by_type["Other"],
    )

    difficulty_multiplier = {
        1: 0.75,
        2: 0.9,
        3: 1.0,
        4: 1.25,
        5: 1.5,
    }

    return round(base_minutes * difficulty_multiplier[difficulty])


def allocate_task_minutes(
    total_minutes: int,
    effort_percentage: float,
) -> int:
    return max(
        1,
        round(total_minutes * (effort_percentage / 100)),
    )


def split_into_sessions(
    task_minutes: int,
    session_length: int,
) -> list[int]:
    session_count = math.ceil(task_minutes / session_length)

    sessions = []
    remaining_minutes = task_minutes

    for _ in range(session_count):
        current_session = min(session_length, remaining_minutes)
        sessions.append(current_session)
        remaining_minutes -= current_session

    return sessions