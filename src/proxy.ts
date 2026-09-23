import { NextResponse, type NextRequest } from "next/server";

const SESSION_COOKIE = "cad_session";
const PUBLICAS = ["/entrar", "/cadastro"];

/**
 * Checagem otimista: só olha se o cookie existe. A validação real da sessão
 * acontece nas rotas da API (src/server/http.ts).
 */
export function proxy(req: NextRequest) {
  const logado = req.cookies.has(SESSION_COOKIE);
  const publica = PUBLICAS.some((p) => req.nextUrl.pathname.startsWith(p));
  if (!logado && !publica) {
    const url = new URL("/entrar", req.url);
    if (req.nextUrl.pathname !== "/") url.searchParams.set("volta", req.nextUrl.pathname);
    return NextResponse.redirect(url);
  }
  if (logado && publica) return NextResponse.redirect(new URL("/", req.url));
  return NextResponse.next();
}

export const config = {
  // Não roda na API, nos arquivos do Next nem nos arquivos de public/. Lista as
  // extensões explicitamente: um padrão genérico ".*\\..*" deixava as páginas de fora.
  matcher: ["/((?!api|_next/static|_next/image|.*\\.(?:svg|png|ico|csv|ofx|mjs|webmanifest)$).*)"],
};
