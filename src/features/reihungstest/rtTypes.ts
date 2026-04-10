export type RtCategoryId =
  | "algebra"
  | "funktionen"
  | "figurenlogik"
  | "schlussfolgerungen"
  | "informatik"
  | "naturwissenschaften"
  | "textverstaendnis"
  | "englisch"
  | "ready4study";

export type RtDifficulty = 1 | 2 | 3;

export type RtExplain = {
  steps: string[];
  tip?: string;
  pitfalls?: string[]; // why wrong answers feel tempting
};

export type RtQuestion = {
  id: string; // stable (seeded)
  cat: RtCategoryId;
  diff: RtDifficulty;
  promptHtml: string;
  options: [string, string, string, string];
  correctIndex: 0 | 1 | 2 | 3;
  explain: RtExplain;

  passageHtml?: string; // for long text comprehension
  statementHtml?: string;
  tag?: string;
};

export type RtMode = "adaptive" | "weak" | "new" | "mock";

