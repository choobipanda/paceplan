from fastapi import FastAPI, HTTPException

from database import supabase
from models import AssignmentCreate

from services.ai_service import generate_task_breakdown

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
            .table("tasks") \
            .delete() \
            .eq("assignment_id", assignment_id) \
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

        return {
            "assignment_id": assignment_id,
            "tasks": task_response.data,
        }

    except HTTPException:
        raise

    except Exception as error:
        raise HTTPException(
            status_code=500,
            detail=f"Could not generate tasks: {error}",
        ) from error