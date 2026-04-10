import { useMemo } from "react";
import { useAppStore } from "../features/progress/useAppStore";

function dayKey(ts = Date.now()) {
  const d = new Date(ts);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const da = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${da}`;
}

export function HabitsPage() {
  const { store, update } = useAppStore();
  const today = useMemo(() => dayKey(), []);
  const entry = store.habits.entries[today] || {
    deepWork: false,
    indieBuild: false,
    gamingLimit: false,
  };

  const streak = store.habits.streak;

  const toggle = (k: keyof typeof entry) => {
    update((s) => {
      const current = s.habits.entries[today] || {
        deepWork: false,
        indieBuild: false,
        gamingLimit: false,
      };
      const next = { ...current, [k]: !current[k] };
      s.habits.entries[today] = next;

      // Update streak (simple v1): streak increments when all 3 are true and day changed.
      const allDone = next.deepWork && next.indieBuild && next.gamingLimit;
      if (allDone) {
        if (s.habits.lastDay !== today) {
          s.habits.streak = (s.habits.streak || 0) + 1;
          s.habits.lastDay = today;
        }
      }
    });
  };

  return (
    <div className="space-y-4">
      <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
        <div className="text-xs font-semibold tracking-wide text-white/60">
          Disziplin · Monte‑Christo‑Ansatz (v1)
        </div>
        <h2 className="mt-2 text-2xl font-black tracking-tight text-white">
          Habit‑Tracker
        </h2>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-white/65">
          Ziel: Dual‑Studium + Indie‑Hacking langfristig tragbar machen. In v1 ist
          es bewusst simpel: 3 Hebel, täglich abhaken.
        </p>
        <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/20 px-3 py-2 text-sm text-white/70">
          Streak: <span className="font-mono font-bold text-white">{streak}</span>
        </div>
      </div>

      <div className="grid gap-3 lg:grid-cols-3">
        <HabitCard
          title="Deep Work (60–120 min)"
          desc="Fokusblock ohne Multitasking. Notfalls 30 min starten."
          checked={entry.deepWork}
          onToggle={() => toggle("deepWork")}
        />
        <HabitCard
          title="Indie Build (45–90 min)"
          desc="Ship‑Momentum: 1 kleine Lieferung pro Tag."
          checked={entry.indieBuild}
          onToggle={() => toggle("indieBuild")}
        />
        <HabitCard
          title="Gaming‑Limit"
          desc="Heute bewusst limitiert/kein Doom‑Scroll."
          checked={entry.gamingLimit}
          onToggle={() => toggle("gamingLimit")}
        />
      </div>

      <div className="rounded-3xl border border-white/10 bg-white/5 p-5 text-sm text-white/65">
        <div className="font-extrabold text-white">Warum das funktioniert</div>
        <ul className="mt-2 list-disc space-y-1 pl-5">
          <li>Wenig, aber täglich – statt „perfekt“ und selten.</li>
          <li>3 Hebel decken Energie, Output und Ablenkung ab.</li>
          <li>Streak belohnt Konsistenz (nicht Intensität).</li>
        </ul>
      </div>
    </div>
  );
}

function HabitCard(props: {
  title: string;
  desc: string;
  checked: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      onClick={props.onToggle}
      className={[
        "text-left rounded-3xl border p-5 transition",
        props.checked
          ? "border-emerald-400/30 bg-emerald-400/10"
          : "border-white/10 bg-white/5 hover:bg-white/10",
      ].join(" ")}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-sm font-extrabold text-white">{props.title}</div>
          <div className="mt-1 text-sm text-white/60">{props.desc}</div>
        </div>
        <div
          className={[
            "grid size-10 place-items-center rounded-2xl border font-black",
            props.checked
              ? "border-emerald-400/30 bg-emerald-400/15 text-emerald-200"
              : "border-white/10 bg-black/20 text-white/60",
          ].join(" ")}
        >
          {props.checked ? "✓" : "•"}
        </div>
      </div>
    </button>
  );
}

