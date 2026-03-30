import type Database from "better-sqlite3";
import type { UserRow } from "../db";

export interface User {
  id: string;
  username: string;
  displayName: string;
  role: string;
  createdAt: string;
}

function toUser(row: UserRow): User {
  return {
    id: row.id,
    username: row.username,
    displayName: row.display_name,
    role: row.role,
    createdAt: row.created_at,
  };
}

export function getUserById(db: Database.Database, id: string): User | null {
  const row = db
    .prepare("SELECT id, username, display_name, role, created_at FROM users WHERE id = ?")
    .get(id) as UserRow | undefined;
  return row ? toUser(row) : null;
}

export function getUserByUsername(db: Database.Database, username: string): UserRow | null {
  const row = db
    .prepare("SELECT * FROM users WHERE username = ?")
    .get(username) as UserRow | undefined;
  return row ?? null;
}

export function listUsers(db: Database.Database): User[] {
  const rows = db
    .prepare("SELECT id, username, display_name, role, created_at FROM users")
    .all() as UserRow[];
  return rows.map(toUser);
}
