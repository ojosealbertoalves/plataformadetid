import { requireUser } from "@/lib/session";
import { AppNav } from "@/components/app-nav";
import { AppSidebar } from "@/components/app-sidebar";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();

  return (
    <div className="flex min-h-screen flex-col">
      <AppNav
        user={{
          name: user.name ?? user.login,
          login: user.login,
          role: user.role,
          unitName: user.unitName,
        }}
      />
      <div className="flex min-h-0 flex-1">
        <AppSidebar role={user.role} />
        <main className="min-w-0 flex-1 overflow-x-hidden px-4 py-6 sm:px-6 lg:px-8">
          <div className="mx-auto w-full max-w-7xl">{children}</div>
        </main>
      </div>
    </div>
  );
}
