from datetime import date

from pydantic import BaseModel, Field


class AssignmentCreate(BaseModel):
    title: str = Field(min_length=1, max_length=200)
    prompt: str = Field(min_length=1)
    assignment_type: str = Field(min_length=1, max_length=100)
    difficulty: int = Field(ge=1, le=5)
    due_date: date
    preferred_session_length: int = Field(ge=15, le=180)