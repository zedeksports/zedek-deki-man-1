import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";

export async function middleware(request) {
  let response = NextResponse.next({ request });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.redirect(new URL("/login?error=configuration", request.url));
  }

  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          request.cookies.set(name, value);
          response.cookies.set(name, value, options);
        });
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;
  const isLogin = pathname === "/login" || pathname.startsWith("/login/");
  const isResetPassword = pathname === "/reset-password" || pathname.startsWith("/reset-password/");

  if (isLogin || isResetPassword) {
    return response;
  }

  if (!user) {
    return NextResponse.redirect(new URL("/login?error=restricted", request.url));
  }

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("role,is_active")
    .eq("id", user.id)
    .maybeSingle();

  if (error || !profile?.is_active) {
    return NextResponse.redirect(new URL("/login?error=restricted", request.url));
  }

  const isReporterRoute = pathname === "/reporter" || pathname.startsWith("/reporter/");
  const isReporter = profile.role === "reporter";
  const isAdmin = profile.role === "super_admin" || profile.role === "zedek_admin";

  if (isReporterRoute) {
    if (!isReporter) {
      return NextResponse.redirect(new URL("/login?error=restricted", request.url));
    }
    return response;
  }

  if (!isAdmin) {
    return NextResponse.redirect(new URL("/login?error=restricted", request.url));
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
