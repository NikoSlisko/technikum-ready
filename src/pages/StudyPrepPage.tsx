export function StudyPrepPage() {
  return (
    <div className="space-y-4">
      <Section
        title="Semester 1–2 Prep (v1)"
        desc="Hier bauen wir Schritt für Schritt Checklisten + Lernstrategien aus. In v1 ist das bewusst schlank: du bekommst einen klaren, realistischen Startplan."
      />

      <Card title="Checkliste: Vor Semesterstart">
        <ul className="list-disc space-y-1 pl-5 text-sm text-white/70">
          <li>
            Mathe: Brüche, Potenzen, Logarithmen, Gleichungen (Routine statt
            Verständnis‑Schein)
          </li>
          <li>Funktionen: Steigung, Nullstellen, Scheitelpunkt, Einsetzen</li>
          <li>
            CS‑Basics: Binär/Hex, Big‑O Intuition, SQL SELECT/WHERE/JOIN
          </li>
          <li>Git: commit/push/pull, Branches, Merge‑Konflikt Basics</li>
          <li>Linux: cd/ls/cat, Rechte, pipes, grep, ssh</li>
          <li>
            Dual‑Rhythmus: fixe Lernslots + Review‑Slot (z.B. So Abend 45 min)
          </li>
        </ul>
      </Card>

      <Card title="Lernstrategie (prüfungsnah)">
        <ol className="list-decimal space-y-1 pl-5 text-sm text-white/70">
          <li>Kurze Sessions (10–25 min) statt Marathon.</li>
          <li>Fehler kategorisieren (Vorzeichen, Lesen, Regel, Zeitdruck).</li>
          <li>Schwächenmodus bis 60–70% stabil, dann Adaptive.</li>
          <li>Mock‑Test 1×/Woche + Review.</li>
        </ol>
        <p className="mt-3 text-sm text-white/60">
          Nächstes Upgrade: Lernplan‑Generator + „Skill‑Tree“ für Semester‑Topics.
        </p>
      </Card>
    </div>
  );
}

function Section(props: { title: string; desc: string }) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
      <div className="text-xs font-semibold tracking-wide text-white/60">
        Studium · Dual · Realität
      </div>
      <h2 className="mt-2 text-2xl font-black tracking-tight text-white">
        {props.title}
      </h2>
      <p className="mt-2 max-w-3xl text-sm leading-relaxed text-white/65">
        {props.desc}
      </p>
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

