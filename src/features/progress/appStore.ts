export type AppSettings = {
  seed: string;
  weakThreshold: number; // 0..1
  adaptiveWeakShare: number; // 0..1
  practiceCount: number;
  reduceExplanationsInExam: boolean;
};

export type QStat = {
  seen: number;
  correct: number;
  wrong: number;
  lastTs: number;
};

export type AppStore = {
  version: 1;
  settings: AppSettings;
  stats: {
    byQ: Record<string, QStat>;
    byCat: Record<string, QStat>;
    byCatDiff: Record<string, QStat>;
    days: Record<string, number>;
    total: { seen: number; correct: number; wrong: number };
  };
  habits: {
    // lightweight v1
    lastDay: string | null;
    streak: number;
    entries: Record<string, { deepWork: boolean; indieBuild: boolean; gamingLimit: boolean }>;
  };
  journal: {
    entries: Array<{ id: string; ts: number; title: string; body: string }>;
  };
};

export const defaultStore: AppStore = {
  version: 1,
  settings: {
    seed: "technikum-ready-" + new Date().getFullYear(),
    weakThreshold: 0.6,
    adaptiveWeakShare: 0.7,
    practiceCount: 18,
    reduceExplanationsInExam: true,
  },
  stats: {
    byQ: {},
    byCat: {},
    byCatDiff: {},
    days: {},
    total: { seen: 0, correct: 0, wrong: 0 },
  },
  habits: {
    lastDay: null,
    streak: 0,
    entries: {},
  },
  journal: {
    entries: [],
  },
};

