import Database from "better-sqlite3";
import path from "node:path";
import { hashPassword } from "./auth";

const DB_PATH = path.join(process.cwd(), "data", "demo.db");

let db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (db) return db;

  db = new Database(DB_PATH);
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");

  initSchema(db);
  seedIfEmpty(db);

  return db;
}

function initSchema(db: Database.Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      display_name TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'member',
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS projects (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      status TEXT NOT NULL DEFAULT 'planning',
      owner_id TEXT NOT NULL REFERENCES users(id),
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS tasks (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      status TEXT NOT NULL DEFAULT 'todo',
      priority TEXT NOT NULL DEFAULT 'medium',
      assignee_id TEXT REFERENCES users(id),
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);
}

function seedIfEmpty(db: Database.Database) {
  const count = db.prepare("SELECT COUNT(*) as count FROM users").get() as {
    count: number;
  };
  if (count.count > 0) return;

  const adminHash = hashPassword("admin123");
  const aliceHash = hashPassword("alice123");

  const insertUser = db.prepare(
    "INSERT INTO users (id, username, password_hash, display_name, role) VALUES (?, ?, ?, ?, ?)"
  );
  insertUser.run("u1", "admin", adminHash, "Admin User", "admin");
  insertUser.run("u2", "alice", aliceHash, "Alice Johnson", "member");

  const insertProject = db.prepare(
    "INSERT INTO projects (id, name, description, status, owner_id) VALUES (?, ?, ?, ?, ?)"
  );
  insertProject.run("p1", "Website Redesign", "Modernize the company website with new branding", "active", "u1");
  insertProject.run("p2", "Mobile App", "Build a cross-platform mobile application", "planning", "u2");
  insertProject.run("p3", "API Integration", "Connect third-party services via REST APIs", "completed", "u1");

  const insertTask = db.prepare(
    "INSERT INTO tasks (id, project_id, title, description, status, priority, assignee_id) VALUES (?, ?, ?, ?, ?, ?, ?)"
  );
  insertTask.run("t1", "p1", "Design new homepage", "Create wireframes and mockups for the new homepage", "done", "high", "u2");
  insertTask.run("t2", "p1", "Implement responsive layout", "Make the site work on mobile and tablet", "in_progress", "high", "u1");
  insertTask.run("t3", "p1", "Set up CI/CD pipeline", "Automate builds and deployments", "todo", "medium", null);
  insertTask.run("t4", "p2", "Define app requirements", "Document features and user stories", "in_progress", "high", "u2");
  insertTask.run("t5", "p2", "Research frameworks", "Compare React Native vs Flutter", "todo", "medium", "u2");
  insertTask.run("t6", "p2", "Design app screens", "Create UI designs for key screens", "todo", "low", null);
  insertTask.run("t7", "p3", "Connect payment gateway", "Integrate Stripe API for payments", "done", "high", "u1");
  insertTask.run("t8", "p3", "Add webhook handlers", "Process incoming webhooks from partners", "done", "medium", "u1");
}

// Type definitions for database rows
export interface UserRow {
  id: string;
  username: string;
  password_hash: string;
  display_name: string;
  role: string;
  created_at: string;
}

export interface ProjectRow {
  id: string;
  name: string;
  description: string;
  status: string;
  owner_id: string;
  created_at: string;
  updated_at: string;
}

export interface TaskRow {
  id: string;
  project_id: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  assignee_id: string | null;
  created_at: string;
  updated_at: string;
}
