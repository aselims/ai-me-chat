import { z } from "zod";
import type { NextRequest } from "next/server";
import { getDb } from "@/lib/db";
import { getTask, updateTask, deleteTask } from "@/lib/services/tasks";
import { getSession } from "@/lib/auth";

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
  const session = await getSession();
  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

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
  const session = await getSession();
  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(raw);
  if (!parsed.success) {
    return Response.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { taskId } = await params;
  const db = getDb();
  const task = updateTask(db, taskId, parsed.data);

  if (!task) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  return Response.json(task);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; taskId: string }> }
) {
  const session = await getSession();
  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { taskId } = await params;
  const db = getDb();
  const deleted = deleteTask(db, taskId);

  if (!deleted) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  return Response.json({ ok: true });
}
