// src/middleware.ts dosyanın içi
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  const url = request.nextUrl.clone();
  const hostname = request.headers.get("host") || "";

  const allowedDomains = ["localhost:3000", "b2-b-saa-s-dynamic.vercel.app"];
  let subdomain = "";
  for (const domain of allowedDomains) {
    if (hostname.endsWith(domain) && hostname !== domain) {
      subdomain = hostname.replace(`.${domain}`, "");
      break;
    }
  }

  if (
    url.pathname.startsWith("/_next") ||
    url.pathname.startsWith("/api") ||
    url.pathname.includes(".") ||
    url.pathname === "/favicon.ico"
  ) {
    return NextResponse.next();
  }

  const publicPaths = [
    "/login",
    "/register",
    "/forgot",
    "/accept-invite",
    "/demo",
    "/share",
    "/pricing",
    "/docs",
    "/changelog",
    "/solutions",
  ];
  const isPublicPath = publicPaths.some((path) =>
    url.pathname.startsWith(path),
  );

  if (isPublicPath || url.pathname === "/") {
    return NextResponse.next();
  }

  const token = request.cookies.get("token")?.value;
  if (!token) {
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  if (!subdomain || subdomain === "www") {
    return NextResponse.next();
  }

  const dashboardUuidRegex =
    /^\/dashboard\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;

  if (dashboardUuidRegex.test(url.pathname)) {
    const cleanPath = url.pathname.replace(dashboardUuidRegex, "");
    url.pathname = cleanPath || "/";
    return NextResponse.redirect(url);
  }
  if (!url.pathname.startsWith("/dashboard")) {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
      const res = await fetch(`${apiUrl}/api/tenants/by-slug/${subdomain}`);

      if (res.ok) {
        const data = await res.json();
        const realTenantId = data.id;

        url.pathname = `/dashboard/${realTenantId}${url.pathname}`;
        return NextResponse.rewrite(url);
      } else {
        url.pathname = "/login";
        return NextResponse.redirect(url);
      }
    } catch (error) {
      console.error("Proxy fetch error:", error);
      return NextResponse.next();
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api|.*\\.).*)"],
};
