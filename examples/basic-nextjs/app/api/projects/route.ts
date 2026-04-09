import { z } from "zod";
import { getDb } from "@/lib/db";
import { listProjects, createProject } from "@/lib/services/projects";
import { getSession } from "@/lib/auth";

export const bodySchema = z.object({
  name: z.string().min(1, "name is required"),
  description: z.string().optional(),
  status: z.enum(["planning", "active", "completed", "archived"]).optional(),
});

export async function GET() {
  const session = await getSession();
  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = getDb();
  return Response.json(listProjects(db));
}

export async function POST(req: Request) {
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

  const db = getDb();
  const project = createProject(db, {
    name: parsed.data.name,
    description: parsed.data.description,
    status: parsed.data.status,
    ownerId: session.user.id,
  });

  return Response.json(project, { status: 201 });
}
