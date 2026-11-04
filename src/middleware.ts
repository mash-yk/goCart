import { NextResponse, type NextRequest } from "next/server";
import { GUEST_COOKIE, GUEST_MAX_AGE_SECONDS, SESSION_COOKIE } from "@/lib/auth/constants";

/**
 * Gives every visitor without a session an anonymous guest id, so they can
 * use the cart and wishlist before creating an account. The id is also added
 * to the forwarded request so server components see it on the very first visit.
 */
export function middleware(request: NextRequest) {
  if (request.cookies.has(SESSION_COOKIE) || request.cookies.has(GUEST_COOKIE)) {
    return NextResponse.next();
  }

  const guestId = crypto.randomUUID();
  request.cookies.set(GUEST_COOKIE, guestId);
  const response = NextResponse.next({ request: { headers: request.headers } });
  response.cookies.set(GUEST_COOKIE, guestId, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: GUEST_MAX_AGE_SECONDS,
  });
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|icon.svg|robots.txt|sitemap.xml).*)"],
};
