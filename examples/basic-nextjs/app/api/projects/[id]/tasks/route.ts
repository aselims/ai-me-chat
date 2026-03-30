import { z } from "zod";
import type { NextRequest } from "next/server";
import { getDb } from "@/lib/db";
import { listTasks, createTask } from "@/lib/services/tasks";

export const bodySchema = z.object({
  title: z.string(),
  description: z.string().optional(),
  status: z.enum(["todo", "in_progress", "done"]).optional(),
  priority: z.enum(["low", "medium", "high"]).optional(),
  assigneeId: z.string().optional(),
});

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const db = getDb();
  return Response.json(listTasks(db, id));
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();
  const db = getDb();

  const task = createTask(db, {
    projectId: id,
    title: body.title ?? "Untitled task",
    description: body.description,
    status: body.status,
    priority: body.priority,
    assigneeId: body.assigneeId,
  });

  return Response.json(task, { status: 201 });
}
