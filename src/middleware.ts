import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import createIntlMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

const handleI18nRouting = createIntlMiddleware(routing);

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

  const pathnameIsMissingLocale = routing.locales.every(
    (locale) =>
      !url.pathname.startsWith(`/${locale}/`) && url.pathname !== `/${locale}`,
  );
  const localePrefix = routing.locales.find(
    (locale) =>
      url.pathname.startsWith(`/${locale}/`) || url.pathname === `/${locale}`,
  );
  const basePath = localePrefix
    ? url.pathname.replace(`/${localePrefix}`, "") || "/"
    : url.pathname;

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
    "/features",
    "/templates",
    "/blog",
    "/community",
  ];

  const isPublicPath = publicPaths.some((path) => basePath.startsWith(path));

  if (pathnameIsMissingLocale) {
    return handleI18nRouting(request);
  }

  if (isPublicPath || basePath === "/") {
    return handleI18nRouting(request);
  }

  const token = request.cookies.get("token")?.value;
  if (!token) {
    url.pathname = `/${localePrefix || routing.defaultLocale}/login`;
    return NextResponse.redirect(url);
  }

  if (!subdomain || subdomain === "www") {
    return handleI18nRouting(request);
  }

  const dashboardUuidRegex =
    /^\/dashboard\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;

  if (dashboardUuidRegex.test(basePath)) {
    const cleanPath = basePath.replace(dashboardUuidRegex, "");
    url.pathname = `/${localePrefix || routing.defaultLocale}${cleanPath || "/"}`;
    return NextResponse.redirect(url);
  }

  if (!basePath.startsWith("/dashboard")) {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
      const res = await fetch(`${apiUrl}/api/tenants/by-slug/${subdomain}`);

      if (res.ok) {
        const data = await res.json();
        const realTenantId = data.id;

        url.pathname = `/${localePrefix || routing.defaultLocale}/dashboard/${realTenantId}${basePath}`;
        return NextResponse.rewrite(url);
      } else {
        url.pathname = `/${localePrefix || routing.defaultLocale}/login`;
        return NextResponse.redirect(url);
      }
    } catch (error) {
      console.error("Proxy fetch error:", error);
      return handleI18nRouting(request);
    }
  }

  return handleI18nRouting(request);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api|.*\\.).*)"],
};
