import { NavLink, Outlet } from "react-router-dom";
import { AppTopbar } from "./AppTopbar";

const nav = [
  { to: "/", label: "Dashboard" },
  { to: "/reihungstest", label: "Reihungstest" },
  { to: "/study-prep", label: "Semester 1–2" },
  { to: "/habits", label: "Disziplin" },
  { to: "/journal", label: "Journal" },
  { to: "/settings", label: "Settings" },
];

export function AppShell() {
  return (
    <div className="min-h-dvh">
      <AppTopbar />

      <div className="mx-auto flex w-full max-w-6xl gap-4 px-4 pb-12 pt-4">
        <aside className="sticky top-16 hidden h-[calc(100dvh-88px)] w-60 shrink-0 rounded-2xl border border-white/10 bg-white/5 p-3 backdrop-blur lg:block">
          <div className="px-2 pb-2 text-xs font-semibold tracking-wide text-white/60">
            Technikum Ready
          </div>
          <nav className="flex flex-col gap-1">
            {nav.map((n) => (
              <NavLink
                key={n.to}
                to={n.to}
                className={({ isActive }) =>
                  [
                    "rounded-xl px-3 py-2 text-sm transition",
                    isActive
                      ? "border border-white/10 bg-white/10 text-white"
                      : "text-white/75 hover:bg-white/10 hover:text-white",
                  ].join(" ")
                }
                end={n.to === "/"}
              >
                {n.label}
              </NavLink>
            ))}
          </nav>
          <div className="mt-4 rounded-xl border border-white/10 bg-black/20 p-3 text-xs text-white/65">
            <div className="font-semibold text-white/80">Shortcut‑Hint</div>
            <div className="mt-1">
              Im Quiz: <span className="font-mono">1–4</span>,{" "}
              <span className="font-mono">←/→</span>,{" "}
              <span className="font-mono">Space</span>
            </div>
          </div>
        </aside>

        <main className="w-full">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

