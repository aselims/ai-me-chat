import type { NextRequest } from "next/server";
import { projects } from "../data";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const project = projects.find((p) => p.id === id);
  if (!project) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }
  return Response.json(project);
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const idx = projects.findIndex((p) => p.id === id);
  if (idx === -1) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }
  const body = await req.json();
  projects[idx] = { ...projects[idx], ...body };
  return Response.json(projects[idx]);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const idx = projects.findIndex((p) => p.id === id);
  if (idx === -1) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }
  const deleted = projects.splice(idx, 1)[0];
  return Response.json(deleted);
}
