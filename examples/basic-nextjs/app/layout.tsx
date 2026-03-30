import "./globals.css";

export const metadata = {
  title: "Task Tracker — AI-Me Demo",
  description: "Demo app showcasing AI-Me copilot plugin capabilities",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
