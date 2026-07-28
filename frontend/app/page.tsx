"use client";

import {
  createAssignment,
  generatePlan,
  getAssignments, 
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

export default function Home() {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [title, setTitle] = useState("");
  const [prompt, setPrompt] = useState("");
  const [assignmentType, setAssignmentType] = useState("Homework");
  const [difficulty, setDifficulty] = useState(3);
  const [dueDate, setDueDate] = useState("");
  const [sessionLength, setSessionLength] = useState(45);
  const [generatingId, setGeneratingId] = useState<number | null>(null);

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

  useEffect(() => {
    async function loadAssignments() {
      const data = await getAssignments();
      setAssignments(data);
    }

    loadAssignments();
  }, []);

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
                  className="rounded-lg border border-zinc-200 bg-white p-4"
                >
                  <h3 className="font-semibold text-zinc-900">
                    {assignment.title}
                  </h3>

                  <p className="mt-1 text-sm text-zinc-700">
                    Type: {assignment.assignment_type}
                  </p>

                  <p className="text-sm text-zinc-700">
                    Due: {assignment.due_date}
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
                  
                  <button
                    onClick={() => handleGeneratePlan(assignment.id)}
                    disabled={generatingId === assignment.id}
                    className="mt-4 rounded-lg bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {generatingId === assignment.id
                      ? "Generating..."
                      : "Generate Plan"}
                  </button>
                </li>
              ))}
            </ul>
          )}

        </section>
      </div>
    </main>
  );
}