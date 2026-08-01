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

export async function startStudySession(sessionId: number) {
  const response = await fetch(
    `${API_BASE_URL}/study-sessions/${sessionId}/start`,
    {
      method: "PATCH",
    }
  );

  if (!response.ok) {
    const errorData = await response.json();

    throw new Error(
      errorData.detail || "Failed to start study session."
    );
  }

  return response.json();
}

export async function completeStudySession(sessionId: number) {
  const response = await fetch(
    `${API_BASE_URL}/study-sessions/${sessionId}/complete`,
    {
      method: "PATCH",
    }
  );

  if (!response.ok) {
    const errorData = await response.json();

    throw new Error(
      errorData.detail || "Failed to complete study session."
    );
  }

  return response.json();
}

export async function completeAssignment(
  assignmentId: number,
  actualMinutes: number
) {
  const response = await fetch(
    `${API_BASE_URL}/assignments/${assignmentId}/complete`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        actual_minutes: actualMinutes,
      }),
    }
  );

  if (!response.ok) {
    const errorData = await response.json();

    throw new Error(
      errorData.detail || "Failed to complete assignment."
    );
  }

  return response.json();
}

export async function deleteAssignment(assignmentId: number) {
  const response = await fetch(
    `${API_BASE_URL}/assignments/${assignmentId}`,
    {
      method: "DELETE",
    }
  );

  if (!response.ok) {
    const errorData = await response.json();

    throw new Error(
      errorData.detail || "Failed to delete assignment."
    );
  }

  return response.json();
}

export async function updateAssignment(
  assignmentId: number,
  assignment: {
    title: string;
    prompt: string;
    assignment_type: string;
    difficulty: number;
    due_date: string;
    preferred_session_length: number;
  }
) {
  const response = await fetch(
    `${API_BASE_URL}/assignments/${assignmentId}`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(assignment),
    }
  );

  if (!response.ok) {
    const errorData = await response.json();

    throw new Error(
      errorData.detail || "Failed to update assignment."
    );
  }

  return response.json();
}