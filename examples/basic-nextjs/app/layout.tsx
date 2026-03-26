import { Providers } from "./providers";

export const metadata = {
  title: "AI-Me Example",
  description: "AI-Me copilot plugin example app",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
