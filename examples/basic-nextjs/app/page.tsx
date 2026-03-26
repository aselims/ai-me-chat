"use client";

export default function Home() {
  return (
    <div style={{ maxWidth: 800, margin: "0 auto", padding: 40 }}>
      <h1>AI-Me Example App</h1>
      <p style={{ color: "#6b7280", marginBottom: 24 }}>
        This is a demo project management app with AI-Me integrated.
        Click the chat bubble in the bottom-right corner or press{" "}
        <kbd style={{ padding: "2px 6px", border: "1px solid #d1d5db", borderRadius: 4, fontSize: 12 }}>
          Cmd+.
        </kbd>{" "}
        to open the AI assistant.
      </p>
      <div style={{ display: "grid", gap: 16 }}>
        <div style={{ padding: 16, border: "1px solid #e5e7eb", borderRadius: 8 }}>
          <h3 style={{ margin: "0 0 8px" }}>Website Redesign</h3>
          <p style={{ margin: 0, color: "#6b7280", fontSize: 14 }}>Status: active | Budget: $15,000</p>
        </div>
        <div style={{ padding: 16, border: "1px solid #e5e7eb", borderRadius: 8 }}>
          <h3 style={{ margin: "0 0 8px" }}>Mobile App</h3>
          <p style={{ margin: 0, color: "#6b7280", fontSize: 14 }}>Status: planning | Budget: $50,000</p>
        </div>
        <div style={{ padding: 16, border: "1px solid #e5e7eb", borderRadius: 8 }}>
          <h3 style={{ margin: "0 0 8px" }}>API Integration</h3>
          <p style={{ margin: 0, color: "#6b7280", fontSize: 14 }}>Status: completed | Budget: $8,000</p>
        </div>
      </div>
    </div>
  );
}
