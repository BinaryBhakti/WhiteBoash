"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body>
        <main className="grid min-h-screen place-items-center bg-slate-950 px-6 text-white">
          <section className="max-w-md rounded-md border border-white/10 bg-white/5 p-6 text-center shadow-sm">
            <p className="text-sm font-medium text-rose-300">Application error</p>
            <h1 className="mt-2 text-2xl font-semibold">The app needs a refresh.</h1>
            <p className="mt-3 text-sm text-slate-300">{error.message || "A global rendering error occurred."}</p>
            <button className="mt-6 rounded-md bg-white px-3 py-2 text-sm font-medium text-slate-950" onClick={reset} type="button">
              Reload
            </button>
          </section>
        </main>
      </body>
    </html>
  );
}
