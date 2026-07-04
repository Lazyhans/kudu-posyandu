import { Link, useRouterState } from "@tanstack/react-router";
import { Home, Users, ClipboardList, Activity } from "lucide-react";
import type { ReactNode } from "react";

const navItems = [
  { to: "/", label: "Beranda", icon: Home },
  { to: "/balita", label: "Balita", icon: Users },
  { to: "/pencatatan", label: "Catat", icon: ClipboardList },
  { to: "/riwayat", label: "Riwayat", icon: Activity },
];

export function AppShell({ children, title }: { children: ReactNode; title?: string }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <div className="min-h-screen bg-background pb-24">
      <header className="sticky top-0 z-40 border-b bg-primary text-primary-foreground shadow-sm">
        <div className="mx-auto max-w-2xl px-4 py-3">
          <div className="text-[10px] uppercase tracking-wider opacity-80">
            KKN PPM XXVIII Universitas Semarang · Kelurahan Kudu
          </div>
          <h1 className="mt-0.5 text-base font-semibold leading-tight">
            {title ?? "Posyandu RW 06"}
          </h1>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 py-4">{children}</main>

      <nav className="fixed inset-x-0 bottom-0 z-40 border-t bg-card">
        <div className="mx-auto grid max-w-2xl grid-cols-4">
          {navItems.map((item) => {
            const active =
              item.to === "/" ? pathname === "/" : pathname.startsWith(item.to);
            const Icon = item.icon;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`flex flex-col items-center gap-1 py-3 text-xs font-medium transition-colors ${
                  active ? "text-primary" : "text-muted-foreground"
                }`}
              >
                <Icon className={`h-5 w-5 ${active ? "stroke-[2.5]" : ""}`} />
                {item.label}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
