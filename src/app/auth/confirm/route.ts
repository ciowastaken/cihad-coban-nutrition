import { type NextRequest, NextResponse } from "next/server";

// Eski e-posta şablonları /auth/confirm adresini kullanıyorsa geriye dönük
// uyumluluk için tüm parametreleri yeni ve tek callback rotasına aktarır.
export function GET(request: NextRequest) {
  const callbackUrl = request.nextUrl.clone();
  callbackUrl.pathname = "/auth/callback";
  return NextResponse.redirect(callbackUrl);
}
