import type { RtCategoryId, RtDifficulty, RtQuestion } from "./rtTypes";
import { rngFrom, shuffle } from "./seedRng";

type Rng = () => number;

function qid(seed: string, cat: RtCategoryId, key: string) {
  return `rt:${seed}:${cat}:${key}`;
}

function as4(opts: string[]): [string, string, string, string] {
  if (opts.length !== 4) throw new Error("options must be length 4");
  return [opts[0], opts[1], opts[2], opts[3]];
}

function matrixTable(grid: string[][]) {
  const rows = grid
    .map(
      (r) =>
        `<tr>${r
          .map((c) =>
            c === "?"
              ? `<td class="blank">?</td>`
              : `<td>${c}</td>`,
          )
          .join("")}</tr>`,
    )
    .join("");
  return `<table class="matrix-grid">${rows}</table>`;
}

function mk(
  seed: string,
  cat: RtCategoryId,
  key: string,
  diff: RtDifficulty,
  promptHtml: string,
  options: string[],
  correctIndex: number,
  explain: RtQuestion["explain"],
  extra: Partial<RtQuestion> = {},
): RtQuestion {
  const rng = rngFrom(`${seed}|opt|${cat}|${key}`);
  const idxs = shuffle(rng, [0, 1, 2, 3]);
  const newOptions = idxs.map((i) => options[i]);
  const newCorrect = idxs.indexOf(correctIndex) as 0 | 1 | 2 | 3;

  return {
    id: qid(seed, cat, key),
    cat,
    diff,
    promptHtml,
    options: as4(newOptions),
    correctIndex: newCorrect,
    explain,
    ...extra,
  };
}

/* =========================
   Generators (fresh, exam-aligned)
========================= */
function genAlgebra(seed: string, rng: Rng): RtQuestion[] {
  const out: RtQuestion[] = [];

  // Simplify linear expressions
  for (let i = 0; i < 28; i++) {
    const a = 2 + Math.floor(rng() * 8);
    const b = 1 + Math.floor(rng() * 8);
    const c = 1 + Math.floor(rng() * 10);
    const d = 1 + Math.floor(rng() * 10);
    const sign = rng() < 0.5 ? "-" : "+";
    const coef = a - b;
    const konst = sign === "-" ? c - d : c + d;
    const correct = `${coef}x ${konst >= 0 ? "+" : "−"} ${Math.abs(konst)}`;
    const options = [
      correct,
      `${a + b}x ${konst >= 0 ? "+" : "−"} ${Math.abs(konst)}`,
      `${coef}x ${sign === "-" ? "+" : "−"} ${Math.abs(c - d)}`,
      `${coef + 1}x ${konst >= 0 ? "+" : "−"} ${Math.abs(konst)}`,
    ];
    out.push(
      mk(
        seed,
        "algebra",
        `simp_${i}`,
        1,
        `Vereinfache: <span class="font-mono">${a}x ${sign} ${b}x + ${c} ${sign === "-" ? "−" : "+"} ${d}</span>`,
        options,
        0,
        {
          steps: [
            `x‑Terme: ${a}x ${sign} ${b}x = ${coef}x`,
            `Zahlen: ${c} ${sign === "-" ? "−" : "+"} ${d} = ${konst}`,
            `Ergebnis: <b>${correct}</b>`,
          ],
          tip: "Typischer Fehler: Vorzeichen beim zweiten Term/bei der Zahl verlieren.",
          pitfalls: [
            "„a+b“ bei den x‑Termen (falsch, wenn ein Minus dabei ist).",
            "Zahlen falsch zusammengefasst (Minus als Plus gelesen).",
          ],
        },
      ),
    );
  }

  // Linear equations with brackets
  for (let i = 0; i < 26; i++) {
    const t = 2 + Math.floor(rng() * 6);
    const p = 1 + Math.floor(rng() * 9);
    const rhs = 6 + Math.floor(rng() * 40);
    const rhs2 = rhs - (rhs % t);
    const sol = rhs2 / t + p;
    out.push(
      mk(
        seed,
        "algebra",
        `lin_${i}`,
        1,
        `Löse: <span class="font-mono">${t}(x − ${p}) = ${rhs2}</span>`,
        [`x = ${sol}`, `x = ${sol - 1}`, `x = ${rhs2 / t}`, `x = ${p - rhs2 / t}`],
        0,
        {
          steps: [
            `Klammer auflösen: ${t}x − ${t * p} = ${rhs2}`,
            `Umformen: ${t}x = ${rhs2 + t * p}`,
            `Teilen: x = ${sol}`,
          ],
          tip: "Erst Klammer weg, dann in kleinen Schritten umformen.",
          pitfalls: [
            "p statt (−p) eingesetzt: Vorzeichenfehler.",
            "Nur rhs durch t geteilt und „+p“ vergessen.",
          ],
        },
      ),
    );
  }

  // Binomial expansions
  for (let i = 0; i < 18; i++) {
    const b = 2 + Math.floor(rng() * 7);
    const plus = rng() < 0.5;
    const correct = plus
      ? `x² + ${2 * b}x + ${b * b}`
      : `x² − ${2 * b}x + ${b * b}`;
    out.push(
      mk(
        seed,
        "algebra",
        `bin_${i}`,
        2,
        `Wandle um: <span class="font-mono">(x ${plus ? "+" : "−"} ${b})²</span>`,
        [
          correct,
          `x² ${plus ? "+" : "−"} ${b}x + ${b * b}`,
          `x² + ${b * b}`,
          plus ? `x² + ${b}x + ${b * b}` : `x² − ${b}x + ${b * b}`,
        ],
        0,
        {
          steps: [
            `Binomische Formel: (a±b)² = a² ± 2ab + b²`,
            `a=x, b=${b} ⇒ x² ${plus ? "+" : "−"} ${2 * b}x + ${b * b}`,
          ],
          tip: "Der mittlere Term ist immer 2ab – nicht nur ab.",
          pitfalls: ["Mittleren Term vergessen/halbiert.", "Vorzeichen beim ±2ab falsch."],
        },
      ),
    );
  }

  // Quadratic equations (factorable)
  for (let i = 0; i < 20; i++) {
    const r1 = 1 + Math.floor(rng() * 8);
    const r2 = 1 + Math.floor(rng() * 8);
    const s1 = rng() < 0.5 ? -r1 : r1;
    const s2 = rng() < 0.5 ? -r2 : r2;
    const b = -(s1 + s2);
    const c = s1 * s2;
    const eq = `x² ${b >= 0 ? "+" : "−"} ${Math.abs(b)}x ${c >= 0 ? "+" : "−"} ${Math.abs(c)} = 0`;
    out.push(
      mk(
        seed,
        "algebra",
        `quad_${i}`,
        3,
        `Löse: <span class="font-mono">${eq}</span>`,
        [
          `x = ${s1} und x = ${s2}`,
          `x = ${-s1} und x = ${-s2}`,
          `x = ${s1 + s2}`,
          `x = ${c}`,
        ],
        0,
        {
          steps: [
            `Suche p,q mit p·q=${c} und p+q=${-(b)}.`,
            `Faktorisieren und Nullprodukt anwenden.`,
            `Lösungen: x=${s1}, x=${s2}`,
          ],
          tip: "Wenn Vorzeichen nerven: Kandidaten kurz einsetzen und prüfen, ob 0 wird.",
          pitfalls: [
            "p·q stimmt, aber p+q nicht (oder umgekehrt).",
            "Vorzeichen bei (x−s) falsch: Nullstelle s ⇒ Faktor (x−s).",
          ],
        },
      ),
    );
  }

  // Logarithms (base 2 or 10)
  for (let i = 0; i < 14; i++) {
    const base = rng() < 0.65 ? 2 : 10;
    const exp = 2 + Math.floor(rng() * 6);
    const x = base ** exp;
    out.push(
      mk(
        seed,
        "algebra",
        `log_${i}`,
        3,
        `Bestimme x: <span class="font-mono">log<sub>${base}</sub>(x) = ${exp}</span>`,
        [`x = ${x}`, `x = ${exp}`, `x = ${x / base}`, `x = ${x * base}`],
        0,
        {
          steps: [
            `Definition: log_b(x)=y ↔ b^y=x`,
            `Also: ${base}^${exp} = x`,
            `Ergebnis: x=${x}`,
          ],
          tip: "Logarithmus fragt nach dem Exponenten.",
          pitfalls: ["x als exp verwechselt.", "Basis ignoriert (2 vs 10)."],
        },
      ),
    );
  }

  return out;
}

function genFunctions(seed: string, rng: Rng): RtQuestion[] {
  const out: RtQuestion[] = [];

  // Function value (linear)
  for (let i = 0; i < 22; i++) {
    const m = -6 + Math.floor(rng() * 13);
    const b = -9 + Math.floor(rng() * 19);
    const x = -4 + Math.floor(rng() * 9);
    if (m === 0) continue;
    const y = m * x + b;
    out.push(
      mk(
        seed,
        "funktionen",
        `val_${i}`,
        1,
        `Gegeben: <span class="font-mono">f(x) = ${m}x ${b >= 0 ? "+" : "−"} ${Math.abs(b)}</span>. Berechne <span class="font-mono">f(${x})</span>.`,
        [`${y}`, `${y + 2}`, `${y - m}`, `${y + m}`],
        0,
        {
          steps: [
            `Einsetzen: f(${x}) = ${m}·(${x}) ${b >= 0 ? "+" : "−"} ${Math.abs(b)}`,
            `Rechnen: ${m * x} ${b >= 0 ? "+" : "−"} ${Math.abs(b)} = ${y}`,
          ],
          tip: "Bei negativen x immer Klammern verwenden.",
          pitfalls: ["Vorzeichenfehler beim Produkt m·x.", "b falsch addiert/subtrahiert."],
        },
      ),
    );
  }

  // Slope between points
  for (let i = 0; i < 18; i++) {
    const x1 = -3 + Math.floor(rng() * 7);
    const x2 = x1 + 1 + Math.floor(rng() * 4);
    const y1 = -5 + Math.floor(rng() * 11);
    const m = -4 + Math.floor(rng() * 9);
    if (m === 0) continue;
    const y2 = y1 + m * (x2 - x1);
    out.push(
      mk(
        seed,
        "funktionen",
        `slope_${i}`,
        2,
        `Steigung der Geraden durch <span class="font-mono">(${x1}|${y1})</span> und <span class="font-mono">(${x2}|${y2})</span>?`,
        [`${m}`, `${-m}`, `${m + 1}`, `${(y2 - y1) + (x2 - x1)}`],
        0,
        {
          steps: [
            `m = (y₂−y₁)/(x₂−x₁)`,
            `m = (${y2}−${y1})/(${x2}−${x1}) = ${y2 - y1}/${x2 - x1} = ${m}`,
          ],
          tip: "Immer Δy/Δx – nicht Δx/Δy.",
          pitfalls: ["Δx und Δy vertauscht.", "Vorzeichen bei Differenzen falsch."],
        },
      ),
    );
  }

  // Linear root (x-intercept)
  for (let i = 0; i < 16; i++) {
    const m = 1 + Math.floor(rng() * 7);
    const sign = rng() < 0.5 ? -1 : 1;
    const mm = sign * m;
    const b = m * (2 + Math.floor(rng() * 8));
    const x0 = b / mm;
    out.push(
      mk(
        seed,
        "funktionen",
        `root_${i}`,
        1,
        `f(x) = <span class="font-mono">${mm}x − ${b}</span>. Wo liegt die Nullstelle?`,
        [`x = ${x0}`, `x = ${-x0}`, `x = ${b}`, `x = ${mm}`],
        0,
        {
          steps: [
            `Nullstelle: f(x)=0 ⇒ ${mm}x − ${b} = 0`,
            `${mm}x = ${b} ⇒ x = ${b}/${mm} = ${x0}`,
          ],
          tip: "Bei f(x)=mx+b ist x₀ = −b/m. Hier ist b=−" + b + ".",
          pitfalls: ["Vorzeichen von b falsch in die Formel übernommen."],
        },
      ),
    );
  }

  // Vertex x-position
  for (let i = 0; i < 14; i++) {
    const a = rng() < 0.65 ? 1 : 2;
    const b = (2 * a) * (-(2 + Math.floor(rng() * 6))); // divisible
    const c = -10 + Math.floor(rng() * 21);
    const xs = -b / (2 * a);
    const ys = a * xs * xs + b * xs + c;
    out.push(
      mk(
        seed,
        "funktionen",
        `vertex_${i}`,
        3,
        `f(x) = <span class="font-mono">${a}x² ${b >= 0 ? "+" : "−"} ${Math.abs(b)}x ${c >= 0 ? "+" : "−"} ${Math.abs(c)}</span>. Scheitelpunkt?`,
        [`S(${xs}|${ys})`, `S(${xs + 1}|${ys})`, `S(${-xs}|${ys})`, `S(${xs}|${ys + 2})`],
        0,
        {
          steps: [
            `xₛ = −b/(2a) = −(${b})/(2·${a}) = ${xs}`,
            `yₛ = f(${xs}) = ${ys}`,
          ],
          tip: "b ist der Koeffizient vor x (mit Vorzeichen!).",
          pitfalls: ["−b/(2a) falsch gerechnet.", "yₛ nicht durch Einsetzen bestimmt."],
        },
      ),
    );
  }

  return out;
}

function genFigures(seed: string, rng: Rng): RtQuestion[] {
  const out: RtQuestion[] = [];
  const shapes = ["▲", "■", "●", "◆", "★", "⬟", "⬢", "⬣"];
  const arrows = ["↑", "→", "↓", "←"];

  // 1) Rotation (symbols)
  for (let i = 0; i < 16; i++) {
    const s = shuffle(rng, shapes).slice(0, 6);
    const r1 = [s[0], s[1], s[2]];
    const r2 = [s[2], s[0], s[1]];
    const r3 = [s[1], s[2], "?"];
    const correct = s[0];
    const opts = shuffle(rng, [correct, s[3], s[4], s[5]]);
    out.push(
      mk(
        seed,
        "figurenlogik",
        `rot_${i}`,
        2,
        `Welche Figur gehört ins leere Feld? ${matrixTable([r1, r2, r3])}`,
        opts,
        opts.indexOf(correct),
        {
          steps: [
            "Jede Zeile ist eine zyklische Verschiebung der vorherigen.",
            "Zeile 3 muss die Rotation fortsetzen.",
            `Daher fehlt: <b>${correct}</b>.`,
          ],
          tip: "Regel immer mit Zeile 1 UND 2 validieren.",
          pitfalls: ["Nur eine Zeile betrachtet (Zufallstreffer).", "Rotation in falsche Richtung angenommen."],
        },
        { tag: "Rotation" },
      ),
    );
  }

  // 2) Mirror symmetry
  for (let i = 0; i < 12; i++) {
    const s = shuffle(rng, shapes).slice(0, 6);
    const grid = [
      [s[0], s[1], s[0]],
      [s[2], s[3], s[2]],
      [s[4], "?", s[4]],
    ];
    const correct = s[5];
    // Rule: middle column increases (s1, s3, s5)
    grid[2][1] = "?";
    const opts = shuffle(rng, [correct, s[1], s[3], s[4]]);
    out.push(
      mk(
        seed,
        "figurenlogik",
        `sym_${i}`,
        2,
        `Spiegelregel: links = rechts. Was steht in der Mitte unten? ${matrixTable(grid)}`,
        opts,
        opts.indexOf(correct),
        {
          steps: [
            "Außenfelder sind pro Zeile identisch (Symmetrie).",
            "Die mittlere Spalte folgt einem eigenen Verlauf: oben→mitte→unten.",
            "Unten fehlt das nächste „Mitte‑Symbol“.",
          ],
          tip: "Bei Symmetrie: zuerst links/rechts prüfen, dann die Mittelachse separat.",
          pitfalls: ["Nur Symmetrie geprüft, Mittelspalte ignoriert.", "Mittelspalte als „egal“ angenommen."],
        },
        { tag: "Symmetrie" },
      ),
    );
  }

  // 3) Arrow rotation (direction)
  for (let i = 0; i < 12; i++) {
    const base = Math.floor(rng() * 4);
    const a1 = arrows[base];
    const a2 = arrows[(base + 1) % 4];
    const a3 = arrows[(base + 2) % 4];
    const grid = [
      [a1, a2, a3],
      [arrows[(base + 1) % 4], arrows[(base + 2) % 4], arrows[(base + 3) % 4]],
      [arrows[(base + 2) % 4], arrows[(base + 3) % 4], "?"],
    ];
    const correct = arrows[(base + 0) % 4];
    const opts = shuffle(rng, [correct, arrows[(base + 1) % 4], arrows[(base + 2) % 4], arrows[(base + 3) % 4]]);
    out.push(
      mk(
        seed,
        "figurenlogik",
        `arr_${i}`,
        2,
        `Richtungen: Was fehlt? ${matrixTable(grid)}`,
        opts,
        opts.indexOf(correct),
        {
          steps: ["In jeder Zeile rotiert der Pfeil um 90° weiter.", "Jede Zeile startet um +1 Rotation gegenüber der Zeile darüber.", `Damit fehlt: <b>${correct}</b>.`],
          tip: "Wenn du unsicher bist: schreibe die Richtungen als 0/1/2/3 auf.",
          pitfalls: ["Rotation pro Zeile mit Rotation pro Spalte verwechselt."],
        },
        { tag: "Rotation (Pfeile)" },
      ),
    );
  }

  // 4) Numeric add pattern (Fibonacci-like)
  for (let i = 0; i < 12; i++) {
    const a = 1 + Math.floor(rng() * 4);
    const b = 1 + Math.floor(rng() * 4);
    const grid = [
      [`${a}`, `${b}`, `${a + b}`],
      [`${b}`, `${a + b}`, `${a + 2 * b}`],
      [`${a + b}`, `${a + 2 * b}`, "?"],
    ];
    const correct = `${(a + b) + (a + 2 * b)}`;
    const opts = shuffle(rng, [correct, `${a + 3 * b}`, `${2 * a + 2 * b}`, `${2 * a + 4 * b}`]);
    out.push(
      mk(
        seed,
        "figurenlogik",
        `fib_${i}`,
        3,
        `Zahlenregel: dritte Zelle = Summe der ersten beiden. Was fehlt? ${matrixTable(grid)}`,
        opts,
        opts.indexOf(correct),
        {
          steps: ["Regel: rechts = links + mitte.", `Unten rechts = ${a + b} + ${a + 2 * b} = ${correct}.`],
          tip: "Wenn du Additionsregeln vermutest: prüfe 2 Zeilen, dann 1 Spalte.",
          pitfalls: ["Nur Zeile 1 passt, Zeile 2 nicht (Scheinregel)."],
        },
        { tag: "Addition" },
      ),
    );
  }

  // Ensure at least 50 items
  return out;
}

function genText(seed: string): RtQuestion[] {
  const out: RtQuestion[] = [];
  const passages = [
    {
      key: "ds",
      cat: "textverstaendnis" as const,
      diff: 2 as RtDifficulty,
      text:
        "Die DSGVO wird oft als Papierkram abgetan, doch in IT-Projekten ist sie vor allem ein Engineering-Thema. Sobald personenbezogene Daten verarbeitet werden, müssen Prinzipien wie Datenminimierung und Zweckbindung technisch unterstützt werden: Es soll nur gesammelt werden, was nötig ist, und nur so lange, wie es gebraucht wird. In der Praxis scheitert es häufig an fehlender Architektur: Logs speichern zu viel, Testdaten stammen aus echten Kundendaten oder Berechtigungen sind zu grob. Gute Teams bauen Datenschutz in Prozesse ein – klare Datenflüsse, Rollenmodelle, Audit-Logs und automatisierte Löschroutinen.",
      qs: [
        {
          q: "Welche Kernaussage passt am besten?",
          opts: [
            "DSGVO ist nur ein juristisches Thema.",
            "Datenschutz ist vor allem Architektur + Prozess.",
            "Logs sind grundsätzlich verboten.",
            "Zweckbindung erlaubt jede Nutzung.",
          ],
          c: 1,
          exp: ["Der Text betont: Engineering/Architektur/Prozesse sind der Kern."],
        },
        {
          q: "Welches Beispiel wird als typischer Praxisfehler genannt?",
          opts: [
            "Automatisierte Löschroutinen existieren",
            "Rollenmodelle sind klar",
            "Testdaten stammen aus echten Kundendaten",
            "Datenflüsse sind dokumentiert",
          ],
          c: 2,
          exp: ["Das wird explizit erwähnt."],
        },
        {
          q: "Welche Maßnahme wird als Lösung genannt?",
          opts: ["Audit-Logs", "Nur VPN", "Open-Source verbieten", "Keine Tests"],
          c: 0,
          exp: ["Audit-Logs werden als Prozessbaustein genannt."],
        },
      ],
    },
    {
      key: "cloud",
      cat: "textverstaendnis" as const,
      diff: 3 as RtDifficulty,
      text:
        "In Cloud-Projekten wirken Kosten anfangs oft niedrig, weil man pro Nutzung bezahlt. Genau das kann zur Falle werden: Ressourcen laufen dauerhaft, Instanzen sind zu groß oder Testumgebungen werden nie abgeschaltet. FinOps verbindet Technik und Controlling: Tagging, Budgets, Alarme, Reviews und die Fähigkeit, auch nach unten zu skalieren. Teams, die früh messen und automatisieren, vermeiden Überraschungen und treffen Entscheidungen datenbasiert statt nach Bauchgefühl.",
      qs: [
        {
          q: "Welche „Falle“ wird beschrieben?",
          opts: [
            "Cloud kann nicht skalieren",
            "Man zahlt für ungenutzte/zu große Ressourcen",
            "Budgets sind in der Cloud unmöglich",
            "Cloud ist immer billiger",
          ],
          c: 1,
          exp: ["Ungenutzte Reserven/zu große Instanzen/dauerlaufende Umgebungen."],
        },
        {
          q: "Was gehört laut Text zu FinOps?",
          opts: ["Sauberes Tagging + Kostenalarme", "Keine Reviews", "Nur manuell", "Nie skalieren"],
          c: 0,
          exp: ["Genau diese Maßnahmen werden genannt."],
        },
        {
          q: "Was ist die Meta-Idee des Textes?",
          opts: [
            "Bauchgefühl ist besser als Metriken",
            "Entscheidungen datenbasiert treffen",
            "Testumgebungen müssen immer laufen",
            "Controlling ersetzt Engineering",
          ],
          c: 1,
          exp: ["Der Text kontrastiert datenbasiert vs Bauchgefühl."],
        },
      ],
    },
  ];

  for (const p of passages) {
    for (let i = 0; i < p.qs.length; i++) {
      const qi = p.qs[i];
      out.push(
        mk(
          seed,
          p.cat,
          `${p.key}_${i}`,
          qi.c === 0 ? p.diff : p.diff,
          qi.q,
          qi.opts,
          qi.c,
          {
            steps: qi.exp,
            tip: "Tipp: Lies erst die Frage, dann suche gezielt die relevante Stelle.",
            pitfalls: ["Zu absolute Aussagen (immer/nie) sind oft falsch.", "Antworten, die „gut klingen“, aber nicht im Text stehen."],
          },
          { passageHtml: `<div class="leading-relaxed">${p.text}</div>` },
        ),
      );
    }
  }
  return out;
}

function genEnglish(seed: string): RtQuestion[] {
  const out: RtQuestion[] = [];

  const passage =
    "Cybersecurity incidents often start with simple mistakes rather than sophisticated malware. Attackers may reuse leaked passwords, trick users with realistic phishing emails, or exploit unpatched systems. This is why organisations combine technical controls (like multi-factor authentication and monitoring) with human-focused measures (such as training and clear reporting channels). Effective security is an ongoing process of prevention, detection, and response.";

  out.push(
    mk(
      seed,
      "englisch",
      "cyb_0",
      2,
      "What is the main idea of the passage?",
      [
        "Security is only about antivirus software.",
        "Many incidents begin with simple issues, so security needs technical and human measures.",
        "Phishing is no longer a threat.",
        "Unpatched systems are harmless.",
      ],
      1,
      {
        steps: ["The passage highlights simple mistakes and combined measures (technical + human)."],
        tip: 'Tip: Avoid options with "only"/"always" unless the text says so.',
        pitfalls: ["Option sounds plausible but contradicts the text (e.g., 'only antivirus')."],
      },
      { passageHtml: `<div class="leading-relaxed">${passage}</div>` },
    ),
  );

  out.push(
    mk(
      seed,
      "englisch",
      "cyb_1",
      3,
      "Which example is mentioned as an attack method?",
      ["Realistic phishing emails", "Quantum decryption", "Mind reading", "Satellite hacking only"],
      0,
      {
        steps: ["The text explicitly mentions realistic phishing emails."],
        tip: "Scan for exact phrases (phishing, leaked passwords, unpatched systems).",
        pitfalls: ["Fancy-sounding terms that are not in the passage."],
      },
      { passageHtml: `<div class="leading-relaxed">${passage}</div>` },
    ),
  );

  // Language-in-context
  out.push(
    mk(
      seed,
      "englisch",
      "lang_0",
      2,
      'Choose the correct word: "We need to ___ the root cause before fixing the bug."',
      ["identify", "identefy", "indentify", "identifie"],
      0,
      {
        steps: ['Correct spelling is "identify".'],
        tip: "If unsure, look for the familiar pattern: identi-fy.",
        pitfalls: ["Swapped letters (indentify).", "Wrong ending (-ie)."],
      },
    ),
  );

  return out;
}

function genReady4Study(seed: string): RtQuestion[] {
  // study program specific + mindset / dual realities
  const out: RtQuestion[] = [];
  const items = [
    {
      key: "expect",
      diff: 1 as RtDifficulty,
      q: "Was ist eine realistische Erwartung an ein Vollzeit-FH-Studium (30 ECTS/Semester)?",
      opts: [
        "Ca. 10–15 Stunden/Woche",
        "Ca. 40 Stunden/Woche (ähnlich Vollzeitjob)",
        "Unter 5 Stunden/Woche",
        "Nur während Prüfungswochen",
      ],
      c: 1,
      exp: [
        "30 ECTS pro Semester entsprechen grob ~750 Stunden Arbeit (inkl. Lehrveranstaltungen + Selbststudium).",
        "Das ist im Schnitt ~40 Std/Woche.",
      ],
      tip: "Plan lieber konservativ (Zeitpuffer), besonders im Dual-Studium.",
    },
    {
      key: "dual",
      diff: 2 as RtDifficulty,
      q: "Welche Strategie passt am besten fürs Dual-Studium (Praxis + Theorie)?",
      opts: [
        "Alles am Wochenende nachholen",
        "Fixe Lernslots + wöchentlicher Review + klare Prioritäten",
        "Nur auf leichte Fächer fokussieren",
        "Lernen erst 2 Tage vor Prüfungen",
      ],
      c: 1,
      exp: ["Dual braucht Rhythmus: feste Slots + Review, damit nichts „wegdriftet“."],
      tip: "1 Review-Block pro Woche verhindert, dass du Schulden ansammelst.",
    },
    {
      key: "failure",
      diff: 2 as RtDifficulty,
      q: "Du fällst bei einer Prüfung durch. Was ist die lernförderlichste Reaktion?",
      opts: [
        "Schuld nur beim System suchen",
        "Analyse: Fehlerarten + Lernplan anpassen + gezielt nachtrainieren",
        "Alles komplett anders machen ohne Analyse",
        "Aufgeben: Talent oder nichts",
      ],
      c: 1,
      exp: ["Analyse + Anpassung ist die schnellste, kontrollierbare Verbesserung."],
      tip: "Frage: War es Zeitdruck, Verständnis, Routine oder Lesen/Details?",
    },
  ];

  for (const it of items) {
    out.push(
      mk(seed, "ready4study", it.key, it.diff, it.q, it.opts, it.c, {
        steps: it.exp,
        tip: it.tip,
        pitfalls: ["Antworten, die kurzfristig angenehm sind (Ausweichen), sind langfristig teuer."],
      }),
    );
  }
  return out;
}

function genLogic(seed: string, rng: Rng): RtQuestion[] {
  const out: RtQuestion[] = [];
  const items = [
    {
      key: "inv_0",
      diff: 1 as RtDifficulty,
      q: "Alle Softwareentwickler können programmieren. Niko kann programmieren. Was folgt logisch?",
      opts: [
        "Niko ist Softwareentwickler.",
        "Niko könnte Softwareentwickler sein, aber es ist nicht zwingend.",
        "Niko ist kein Softwareentwickler.",
        "Alle Programmierer sind Softwareentwickler.",
      ],
      c: 1,
      exp: ["Aus „Alle A sind B“ folgt nicht „Alle B sind A“ (Umkehrschluss)."],
      tip: "Frage: Ist die Aussage wirklich zwingend oder nur möglich?",
    },
    {
      key: "mt_0",
      diff: 2 as RtDifficulty,
      q: "Wenn ein Bewerber alle Teile besteht, wird er zugelassen. Anna wird nicht zugelassen. Was folgt zwingend?",
      opts: [
        "Anna hat alles bestanden.",
        "Anna hat mindestens einen Teil nicht bestanden.",
        "Anna ist nicht geeignet.",
        "Anna hat sich nicht beworben.",
      ],
      c: 1,
      exp: ["Modus Tollens: P→Q und ¬Q ⇒ ¬P. Nicht zugelassen ⇒ nicht alles bestanden."],
      tip: "Zwingend heißt: Es gibt keine alternative Erklärung im Modell.",
    },
    {
      key: "fallacy_0",
      diff: 3 as RtDifficulty,
      q: "Wenn das System überlastet ist, dann steigen die Timeouts. Die Timeouts steigen. Was folgt korrekt?",
      opts: [
        "Das System ist überlastet.",
        "Das System ist nicht überlastet.",
        "Das System könnte überlastet sein; andere Ursachen sind möglich.",
        "Timeouts können nur durch Überlastung entstehen.",
      ],
      c: 2,
      exp: ["Fehlbejahung des Nachsatzes: Q bedeutet nicht zwingend P."],
      tip: "Suche nach Alternativursachen (Netzwerk, DNS, Bugs, Downstream).",
    },
  ];
  for (const it of items) {
    out.push(
      mk(seed, "schlussfolgerungen", it.key, it.diff, it.q, it.opts, it.c, {
        steps: it.exp,
        tip: it.tip,
        pitfalls: ["Verlockend ist meist der Umkehrschluss (B⇒A).", "„Zwingend“ überlesen."],
      }),
    );
  }

  // number sequences (fresh variants)
  const seqs = [
    { key: "seq_0", diff: 1 as RtDifficulty, seq: [3, 6, 12, 24, null, 96], opts: [36, 40, 48, 60], c: 2, exp: ["Verdoppeln: ×2 ⇒ fehlend 48."] },
    { key: "seq_1", diff: 2 as RtDifficulty, seq: [2, 5, 11, 23, null, 95], opts: [35, 47, 49, 51], c: 1, exp: ["Regel: ×2 +1 ⇒ 23→47."] },
    { key: "seq_2", diff: 2 as RtDifficulty, seq: [1, 4, 9, 16, 25, null], opts: [30, 32, 34, 36], c: 3, exp: ["Quadratzahlen: 6²=36."] },
    { key: "seq_3", diff: 3 as RtDifficulty, seq: [8, 5, 11, 8, 14, 11, null], opts: [14, 17, 18, 20], c: 1, exp: ["Wechsel: −3, +6, −3, +6 … ⇒ 11+6=17."] },
  ];
  for (const s of seqs) {
    const prompt = `Welche Zahl fehlt? <span class="font-mono">${s.seq.map((x) => (x === null ? "__" : x)).join(", ")}</span>`;
    out.push(
      mk(seed, "schlussfolgerungen", s.key, s.diff, prompt, s.opts.map(String), s.c, {
        steps: s.exp,
        tip: "Wenn’s nicht sofort klappt: Differenzen (Abstände) aufschreiben.",
        pitfalls: ["Zu früh auf eine Regel festlegen.", "Ein einzelner Übergang ist kein Beweis."],
      }),
    );
  }

  // tiny randomised extras
  for (let i = 0; i < 10; i++) {
    const a = 1 + Math.floor(rng() * 5);
    const b = 1 + Math.floor(rng() * 5);
    const c = 1 + Math.floor(rng() * 5);
    const correct = a + b * c;
    out.push(
      mk(
        seed,
        "schlussfolgerungen",
        `prio_${i}`,
        1,
        `Operator‑Priorität: <span class="font-mono">${a} + ${b}·${c}</span> = ?`,
        [`${correct}`, `${(a + b) * c}`, `${a * b + c}`, `${a + b + c}`],
        0,
        {
          steps: ["Punkt vor Strich: zuerst Multiplikation.", `${b}·${c}=${b * c}, dann +${a} ⇒ ${correct}.`],
          tip: "Wenn Klammern fehlen: * und / zuerst.",
          pitfalls: ["Links‑nach‑rechts gerechnet (falsch)."],
        },
      ),
    );
  }

  return out;
}

function genCS(seed: string, rng: Rng): RtQuestion[] {
  const out: RtQuestion[] = [];

  for (let i = 0; i < 14; i++) {
    const n = 16 + Math.floor(rng() * 240);
    const hex = n.toString(16).toUpperCase();
    const opts = shuffle(rng, [
      hex,
      (n + 1).toString(16).toUpperCase(),
      (n - 1).toString(16).toUpperCase(),
      (n + 16).toString(16).toUpperCase(),
    ]);
    out.push(
      mk(
        seed,
        "informatik",
        `hex_${i}`,
        1,
        `Welche Hex‑Darstellung passt zu <span class="font-mono">${n}<sub>10</sub></span>?`,
        opts,
        opts.indexOf(hex),
        {
          steps: ["Hex ist Basis 16: 0–9, A=10 … F=15.", "Umrechnung über Division durch 16 oder Stellenwert."],
          tip: "Grobe Kontrolle: Wert ≈ (erste Stelle)·16 + (zweite Stelle).",
          pitfalls: ["Dezimal und Hex Ziffern verwechselt (A=10)."],
        },
      ),
    );
  }

  for (let i = 0; i < 12; i++) {
    const n = 8 + Math.floor(rng() * 120);
    const bin = n.toString(2);
    out.push(
      mk(
        seed,
        "informatik",
        `bin_${i}`,
        1,
        `Was ist <span class="font-mono">${bin}<sub>2</sub></span> in Dezimal?`,
        [`${n}`, `${n + 1}`, `${n - 1}`, `${n + 2}`],
        0,
        {
          steps: ["Binärstellen sind Potenzen von 2 (…8,4,2,1).", "Addiere die Werte der 1‑Bits."],
          tip: "Von rechts beginnen: 2⁰,2¹,2² …",
          pitfalls: ["Stellenwertreihenfolge vertauscht."],
        },
      ),
    );
  }

  out.push(
    mk(
      seed,
      "informatik",
      "osi_ip",
      2,
      "Auf welcher OSI‑Schicht arbeitet IP hauptsächlich?",
      ["Schicht 2", "Schicht 3", "Schicht 4", "Schicht 7"],
      1,
      {
        steps: ["IP routet zwischen Netzwerken ⇒ Network Layer (3)."],
        tip: "TCP/UDP sind Transport (4), IP ist darunter (3).",
        pitfalls: ["IP mit TCP verwechselt."],
      },
    ),
  );

  out.push(
    mk(
      seed,
      "informatik",
      "sql_where",
      2,
      "Welche SQL‑Abfrage liefert Namen aller Kunden aus Wien mit Alter ≥ 30?",
      [
        "SELECT * FROM Kunden WHERE Stadt='Wien' OR Alter>=30;",
        "SELECT Name FROM Kunden WHERE Stadt='Wien' AND Alter>=30;",
        "SELECT Name, Alter FROM Kunden WHERE Stadt='Wien' AND Alter>30;",
        "SELECT Name FROM Kunden WHERE Stadt='Wien' AND Alter=30;",
      ],
      1,
      {
        steps: ["Nur Name ⇒ SELECT Name.", "Beide Bedingungen ⇒ AND.", "≥ 30 ⇒ Alter>=30."],
        tip: "OR liefert fast immer zu viele Zeilen.",
        pitfalls: ["AND/OR verwechselt.", "≥ vs > übersehen."],
      },
    ),
  );

  out.push(
    mk(
      seed,
      "informatik",
      "big_o",
      2,
      "Was bedeutet O(n²) anschaulich?",
      [
        "Konstant, egal wie groß n ist.",
        "Wenn n doppelt so groß wird, wird es ungefähr viermal so langsam.",
        "Wenn n doppelt so groß wird, wird es ungefähr doppelt so langsam.",
        "Immer kleiner als O(n).",
      ],
      1,
      {
        steps: ["Quadratisch: Schritte ~ n².", "(2n)² = 4n² ⇒ ca. 4×."],
        tip: "Es geht um Wachstum, nicht um exakte Millisekunden.",
        pitfalls: ["Quadratisch mit linear verwechselt."],
      },
    ),
  );

  return out;
}

function genScience(seed: string, rng: Rng): RtQuestion[] {
  const out: RtQuestion[] = [];

  out.push(
    mk(
      seed,
      "naturwissenschaften",
      "atom",
      1,
      "Welche Teilchen befinden sich im Atomkern?",
      ["Elektronen und Protonen", "Protonen und Neutronen", "Elektronen und Neutronen", "Nur Elektronen"],
      1,
      {
        steps: ["Kern: Protonen (+) und Neutronen (neutral).", "Elektronen sind in der Hülle."],
        tip: "Kern = schwer (p+n), Hülle = leicht (e−).",
        pitfalls: ["Elektronen in den Kern „verschoben“."],
      },
    ),
  );

  for (let i = 0; i < 12; i++) {
    const m = 1 + Math.floor(rng() * 9);
    const a = 2 + Math.floor(rng() * 9);
    const F = m * a;
    out.push(
      mk(
        seed,
        "naturwissenschaften",
        `fma_${i}`,
        2,
        `Kraft: <span class="font-mono">F = m·a</span>, m=${m} kg, a=${a} m/s². Wie groß ist F?`,
        [`${F} N`, `${F / m} N`, `${F * a} N`, `${m + a} N`],
        0,
        {
          steps: ["Einsetzen: F=m·a", `F=${m}·${a}=${F}`, "Einheit: N=kg·m/s²"],
          tip: "Erst Zahl, dann Einheit.",
          pitfalls: ["a und m addiert statt multipliziert."],
        },
      ),
    );
  }

  out.push(
    mk(
      seed,
      "naturwissenschaften",
      "boyle",
      2,
      "Boyle‑Mariotte (T konstant): Volumen halbiert ⇒ Druck …",
      ["bleibt gleich", "halbiert sich", "verdoppelt sich", "vervierfacht sich"],
      2,
      {
        steps: ["p·V = konstant.", "Halbes V ⇒ doppeltes p."],
        tip: "p und V sind umgekehrt proportional.",
        pitfalls: ["„halbiert“ automatisch auf p übertragen (falsch)."],
      },
    ),
  );

  out.push(
    mk(
      seed,
      "naturwissenschaften",
      "isotope",
      2,
      "Was ist ein Isotop?",
      [
        "Atome verschiedener Elemente mit gleicher Massenzahl",
        "Atome desselben Elements mit unterschiedlicher Neutronenzahl",
        "Atome mit gleicher Elektronenanzahl",
        "Atome, die immer radioaktiv sind",
      ],
      1,
      {
        steps: ["Gleiches Element ⇒ gleiche Protonenzahl.", "Isotope unterscheiden sich in Neutronen/Masse."],
        tip: "Protonen bestimmen das Element.",
        pitfalls: ["Elektronenanzahl als Kriterium genommen."],
      },
    ),
  );

  for (let i = 0; i < 10; i++) {
    const Uv = 6 + Math.floor(rng() * 19);
    const R = 2 + Math.floor(rng() * 9);
    if (Uv % R !== 0) continue;
    const I = Uv / R;
    out.push(
      mk(
        seed,
        "naturwissenschaften",
        `ohm_${i}`,
        2,
        `Ohmsches Gesetz: <span class="font-mono">I = U/R</span>, U=${Uv} V, R=${R} Ω. Wie groß ist I?`,
        [`${I} A`, `${Uv * R} A`, `${R / Uv} A`, `${I + 1} A`],
        0,
        {
          steps: ["I = U/R", `I = ${Uv}/${R} = ${I} A`],
          tip: "U durch R – nicht umgekehrt.",
          pitfalls: ["U und R vertauscht."],
        },
      ),
    );
  }

  return out;
}

/* =========================
   Public API
========================= */
export function buildQuestionBank(seed: string): RtQuestion[] {
  const rng = rngFrom(`${seed}|bank`);
  const all: RtQuestion[] = [];
  all.push(...genAlgebra(seed, rng));
  all.push(...genFunctions(seed, rng));
  all.push(...genFigures(seed, rng));
  all.push(...genLogic(seed, rng));
  all.push(...genCS(seed, rng));
  all.push(...genScience(seed, rng));
  all.push(...genText(seed));
  all.push(...genEnglish(seed));
  all.push(...genReady4Study(seed));
  return all;
}

