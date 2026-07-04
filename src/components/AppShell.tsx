import { Link, useRouterState, useNavigate } from "@tanstack/react-router";
import {
  Home,
  Users,
  ClipboardList,
  Activity,
  LogOut,
  ShieldCheck,
  Loader2,
  UserCog,
} from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import { currentRoleQuery, type UserRole } from "@/lib/queries";

type AuthState = "checking" | "authed" | "guest";

export function AppShell({
  children,
  title,
  requireRole,
}: {
  children: ReactNode;
  title?: string;
  requireRole?: "admin" | "kader" | "any";
}) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isNavigating = useRouterState({ select: (s) => s.isLoading || s.isTransitioning });
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<AuthState>("checking");
  const [signingOut, setSigningOut] = useState(false);

  useEffect(() => {
    let mounted = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      if (data.session) setStatus("authed");
      else {
        setStatus("guest");
        navigate({ to: "/auth", replace: true });
      }
    });
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT") {
        setStatus("guest");
        navigate({ to: "/auth", replace: true });
        return;
      }
      if (session) setStatus("authed");
    });
    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, [navigate]);

  const { data: role, isLoading: roleLoading } = useQuery({
    ...currentRoleQuery(),
    enabled: status === "authed",
  });

  useEffect(() => {
    if (status !== "authed" || roleLoading) return;
    const need = requireRole ?? "any";
    if (!role) {
      toast.error("Akun belum memiliki peran. Hubungi admin.");
      navigate({ to: "/auth", replace: true });
      return;
    }
    if (need === "admin" && role !== "admin") {
      navigate({ to: "/kader", replace: true });
    } else if (need === "kader" && role !== "kader" && role !== "admin") {
      navigate({ to: "/admin", replace: true });
    }
  }, [status, role, roleLoading, requireRole, navigate]);

  async function handleLogout() {
    setSigningOut(true);
    try {
      await queryClient.cancelQueries();
      queryClient.clear();
      await supabase.auth.signOut();
      toast.success("Berhasil keluar");
      navigate({ to: "/auth", replace: true });
    } finally {
      setSigningOut(false);
    }
  }

  if (status !== "authed" || roleLoading || !role) {
    return <FullScreenLoader label="Memverifikasi sesi..." />;
  }

  const isAdmin = role === "admin";
  const home = isAdmin ? "/admin" : "/kader";
  const navItems: Array<{ to: string; label: string; icon: typeof Home }> = [
    { to: home, label: "Dashboard", icon: Home },
    { to: "/balita", label: "Balita", icon: Users },
    { to: "/pencatatan", label: "Catat", icon: ClipboardList },
    { to: "/riwayat", label: "Riwayat", icon: Activity },
  ];

  return (
    <div className="min-h-screen bg-background pb-24">
      {isNavigating && (
        <div className="fixed left-0 right-0 top-0 z-50 h-0.5 overflow-hidden bg-primary/20">
          <div className="h-full w-1/3 animate-[loader_1.1s_ease-in-out_infinite] bg-primary" />
        </div>
      )}
      <header className="sticky top-0 z-40 border-b bg-primary text-primary-foreground shadow-sm">
        <div className="mx-auto flex max-w-2xl items-center justify-between gap-3 px-4 py-3">
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider opacity-80">
              {isAdmin ? (
                <ShieldCheck className="h-3 w-3" />
              ) : (
                <UserCog className="h-3 w-3" />
              )}{" "}
              {isAdmin ? "Admin" : "Kader"} · Kelurahan Kudu
            </div>
            <h1 className="mt-0.5 truncate text-base font-semibold leading-tight">
              {title ?? "Posyandu Kelurahan Kudu"}
            </h1>
          </div>
          <button
            onClick={handleLogout}
            disabled={signingOut}
            aria-label="Keluar"
            className="flex shrink-0 items-center gap-1.5 rounded-full bg-primary-foreground/15 px-3 py-2 text-xs font-semibold hover:bg-primary-foreground/25 transition-colors disabled:opacity-60"
          >
            {signingOut ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <LogOut className="h-4 w-4" />
            )}
            <span className="hidden sm:inline">
              {signingOut ? "Keluar..." : "Logout"}
            </span>
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 py-4">{children}</main>

      <nav className="fixed inset-x-0 bottom-0 z-40 border-t bg-card">
        <div className="mx-auto grid max-w-2xl grid-cols-4">
          {navItems.map((item) => {
            const active =
              item.to === home ? pathname === home : pathname.startsWith(item.to);
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

function FullScreenLoader({ label }: { label: string }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-background px-6 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
        <Loader2 className="h-7 w-7 animate-spin" />
      </div>
      <div className="text-sm font-medium text-foreground">{label}</div>
      <div className="text-xs text-muted-foreground">Mohon tunggu sebentar</div>
    </div>
  );
}
