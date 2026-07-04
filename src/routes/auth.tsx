import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { ShieldCheck, LogIn, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { ensureAdminSeed } from "@/lib/admin.functions";
import { toast } from "sonner";

export const Route = createFileRoute("/auth")({
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const seed = useServerFn(ensureAdminSeed);
  const [username, setUsername] = useState("kuduadmin");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Pastikan admin default sudah tersedia
    seed({}).catch(() => {});
    // Redirect jika sudah login
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/" });
    });
  }, [seed, navigate]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const email = username.includes("@") ? username : `${username}@posyandu.local`;
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      toast.success("Berhasil masuk");
      navigate({ to: "/" });
    } catch (err) {
      toast.error((err as Error).message || "Gagal masuk");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-background flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-6 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-md">
            <ShieldCheck className="h-7 w-7" />
          </div>
          <h1 className="mt-4 text-xl font-semibold">Login Admin Posyandu</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Kelurahan Kudu
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="rounded-2xl border bg-card p-5 shadow-sm space-y-4"
        >
          <div>
            <label className="text-sm font-medium">Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
              required
              className="mt-1 w-full rounded-lg border bg-background px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="username"
            />
          </div>
          <div>
            <label className="text-sm font-medium">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
              className="mt-1 w-full rounded-lg border bg-background px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="••••••••"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary py-3 text-base font-semibold text-primary-foreground shadow-sm transition-opacity disabled:opacity-60"
          >
            {loading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <LogIn className="h-5 w-5" />
            )}
            Masuk
          </button>
          <p className="text-center text-xs text-muted-foreground">
            Khusus kader & admin Posyandu Kelurahan Kudu
          </p>
        </form>
      </div>
    </div>
  );
}
