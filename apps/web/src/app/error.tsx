"use client";

import Link from "next/link";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="grid min-h-screen place-items-center bg-slate-50 px-6">
      <section className="max-w-md rounded-md border bg-white p-6 text-center shadow-sm">
        <p className="text-sm font-medium text-rose-700">Something went wrong</p>
        <h1 className="mt-2 text-2xl font-semibold text-slate-950">The page could not load.</h1>
        <p className="mt-3 text-sm text-slate-600">{error.message || "An unexpected application error occurred."}</p>
        <div className="mt-6 flex justify-center gap-3">
          <button className="rounded-md bg-slate-950 px-3 py-2 text-sm font-medium text-white" onClick={reset} type="button">
            Try again
          </button>
          <Link className="rounded-md border bg-white px-3 py-2 text-sm font-medium text-slate-700" href="/">
            Home
          </Link>
        </div>
      </section>
    </main>
  );
}
