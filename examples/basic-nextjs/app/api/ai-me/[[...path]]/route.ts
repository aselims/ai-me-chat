import { createAIMeHandler } from "@ai-me-chat/nextjs";
import { createOpenAI } from "@ai-sdk/openai";
import { getSessionFromRequest } from "@/lib/auth";

const groq = createOpenAI({
  baseURL: "https://api.groq.com/openai/v1",
  apiKey: process.env.GROQ_API_KEY!,
});

const modelId = process.env.GROQ_MODEL ?? "openai/gpt-oss-120b";

const handler = createAIMeHandler({
  model: groq.chat(modelId),
  discovery: {
    mode: "filesystem",
    include: ["/api/**"],
    exclude: ["/api/ai-me/**", "/api/auth/**"],
  },
  getSession: async (req) => {
    const session = getSessionFromRequest(req);
    if (!session) return null;
    return { user: session.user };
  },
  systemPrompt: async (session) => {
    const userName = (session.user as Record<string, unknown>).displayName ?? "User";

    return `You are an AI assistant for a Task Tracker app. The current user is ${userName}.

You can help with:
- Listing, creating, updating, and deleting projects
- Listing, creating, updating, and deleting tasks within projects
- Answering questions about project status and task progress

Important rules:
- Use POST to create new projects and tasks
- Use PUT to update existing ones
- Use DELETE to remove projects or tasks
- When creating a project, you need a "name" field
- When creating a task, you need a "title" field and the project ID in the URL path
- Task statuses are: todo, in_progress, done
- Project statuses are: planning, active, completed, archived
- Task priorities are: low, medium, high

Be helpful, concise, and proactive. If the user asks about tasks, fetch them from the relevant project.`;
  },
  confirmation: {
    methods: ["POST", "PUT", "DELETE"],
  },
  providerOptions: {
    openai: { strictJsonSchema: false },
  },
});

export { handler as GET, handler as POST };
