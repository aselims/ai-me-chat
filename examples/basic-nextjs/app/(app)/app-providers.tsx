"use client";

import { AIMeProvider, AIMeChat, AIMeCommandPalette } from "@ai-me-chat/react";
import type { CommandItem } from "@ai-me-chat/react";
import { useRouter } from "next/navigation";

const commands: CommandItem[] = [
  {
    id: "create-project",
    label: "Create new project",
    description: "Start a new project via AI",
    category: "Actions",
    action: "Create a new project",
  },
  {
    id: "list-projects",
    label: "List all projects",
    description: "Show all projects and their status",
    category: "View",
    action: "List all projects with their status",
  },
  {
    id: "project-summary",
    label: "Project summary",
    description: "Get an overview of all projects and tasks",
    category: "View",
    action: "Give me a summary of all projects and their tasks",
  },
  {
    id: "help",
    label: "What can you do?",
    description: "Ask the AI assistant for help",
    category: "Help",
    action: "What actions can you help me with?",
  },
];

export function AppProviders({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  return (
    <AIMeProvider
      endpoint="/api/ai-me"
      onAction={(action) => {
        if (action.type === "navigate" && typeof action.url === "string") {
          router.push(action.url);
        }
      }}
    >
      {children}
      <AIMeChat
        suggestedPrompts={[
          "Show me all projects",
          "Create a new project called 'Q4 Launch'",
          "How many tasks are in progress?",
          "What's the status of the Website Redesign project?",
        ]}
        theme={{
          primaryColor: "#6366f1",
          borderRadius: "8px",
        }}
        onToolComplete={() => {
          router.refresh();
        }}
      />
      <AIMeCommandPalette commands={commands} />
    </AIMeProvider>
  );
}
