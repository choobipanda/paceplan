from fastapi import FastAPI, HTTPException

from database import supabase
from models import AssignmentCreate

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