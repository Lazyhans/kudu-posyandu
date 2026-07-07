import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const getMyProfile = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin
      .from("kader" as never)
      .select("id, nama_lengkap, username, posko_rw, no_hp")
      .eq("user_id", context.userId)
      .maybeSingle();
    if (error) throw error;
    return (data ?? null) as null | {
      id: string;
      nama_lengkap: string;
      username: string;
      posko_rw: string;
      no_hp: string | null;
    };
  });

export const updateMyUsername = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { username: string; currentPassword: string }) => d)
  .handler(async ({ data, context }) => {
    const uname = data.username.trim().toLowerCase();
    if (!/^[a-z0-9_.]{3,32}$/i.test(uname))
      throw new Error("Username 3-32 karakter (huruf/angka/._)");
    if (!data.currentPassword) throw new Error("Password saat ini wajib diisi");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // Verifikasi password saat ini
    const { data: userRes, error: uErr } = await supabaseAdmin.auth.admin.getUserById(
      context.userId,
    );
    if (uErr || !userRes.user?.email) throw new Error("Akun tidak ditemukan");
    const currentEmail = userRes.user.email;

    const { createClient } = await import("@supabase/supabase-js");
    const verifier = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_PUBLISHABLE_KEY!,
      { auth: { storage: undefined, persistSession: false, autoRefreshToken: false } },
    );
    const { error: signErr } = await verifier.auth.signInWithPassword({
      email: currentEmail,
      password: data.currentPassword,
    });
    if (signErr) throw new Error("Password saat ini salah");

    // Cek username unik
    const { data: exists } = await supabaseAdmin
      .from("kader" as never)
      .select("id")
      .eq("username", uname)
      .neq("user_id", context.userId)
      .maybeSingle();
    if (exists) throw new Error("Username sudah dipakai");

    const newEmail = `${uname}@posyandu.local`;
    const { error: eErr } = await supabaseAdmin.auth.admin.updateUserById(context.userId, {
      email: newEmail,
      email_confirm: true,
      user_metadata: { ...(userRes.user.user_metadata ?? {}), username: uname },
    });
    if (eErr) throw eErr;

    const { error: kErr } = await supabaseAdmin
      .from("kader" as never)
      .update({ username: uname } as never)
      .eq("user_id", context.userId);
    if (kErr) throw kErr;

    return { ok: true, username: uname };
  });

export const updateMyPassword = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { currentPassword: string; newPassword: string }) => d)
  .handler(async ({ data, context }) => {
    if (!data.currentPassword) throw new Error("Password saat ini wajib diisi");
    if (data.newPassword.length < 8) throw new Error("Password baru minimal 8 karakter");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: userRes, error: uErr } = await supabaseAdmin.auth.admin.getUserById(
      context.userId,
    );
    if (uErr || !userRes.user?.email) throw new Error("Akun tidak ditemukan");

    const { createClient } = await import("@supabase/supabase-js");
    const verifier = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_PUBLISHABLE_KEY!,
      { auth: { storage: undefined, persistSession: false, autoRefreshToken: false } },
    );
    const { error: signErr } = await verifier.auth.signInWithPassword({
      email: userRes.user.email,
      password: data.currentPassword,
    });
    if (signErr) throw new Error("Password saat ini salah");

    const { error: pErr } = await supabaseAdmin.auth.admin.updateUserById(context.userId, {
      password: data.newPassword,
    });
    if (pErr) throw pErr;

    return { ok: true };
  });
