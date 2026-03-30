import type Database from "better-sqlite3";
import crypto from "node:crypto";
import type { ProjectRow } from "../db";

export interface Project {
  id: string;
  name: string;
  description: string;
  status: string;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateProjectInput {
  name: string;
  description?: string;
  status?: string;
  ownerId: string;
}

export interface UpdateProjectInput {
  name?: string;
  description?: string;
  status?: string;
}

function toProject(row: ProjectRow): Project {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    status: row.status,
    ownerId: row.owner_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function listProjects(db: Database.Database): Project[] {
  const rows = db.prepare("SELECT * FROM projects ORDER BY created_at DESC").all() as ProjectRow[];
  return rows.map(toProject);
}

export function getProject(db: Database.Database, id: string): Project | null {
  const row = db.prepare("SELECT * FROM projects WHERE id = ?").get(id) as ProjectRow | undefined;
  return row ? toProject(row) : null;
}

export function createProject(db: Database.Database, input: CreateProjectInput): Project {
  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  db.prepare(
    "INSERT INTO projects (id, name, description, status, owner_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)"
  ).run(id, input.name, input.description ?? "", input.status ?? "planning", input.ownerId, now, now);

  return getProject(db, id)!;
}

export function updateProject(
  db: Database.Database,
  id: string,
  input: UpdateProjectInput
): Project | null {
  const existing = getProject(db, id);
  if (!existing) return null;

  const now = new Date().toISOString();
  db.prepare(
    "UPDATE projects SET name = ?, description = ?, status = ?, updated_at = ? WHERE id = ?"
  ).run(
    input.name ?? existing.name,
    input.description ?? existing.description,
    input.status ?? existing.status,
    now,
    id
  );

  return getProject(db, id);
}

export function deleteProject(db: Database.Database, id: string): boolean {
  const result = db.prepare("DELETE FROM projects WHERE id = ?").run(id);
  return result.changes > 0;
}
