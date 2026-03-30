import crypto from "node:crypto";
import { cookies } from "next/headers";
import { getDb, type UserRow } from "./db";

const COOKIE_NAME = "session";
const SECRET = process.env.AUTH_SECRET ?? "dev-secret-change-in-production";
const SESSION_DURATION_MS = 24 * 60 * 60 * 1000; // 24 hours

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(":");
  const testHash = crypto.scryptSync(password, salt, 64).toString("hex");
  return crypto.timingSafeEqual(Buffer.from(hash, "hex"), Buffer.from(testHash, "hex"));
}

interface SessionPayload {
  userId: string;
  role: string;
  exp: number;
}

function sign(payload: SessionPayload): string {
  const data = JSON.stringify(payload);
  const encoded = Buffer.from(data).toString("base64url");
  const signature = crypto
    .createHmac("sha256", SECRET)
    .update(encoded)
    .digest("base64url");
  return `${encoded}.${signature}`;
}

function verify(token: string): SessionPayload | null {
  const [encoded, signature] = token.split(".");
  if (!encoded || !signature) return null;

  const expected = crypto
    .createHmac("sha256", SECRET)
    .update(encoded)
    .digest("base64url");

  if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) {
    return null;
  }

  const payload: SessionPayload = JSON.parse(
    Buffer.from(encoded, "base64url").toString()
  );

  if (Date.now() > payload.exp) return null;

  return payload;
}

export function createSessionToken(user: { id: string; role: string }): string {
  return sign({
    userId: user.id,
    role: user.role,
    exp: Date.now() + SESSION_DURATION_MS,
  });
}

export async function setSessionCookie(user: { id: string; role: string }) {
  const token = createSessionToken(user);
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_DURATION_MS / 1000,
  });
}

export async function clearSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

export async function getSession(): Promise<{
  user: { id: string; role: string; displayName: string };
} | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;

  const payload = verify(token);
  if (!payload) return null;

  const db = getDb();
  const user = db
    .prepare("SELECT id, role, display_name FROM users WHERE id = ?")
    .get(payload.userId) as Pick<UserRow, "id" | "role" | "display_name"> | undefined;

  if (!user) return null;

  return {
    user: { id: user.id, role: user.role, displayName: user.display_name },
  };
}

export function getSessionFromRequest(req: Request): {
  user: { id: string; role: string; displayName: string };
} | null {
  const cookieHeader = req.headers.get("cookie") ?? "";
  const match = cookieHeader.match(/(?:^|;\s*)session=([^\s;]+)/);
  if (!match) return null;

  const payload = verify(match[1]);
  if (!payload) return null;

  const db = getDb();
  const user = db
    .prepare("SELECT id, role, display_name FROM users WHERE id = ?")
    .get(payload.userId) as Pick<UserRow, "id" | "role" | "display_name"> | undefined;

  if (!user) return null;

  return {
    user: { id: user.id, role: user.role, displayName: user.display_name },
  };
}
