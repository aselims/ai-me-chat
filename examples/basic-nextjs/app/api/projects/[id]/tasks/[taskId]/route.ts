import { z } from "zod";
import type { NextRequest } from "next/server";
import { getDb } from "@/lib/db";
import { getTask, updateTask, deleteTask } from "@/lib/services/tasks";

export const bodySchema = z.object({
  title: z.string().optional(),
  description: z.string().optional(),
  status: z.enum(["todo", "in_progress", "done"]).optional(),
  priority: z.enum(["low", "medium", "high"]).optional(),
  assigneeId: z.string().optional(),
});

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; taskId: string }> }
) {
  const { taskId } = await params;
  const db = getDb();
  const task = getTask(db, taskId);

  if (!task) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  return Response.json(task);
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; taskId: string }> }
) {
  const { taskId } = await params;
  const body = await req.json();
  const db = getDb();
  const task = updateTask(db, taskId, body);

  if (!task) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  return Response.json(task);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; taskId: string }> }
) {
  const { taskId } = await params;
  const db = getDb();
  const deleted = deleteTask(db, taskId);

  if (!deleted) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  return Response.json({ ok: true });
}
