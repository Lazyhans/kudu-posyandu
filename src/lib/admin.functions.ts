import { createServerFn } from "@tanstack/react-start";

const ADMIN_EMAIL = "kuduadmin@posyandu.local";
const ADMIN_PASSWORD = "kelurahankudu2026";
const ADMIN_USERNAME = "kuduadmin";

// Idempotent: creates the fixed admin user if it does not yet exist.
export const ensureAdminSeed = createServerFn({ method: "POST" }).handler(async () => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

  // Cek apakah admin sudah terdaftar
  const { data: list, error: listErr } = await supabaseAdmin.auth.admin.listUsers({
    page: 1,
    perPage: 200,
  });
  if (listErr) throw listErr;

  const exists = list.users.some((u) => u.email === ADMIN_EMAIL);
  if (exists) return { ok: true, created: false };

  const { error: createErr } = await supabaseAdmin.auth.admin.createUser({
    email: ADMIN_EMAIL,
    password: ADMIN_PASSWORD,
    email_confirm: true,
    user_metadata: { username: ADMIN_USERNAME, role: "admin" },
  });
  if (createErr) throw createErr;

  return { ok: true, created: true };
});
