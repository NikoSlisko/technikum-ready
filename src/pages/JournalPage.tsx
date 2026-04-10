import { useState } from "react";
import { useAppStore } from "../features/progress/useAppStore";

export function JournalPage() {
  const { store, update } = useAppStore();
  const [title, setTitle] = useState("Warum ich das mache");
  const [body, setBody] = useState(
    "Dual‑Studium Informatik + Indie‑Hacking. Ziel: finanzielle Unabhängigkeit, Umzug ans kroatische Meer, Weltbürger‑Lifestyle. Heute mache ich den nächsten Schritt durch..."
  );

  const add = () => {
    const t = title.trim();
    const b = body.trim();
    if (!t || !b) return;
    update((s) => {
      s.journal.entries.unshift({
        id: crypto?.randomUUID?.() ?? String(Date.now()),
        ts: Date.now(),
        title: t,
        body: b,
      });
    });
    setBody("");
  };

  return (
    <div className="space-y-4">
      <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
        <div className="text-xs font-semibold tracking-wide text-white/60">
          Motivation · mentale Stärke (v1)
        </div>
        <h2 className="mt-2 text-2xl font-black tracking-tight text-white">
          Journal
        </h2>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-white/65">
          Schreib deine Gründe klar auf. In schwierigen Wochen ist das dein
          „Anker“. (In v2: Prompts + Mood + Export.)
        </p>
      </div>

      <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
        <div className="grid gap-3">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none focus:border-white/20"
            placeholder="Titel"
          />
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            className="min-h-36 w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white/85 outline-none focus:border-white/20"
            placeholder="Text"
          />
          <div className="flex flex-wrap gap-2">
            <button
              onClick={add}
              className="rounded-2xl border border-white/10 bg-gradient-to-br from-[#69a8ff] to-[#c38bff] px-4 py-2 text-sm font-black text-[#071022] hover:opacity-95"
            >
              Speichern
            </button>
            <button
              onClick={() =>
                update((s) => {
                  s.journal.entries = [];
                })
              }
              className="rounded-2xl border border-rose-400/20 bg-rose-400/10 px-4 py-2 text-sm font-semibold text-rose-100 hover:bg-rose-400/15"
            >
              Alles löschen
            </button>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {store.journal.entries.length === 0 ? (
          <div className="rounded-3xl border border-white/10 bg-white/5 p-5 text-sm text-white/60">
            Noch keine Einträge.
          </div>
        ) : (
          store.journal.entries.map((e) => (
            <div
              key={e.id}
              className="rounded-3xl border border-white/10 bg-white/5 p-5"
            >
              <div className="text-xs font-semibold tracking-wide text-white/55">
                {new Date(e.ts).toLocaleString()}
              </div>
              <div className="mt-1 text-sm font-extrabold text-white">
                {e.title}
              </div>
              <div className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-white/70">
                {e.body}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

