import type { AppStore, QStat } from "../progress/appStore";
import type { RtCategoryId, RtDifficulty, RtMode, RtQuestion } from "./rtTypes";

function acc(stat: QStat | undefined) {
  if (!stat || !stat.seen) return null;
  return stat.correct / stat.seen;
}

function isWeak(store: AppStore, q: RtQuestion) {
  const st = store.stats.byQ[q.id];
  const a = acc(st);
  if (a === null) return false;
  return a < store.settings.weakThreshold;
}

function isUnseen(store: AppStore, q: RtQuestion) {
  return !store.stats.byQ[q.id]?.seen;
}

function recencyPenaltyDays(store: AppStore, q: RtQuestion) {
  const last = store.stats.byQ[q.id]?.lastTs;
  if (!last) return 0;
  const days = (Date.now() - last) / (24 * 3600 * 1000);
  // recently seen => penalty; older => smaller penalty
  return Math.max(0, 3 - days); // 0..3
}

export function pickQuestion(params: {
  store: AppStore;
  pool: RtQuestion[];
  cat: RtCategoryId;
  diff: RtDifficulty | "all";
  mode: Exclude<RtMode, "mock">;
  rng: () => number;
  usedIds: Set<string>;
}) {
  const { store, pool, cat, diff, mode, rng, usedIds } = params;

  const candidates = pool.filter(
    (q) =>
      q.cat === cat &&
      (diff === "all" || q.diff === diff) &&
      !usedIds.has(q.id),
  );
  if (!candidates.length) return null;

  const weak = candidates.filter((q) => isWeak(store, q));
  const unseen = candidates.filter((q) => isUnseen(store, q));

  const choose = (arr: RtQuestion[]) => arr[Math.floor(rng() * arr.length)];

  // modes
  if (mode === "weak") return (weak.length ? choose(weighted(weak, store, rng)) : (unseen.length ? choose(unseen) : choose(candidates)));
  if (mode === "new") return (unseen.length ? choose(unseen) : (weak.length ? choose(weighted(weak, store, rng)) : choose(candidates)));

  // adaptive: 70% weak, 30% new by default (configurable)
  const wantWeak = rng() < store.settings.adaptiveWeakShare;
  if (wantWeak && weak.length) return choose(weighted(weak, store, rng));
  if (!wantWeak && unseen.length) return choose(unseen);
  if (weak.length) return choose(weighted(weak, store, rng));
  if (unseen.length) return choose(unseen);
  return choose(candidates);
}

function weighted(arr: RtQuestion[], store: AppStore, rng: () => number) {
  // Build a bag where "more weak + less recent" appears more often.
  const bag: RtQuestion[] = [];
  for (const q of arr) {
    const st = store.stats.byQ[q.id];
    const a = acc(st) ?? 0.5;
    const seen = st?.seen ?? 1;
    const badness = 1 - a; // higher => worse
    const recPenalty = recencyPenaltyDays(store, q); // 0..3
    const base = 2 + badness * 10 + (seen <= 3 ? 2 : 0);
    const w = Math.max(1, Math.round(base - recPenalty));
    for (let i = 0; i < w; i++) bag.push(q);
  }
  if (!bag.length) return arr;
  // shuffle a bit for variety
  for (let i = bag.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [bag[i], bag[j]] = [bag[j], bag[i]];
  }
  return bag;
}

