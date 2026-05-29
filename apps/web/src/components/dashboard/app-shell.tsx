import { SignedIn, SignedOut, SignInButton, SignUpButton, UserButton } from "@clerk/nextjs";
import { LayoutDashboard, Users } from "lucide-react";
import Link from "next/link";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-50">
      <div className="flex min-h-screen">
        <aside className="hidden w-16 border-r bg-white p-3 md:block">
          <div className="grid size-10 place-items-center rounded-md bg-slate-950 text-sm font-bold text-white">
            CS
          </div>
          <nav className="mt-5 grid gap-2">
            <Link className="grid size-10 place-items-center rounded-md text-slate-500 hover:bg-slate-100 hover:text-slate-950" href="/dashboard" title="Dashboard">
              <LayoutDashboard className="size-4" />
            </Link>
            <Link className="grid size-10 place-items-center rounded-md text-slate-500 hover:bg-slate-100 hover:text-slate-950" href="/settings/team" title="Team">
              <Users className="size-4" />
            </Link>
          </nav>
        </aside>
        <div className="min-w-0 flex-1">
          <div className="flex h-14 items-center justify-end gap-3 border-b bg-white px-4">
            <SignedOut>
              <SignInButton forceRedirectUrl="/dashboard">
                <button className="rounded-md border bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm" type="button">
                  Sign in
                </button>
              </SignInButton>
              <SignUpButton forceRedirectUrl="/dashboard">
                <button className="rounded-md bg-slate-950 px-3 py-2 text-sm font-medium text-white shadow-sm" type="button">
                  Sign up
                </button>
              </SignUpButton>
            </SignedOut>
            <SignedIn>
              <UserButton afterSignOutUrl="/" />
            </SignedIn>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}
