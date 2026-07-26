from datetime import date, datetime, time, timedelta


def get_scheduling_dates(
    start_date: date,
    due_date: date,
) -> list[date]:
    if due_date < start_date:
        raise ValueError("The due date cannot be in the past.")

    dates = []
    current_date = start_date

    while current_date < due_date:
        dates.append(current_date)
        current_date += timedelta(days=1)

    if not dates:
        dates.append(due_date)

    return dates

def distribute_sessions_evenly(
    sessions: list[dict],
    scheduling_dates: list[date],
) -> list[dict]:
    if not scheduling_dates:
        raise ValueError("At least one scheduling date is required.")

    total_sessions = len(sessions)
    total_dates = len(scheduling_dates)

    base_sessions_per_day = total_sessions // total_dates
    extra_sessions = total_sessions % total_dates

    scheduled_sessions = []
    session_index = 0

    for date_index, assigned_date in enumerate(scheduling_dates):
        sessions_for_date = base_sessions_per_day

        if date_index < extra_sessions:
            sessions_for_date += 1

        for _ in range(sessions_for_date):
            if session_index >= total_sessions:
                break

            scheduled_sessions.append(
                {
                    **sessions[session_index],
                    "scheduled_date": assigned_date,
                }
            )

            session_index += 1

    return scheduled_sessions

def assign_session_times(
    scheduled_sessions: list[dict],
    start_hour: int = 9,
) -> list[dict]:
    sessions_with_times = []
    current_date = None
    current_start = None

    for session in scheduled_sessions:
        scheduled_date = session["scheduled_date"]

        if scheduled_date != current_date:
            current_date = scheduled_date
            current_start = datetime.combine(
                scheduled_date,
                time(hour=start_hour),
            )

        scheduled_end = current_start + timedelta(
            minutes=session["planned_minutes"],
        )

        sessions_with_times.append(
            {
                **session,
                "scheduled_start": current_start,
                "scheduled_end": scheduled_end,
            }
        )

        current_start = scheduled_end

    return sessions_with_times