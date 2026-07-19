import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

function resolveUserName(
  profileName: string | null | undefined,
  metadata: Record<string, unknown> | undefined,
  email: string | undefined,
) {
  const metadataName =
    typeof metadata?.full_name === "string"
      ? metadata.full_name
      : typeof metadata?.name === "string"
        ? metadata.name
        : null;

  const emailName = email
    ?.split("@")[0]
    .replace(/[._-]+/g, " ")
    .replace(/\b\p{L}/gu, (letter) => letter.toLocaleUpperCase("tr-TR"));

  return profileName?.trim() || metadataName?.trim() || emailName || "Kullanıcı";
}

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ authenticated: false, role: null, membershipTier: null });
  }

  const admin = createAdminClient();
  const { data: profile, error } = await admin
    .from("profiles")
    .select("full_name, role, membership_tier")
    .eq("id", user.id)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    authenticated: true,
    role: profile?.role ?? null,
    membershipTier: profile?.membership_tier ?? "standard",
    fullName: resolveUserName(profile?.full_name, user.user_metadata, user.email),
    email: user.email ?? "",
  });
}
