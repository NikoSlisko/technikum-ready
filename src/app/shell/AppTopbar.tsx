import { Link, NavLink } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { getTodayCounts, getTotalAccuracy } from "../../features/progress/progressSelectors";
import { useAppStore } from "../../features/progress/useAppStore";

export function AppTopbar() {
  const { store } = useAppStore();
  const [tick, setTick] = useState(0);

  // refresh pills when other tabs update storage
  useEffect(() => {
    const onStorage = () => setTick((x) => x + 1);
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const today = useMemo(() => getTodayCounts(store), [store, tick]);
  const acc = useMemo(() => getTotalAccuracy(store), [store, tick]);

  return (
    <header className="sticky top-0 z-30 border-b border-white/10 bg-[#0b1220cc] backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3">
        <Link to="/" className="group flex items-center gap-3">
          <div className="grid size-10 place-items-center rounded-2xl bg-gradient-to-br from-[#69a8ff] to-[#c38bff] font-black text-[#071022] shadow-[0_10px_30px_rgba(105,168,255,.16)]">
            TR
          </div>
          <div className="leading-tight">
            <div className="text-sm font-extrabold tracking-tight">
              Technikum Ready
            </div>
            <div className="text-xs text-white/60">
              Dein Weg zum Informatik‑Studium (FH Technikum Wien)
            </div>
          </div>
        </Link>

        <div className="flex-1" />

        <div className="hidden items-center gap-2 md:flex">
          <Pill label="Heute" value={`${today}`} />
          <Pill label="Treffer" value={acc === null ? "–" : `${acc}%`} />
          <NavLink
            to="/settings"
            className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-white/80 hover:bg-white/10"
          >
            Settings
          </NavLink>
        </div>
      </div>
    </header>
  );
}

function Pill(props: { label: string; value: string }) {
  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs text-white/70">
      <span>{props.label}</span>
      <span className="font-mono font-bold text-white">{props.value}</span>
    </div>
  );
}

