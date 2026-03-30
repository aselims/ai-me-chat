"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";

interface Project {
  id: string;
  name: string;
  description: string;
  status: string;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
}

interface Task {
  id: string;
  projectId: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  assigneeId: string | null;
  createdAt: string;
  updatedAt: string;
}

const STATUS_COLUMNS = [
  { key: "todo", label: "To Do" },
  { key: "in_progress", label: "In Progress" },
  { key: "done", label: "Done" },
] as const;

export default function ProjectDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [project, setProject] = useState<Project | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddTask, setShowAddTask] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskPriority, setNewTaskPriority] = useState("medium");
  const [editingTask, setEditingTask] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const fetchData = useCallback(async () => {
    const [projRes, taskRes] = await Promise.all([
      fetch(`/api/projects/${params.id}`),
      fetch(`/api/projects/${params.id}/tasks`),
    ]);

    if (!projRes.ok) {
      router.push("/projects");
      return;
    }

    setProject(await projRes.json());
    setTasks(await taskRes.json());
    setLoading(false);
  }, [params.id, router]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  async function handleAddTask(e: React.FormEvent) {
    e.preventDefault();
    await fetch(`/api/projects/${params.id}/tasks`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: newTaskTitle, priority: newTaskPriority }),
    });
    setNewTaskTitle("");
    setNewTaskPriority("medium");
    setShowAddTask(false);
    fetchData();
  }

  async function handleStatusChange(taskId: string, newStatus: string) {
    await fetch(`/api/projects/${params.id}/tasks/${taskId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    setEditingTask(null);
    fetchData();
  }

  async function handleDeleteTask(taskId: string) {
    await fetch(`/api/projects/${params.id}/tasks/${taskId}`, {
      method: "DELETE",
    });
    fetchData();
  }

  async function handleDeleteProject() {
    await fetch(`/api/projects/${params.id}`, { method: "DELETE" });
    router.push("/projects");
  }

  async function handleStatusUpdate(newStatus: string) {
    await fetch(`/api/projects/${params.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    fetchData();
  }

  if (loading || !project) {
    return <div style={{ padding: 40, color: "var(--color-text-secondary)" }}>Loading...</div>;
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <button className="btn btn-ghost btn-sm" onClick={() => router.push("/projects")}>
              ← Back
            </button>
            <h1 className="page-title">{project.name}</h1>
            <span className={`badge badge-${project.status}`}>{project.status}</span>
          </div>
          {project.description && (
            <p className="page-subtitle" style={{ marginLeft: 60 }}>
              {project.description}
            </p>
          )}
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <select
            className="form-select"
            value={project.status}
            onChange={(e) => handleStatusUpdate(e.target.value)}
            style={{ width: "auto" }}
          >
            <option value="planning">Planning</option>
            <option value="active">Active</option>
            <option value="completed">Completed</option>
            <option value="archived">Archived</option>
          </select>
          <button className="btn btn-danger btn-sm" onClick={() => setShowDeleteConfirm(true)}>
            Delete
          </button>
        </div>
      </div>

      {/* Delete confirmation modal */}
      {showDeleteConfirm && (
        <div className="modal-overlay" onClick={() => setShowDeleteConfirm(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2 className="modal-title">Delete Project?</h2>
            <p style={{ color: "var(--color-text-secondary)", fontSize: 14 }}>
              This will permanently delete &ldquo;{project.name}&rdquo; and all its tasks.
              This action cannot be undone.
            </p>
            <div className="modal-actions">
              <button
                className="btn btn-secondary"
                onClick={() => setShowDeleteConfirm(false)}
              >
                Cancel
              </button>
              <button className="btn btn-danger" onClick={handleDeleteProject}>
                Delete Project
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add task section */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
        <h2 style={{ fontSize: 18, fontWeight: 600 }}>
          Tasks ({tasks.length})
        </h2>
        <button className="btn btn-primary btn-sm" onClick={() => setShowAddTask(true)}>
          + Add Task
        </button>
      </div>

      {showAddTask && (
        <div className="card" style={{ marginBottom: 16 }}>
          <form onSubmit={handleAddTask} style={{ display: "flex", gap: 12, alignItems: "flex-end" }}>
            <div style={{ flex: 1 }}>
              <label className="form-label" htmlFor="task-title">Task title</label>
              <input
                id="task-title"
                className="form-input"
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                placeholder="What needs to be done?"
                required
                autoFocus
              />
            </div>
            <div>
              <label className="form-label" htmlFor="task-priority">Priority</label>
              <select
                id="task-priority"
                className="form-select"
                value={newTaskPriority}
                onChange={(e) => setNewTaskPriority(e.target.value)}
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
            <button type="submit" className="btn btn-primary">Add</button>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setShowAddTask(false)}
            >
              Cancel
            </button>
          </form>
        </div>
      )}

      {/* Task board */}
      <div className="task-board">
        {STATUS_COLUMNS.map((col) => {
          const columnTasks = tasks.filter((t) => t.status === col.key);
          return (
            <div key={col.key} className="task-column">
              <div className="task-column-header">
                {col.label}
                <span className="task-column-count">{columnTasks.length}</span>
              </div>
              {columnTasks.map((task) => (
                <div key={task.id} className="task-card" onClick={() => setEditingTask(editingTask === task.id ? null : task.id)}>
                  <div className="task-card-title">{task.title}</div>
                  <div className="task-card-meta">
                    <span className={`badge badge-${task.priority}`}>{task.priority}</span>
                  </div>

                  {editingTask === task.id && (
                    <div style={{ marginTop: 10, paddingTop: 10, borderTop: "1px solid var(--color-border)" }} onClick={(e) => e.stopPropagation()}>
                      <div style={{ display: "flex", gap: 4, marginBottom: 8, flexWrap: "wrap" }}>
                        {STATUS_COLUMNS.filter((s) => s.key !== task.status).map((s) => (
                          <button
                            key={s.key}
                            className="btn btn-secondary btn-sm"
                            onClick={() => handleStatusChange(task.id, s.key)}
                          >
                            Move to {s.label}
                          </button>
                        ))}
                      </div>
                      <button
                        className="btn btn-danger btn-sm"
                        onClick={() => handleDeleteTask(task.id)}
                      >
                        Delete
                      </button>
                    </div>
                  )}
                </div>
              ))}
              {columnTasks.length === 0 && (
                <div style={{ textAlign: "center", padding: 20, color: "var(--color-text-secondary)", fontSize: 13 }}>
                  No tasks
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
