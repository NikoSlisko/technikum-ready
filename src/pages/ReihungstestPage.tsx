import { useEffect, useMemo, useState } from "react";
import { useAppStore } from "../features/progress/useAppStore";
import { buildQuestionBank } from "../features/reihungstest/questionBank";
import type { RtCategoryId, RtDifficulty, RtMode, RtQuestion } from "../features/reihungstest/rtTypes";
import { rngFrom } from "../features/reihungstest/seedRng";
import { pickQuestion } from "../features/reihungstest/selector";
import { recordAnswer } from "../features/reihungstest/rtStats";

type Session =
  | {
      kind: "practice";
      mode: Exclude<RtMode, "mock">;
      cat: RtCategoryId;
      diff: RtDifficulty | "all";
      items: RtQuestion[];
      index: number;
      answered: Record<string, { chosen: number; correct: boolean; ts: number }>;
    }
  | {
      kind: "mock";
      items: RtQuestion[];
      index: number;
      answered: Record<string, { chosen: number; correct: boolean; ts: number }>;
      startTs: number;
      durationMs: number;
      finished: boolean;
      examMode: boolean;
    };

const CAT_LABELS: Array<{ id: RtCategoryId; label: string; desc: string }> = [
  { id: "algebra", label: "Algebra", desc: "Terme, Gleichungen, Logarithmen" },
  { id: "funktionen", label: "Funktionen", desc: "Steigung, Nullstellen, Scheitel" },
  { id: "figurenlogik", label: "Figurenlogik (3×3)", desc: "Rotation, Symmetrie, Muster" },
  { id: "schlussfolgerungen", label: "Schlussfolgerungen", desc: "Logik, Fehlschlüsse, Folgen" },
  { id: "informatik", label: "Informatik", desc: "Binär/Hex, SQL, OSI, Big-O" },
  { id: "naturwissenschaften", label: "Naturwissenschaften", desc: "Physik/Chemie Basics" },
  { id: "textverstaendnis", label: "Textverständnis", desc: "IT-Passagen + Fragen" },
  { id: "englisch", label: "Englisch", desc: "Tech-Passagen + Language" },
  { id: "ready4study", label: "Ready4Study", desc: "FH-Realität, Dual, Motivation" },
];

export function ReihungstestPage() {
  const { store, update } = useAppStore();

  const pool = useMemo(
    () => buildQuestionBank(store.settings.seed.trim() || "technikum-ready"),
    [store.settings.seed],
  );

  const [cat, setCat] = useState<RtCategoryId>("algebra");
  const [diff, setDiff] = useState<RtDifficulty | "all">("all");
  const [mode, setMode] = useState<Exclude<RtMode, "mock">>("adaptive");
  const [count, setCount] = useState<number>(store.settings.practiceCount);
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    setCount(store.settings.practiceCount);
  }, [store.settings.practiceCount]);

  // Keyboard shortcuts in quiz
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!session) return;
      if (e.key === "ArrowRight") next();
      if (e.key === "ArrowLeft") prev();
      if (e.code === "Space") {
        e.preventDefault();
        next();
      }
      if (["1", "2", "3", "4"].includes(e.key)) answer(Number(e.key) - 1);
      if (e.key.toLowerCase() === "r" && session.kind === "mock" && session.finished) {
        setSession(null);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [session]);

  const startPractice = () => {
    const rng = rngFrom(`${store.settings.seed}|practice|${Date.now()}`);
    const used = new Set<string>();
    const items: RtQuestion[] = [];
    for (let i = 0; i < clampInt(count, 6, 60); i++) {
      const q = pickQuestion({
        store,
        pool,
        cat,
        diff,
        mode,
        rng,
        usedIds: used,
      });
      if (!q) break;
      used.add(q.id);
      items.push(q);
    }
    setSession({ kind: "practice", mode, cat, diff, items, index: 0, answered: {} });
  };

  const startMock = () => {
    const rng = rngFrom(`${store.settings.seed}|mock|${Date.now()}`);
    const durationMs = 90 * 60 * 1000;
    const startTs = Date.now();

    // balanced mix
    const weights: Array<[RtCategoryId, number]> = [
      ["algebra", 0.18],
      ["funktionen", 0.14],
      ["figurenlogik", 0.16],
      ["schlussfolgerungen", 0.14],
      ["informatik", 0.14],
      ["naturwissenschaften", 0.10],
      ["textverstaendnis", 0.08],
      ["englisch", 0.06],
    ];

    const pickCat = () => {
      const r = rng();
      let acc = 0;
      for (const [c, w] of weights) {
        acc += w;
        if (r <= acc) return c;
      }
      return "algebra";
    };

    const used = new Set<string>();
    const items: RtQuestion[] = [];
    while (items.length < 60) {
      const c = pickCat();
      const diffRoll = rng();
      const d: RtDifficulty = diffRoll < 0.4 ? 1 : diffRoll < 0.78 ? 2 : 3;
      const candidates = pool.filter((q) => q.cat === c && q.diff === d && !used.has(q.id));
      if (!candidates.length) continue;
      const q = candidates[Math.floor(rng() * candidates.length)];
      items.push(q);
      used.add(q.id);
    }

    setSession({
      kind: "mock",
      items,
      index: 0,
      answered: {},
      startTs,
      durationMs,
      finished: false,
      examMode: store.settings.reduceExplanationsInExam,
    });
  };

  const current = session ? session.items[session.index] : null;
  const answered = current && session ? session.answered[current.id] : null;

  const answer = (choiceIdx: number) => {
    if (!session || !current) return;
    if (answered) return;
    const correct = choiceIdx === current.correctIndex;
    setSession((prev) => {
      if (!prev) return prev;
      const next = structuredClone(prev) as Session;
      next.answered[current.id] = { chosen: choiceIdx, correct, ts: Date.now() };
      return next;
    });
    update((s) => recordAnswer(s, current, correct));
  };

  const next = () => {
    if (!session) return;
    setSession((prev) => {
      if (!prev) return prev;
      const next = structuredClone(prev) as Session;
      if (next.index < next.items.length - 1) next.index++;
      else {
        if (next.kind === "mock") next.finished = true;
        else return null;
      }
      return next;
    });
  };

  const prev = () => {
    if (!session) return;
    setSession((prev) => {
      if (!prev) return prev;
      const next = structuredClone(prev) as Session;
      if (next.index > 0) next.index--;
      return next;
    });
  };

  if (!session) {
    return (
      <div className="space-y-4">
        <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
          <div className="text-xs font-semibold tracking-wide text-white/60">
            Kernfeature
          </div>
          <h2 className="mt-2 text-2xl font-black tracking-tight text-white">
            Reihungstest‑Trainer
          </h2>
          <p className="mt-2 max-w-3xl text-sm leading-relaxed text-white/65">
            Adaptive Auswahl: <b>Schwächen priorisieren</b>, aber regelmäßig neue
            Varianten einstreuen. Alles offline speicherbar.
          </p>
        </div>

        <div className="grid gap-3 lg:grid-cols-3">
          <Card title="Kategorie">
            <select
              value={cat}
              onChange={(e) => setCat(e.target.value as RtCategoryId)}
              className="w-full rounded-2xl border border-white/10 bg-black/20 px-3 py-2 text-sm text-white outline-none"
            >
              {CAT_LABELS.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label}
                </option>
              ))}
            </select>
            <div className="mt-2 text-sm text-white/60">
              {CAT_LABELS.find((c) => c.id === cat)?.desc}
            </div>
          </Card>

          <Card title="Schwierigkeit">
            <select
              value={diff === "all" ? "all" : String(diff)}
              onChange={(e) =>
                setDiff(e.target.value === "all" ? "all" : (Number(e.target.value) as RtDifficulty))
              }
              className="w-full rounded-2xl border border-white/10 bg-black/20 px-3 py-2 text-sm text-white outline-none"
            >
              <option value="all">Alle</option>
              <option value="1">Leicht</option>
              <option value="2">Mittel</option>
              <option value="3">Schwer</option>
            </select>
            <div className="mt-2 text-sm text-white/60">
              Tipp: Für echte Progress‑Sprünge: Mittel/Schwer regelmäßig rein.
            </div>
          </Card>

          <Card title="Modus">
            <select
              value={mode}
              onChange={(e) => setMode(e.target.value as any)}
              className="w-full rounded-2xl border border-white/10 bg-black/20 px-3 py-2 text-sm text-white outline-none"
            >
              <option value="adaptive">Adaptive (Schwächen + neu)</option>
              <option value="weak">Schwächen‑Fokus</option>
              <option value="new">Neue Fragen zuerst</option>
            </select>
            <div className="mt-2 text-sm text-white/60">
              Schwächen = Trefferquote &lt; {Math.round(store.settings.weakThreshold * 100)}%
            </div>
          </Card>
        </div>

        <div className="grid gap-3 lg:grid-cols-2">
          <Card title="Training starten">
            <div className="flex items-center gap-3">
              <input
                type="number"
                min={6}
                max={60}
                value={count}
                onChange={(e) => setCount(clampInt(e.target.value, 6, 60))}
                className="w-28 rounded-2xl border border-white/10 bg-black/20 px-3 py-2 text-sm text-white outline-none"
              />
              <span className="text-sm text-white/60">Fragen</span>
            </div>
            <button
              onClick={startPractice}
              className="mt-3 w-full rounded-2xl border border-white/10 bg-gradient-to-br from-[#69a8ff] to-[#c38bff] px-4 py-3 text-sm font-black text-[#071022] hover:opacity-95"
            >
              Training starten
            </button>
            <div className="mt-2 text-xs text-white/60">
              Shortcuts im Quiz: <span className="font-mono">1–4</span>,{" "}
              <span className="font-mono">←/→</span>,{" "}
              <span className="font-mono">Space</span>
            </div>
          </Card>

          <Card title="Mock‑Test (60 Fragen · 90 Minuten)">
            <button
              onClick={startMock}
              className="w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm font-extrabold text-white hover:bg-white/15"
            >
              Mock‑Test starten
            </button>
            <div className="mt-2 text-sm text-white/60">
              Realistischer Mix + Timer. Im Prüfungs‑Modus werden Erklärungen
              ausgeblendet (Review danach).
            </div>
          </Card>
        </div>

        <Card title="Fragenpool (v1)">
          <div className="text-sm text-white/70">
            Aktuell geladen: <span className="font-mono font-bold">{pool.length}</span>{" "}
            Fragen (seeded).
          </div>
          <div className="mt-2 text-xs text-white/55">
            Nächster Ausbau: deutlich größere Pools für Informatik/Nawi/Logik +
            mehr lange Textpassagen (je 3–4 Fragen) + mehr 3×3‑Matrixtypen (XOR/Overlay).
          </div>
        </Card>
      </div>
    );
  }

  if (session.kind === "mock" && session.finished) {
    const total = session.items.length;
    const answers = Object.values(session.answered);
    const correct = answers.filter((a) => a.correct).length;
    const pct = total ? Math.round((100 * correct) / total) : 0;
    return (
      <div className="space-y-4">
        <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
          <div className="text-xs font-semibold tracking-wide text-white/60">
            Mock‑Ergebnis
          </div>
          <h2 className="mt-2 text-3xl font-black tracking-tight text-white">
            {correct}/{total} ({pct}%)
          </h2>
          <p className="mt-2 max-w-3xl text-sm leading-relaxed text-white/65">
            Review‑Regel: Nicht nur „richtig/falsch“. Frag dich:{" "}
            <b>Warum ist die richtige Option richtig</b> – und{" "}
            <b>warum waren die falschen verlockend</b>?
          </p>
          <button
            onClick={() => setSession(null)}
            className="mt-4 rounded-2xl border border-white/10 bg-white/10 px-4 py-2 text-sm font-semibold text-white hover:bg-white/15"
          >
            Zurück
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <QuizHeader session={session} />

      {current && (
        <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
          {current.tag && (
            <div className="text-xs font-semibold tracking-wide text-white/60">
              {current.tag}
            </div>
          )}

          {current.passageHtml && (
            <div
              className="mt-3 rounded-2xl border border-white/10 bg-black/20 p-4 text-sm leading-relaxed text-white/75"
              dangerouslySetInnerHTML={{ __html: current.passageHtml }}
            />
          )}

          {current.statementHtml && (
            <div
              className="mt-3 rounded-2xl border border-sky-400/20 bg-sky-400/10 p-3 text-sm text-white/80"
              dangerouslySetInnerHTML={{ __html: current.statementHtml }}
            />
          )}

          <div
            className="mt-3 text-lg font-extrabold leading-relaxed text-white"
            dangerouslySetInnerHTML={{ __html: current.promptHtml }}
          />

          <div className="mt-4 space-y-2">
            {current.options.map((opt, idx) => {
              const a = answered;
              const isCorrect = idx === current.correctIndex;
              const isChosen = a?.chosen === idx;
              const disabled = !!a;
              const cls = [
                "w-full rounded-2xl border px-4 py-3 text-left text-sm transition",
                "border-white/10 bg-black/20 hover:bg-white/10",
                disabled ? "cursor-not-allowed opacity-95" : "cursor-pointer",
                a && isCorrect ? "border-emerald-400/30 bg-emerald-400/10" : "",
                a && isChosen && !isCorrect ? "border-rose-400/30 bg-rose-400/10" : "",
              ].join(" ");
              return (
                <button
                  key={idx}
                  disabled={disabled}
                  onClick={() => answer(idx)}
                  className={cls}
                >
                  <span className="mr-2 inline-flex size-7 items-center justify-center rounded-xl border border-white/10 bg-white/5 font-mono font-bold text-white/80">
                    {idx + 1}
                  </span>
                  <span dangerouslySetInnerHTML={{ __html: opt }} />
                </button>
              );
            })}
          </div>

          {answered && !(session.kind === "mock" && session.examMode) && (
            <div className="mt-4 rounded-2xl border border-white/10 bg-black/20 p-4">
              <div className="text-sm font-extrabold text-white">
                {answered.correct ? "Richtig." : "Nicht ganz – Schritt‑für‑Schritt:"}
              </div>
              <ul className="mt-2 space-y-2 text-sm text-white/75">
                {current.explain.steps.map((s, i) => (
                  <li key={i} className="flex gap-2">
                    <span className="mt-0.5 inline-flex size-6 items-center justify-center rounded-xl border border-sky-400/20 bg-sky-400/10 font-mono text-xs font-bold text-white/85">
                      {i + 1}
                    </span>
                    <span dangerouslySetInnerHTML={{ __html: s }} />
                  </li>
                ))}
              </ul>
              {current.explain.tip && (
                <div className="mt-3 text-xs text-white/60">
                  <b className="text-white/80">Tipp:</b> {current.explain.tip}
                </div>
              )}
              {current.explain.pitfalls?.length ? (
                <div className="mt-3 text-xs text-white/60">
                  <b className="text-white/80">Warum falsche Optionen verlockend sind:</b>
                  <ul className="mt-1 list-disc space-y-1 pl-5">
                    {current.explain.pitfalls.map((p, i) => (
                      <li key={i}>{p}</li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </div>
          )}

          {answered && session.kind === "mock" && session.examMode && (
            <div className="mt-4 rounded-2xl border border-white/10 bg-black/20 p-4 text-sm text-white/65">
              Prüfungs‑Modus aktiv: Erklärungen im Test ausgeblendet. Review nach dem Mock.
            </div>
          )}

          <div className="mt-4 flex flex-wrap gap-2">
            <button
              onClick={prev}
              className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white/80 hover:bg-white/10"
            >
              ← Zurück
            </button>
            <button
              onClick={next}
              className="rounded-2xl border border-white/10 bg-gradient-to-br from-[#69a8ff] to-[#c38bff] px-4 py-2 text-sm font-black text-[#071022] hover:opacity-95"
            >
              {session.index < session.items.length - 1 ? "Weiter →" : session.kind === "mock" ? "Mock abschließen" : "Fertig"}
            </button>
            {session.kind === "mock" && (
              <button
                onClick={() =>
                  setSession((prev) => {
                    if (!prev || prev.kind !== "mock") return prev;
                    return { ...prev, examMode: !prev.examMode };
                  })
                }
                className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white/80 hover:bg-white/10"
              >
                Prüfungs‑Modus: {session.examMode ? "An" : "Aus"}
              </button>
            )}
            <button
              onClick={() => setSession(null)}
              className="rounded-2xl border border-rose-400/20 bg-rose-400/10 px-4 py-2 text-sm font-semibold text-rose-100 hover:bg-rose-400/15"
            >
              Beenden
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function QuizHeader(props: { session: Session }) {
  const s = props.session;
  const idx = s.index + 1;
  const total = s.items.length;
  const pct = total ? Math.round((100 * idx) / total) : 0;

  const timeLeft =
    s.kind === "mock"
      ? Math.max(0, s.startTs + s.durationMs - Date.now())
      : null;

  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="text-xs font-semibold tracking-wide text-white/60">
            {s.kind === "mock" ? "Mock‑Test" : "Training"}
          </div>
          <div className="mt-1 text-sm font-extrabold text-white">
            Frage {idx} von {total}
          </div>
          <div className="mt-1 text-xs text-white/60">
            Shortcuts: <span className="font-mono">1–4</span>,{" "}
            <span className="font-mono">←/→</span>,{" "}
            <span className="font-mono">Space</span>
          </div>
        </div>

        {s.kind === "mock" && (
          <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white/70">
            ⏱️{" "}
            <span className="font-mono font-bold text-white">
              {msToClock(timeLeft ?? 0)}
            </span>
          </div>
        )}
      </div>

      <div className="mt-4 h-3 w-full overflow-hidden rounded-full border border-white/10 bg-black/20">
        <div
          className="h-full bg-gradient-to-r from-[#69a8ff] to-[#c38bff]"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function Card(props: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
      <div className="text-sm font-extrabold text-white">{props.title}</div>
      <div className="mt-3">{props.children}</div>
    </div>
  );
}

function clampInt(v: any, a: number, b: number) {
  const n = Number(v);
  if (!Number.isFinite(n)) return a;
  return Math.max(a, Math.min(b, Math.round(n)));
}

function msToClock(ms: number) {
  const s = Math.max(0, Math.floor(ms / 1000));
  const hh = Math.floor(s / 3600);
  const mm = Math.floor((s % 3600) / 60);
  const ss = s % 60;
  return hh > 0
    ? `${hh}:${String(mm).padStart(2, "0")}:${String(ss).padStart(2, "0")}`
    : `${mm}:${String(ss).padStart(2, "0")}`;
}

