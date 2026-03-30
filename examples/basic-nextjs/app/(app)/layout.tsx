import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Sidebar } from "./sidebar";
import { AppProviders } from "./app-providers";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  return (
    <AppProviders>
      <div className="app-layout">
        <Sidebar user={session.user} />
        <main className="app-main">{children}</main>
      </div>
    </AppProviders>
  );
}
