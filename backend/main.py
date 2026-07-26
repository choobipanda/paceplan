from fastapi import FastAPI, HTTPException

from database import supabase
from models import AssignmentCreate

from services.ai_service import generate_task_breakdown

from services.planning_service import (
    allocate_task_minutes,
    estimate_total_minutes,
    split_into_sessions,
)

from datetime import date

from services.scheduling_service import (
    assign_session_times,
    distribute_sessions_evenly,
    get_scheduling_dates,
)

app = FastAPI(title="PacePlan API")


@app.get("/")
def read_root():
    return {"message": "PacePlan API is running"}


@app.get("/assignments")
def get_assignments():
    try:
        response = (
            supabase
            .table("assignments")
            .select("*")
            .execute()
        )

        return response.data

    except Exception as error:
        raise HTTPException(
            status_code=500,
            detail=f"Could not retrieve assignments: {error}",
        ) from error


@app.post("/assignments", status_code=201)
def create_assignment(assignment: AssignmentCreate):
    try:
        response = (
            supabase
            .table("assignments")
            .insert(
                {
                    "title": assignment.title,
                    "prompt": assignment.prompt,
                    "assignment_type": assignment.assignment_type,
                    "difficulty": assignment.difficulty,
                    "due_date": assignment.due_date.isoformat(),
                    "preferred_session_length": assignment.preferred_session_length,
                }
            )
            .select("*")
            .execute()
        )
        # print("SUPABASE RESPONSE:", response)

        return {
            "data": response.data
        }

    except Exception as error:
        print("SUPABASE ERROR:", repr(error))

        raise HTTPException(
            status_code=500,
            detail=f"Could not create assignment: {error}",
        ) from error

@app.post("/assignments/{assignment_id}/generate-tasks")
def generate_tasks(assignment_id: int):
    try:
        assignment_response = (
            supabase
            .table("assignments")
            .select("*")
            .eq("id", assignment_id)
            .single()
            .execute()
        )

        assignment = assignment_response.data

        if not assignment:
            raise HTTPException(
                status_code=404,
                detail="Assignment not found.",
            )

        supabase \
            .table("study_sessions") \
            .delete() \
            .eq("assignment_id", assignment_id) \
            .execute()

        supabase \
            .table("tasks") \
            .delete() \
            .eq("assignment_id", assignment_id) \
            .execute()
        

        total_minutes = estimate_total_minutes(
            assignment_type=assignment["assignment_type"],
            difficulty=assignment["difficulty"],
        )

        supabase \
                    .table("assignments") \
                    .update(
                        {
                            "predicted_minutes": total_minutes,
                        }
                    ) \
                    .eq("id", assignment_id) \
                    .execute()

        breakdown = generate_task_breakdown(
            title=assignment["title"],
            prompt=assignment["prompt"],
            assignment_type=assignment["assignment_type"],
            difficulty=assignment["difficulty"],
        )

        task_rows = [
            {
                "assignment_id": assignment_id,
                "title": task.title,
                "description": task.description,
                "order_number": task.order_number,
                "effort_percentage": task.effort_percentage,
            }
            for task in breakdown.tasks
        ]

        task_response = (
            supabase
            .table("tasks")
            .insert(task_rows)
            .select("*")
            .execute()
        )

        saved_tasks = task_response.data

        session_rows = []
        session_order = 1

        for task in saved_tasks:
            task_minutes = allocate_task_minutes(
                total_minutes=total_minutes,
                effort_percentage=float(task["effort_percentage"]),
            )

            task_sessions = split_into_sessions(
                task_minutes=task_minutes,
                session_length=assignment["preferred_session_length"],
            )

            for planned_minutes in task_sessions:
                session_rows.append(
                    {
                        "task_id": task["id"],
                        "assignment_id": assignment_id,
                        "session_order": session_order,
                        "planned_minutes": planned_minutes,
                    }
                )

                session_order += 1

        if session_rows:
            session_response = (
                supabase
                .table("study_sessions")
                .insert(session_rows)
                .select("*")
                .execute()
            )
        else:
            session_response = None

        if session_response is None:
            raise HTTPExeception(
                status_code=500,
                detail="No study sessions were generated."
            )

        study_sessions = session_response.data

        scheduling_dates = get_scheduling_dates(
            start_date=date.today(),
            due_date=date.fromisoformat(assignment["due_date"]),
        )

        scheduled_sessions = distribute_sessions_evenly(
            sessions=study_sessions,
            scheduling_dates=scheduling_dates,
        )

        sessions_with_times = assign_session_times(
            scheduled_sessions=scheduled_sessions,
        )

        for session in sessions_with_times:
            (
                supabase
                .table("study_sessions")
                .update(
                    {
                        "scheduled_start": session["scheduled_start"].isoformat(),
                        "scheduled_end": session["scheduled_end"].isoformat(),
                    }
                )
                .eq("id", session["id"])
                .execute()
            )

        return {
            "assignment_id": assignment_id,
            "predicted_minutes": total_minutes,
            "tasks": saved_tasks,
            "study_sessions": sessions_with_times,
        }

    except HTTPException:
        raise

    except Exception as error:
        raise HTTPException(
            status_code=500,
            detail=f"Could not generate tasks: {error}",
        ) from error