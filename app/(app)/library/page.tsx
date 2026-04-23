export default function LibraryPage() {
  return (
    <div className="min-h-screen bg-[#050608] px-4 pt-10 pb-6 sm:px-6 max-w-lg mx-auto">
      <p className="font-saira text-[10px] font-semibold uppercase tracking-[0.26em] text-purple-400 mb-1">
        POWERFLOW · LIBRARY
      </p>
      <h1 className="font-saira text-3xl font-extrabold uppercase tracking-tight text-white mb-2">
        Library
      </h1>

      <div className="mt-16 flex flex-col items-center text-center gap-4">
        <div className="w-14 h-14 rounded-2xl border border-white/5 bg-[#17131F] flex items-center justify-center text-2xl">
          🎬
        </div>
        <p className="font-saira text-sm font-semibold text-zinc-300">Video library coming soon</p>
        <p className="font-saira text-xs text-zinc-600 max-w-[260px]">
          Mental performance videos, technique breakdowns, and competition prep content will live here.
        </p>
        <span className="rounded-full border border-purple-500/20 bg-purple-500/10 px-3 py-1 font-saira text-[10px] uppercase tracking-[0.16em] text-purple-400">
          Phase 2
        </span>
      </div>
    </div>
  );
}
