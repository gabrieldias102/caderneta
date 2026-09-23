import "server-only";
import { createHash, randomBytes, scrypt as scryptCb, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import { cookies } from "next/headers";
import { and, eq, gt, lt } from "drizzle-orm";
import { db } from "@/db";
import { sessions, users } from "@/db/schema";

const scrypt = promisify(scryptCb) as (pw: string, salt: Buffer, len: number, opts: { N: number; r: number; p: number; maxmem: number }) => Promise<Buffer>;

export const SESSION_COOKIE = "cad_session";
const SESSION_DAYS = 30;
const RENEW_BELOW_DAYS = 15;
const KDF = { N: 2 ** 15, r: 8, p: 1, maxmem: 64 * 1024 * 1024 };

/* ── Senhas ─────────────────────────────────────────────────────────────── */

export async function hashPassword(senha: string): Promise<string> {
  const salt = randomBytes(16);
  const hash = await scrypt(senha.normalize("NFKC"), salt, 64, KDF);
  return `scrypt$${KDF.N}$${KDF.r}$${KDF.p}$${salt.toString("base64url")}$${hash.toString("base64url")}`;
}

export async function verifyPassword(senha: string, stored: string): Promise<boolean> {
  const [alg, n, r, p, saltB64, hashB64] = stored.split("$");
  if (alg !== "scrypt" || !hashB64) return false;
  const expected = Buffer.from(hashB64, "base64url");
  const got = await scrypt(senha.normalize("NFKC"), Buffer.from(saltB64, "base64url"), expected.length, {
    N: Number(n), r: Number(r), p: Number(p), maxmem: KDF.maxmem,
  });
  return got.length === expected.length && timingSafeEqual(got, expected);
}

/** Hash fixo para comparar quando o e-mail não existe (tempo de resposta igual). */
let dummyHash: Promise<string> | undefined;
export const getDummyHash = () => (dummyHash ??= hashPassword("senha-que-ninguem-usa"));

/* ── Sessões ─────────────────────────────────────────────────────────────── */

const sha256 = (s: string) => createHash("sha256").update(s).digest("hex");

export async function createSession(userId: string) {
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 86400_000);
  await db.insert(sessions).values({ id: sha256(token), userId, expiresAt });
  await setSessionCookie(token, expiresAt);
  // Limpeza oportunista de sessões vencidas deste usuário.
  await db.delete(sessions).where(and(eq(sessions.userId, userId), lt(sessions.expiresAt, new Date())));
}

async function setSessionCookie(token: string, expiresAt: Date) {
  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });
}

export interface SessionUser { id: string; email: string; nome: string }

/** Usuário da sessão atual, ou null. Renova a sessão quando está perto de vencer. */
export async function getSessionUser(): Promise<SessionUser | null> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const id = sha256(token);
  const [row] = await db
    .select({ id: users.id, email: users.email, nome: users.nome, expiresAt: sessions.expiresAt })
    .from(sessions)
    .innerJoin(users, eq(users.id, sessions.userId))
    .where(and(eq(sessions.id, id), gt(sessions.expiresAt, new Date())))
    .limit(1);
  if (!row) return null;
  if (row.expiresAt.getTime() - Date.now() < RENEW_BELOW_DAYS * 86400_000) {
    const expiresAt = new Date(Date.now() + SESSION_DAYS * 86400_000);
    await db.update(sessions).set({ expiresAt }).where(eq(sessions.id, id));
    try { await setSessionCookie(token, expiresAt); } catch { /* em Server Components não dá para gravar cookie */ }
  }
  return { id: row.id, email: row.email, nome: row.nome };
}

export async function destroySession() {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (token) await db.delete(sessions).where(eq(sessions.id, sha256(token)));
  store.delete(SESSION_COOKIE);
}

/* ── Limite de tentativas (memória do processo) ─────────────────────────── */

const tentativas = new Map<string, { n: number; ate: number }>();

/** true se ainda pode tentar. Janela de 15 min, 10 tentativas por chave. */
export function permitirTentativa(chave: string, max = 10, janelaMs = 15 * 60_000): boolean {
  const agora = Date.now();
  const t = tentativas.get(chave);
  if (!t || t.ate < agora) {
    tentativas.set(chave, { n: 1, ate: agora + janelaMs });
    return true;
  }
  t.n++;
  return t.n <= max;
}

export const limparTentativas = (chave: string) => tentativas.delete(chave);
