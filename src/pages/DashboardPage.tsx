import { Link } from "react-router-dom";
import { useMemo } from "react";
import { useAppStore } from "../features/progress/useAppStore";
import { getTotalAccuracy, getTodayCounts } from "../features/progress/progressSelectors";

export function DashboardPage() {
  const { store } = useAppStore();
  const today = useMemo(() => getTodayCounts(store), [store]);
  const acc = useMemo(() => getTotalAccuracy(store), [store]);

  return (
    <div className="space-y-4">
      <Hero />

      <div className="grid gap-3 lg:grid-cols-3">
        <Card>
          <div className="text-xs font-semibold text-white/60">Heute</div>
          <div className="mt-2 text-3xl font-black tracking-tight text-white">
            {today}
          </div>
          <div className="mt-1 text-sm text-white/60">gelöste Fragen</div>
        </Card>
        <Card>
          <div className="text-xs font-semibold text-white/60">Gesamt</div>
          <div className="mt-2 text-3xl font-black tracking-tight text-white">
            {acc === null ? "–" : `${acc}%`}
          </div>
          <div className="mt-1 text-sm text-white/60">Trefferquote</div>
        </Card>
        <Card>
          <div className="text-xs font-semibold text-white/60">Streak</div>
          <div className="mt-2 text-3xl font-black tracking-tight text-white">
            {store.habits.streak}
          </div>
          <div className="mt-1 text-sm text-white/60">
            Tage mit Disziplin‑Check‑in
          </div>
        </Card>
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        <Card>
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="text-sm font-extrabold text-white">
                Reihungstest – Schnellstart
              </div>
              <div className="mt-1 text-sm text-white/60">
                Adaptive Auswahl (Schwächen + neue Varianten).
              </div>
            </div>
            <Link
              to="/reihungstest"
              className="rounded-xl border border-white/10 bg-gradient-to-br from-[#69a8ff] to-[#c38bff] px-3 py-2 text-sm font-black text-[#071022] hover:opacity-95"
            >
              Start →
            </Link>
          </div>
          <div className="mt-3 rounded-2xl border border-white/10 bg-black/20 p-3 text-sm text-white/70">
            <div className="font-semibold text-white/85">Mini‑Plan (10–25 min)</div>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              <li>1 Kategorie Schwächen‑Modus (8–12 Fragen)</li>
              <li>1 Kategorie neu (6–10 Fragen)</li>
              <li>1 kurzer Review der Fehler (warum verlockend?)</li>
            </ul>
          </div>
        </Card>

        <Card>
          <div className="text-sm font-extrabold text-white">
            Semester 1–2 Prep (v1)
          </div>
          <div className="mt-1 text-sm text-white/60">
            Checklisten + Lernstrategien + Dual‑Zeitmanagement.
          </div>
          <div className="mt-3 grid gap-2">
            <Link
              to="/study-prep"
              className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/80 hover:bg-white/10"
            >
              Checkliste „vor Semesterstart“ →
            </Link>
            <Link
              to="/habits"
              className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/80 hover:bg-white/10"
            >
              Habit‑Tracker (Deep Work / Indie Build) →
            </Link>
            <Link
              to="/journal"
              className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/80 hover:bg-white/10"
            >
              „Warum ich das mache“ Journal →
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
}

function Hero() {
  return (
    <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-5">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(105,168,255,.18),transparent_55%),radial-gradient(circle_at_90%_30%,rgba(195,139,255,.16),transparent_60%)]" />
      <div className="relative">
        <div className="text-xs font-semibold tracking-wide text-white/60">
          Tech‑lastig · offline‑fähig · adaptive learning
        </div>
        <h2 className="mt-2 text-2xl font-black tracking-tight text-white md:text-3xl">
          Technikum Ready – Dein Weg zum Informatik‑Studium
        </h2>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-white/65">
          Trainiere den Reihungstest prüfungsnah, baue Semester‑Ready Skills auf
          (Mathe, Logik, CS‑Basics) und halte Disziplin – damit du Dual‑Studium +
          Indie‑Hacking langfristig tragen kannst.
        </p>
        <div className="mt-4 flex flex-wrap gap-2 text-xs text-white/70">
          <Tag>Adaptive Schwächen</Tag>
          <Tag>Spaced Review (v1 light)</Tag>
          <Tag>Mock‑Test 60/90</Tag>
          <Tag>Heatmap‑Stats (v1)</Tag>
          <Tag>PWA Offline</Tag>
        </div>
      </div>
    </div>
  );
}

function Tag(props: { children: string }) {
  return (
    <span className="rounded-full border border-white/10 bg-black/20 px-3 py-1">
      {props.children}
    </span>
  );
}

function Card(props: { children: React.ReactNode }) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 p-5 backdrop-blur">
      {props.children}
    </div>
  );
}

