import type Database from "better-sqlite3";
import crypto from "node:crypto";
import type { TaskRow } from "../db";

export interface Task {
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

export interface CreateTaskInput {
  projectId: string;
  title: string;
  description?: string;
  status?: string;
  priority?: string;
  assigneeId?: string | null;
}

export interface UpdateTaskInput {
  title?: string;
  description?: string;
  status?: string;
  priority?: string;
  assigneeId?: string | null;
}

function toTask(row: TaskRow): Task {
  return {
    id: row.id,
    projectId: row.project_id,
    title: row.title,
    description: row.description,
    status: row.status,
    priority: row.priority,
    assigneeId: row.assignee_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function listTasks(db: Database.Database, projectId: string): Task[] {
  const rows = db
    .prepare("SELECT * FROM tasks WHERE project_id = ? ORDER BY created_at ASC")
    .all(projectId) as TaskRow[];
  return rows.map(toTask);
}

export function getTask(db: Database.Database, taskId: string): Task | null {
  const row = db.prepare("SELECT * FROM tasks WHERE id = ?").get(taskId) as TaskRow | undefined;
  return row ? toTask(row) : null;
}

export function createTask(db: Database.Database, input: CreateTaskInput): Task {
  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  db.prepare(
    "INSERT INTO tasks (id, project_id, title, description, status, priority, assignee_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)"
  ).run(
    id,
    input.projectId,
    input.title,
    input.description ?? "",
    input.status ?? "todo",
    input.priority ?? "medium",
    input.assigneeId ?? null,
    now,
    now
  );

  return getTask(db, id)!;
}

export function updateTask(
  db: Database.Database,
  taskId: string,
  input: UpdateTaskInput
): Task | null {
  const existing = getTask(db, taskId);
  if (!existing) return null;

  const now = new Date().toISOString();
  db.prepare(
    "UPDATE tasks SET title = ?, description = ?, status = ?, priority = ?, assignee_id = ?, updated_at = ? WHERE id = ?"
  ).run(
    input.title ?? existing.title,
    input.description ?? existing.description,
    input.status ?? existing.status,
    input.priority ?? existing.priority,
    input.assigneeId !== undefined ? input.assigneeId : existing.assigneeId,
    now,
    taskId
  );

  return getTask(db, taskId);
}

export function deleteTask(db: Database.Database, taskId: string): boolean {
  const result = db.prepare("DELETE FROM tasks WHERE id = ?").run(taskId);
  return result.changes > 0;
}

export function getTaskStats(db: Database.Database, projectId?: string): {
  total: number;
  todo: number;
  inProgress: number;
  done: number;
} {
  const where = projectId ? "WHERE project_id = ?" : "";
  const args = projectId ? [projectId] : [];

  const total = (db.prepare(`SELECT COUNT(*) as count FROM tasks ${where}`).get(...args) as { count: number }).count;
  const todo = (db.prepare(`SELECT COUNT(*) as count FROM tasks ${where} ${where ? "AND" : "WHERE"} status = 'todo'`).get(...args) as { count: number }).count;
  const inProgress = (db.prepare(`SELECT COUNT(*) as count FROM tasks ${where} ${where ? "AND" : "WHERE"} status = 'in_progress'`).get(...args) as { count: number }).count;
  const done = (db.prepare(`SELECT COUNT(*) as count FROM tasks ${where} ${where ? "AND" : "WHERE"} status = 'done'`).get(...args) as { count: number }).count;

  return { total, todo, inProgress, done };
}
