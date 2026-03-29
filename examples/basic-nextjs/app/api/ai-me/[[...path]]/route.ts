import { createAIMeHandler } from "@ai-me-chat/nextjs";
import { createOpenAI } from "@ai-sdk/openai";

// Use Groq's OpenAI-compatible API
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
    exclude: ["/api/ai-me/**"],
  },
  getSession: async () => {
    // Demo: always authenticated
    return { user: { id: "demo-user", role: "admin" } };
  },
  systemPrompt:
    "You are an AI assistant for a project management app. You can list, create, update, and delete projects. Use POST to create new projects and PUT to update existing ones. Be helpful and concise.",
  providerOptions: {
    openai: { strictJsonSchema: false },
  },
});

export { handler as GET, handler as POST };
