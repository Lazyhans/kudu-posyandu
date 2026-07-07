import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { AppShell } from "@/components/AppShell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { ArrowLeft, KeyRound, UserCog, Loader2 } from "lucide-react";
import {
  getMyProfile,
  updateMyUsername,
  updateMyPassword,
} from "@/lib/profile.functions";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/profil")({
  component: ProfilPage,
});

function ProfilPage() {
  const getProfile = useServerFn(getMyProfile);
  const changeUsername = useServerFn(updateMyUsername);
  const changePassword = useServerFn(updateMyPassword);

  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<{
    nama_lengkap: string;
    username: string;
    posko_rw: string;
  } | null>(null);

  const [username, setUsername] = useState("");
  const [pwdForUsername, setPwdForUsername] = useState("");
  const [savingUsername, setSavingUsername] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const p = await getProfile();
        if (p) {
          setProfile(p);
          setUsername(p.username);
        }
      } catch (e) {
        toast.error((e as Error).message || "Gagal memuat profil");
      } finally {
        setLoading(false);
      }
    })();
  }, [getProfile]);

  async function handleUsernameSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!profile) return;
    if (username.trim().toLowerCase() === profile.username) {
      toast.info("Username tidak berubah");
      return;
    }
    setSavingUsername(true);
    try {
      const res = await changeUsername({
        data: { username: username.trim(), currentPassword: pwdForUsername },
      });
      toast.success("Username berhasil diubah. Silakan masuk ulang.");
      setProfile({ ...profile, username: res.username });
      setPwdForUsername("");
      await supabase.auth.signOut();
    } catch (e) {
      toast.error((e as Error).message || "Gagal mengubah username");
    } finally {
      setSavingUsername(false);
    }
  }

  async function handlePasswordSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error("Konfirmasi password tidak cocok");
      return;
    }
    setSavingPassword(true);
    try {
      await changePassword({ data: { currentPassword, newPassword } });
      toast.success("Password berhasil diubah. Silakan masuk ulang.");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      await supabase.auth.signOut();
    } catch (e) {
      toast.error((e as Error).message || "Gagal mengubah password");
    } finally {
      setSavingPassword(false);
    }
  }

  return (
    <AppShell title="Pengaturan Profil" requireRole="any">
      <div className="space-y-4">
        <Button asChild variant="ghost" size="sm" className="-ml-2">
          <Link to="/kader">
            <ArrowLeft className="mr-1 h-4 w-4" /> Kembali
          </Link>
        </Button>

        {loading ? (
          <div className="flex items-center justify-center py-12 text-sm text-muted-foreground">
            <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Memuat profil...
          </div>
        ) : (
          <>
            {profile && (
              <Card className="rounded-2xl">
                <CardContent className="p-4">
                  <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Akun Kader
                  </div>
                  <div className="mt-1 text-lg font-semibold">{profile.nama_lengkap}</div>
                  <div className="mt-0.5 text-sm text-muted-foreground">
                    @{profile.username} · Posko {profile.posko_rw}
                  </div>
                </CardContent>
              </Card>
            )}

            <Card className="rounded-2xl">
              <CardContent className="p-4">
                <div className="mb-3 flex items-center gap-2 text-sm font-semibold">
                  <UserCog className="h-4 w-4 text-primary" /> Ubah Username
                </div>
                <form onSubmit={handleUsernameSubmit} className="space-y-3">
                  <div>
                    <Label htmlFor="uname">Username baru</Label>
                    <Input
                      id="uname"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="username"
                      autoComplete="username"
                      required
                    />
                    <p className="mt-1 text-[11px] text-muted-foreground">
                      3-32 karakter, huruf/angka/titik/underscore.
                    </p>
                  </div>
                  <div>
                    <Label htmlFor="pwd-uname">Password saat ini</Label>
                    <Input
                      id="pwd-uname"
                      type="password"
                      value={pwdForUsername}
                      onChange={(e) => setPwdForUsername(e.target.value)}
                      autoComplete="current-password"
                      required
                    />
                  </div>
                  <Button type="submit" disabled={savingUsername} className="w-full">
                    {savingUsername && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Simpan Username
                  </Button>
                </form>
              </CardContent>
            </Card>

            <Card className="rounded-2xl">
              <CardContent className="p-4">
                <div className="mb-3 flex items-center gap-2 text-sm font-semibold">
                  <KeyRound className="h-4 w-4 text-primary" /> Ubah Password
                </div>
                <form onSubmit={handlePasswordSubmit} className="space-y-3">
                  <div>
                    <Label htmlFor="cur-pwd">Password saat ini</Label>
                    <Input
                      id="cur-pwd"
                      type="password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      autoComplete="current-password"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="new-pwd">Password baru</Label>
                    <Input
                      id="new-pwd"
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      autoComplete="new-password"
                      required
                      minLength={8}
                    />
                    <p className="mt-1 text-[11px] text-muted-foreground">
                      Minimal 8 karakter.
                    </p>
                  </div>
                  <div>
                    <Label htmlFor="conf-pwd">Konfirmasi password baru</Label>
                    <Input
                      id="conf-pwd"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      autoComplete="new-password"
                      required
                      minLength={8}
                    />
                  </div>
                  <Button type="submit" disabled={savingPassword} className="w-full">
                    {savingPassword && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Simpan Password
                  </Button>
                </form>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </AppShell>
  );
}
