import Link from "next/link";

export default function NotFoundPage() {
  return (
    <main className="grid min-h-screen place-items-center bg-slate-50 px-6">
      <section className="max-w-md rounded-md border bg-white p-6 text-center shadow-sm">
        <p className="text-sm font-medium text-emerald-700">404</p>
        <h1 className="mt-2 text-2xl font-semibold text-slate-950">Page not found</h1>
        <p className="mt-3 text-sm text-slate-600">The page you requested does not exist or is unavailable.</p>
        <Link className="mt-6 inline-flex rounded-md bg-slate-950 px-3 py-2 text-sm font-medium text-white" href="/">
          Go home
        </Link>
      </section>
    </main>
  );
}
