"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { ChartColumn, Check, Ellipsis, House, List, SlidersHorizontal, Target, Upload, Users, Wallet } from "lucide-react";
import { MES, cap, monthOf } from "@/lib/format";
import { useApp } from "@/lib/store";
import { DetailDialog, QuickAddDialog, RuleDialog } from "./Dialogs";

export const NAV = [
  { href: "/", label: "Início", Icon: House },
  { href: "/lancamentos", label: "Lançamentos", Icon: List },
  { href: "/importar", label: "Importar extrato", short: "Importar", Icon: Upload },
  { href: "/orcamentos", label: "Orçamentos", Icon: Target },
  { href: "/relatorios", label: "Relatórios", Icon: ChartColumn },
  { href: "/contas", label: "Contas e cartões", Icon: Wallet },
  { href: "/compartilhadas", label: "Compartilhadas", Icon: Users },
  { href: "/configuracoes", label: "Configurações", Icon: SlidersHorizontal },
];
const MORE = NAV.slice(4);

export function Shell({ children }: { children: ReactNode }) {
  const path = usePathname();
  const router = useRouter();
  const { hoje, ui, setUI } = useApp();
  const ym = monthOf(hoje);
  const mesLabel = `${cap(MES[Number(ym.slice(5)) - 1])} ${ym.slice(0, 4)}`;
  const isOn = (href: string) => (href === "/" ? path === "/" : path.startsWith(href));
  const moreOn = MORE.some((n) => isOn(n.href));

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [path]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setUI((u) => (u.rule ? u : { ...u, more: false, detail: null, qa: false }));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [setUI]);

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="brand">
          <div className="logo">Caderneta<i>.</i></div>
          <div style={{ fontSize: 12, color: "var(--color-neutral-700)" }}>{mesLabel}</div>
        </div>
        <nav>
          {NAV.map(({ href, label, Icon }) => (
            <Link key={href} href={href} aria-current={isOn(href) ? "page" : undefined}>
              <Icon size={18} />
              <span>{label}</span>
            </Link>
          ))}
        </nav>
        <div className="foot">
          <div className="label-caps" style={{ letterSpacing: ".08em" }}>Sem conexão com o banco</div>
          <div style={{ fontSize: 12, color: "var(--color-neutral-700)" }}>Tudo entra por arquivo ou à mão.</div>
          <SyncBadge />
        </div>
      </aside>

      <div className="main">
        <header className="topbar">
          <div className="logo">Caderneta<i>.</i></div>
          <SyncBadge compact />
          <span className="tag tag-neutral">{cap(MES[Number(ym.slice(5)) - 1].slice(0, 3))} {ym.slice(0, 4)}</span>
        </header>
        <main className="content anim-in" key={path}>
          {children}
        </main>
      </div>

      <nav className="tabbar" aria-label="Navegação principal">
        {NAV.slice(0, 4).map(({ href, label, short, Icon }) => (
          <button key={href} aria-current={isOn(href) ? "page" : undefined} onClick={() => router.push(href)}>
            <Icon size={20} />
            <span>{short ?? label}</span>
          </button>
        ))}
        <button aria-current={moreOn ? "page" : undefined} onClick={() => setUI((u) => ({ ...u, more: true }))}>
          <Ellipsis size={20} />
          <span>Mais</span>
        </button>
      </nav>

      {ui.more && (
        <div className="sheet-backdrop" onClick={() => setUI((u) => ({ ...u, more: false }))}>
          <div className="sheet" role="dialog" aria-label="Mais" onClick={(e) => e.stopPropagation()}>
            {MORE.map(({ href, label, Icon }) => (
              <button key={href} onClick={() => { setUI((u) => ({ ...u, more: false })); router.push(href); }}
                style={isOn(href) ? { color: "var(--color-accent-700)", fontWeight: 800 } : undefined}>
                <Icon size={20} />
                {label}
              </button>
            ))}
          </div>
        </div>
      )}

      <DetailDialog />
      <QuickAddDialog />
      <RuleDialog />

      {ui.toast && (
        <div className="toast-wrap" role="status" aria-live="polite">
          <div className="toast"><Check size={16} />{ui.toast}</div>
        </div>
      )}
    </div>
  );
}

/** Estado do salvamento no servidor. */
function SyncBadge({ compact }: { compact?: boolean }) {
  const { sync } = useApp();
  if (compact && sync === "salvo") return null;
  const label = sync === "salvo" ? "Tudo salvo" : sync === "salvando" ? "Salvando…" : "Sem conexão — tentando de novo";
  return (
    <div role="status" aria-live="polite" style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: sync === "offline" ? "var(--color-accent-700)" : "var(--color-neutral-700)" }}>
      <span aria-hidden style={{ width: 7, height: 7, borderRadius: 99, background: sync === "salvo" ? "var(--color-neutral-400)" : "var(--color-accent)", animation: sync === "salvando" ? "cd-blink 1s infinite" : undefined }} />
      {compact && sync === "offline" ? "Sem conexão" : label}
    </div>
  );
}
