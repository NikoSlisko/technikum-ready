import type { AppStore } from "../progress/appStore";
import type { RtQuestion } from "./rtTypes";

function dayKey(ts = Date.now()) {
  const d = new Date(ts);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const da = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${da}`;
}

function ensure(map: Record<string, any>, key: string) {
  if (!map[key]) map[key] = { seen: 0, correct: 0, wrong: 0, lastTs: 0 };
  return map[key];
}

export function recordAnswer(store: AppStore, q: RtQuestion, correct: boolean) {
  const ts = Date.now();
  const dk = dayKey(ts);
  store.stats.days[dk] = (store.stats.days[dk] || 0) + 1;
  store.stats.total.seen++;
  if (correct) store.stats.total.correct++;
  else store.stats.total.wrong++;

  const sq = ensure(store.stats.byQ, q.id);
  sq.seen++;
  if (correct) sq.correct++;
  else sq.wrong++;
  sq.lastTs = ts;

  const sc = ensure(store.stats.byCat, q.cat);
  sc.seen++;
  if (correct) sc.correct++;
  else sc.wrong++;
  sc.lastTs = ts;

  const cd = ensure(store.stats.byCatDiff, `${q.cat}|${q.diff}`);
  cd.seen++;
  if (correct) cd.correct++;
  else cd.wrong++;
  cd.lastTs = ts;
}

