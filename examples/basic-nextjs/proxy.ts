import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import crypto from "node:crypto";

const PUBLIC_PATHS = ["/login", "/api/auth/login", "/api/auth/logout", "/api/ai-me"];

const SECRET = process.env.AUTH_SECRET ?? "dev-secret-change-in-production";

function isValidSessionToken(token: string): boolean {
  const [encoded, signature] = token.split(".");
  if (!encoded || !signature) return false;

  const expected = crypto
    .createHmac("sha256", SECRET)
    .update(encoded)
    .digest("base64url");

  try {
    if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) {
      return false;
    }
  } catch {
    return false;
  }

  try {
    const payload = JSON.parse(Buffer.from(encoded, "base64url").toString()) as {
      exp?: number;
    };
    if (Date.now() > (payload.exp ?? 0)) return false;
  } catch {
    return false;
  }

  return true;
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public paths (including all /api/ai-me/* routes e.g. health)
  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  // Allow static assets and Next.js internals
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  // Validate session cookie — existence alone is not sufficient
  const token = request.cookies.get("session")?.value;
  if (!token || !isValidSessionToken(token)) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
