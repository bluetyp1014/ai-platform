export function DemoClosedView() {
  return (
    <main className="min-h-screen bg-[#0f172a] text-slate-200 flex items-center justify-center px-4">
      <div className="w-full max-w-lg rounded-2xl border border-slate-700 bg-slate-900/85 p-10 text-center shadow-2xl">
        <p className="text-xs uppercase tracking-[0.3em] text-slate-500">
          AI Platform
        </p>
        <h1 className="mt-4 text-3xl font-semibold text-white">
          Demo Closed
        </h1>
        <p className="mt-4 text-sm leading-7 text-slate-300">
          The public demo is no longer available. Please contact the site owner if
          you need access again.
        </p>
      </div>
    </main>
  );
}