import { createClient } from "@supabase/supabase-js";

export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const adminKey =
    process.env.SUPABASE_SECRET_KEY ??
    process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !adminKey) {
    throw new Error(
      "Supabase admin anahtarı eksik. .env.local içine SUPABASE_SECRET_KEY veya SUPABASE_SERVICE_ROLE_KEY ekleyin.",
    );
  }

  return createClient(url, adminKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
