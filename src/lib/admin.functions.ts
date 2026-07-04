import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const ADMIN_EMAIL = "kuduadmin@posyandu.local";
const ADMIN_PASSWORD = "kelurahankudu2026";
const ADMIN_USERNAME = "kuduadmin";

// Idempotent: creates the fixed admin user + admin role if missing.
export const ensureAdminSeed = createServerFn({ method: "POST" }).handler(async () => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

  const { data: list, error: listErr } = await supabaseAdmin.auth.admin.listUsers({
    page: 1,
    perPage: 200,
  });
  if (listErr) throw listErr;

  let adminUser = list.users.find((u) => u.email === ADMIN_EMAIL);
  if (!adminUser) {
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
      email_confirm: true,
      user_metadata: { username: ADMIN_USERNAME, role: "admin" },
    });
    if (error) throw error;
    adminUser = data.user!;
  }

  // Pastikan role admin
  await supabaseAdmin
    .from("user_roles" as never)
    .upsert({ user_id: adminUser.id, role: "admin" } as never, {
      onConflict: "user_id,role",
    } as never);

  return { ok: true };
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function assertAdmin(context: any) {
  const { data, error } = await context.supabase.rpc("has_role", {
    _user_id: context.userId,
    _role: "admin",
  });
  if (error || !data) throw new Error("Akses ditolak: khusus admin");
}

export const listKader = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin
      .from("kader" as never)
      .select("*")
      .order("nama_lengkap", { ascending: true });
    if (error) throw error;
    return (data ?? []) as unknown as Array<{
      id: string;
      user_id: string;
      nama_lengkap: string;
      username: string;
      posko_rw: string;
      no_hp: string | null;
      created_at: string;
      updated_at: string;
    }>;
  });

export const createKader = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: {
    nama_lengkap: string;
    username: string;
    password: string;
    posko_rw: string;
    no_hp?: string;
  }) => d)
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    if (!/^[a-z0-9_.]{3,32}$/i.test(data.username))
      throw new Error("Username 3-32 karakter (huruf/angka/._)");
    if (data.password.length < 8) throw new Error("Password minimal 8 karakter");
    if (!data.nama_lengkap.trim() || !data.posko_rw.trim())
      throw new Error("Nama & Posko RW wajib diisi");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const email = `${data.username.toLowerCase()}@posyandu.local`;

    const { data: created, error: cErr } = await supabaseAdmin.auth.admin.createUser({
      email,
      password: data.password,
      email_confirm: true,
      user_metadata: { username: data.username, role: "kader" },
    });
    if (cErr) throw cErr;
    const userId = created.user!.id;

    const { error: rErr } = await supabaseAdmin
      .from("user_roles" as never)
      .insert({ user_id: userId, role: "kader" } as never);
    if (rErr) {
      await supabaseAdmin.auth.admin.deleteUser(userId);
      throw rErr;
    }

    const { error: kErr } = await supabaseAdmin.from("kader" as never).insert({
      user_id: userId,
      nama_lengkap: data.nama_lengkap.trim(),
      username: data.username.toLowerCase(),
      posko_rw: data.posko_rw.trim(),
      no_hp: data.no_hp?.trim() || null,
    } as never);
    if (kErr) {
      await supabaseAdmin.auth.admin.deleteUser(userId);
      throw kErr;
    }
    return { ok: true, user_id: userId };
  });

export const updateKader = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: {
    id: string;
    nama_lengkap: string;
    posko_rw: string;
    no_hp?: string;
    password?: string;
  }) => d)
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: row, error: gErr } = await supabaseAdmin
      .from("kader" as never)
      .select("user_id")
      .eq("id", data.id)
      .maybeSingle();
    if (gErr) throw gErr;
    if (!row) throw new Error("Kader tidak ditemukan");
    const userId = (row as unknown as { user_id: string }).user_id;

    const { error: uErr } = await supabaseAdmin
      .from("kader" as never)
      .update({
        nama_lengkap: data.nama_lengkap.trim(),
        posko_rw: data.posko_rw.trim(),
        no_hp: data.no_hp?.trim() || null,
      } as never)
      .eq("id", data.id);
    if (uErr) throw uErr;

    if (data.password && data.password.length >= 8) {
      const { error: pErr } = await supabaseAdmin.auth.admin.updateUserById(userId, {
        password: data.password,
      });
      if (pErr) throw pErr;
    }
    return { ok: true };
  });

export const deleteKader = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => d)
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: row, error: gErr } = await supabaseAdmin
      .from("kader" as never)
      .select("user_id")
      .eq("id", data.id)
      .maybeSingle();
    if (gErr) throw gErr;
    if (!row) return { ok: true };
    const userId = (row as unknown as { user_id: string }).user_id;
    // Menghapus auth user akan cascade ke tabel kader & user_roles
    const { error: dErr } = await supabaseAdmin.auth.admin.deleteUser(userId);
    if (dErr) throw dErr;
    return { ok: true };
  });
