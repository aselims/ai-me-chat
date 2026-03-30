import { z } from "zod";
import type { NextRequest } from "next/server";
import { getDb } from "@/lib/db";
import { getProject, updateProject, deleteProject } from "@/lib/services/projects";

export const bodySchema = z.object({
  name: z.string().optional(),
  description: z.string().optional(),
  status: z.enum(["planning", "active", "completed", "archived"]).optional(),
});

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const db = getDb();
  const project = getProject(db, id);

  if (!project) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  return Response.json(project);
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();
  const db = getDb();
  const project = updateProject(db, id, body);

  if (!project) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  return Response.json(project);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const db = getDb();
  const deleted = deleteProject(db, id);

  if (!deleted) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  return Response.json({ ok: true });
}
