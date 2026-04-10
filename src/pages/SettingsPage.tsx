import { useAppStore } from "../features/progress/useAppStore";

export function SettingsPage() {
  const { store, update } = useAppStore();

  return (
    <div className="space-y-4">
      <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
        <div className="text-xs font-semibold tracking-wide text-white/60">
          App‑Einstellungen
        </div>
        <h2 className="mt-2 text-2xl font-black tracking-tight text-white">
          Settings
        </h2>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-white/65">
          Hier stellst du Adaptive‑Verhalten, Schwächen‑Schwelle und den Seed für
          neue Varianten ein.
        </p>
      </div>

      <Card title="Adaptive Learning">
        <Row label="Schwächen‑Schwelle (unter X = Schwäche)">
          <NumberInput
            value={store.settings.weakThreshold}
            step={0.05}
            min={0.3}
            max={0.9}
            onChange={(v) =>
              update((s) => {
                s.settings.weakThreshold = v;
              })
            }
          />
          <span className="text-xs text-white/60">
            (= {Math.round(store.settings.weakThreshold * 100)}%)
          </span>
        </Row>
        <Row label="Adaptive‑Anteil Schwächen">
          <NumberInput
            value={store.settings.adaptiveWeakShare}
            step={0.05}
            min={0.4}
            max={0.95}
            onChange={(v) =>
              update((s) => {
                s.settings.adaptiveWeakShare = v;
              })
            }
          />
          <span className="text-xs text-white/60">
            (= {Math.round(store.settings.adaptiveWeakShare * 100)}% Schwächen)
          </span>
        </Row>
        <Row label="Training‑Fragenanzahl (Default)">
          <input
            className="w-28 rounded-2xl border border-white/10 bg-black/20 px-3 py-2 text-sm text-white outline-none"
            type="number"
            min={6}
            max={60}
            value={store.settings.practiceCount}
            onChange={(e) =>
              update((s) => {
                s.settings.practiceCount = clampInt(e.target.value, 6, 60);
              })
            }
          />
        </Row>
      </Card>

      <Card title="Fragenpool / Variation">
        <Row label="Seed (ändert Zahlen/Formulierungen)">
          <input
            className="w-full rounded-2xl border border-white/10 bg-black/20 px-3 py-2 text-sm text-white outline-none"
            value={store.settings.seed}
            onChange={(e) =>
              update((s) => {
                s.settings.seed = e.target.value;
              })
            }
          />
        </Row>
        <div className="mt-2 text-sm text-white/60">
          Tipp: Wenn du merkst, dass dir Aufgaben zu bekannt vorkommen, ändere
          den Seed (z.B. <span className="font-mono">nikos-2026-v2</span>).
        </div>
      </Card>

      <Card title="Prüfungs‑Modus (v1 light)">
        <label className="flex items-center gap-3 text-sm text-white/75">
          <input
            type="checkbox"
            checked={store.settings.reduceExplanationsInExam}
            onChange={(e) =>
              update((s) => {
                s.settings.reduceExplanationsInExam = e.target.checked;
              })
            }
            className="size-4 accent-sky-400"
          />
          Im Mock‑Test Erklärungen standardmäßig ausblenden (bis „Review“)
        </label>
      </Card>

      <Card title="Daten">
        <button
          onClick={() => {
            if (!confirm("Wirklich Fortschritt/Stats/Habits/Journal löschen?")) return;
            update((s) => {
              s.stats.byQ = {};
              s.stats.byCat = {};
              s.stats.byCatDiff = {};
              s.stats.days = {};
              s.stats.total = { seen: 0, correct: 0, wrong: 0 };
              s.habits.entries = {};
              s.habits.streak = 0;
              s.habits.lastDay = null;
              s.journal.entries = [];
            });
          }}
          className="rounded-2xl border border-rose-400/20 bg-rose-400/10 px-4 py-2 text-sm font-semibold text-rose-100 hover:bg-rose-400/15"
        >
          Alles zurücksetzen
        </button>
      </Card>
    </div>
  );
}

function Card(props: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
      <div className="text-sm font-extrabold text-white">{props.title}</div>
      <div className="mt-3 space-y-2">{props.children}</div>
    </div>
  );
}

function Row(props: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
      <div className="text-sm text-white/70">{props.label}</div>
      <div className="flex items-center gap-2">{props.children}</div>
    </div>
  );
}

function NumberInput(props: {
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
}) {
  return (
    <input
      className="w-28 rounded-2xl border border-white/10 bg-black/20 px-3 py-2 text-sm text-white outline-none"
      type="number"
      min={props.min}
      max={props.max}
      step={props.step}
      value={props.value}
      onChange={(e) => {
        const v = Number(e.target.value);
        if (!Number.isFinite(v)) return;
        props.onChange(clamp(v, props.min, props.max));
      }}
    />
  );
}

function clamp(n: number, a: number, b: number) {
  return Math.max(a, Math.min(b, n));
}

function clampInt(s: string, a: number, b: number) {
  const n = Number(s);
  if (!Number.isFinite(n)) return a;
  return Math.max(a, Math.min(b, Math.round(n)));
}

