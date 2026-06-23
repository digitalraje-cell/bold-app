/**
 * Local-only visual reference for mobile screen-share layout (before / after).
 * Open at /dev/mobile-screen-share-layout in a narrow viewport or device emulator.
 */
export default function MobileScreenShareLayoutPreviewPage() {
  return (
    <div className="min-h-screen bg-slate-950 p-4 text-white">
      <h1 className="mb-2 text-lg font-semibold">Mobile screen share layout preview</h1>
      <p className="mb-6 max-w-md text-sm text-white/60">
        Reference mockups — production layout is driven by Jitsi inside the meeting iframe.
      </p>

      <div className="grid max-w-4xl gap-8 md:grid-cols-2">
        <figure>
          <figcaption className="mb-2 text-xs font-semibold uppercase tracking-wide text-red-300">
            Before (cluttered)
          </figcaption>
          <div className="relative aspect-[9/16] overflow-hidden rounded-xl border border-white/10 bg-[#0f172a]">
            <div className="absolute inset-2 rounded-lg bg-slate-700/80 ring-1 ring-white/10">
              <span className="absolute left-2 top-2 rounded bg-black/50 px-2 py-0.5 text-[10px]">
                Shared screen (small)
              </span>
            </div>
            <div className="absolute bottom-24 left-3 h-[28%] w-[42%] rounded-lg bg-indigo-900/90 ring-2 ring-white/20" />
            <div className="absolute bottom-24 right-3 h-[28%] w-[42%] rounded-lg bg-indigo-900/90 ring-2 ring-white/20" />
            <div className="absolute bottom-3 left-3 right-3 flex gap-2">
              {[1, 2, 3].map((n) => (
                <div key={n} className="h-14 flex-1 rounded-md bg-slate-600/90" />
              ))}
            </div>
          </div>
        </figure>

        <figure>
          <figcaption className="mb-2 text-xs font-semibold uppercase tracking-wide text-emerald-300">
            After (screen dominant + PiP)
          </figcaption>
          <div className="relative aspect-[9/16] overflow-hidden rounded-xl border border-emerald-500/30 bg-[#0f172a]">
            <div className="absolute inset-1 rounded-lg bg-slate-600/90 ring-1 ring-white/10">
              <span className="absolute left-2 top-2 rounded bg-black/50 px-2 py-0.5 text-[10px]">
                Shared screen (~88% stage)
              </span>
            </div>
            <div className="absolute bottom-[5.5rem] right-3 h-[18%] w-[18%] min-w-[4.5rem] rounded-lg bg-indigo-800 ring-2 ring-white/30 shadow-lg">
              <span className="absolute -top-5 right-0 text-[9px] text-white/70">Presenter PiP</span>
            </div>
            <div className="absolute bottom-3 left-3 right-3 h-12 rounded-full bg-black/40 backdrop-blur" />
          </div>
        </figure>
      </div>
    </div>
  );
}
