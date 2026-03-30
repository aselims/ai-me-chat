import { z } from "zod";
import { getDb } from "@/lib/db";
import { listProjects, createProject } from "@/lib/services/projects";
import { getSession } from "@/lib/auth";

export const bodySchema = z.object({
  name: z.string(),
  description: z.string().optional(),
  status: z.enum(["planning", "active", "completed", "archived"]).optional(),
});

export async function GET() {
  const db = getDb();
  return Response.json(listProjects(db));
}

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const db = getDb();
  const project = createProject(db, {
    name: body.name ?? "Untitled",
    description: body.description,
    status: body.status,
    ownerId: session.user.id,
  });

  return Response.json(project, { status: 201 });
}
