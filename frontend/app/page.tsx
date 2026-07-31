"use client";

import {
  createAssignment,
  generatePlan,
  getAssignmentPlan,
  getAssignments, 
  startStudySession,
  completeStudySession,
} from "@/lib/api";

import { useEffect, useState } from "react";

type Assignment = {
  id: number;
  title: string;
  prompt: string;
  assignment_type: string;
  difficulty: number;
  due_date: string;
  preferred_session_length: number;
  predicted_minutes: number | null;
  actual_minutes: number | null;
  status: string;
};

type Task = {
  id: number;
  assignment_id: number;
  title: string;
  description: string;
  order_number: number;
  effort_percentage: number;
  estimated_minutes: number | null;
  completed: boolean;
};

type StudySession = {
  id: number;
  task_id: number;
  assignment_id: number;
  session_order: number;
  planned_minutes: number;
  scheduled_start: string;
  scheduled_end: string;
  status: string;
};

type AssignmentPlan = {
  assignment: Assignment;
  tasks: Task[];
  study_sessions: StudySession[];
};

export default function Home() {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [title, setTitle] = useState("");
  const [prompt, setPrompt] = useState("");
  const [assignmentType, setAssignmentType] = useState("Homework");
  const [difficulty, setDifficulty] = useState(3);
  const [dueDate, setDueDate] = useState("");
  const [sessionLength, setSessionLength] = useState(45);
  const [generatingId, setGeneratingId] = useState<number | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<AssignmentPlan | null>(null);
  const [selectedAssignmentId, setSelectedAssignmentId] = useState<number | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    
    const newAssignment = await createAssignment({
      title,
      prompt,
      assignment_type: assignmentType,
      difficulty,
      due_date: dueDate,
      preferred_session_length: sessionLength,
    });

    const updatedAssignments = await getAssignments();
    setAssignments(updatedAssignments);
    

    setTitle("");
    setPrompt("");
    setAssignmentType("Homework");
    setDifficulty(3);
    setDueDate("");
    setSessionLength(45);
  }

  async function handleGeneratePlan(assignmentId: number) {
    try {
      setGeneratingId(assignmentId);

      await generatePlan(assignmentId);

      const updatedAssignments = await getAssignments();
      setAssignments(updatedAssignments);
    } catch (error) {
      if (error instanceof Error) {
        alert(error.message);
        console.error(error);
      }
    } finally {
      setGeneratingId(null);
    }
  }

  async function handleViewPlan(assignmentId: number) {
    try {
      const plan = await getAssignmentPlan(assignmentId);

      setSelectedPlan(plan);
      setSelectedAssignmentId(plan.assignment.id);
    } catch (error) {
      if (error instanceof Error) {
        alert(error.message);
        console.error(error);
      }
    }
  }

  async function handleStartSession(sessionId: number) {
    try {
      const response = await startStudySession(sessionId);

      if (!selectedPlan) return;

      setSelectedPlan({
        ...selectedPlan,
        study_sessions: selectedPlan.study_sessions.map((session) =>
          session.id === sessionId
            ? response.study_session
            : session
        ),
      });
    } catch (error) {
      if (error instanceof Error) {
        alert(error.message);
        console.error(error);
      }
    }
  }

  async function handleCompleteSession(sessionId: number) {
    try {
      const response = await completeStudySession(sessionId);

      if (!selectedPlan) return;

      setSelectedPlan({
        ...selectedPlan,
        study_sessions: selectedPlan.study_sessions.map((session) =>
          session.id === sessionId
            ? response.study_session
            : session
        ),
      });
    } catch (error) {
      if (error instanceof Error) {
        alert(error.message);
        console.error(error);
      }
    }
  }

  useEffect(() => {
    async function loadAssignments() {
      const data = await getAssignments();
      setAssignments(data);

      const closestAssignment = data
        .filter(
          (assignment: Assignment) =>
            assignment.status !== "completed" &&
            assignment.predicted_minutes !== null
        )
        .sort(
          (a: Assignment, b: Assignment) =>
            new Date(a.due_date).getTime() -
            new Date(b.due_date).getTime()
        )[0];

      if (closestAssignment) {
        const plan = await getAssignmentPlan(closestAssignment.id);

        setSelectedPlan(plan);
        setSelectedAssignmentId(plan.assignment.id);
      }
    }

    loadAssignments();
  }, []);

  const completedSessions =
    selectedPlan?.study_sessions.filter(
      (session) => session.status === "completed"
    ).length ?? 0;

  const totalSessions =
    selectedPlan?.study_sessions.length ?? 0;

  const progressPercentage =
    totalSessions === 0
      ? 0
      : Math.round((completedSessions / totalSessions) * 100);

  return (
    <main className="min-h-screen bg-zinc-50 px-6 py-10">
      <div className="mx-auto max-w-5xl">
        <header className="mb-10">
          <p className="text-sm font-medium text-blue-600">
            AI-powered study planning
          </p>

          <h1 className="mt-2 text-4xl font-bold text-zinc-900">
            PacePlan
          </h1>

          <p className="mt-3 max-w-2xl text-zinc-600">
            Create assignments, generate task breakdowns, and build a
            personalized study schedule.
          </p>
        </header>

        <form
          onSubmit={handleSubmit}
          className="mb-8 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm"
        >
          <h2 className="mb-4 text-xl font-semibold text-zinc-900">
            New Assignment
          </h2>

          <div className="space-y-4">
            <input
              className="w-full rounded-lg border border-zinc-300 p-2 text-zinc-900 placeholder:text-zinc-500 focus:border-blue-500 focus:outline-none"
              type="text"
              placeholder="Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />

            <textarea
              className="w-full rounded-lg border border-zinc-300 p-2 text-zinc-900 placeholder:text-zinc-500"
              placeholder="Assignment Instructions"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={4}
              required
            />

            <select
              className="w-full rounded-lg border border-zinc-300 p-2 text-zinc-900 focus:border-blue-500 focus:outline-none"
              value={assignmentType}
              onChange={(e) => setAssignmentType(e.target.value)}
            >
              <option>Homework</option>
              <option>Essay</option>
              <option>Research Paper</option>
              <option>Presentation</option>
              <option>Programming Project</option>
              <option>Other</option>
            </select>

            <input
              className="w-full rounded-lg border border-zinc-300 p-2 text-zinc-900 placeholder:text-zinc-500 focus:border-blue-500 focus:outline-none"
              type="number"
              min={1}
              max={5}
              value={difficulty}
              onChange={(e) => setDifficulty(Number(e.target.value))}
            />

            <input
              className="w-full rounded-lg border border-zinc-300 p-2 text-zinc-900 placeholder:text-zinc-500 focus:border-blue-500 focus:outline-none"
              type="datetime-local"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              required
            />

            <input
              className="w-full rounded-lg border border-zinc-300 p-2 text-zinc-900 placeholder:text-zinc-500 focus:border-blue-500 focus:outline-none"
              value={sessionLength}
              onChange={(e) => setSessionLength(Number(e.target.value))}
            />

            <button
              type="submit"
              className="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
            >
              Create Assignment
            </button>
          </div>
        </form>
        <div className="grid gap-8 lg:grid-cols-[1fr_340px]">
          <div className="order-2">
            <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
              <h2 className="text-xl font-semibold text-zinc-900">
                Assignments
              </h2>

              {assignments.length === 0 ? (
                <p className="mt-2 text-zinc-600">
                  No assignments found.
                </p>
              ) : (
                <ul className="mt-4 space-y-4">
                  {assignments.map((assignment) => (
                    <li
                      key={assignment.id}
                      className={`rounded-lg border p-4 transition-colors ${
                        selectedAssignmentId === assignment.id
                          ? "border-blue-400 bg-blue-50"
                          : "border-zinc-200 bg-white"
                      }`}
                    >
                      <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                        Assignment #{assignment.id}
                      </p>
                      
                      <h3 className="font-semibold text-zinc-900">
                        {assignment.title}
                      </h3>

                      <p className="mt-1 text-sm text-zinc-700">
                        Type: {assignment.assignment_type}
                      </p>

                      <p className="text-sm text-zinc-700">
                        Due:{" "}
                        {new Date(assignment.due_date).toLocaleString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                          hour: "numeric",
                          minute: "2-digit",
                        })}
                      </p>

                      <p className="text-sm text-zinc-700">
                        Status: {assignment.status}
                      </p>

                      <p className="text-sm text-blue-600 font-medium">
                        Predicted Time:{" "}
                        {assignment.predicted_minutes !== null
                          ? `${assignment.predicted_minutes} minutes`
                          : "Not generated"}
                      </p>
                      
                      {assignment.predicted_minutes ? (
                        <button
                          onClick={() => handleViewPlan(assignment.id)}
                          className="mt-4 rounded-lg bg-green-600 px-4 py-2 text-white transition-colors hover:bg-green-700"
                        >
                          View Plan
                        </button>
                      ) : (
                        <button
                          onClick={() => handleGeneratePlan(assignment.id)}
                          disabled={generatingId === assignment.id}
                          className="mt-4 rounded-lg bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {generatingId === assignment.id
                            ? "Generating..."
                            : "Generate Plan"}
                        </button>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>
          <div className="order-1">
            {selectedPlan && (
              <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
                <h2 className="text-2xl font-bold text-zinc-900">
                  Study Plan
                </h2>

                <p className="mt-2 text-lg font-medium text-zinc-700">
                  {selectedPlan.assignment.title}
                </p>
                
                <p className="mt-1 text-sm text-zinc-400">
                  ASSIGNMENT #{selectedPlan.assignment.id}
                </p>

                <div className="mt-6 rounded-xl bg-blue-50 p-5">
                  <p className="text-sm font-medium text-blue-600">
                    Estimated Study Time
                  </p>

                  <p className="mt-2 text-3xl font-bold text-zinc-900">
                    {selectedPlan.assignment.predicted_minutes} minutes
                  </p>

                  <p className="mt-2 text-sm text-zinc-600">
                    {selectedPlan.assignment.assignment_type}
                  </p>
                </div>
                
                <div className="mt-8">
                  <div className="rounded-xl border border-zinc-200 bg-white p-5">
                    <h3 className="mt-2 text-lg font-semibold text-zinc-900">
                      Tasks
                    </h3>

                    <ul className="mt-2 grid grid-flow-col grid-rows-2 auto-cols-[220px] gap-x-6 gap-y-2 overflow-x-auto pb-3">
                      {selectedPlan.tasks.map((task) => (
                        <li
                          key={task.id}
                          className="text-sm text-zinc-700"
                        >
                          <span className="font-medium text-zinc-900">
                            {task.order_number}.
                          </span>{" "}
                          {task.title}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="mt-6 rounded-xl border border-zinc-200 bg-white p-5">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold text-zinc-900">
                        Progress
                      </h3>

                      <p className="text-sm font-medium text-zinc-600">
                        {completedSessions} / {totalSessions}
                      </p>
                    </div>

                    <div className="mt-4 h-3 overflow-hidden rounded-full bg-zinc-200">
                      <div
                        className="h-full rounded-full bg-blue-600 transition-all duration-300"
                        style={{ width: `${progressPercentage}%` }}
                      />
                    </div>

                    <p className="mt-3 text-sm text-zinc-600">
                      {progressPercentage}% Complete
                    </p>
                  </div>

                  <div>
                    <h3 className="mt-8 text-lg font-semibold text-zinc-900">
                      Study Sessions
                    </h3>
                    <div className="mt-3 space-y-3">
                      {selectedPlan.study_sessions.map((session) => (
                        <div
                          key={session.id}
                          className="rounded-lg border border-zinc-200 p-4"
                        >
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-semibold uppercase tracking-wide text-zinc-700">
                              Session {session.session_order}
                            </p>

                            <span
                              className={`rounded-full px-3 py-1 text-xs font-medium ${
                                session.status === "planned"
                                  ? "bg-yellow-100 text-yellow-700"
                                  : session.status === "in_progress"
                                  ? "bg-blue-100 text-blue-700"
                                  : "bg-green-100 text-green-700"
                              }`}
                            >
                              {session.status === "planned"
                                ? "Planned"
                                : session.status === "in_progress"
                                ? "In Progress"
                                : "Completed"}
                            </span>
                          </div>

                          <p className="mt-2 text-xl font-semibold text-zinc-900">
                            {session.planned_minutes} min
                          </p>

                          <p className="mt-2 text-sm text-zinc-600">
                            {new Date(session.scheduled_start).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })}
                          </p>

                          <p className="text-sm text-zinc-600">
                            {new Date(session.scheduled_start).toLocaleTimeString("en-US", {
                              hour: "numeric",
                              minute: "2-digit",
                            })}
                            {" – "}
                            {new Date(session.scheduled_end).toLocaleTimeString("en-US", {
                              hour: "numeric",
                              minute: "2-digit",
                            })}
                          </p>

                          {session.status === "planned" && (
                            <button
                              onClick={() => handleStartSession(session.id)}
                              className="mt-4 rounded-lg bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700"
                            >
                              Start Session
                            </button>
                          )}

                          {session.status === "in_progress" && (
                            <button
                              onClick={() => handleCompleteSession(session.id)}
                              className="mt-4 rounded-lg bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700"
                            >
                              Complete Session
                            </button>
                          )}

                          {session.status === "completed" && (
                            <p className="mt-4 text-sm font-medium text-green-700">
                              Session completed
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

              </section>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}