const API_BASE_URL = "http://127.0.0.1:8000";

export async function getAssignments() {
    const response = await fetch(`${API_BASE_URL}/assignments`);

    if (!response.ok) {
        throw new Error("Failed to fetch assignments.");
    }

    return response.json();
}

export async function createAssignment(assignment: {
    title: string;
    prompt: string;
    assignment_type: string;
    difficulty: number;
    due_date: string;
    preferred_session_length: number;
}) {
    const response = await fetch(`${API_BASE_URL}/assignments`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(assignment),
    });

    if (!response.ok) {
        throw new Error("Failed to create assignment.");
    }

    return response.json();
}

export async function generatePlan(assignmentId: number) {
  const response = await fetch(
    `${API_BASE_URL}/assignments/${assignmentId}/generate-tasks`,
    {
      method: "POST",
    }
  );

  if (!response.ok) {
    const errorData = await response.json();
    
    throw new Error(
        errorData.detail || "Failed to generate study plan."
    );
  }

  return response.json();
}

export async function getAssignmentPlan(assignmentId: number) {
    const response = await fetch (
        `${API_BASE_URL}/assignments/${assignmentId}/plan`
    );

    if (!response.ok) {
        const errorData = await response.json();

        throw new Error(
            errorData.detail || "Failed to load assignment plan."
        );
    }

    return response.json();
}