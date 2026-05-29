import { LandingHeroControls, LandingNavControls } from "@/components/auth/landing-auth-controls";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <div className="mx-auto flex min-h-screen max-w-6xl flex-col px-6 py-5">
        <header className="flex items-center justify-between">
          <div className="grid size-10 place-items-center rounded-md bg-white text-sm font-bold text-slate-950">
            CS
          </div>
          <nav className="flex items-center gap-3">
            <LandingNavControls />
          </nav>
        </header>

        <section className="grid flex-1 place-items-center py-16">
          <div className="max-w-3xl text-center">
            <p className="text-sm font-medium uppercase tracking-wide text-emerald-300">Collaborative workspace</p>
            <h1 className="mt-4 text-5xl font-semibold leading-tight tracking-normal text-white md:text-7xl">
              Whiteboards and documents for teams that think visually.
            </h1>
            <p className="mx-auto mt-5 max-w-2xl text-lg text-slate-300">
              Create shared canvases, structured notes, and real-time rooms with secure workspace access.
            </p>
            <div className="mt-8 flex justify-center gap-3">
              <LandingHeroControls />
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
