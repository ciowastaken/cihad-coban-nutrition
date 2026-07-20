import { NextResponse } from "next/server";

import { createAdminClient } from "@/lib/supabase/admin";
import { retrieveIyzicoCheckout } from "@/lib/payments/iyzico";
import { isMembershipTier } from "@/lib/payments/plans";

export const runtime = "nodejs";

async function readToken(request: Request) {
  const contentType = request.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    const body = (await request.json().catch(() => ({}))) as { token?: string };
    return body.token;
  }

  const form = await request.formData().catch(() => null);
  const token = form?.get("token");
  return typeof token === "string" ? token : undefined;
}

function resultUrl(request: Request, status: "failed" | "success", tier?: string) {
  const url = new URL("/checkout/result", request.url);
  url.searchParams.set("status", status);
  if (tier) url.searchParams.set("tier", tier);
  return url;
}

export async function POST(request: Request) {
  const token = await readToken(request);
  if (!token) {
    return NextResponse.redirect(resultUrl(request, "failed"), { status: 303 });
  }

  const result = await retrieveIyzicoCheckout({ token });
  const parts = result.conversationId?.split(":") || [];
  const tier = parts[0] === "membership" ? parts[1] : undefined;
  const userId = parts[0] === "membership" ? parts[2] : undefined;
  const paid = result.status === "success" && result.paymentStatus === "SUCCESS";

  if (!paid || !isMembershipTier(tier) || !userId) {
    return NextResponse.redirect(resultUrl(request, "failed", tier), { status: 303 });
  }

  const admin = createAdminClient();
  const { error } = await admin
    .from("profiles")
    .update({ membership_tier: tier })
    .eq("id", userId);

  if (error) {
    return NextResponse.redirect(resultUrl(request, "failed", tier), { status: 303 });
  }

  return NextResponse.redirect(resultUrl(request, "success", tier), { status: 303 });
}

