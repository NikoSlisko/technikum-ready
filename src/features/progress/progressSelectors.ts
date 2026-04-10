import type { AppStore } from "./appStore";

function dayKey(ts = Date.now()) {
  const d = new Date(ts);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const da = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${da}`;
}

export function getTodayCounts(store: AppStore) {
  const k = dayKey();
  return store.stats.days[k] || 0;
}

export function getTotalAccuracy(store: AppStore) {
  const t = store.stats.total;
  if (!t.seen) return null;
  return Math.round((100 * t.correct) / t.seen);
}

