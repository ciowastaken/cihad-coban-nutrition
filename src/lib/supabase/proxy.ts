import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },

        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => {
            request.cookies.set(name, value);
          });

          response = NextResponse.next({
            request,
          });

          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    },
  );

  /*
   * getClaims() yalnızca token içindeki bilgiyi okuyabilir.
   * Kullanıcı Authentication'dan silinmiş olsa bile eski token bir süre
   * geçerli görünebilir. getUser() Supabase Auth sunucusundan hesabı
   * doğruladığı için silinmiş / geçersiz kullanıcıyı doğru şekilde yakalar.
   */
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  const isAuthenticated = Boolean(user) && !error;
  const pathname = request.nextUrl.pathname;

  const protectedRoute =
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/onboarding") ||
    pathname.startsWith("/plans") ||
    pathname.startsWith("/profile") ||
    pathname.startsWith("/admin");

  const authRoute =
    pathname === "/login" ||
    pathname === "/register";

  if (protectedRoute && !isAuthenticated) {
    /*
     * Geçersiz/eski oturum cookie'lerini temizle.
     * Böylece /login ile /dashboard arasında yönlendirme döngüsü oluşmaz.
     */
    const redirectResponse = NextResponse.redirect(
      new URL(
        `/login?next=${encodeURIComponent(pathname)}`,
        request.url,
      ),
    );

    request.cookies.getAll().forEach(({ name }) => {
      if (
        name.startsWith("sb-") ||
        name.includes("auth-token")
      ) {
        redirectResponse.cookies.set(name, "", {
          expires: new Date(0),
          path: "/",
        });
      }
    });

    return redirectResponse;
  }

  if (authRoute && isAuthenticated) {
    return NextResponse.redirect(
      new URL("/dashboard", request.url),
    );
  }

  return response;
}