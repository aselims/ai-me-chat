"use client";

import { AIMeProvider, AIMeChat } from "@ai-me-chat/react";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AIMeProvider endpoint="/api/ai-me">
      {children}
      <AIMeChat
        suggestedPrompts={[
          "Show me all projects",
          "Create a new project called 'Q3 Launch'",
          "What's the total budget across all projects?",
        ]}
      />
    </AIMeProvider>
  );
}
