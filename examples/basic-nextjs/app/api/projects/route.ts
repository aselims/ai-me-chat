import { projects } from "./data";

export async function GET() {
  return Response.json(projects);
}

export async function POST(req: Request) {
  const body = await req.json();
  const newProject = {
    id: String(projects.length + 1),
    name: body.name ?? "Untitled",
    status: body.status ?? "planning",
    budget: body.budget ?? 0,
  };
  projects.push(newProject);
  return Response.json(newProject, { status: 201 });
}
