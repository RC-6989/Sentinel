import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";
import { getDb, hashToken, newId } from "./db";

const SESSION_COOKIE = "sentinel_session";
const SESSION_DAYS = 14;

function sessionSecret() {
  const secret = process.env.AUTH_SECRET;
  if (!secret || secret.length < 32) {
    // Local-only fallback — production must set AUTH_SECRET
    if (process.env.NODE_ENV === "production") {
      throw new Error("AUTH_SECRET must be set (min 32 chars) in production");
    }
    return new TextEncoder().encode(
      "local-dev-only-sentinel-auth-secret-change-me",
    );
  }
  return new TextEncoder().encode(secret);
}

export type SessionUser = {
  id: string;
  email: string;
  name: string;
};

export async function createSession(userId: string): Promise<string> {
  const db = getDb();
  const sessionId = newId("ses");
  const rawToken = newId("tok");
  const tokenHash = hashToken(rawToken);
  const expires = new Date();
  expires.setDate(expires.getDate() + SESSION_DAYS);

  db.prepare(
    `INSERT INTO sessions (id, user_id, token_hash, expires_at)
     VALUES (?, ?, ?, ?)`,
  ).run(sessionId, userId, tokenHash, expires.toISOString());

  const jwt = await new SignJWT({ sid: sessionId, th: tokenHash })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DAYS}d`)
    .sign(sessionSecret());

  const jar = await cookies();
  jar.set(SESSION_COOKIE, jwt, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires,
  });

  return sessionId;
}

export async function destroySession(): Promise<void> {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (token) {
    try {
      const { payload } = await jwtVerify(token, sessionSecret());
      const sid = payload.sid as string | undefined;
      if (sid) {
        getDb().prepare("DELETE FROM sessions WHERE id = ?").run(sid);
      }
    } catch {
      // ignore invalid cookie
    }
  }
  jar.set(SESSION_COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}

export async function getCurrentUser(): Promise<SessionUser | null> {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, sessionSecret());
    const sid = payload.sid as string | undefined;
    const th = payload.th as string | undefined;
    if (!sid || !th) return null;

    const row = getDb()
      .prepare(
        `SELECT u.id, u.email, u.name, s.token_hash, s.expires_at
         FROM sessions s
         JOIN users u ON u.id = s.user_id
         WHERE s.id = ?`,
      )
      .get(sid) as
      | {
          id: string;
          email: string;
          name: string;
          token_hash: string;
          expires_at: string;
        }
      | undefined;

    if (!row) return null;
    if (row.token_hash !== th) return null;
    if (new Date(row.expires_at).getTime() < Date.now()) {
      getDb().prepare("DELETE FROM sessions WHERE id = ?").run(sid);
      return null;
    }

    return { id: row.id, email: row.email, name: row.name };
  } catch {
    return null;
  }
}
