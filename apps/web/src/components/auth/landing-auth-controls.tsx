"use client";

import { SignInButton, SignUpButton, UserButton, useUser } from "@clerk/nextjs";
import { ArrowRight } from "lucide-react";
import Link from "next/link";

export function LandingNavControls() {
  const { isSignedIn, isLoaded } = useUser();

  if (!isLoaded) {
    return <div className="h-10 w-32 rounded-md border border-white/10 bg-white/5" />;
  }

  if (isSignedIn) {
    return (
      <>
        <Link className="inline-flex items-center gap-2 rounded-md bg-white px-3 py-2 text-sm font-medium text-slate-950" href="/dashboard">
          Dashboard
          <ArrowRight className="size-4" />
        </Link>
        <UserButton afterSignOutUrl="/" />
      </>
    );
  }

  return (
    <>
      <SignInButton forceRedirectUrl="/dashboard">
        <button className="rounded-md border border-white/20 px-3 py-2 text-sm font-medium text-white transition hover:bg-white/10" type="button">
          Sign in
        </button>
      </SignInButton>
      <SignUpButton forceRedirectUrl="/dashboard">
        <button className="rounded-md bg-white px-3 py-2 text-sm font-medium text-slate-950 transition hover:bg-emerald-50" type="button">
          Sign up
        </button>
      </SignUpButton>
    </>
  );
}

export function LandingHeroControls() {
  const { isSignedIn, isLoaded } = useUser();

  if (!isLoaded) {
    return <div className="h-12 w-56 rounded-md border border-white/10 bg-white/5" />;
  }

  if (isSignedIn) {
    return (
      <Link className="inline-flex items-center gap-2 rounded-md bg-emerald-400 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-emerald-300" href="/dashboard">
        Open dashboard
        <ArrowRight className="size-4" />
      </Link>
    );
  }

  return (
    <>
      <SignUpButton forceRedirectUrl="/dashboard">
        <button className="rounded-md bg-emerald-400 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-emerald-300" type="button">
          Create account
        </button>
      </SignUpButton>
      <SignInButton forceRedirectUrl="/dashboard">
        <button className="rounded-md border border-white/20 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/10" type="button">
          Sign in
        </button>
      </SignInButton>
    </>
  );
}
