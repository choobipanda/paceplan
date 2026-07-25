import os

from dotenv import load_dotenv
from openai import OpenAI
from pydantic import BaseModel, Field

load_dotenv()

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))


class GeneratedTask(BaseModel):
    title: str
    description: str
    order_number: int
    effort_percentage: float = Field(ge=0, le=100)


class TaskBreakdown(BaseModel):
    tasks: list[GeneratedTask]

def generate_task_breakdown(
    title: str,
    prompt: str,
    assignment_type: str,
    difficulty: int,
) -> TaskBreakdown:
    response = client.responses.parse(
        model="gpt-5-mini",
        input=[
            {
                "role": "system",
                "content": (
                    "You are a student planning assistant. "
                    "Break assignments into clear, realistic, ordered tasks. "
                    "The effort percentages across all tasks must total 100. "
                    "Do not create study sessions yet. "
                    "Only assign relative effort percentages; the application will calculate minutes."
                ),
            },
            {
                "role": "user",
                "content": (
                    f"Assignment title: {title}\n"
                    f"Assignment type: {assignment_type}\n"
                    f"Difficulty: {difficulty}/5\n\n"
                    f"Assignment instructions:\n{prompt}"
                ),
            },
        ],
        text_format=TaskBreakdown,
    )

    if response.output_parsed is None:
        raise RuntimeError("The AI did not return a valid task breakdown.")

    return response.output_parsed