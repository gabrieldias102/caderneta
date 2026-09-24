"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Ellipsis } from "lucide-react";
import { cn } from "@/lib/cn";
import { MES, cap, monthOf } from "@/lib/format";
import { useApp } from "@/lib/store";
import { Logo } from "./logo";
import { NAV, NAV_MORE, NAV_TABS, isActive } from "./nav";
import { SyncBadge } from "./sync-badge";

const mesDe = (hoje: string) => {
  const ym = monthOf(hoje);
  return { nome: cap(MES[Number(ym.slice(5)) - 1]), ano: ym.slice(0, 4) };
};

/** Barra lateral fixa (≥ 960px). */
export function Sidebar() {
  const path = usePathname();
  const { hoje } = useApp();
  const mes = mesDe(hoje);
  return (
    <aside className="sticky top-0 hidden h-dvh w-62 flex-none flex-col border-r border-divider bg-card lg:flex">
      <div className="border-b border-divider px-5 pt-5 pb-4.5">
        <Logo className="text-[22px]" />
        <div className="text-xs text-neutral-700">
          {mes.nome} {mes.ano}
        </div>
      </div>
      <nav className="flex flex-1 flex-col overflow-auto py-2">
        {NAV.map(({ href, label, Icon }) => {
          const on = isActive(path, href);
          return (
            <Link
              key={href}
              href={href}
              aria-current={on ? "page" : undefined}
              className={cn(
                "mx-2.5 my-px flex items-center gap-3 rounded-md px-3.5 py-2.75 text-md text-fg no-underline hover:bg-surface",
                on && "bg-surface font-extrabold text-accent-700",
              )}
            >
              <Icon size={18} />
              <span>{label}</span>
            </Link>
          );
        })}
      </nav>
      <div className="grid gap-1.5 border-t border-divider px-5 py-4">
        <SyncBadge />
      </div>
    </aside>
  );
}

/** Cabeçalho do celular (< 960px). */
export function Topbar() {
  const { hoje } = useApp();
  const mes = mesDe(hoje);
  return (
    <header className="sticky top-0 z-20 flex items-center gap-3 border-b border-divider bg-canvas px-4 py-3 lg:hidden">
      <Logo className="mr-auto" />
      <SyncBadge compact />
      <span className="rounded-xl bg-neutral-100 px-2.5 py-0.75 text-2xs text-neutral-800">
        {mes.nome.slice(0, 3)} {mes.ano}
      </span>
    </header>
  );
}

const tabClass =
  "flex min-h-14 flex-col items-center gap-0.75 px-0.5 pt-2 pb-2.5 text-2xs text-fg no-underline aria-[current=page]:font-extrabold aria-[current=page]:text-accent-700";

/** Barra de abas inferior do celular; "Mais" abre a folha com o resto. */
export function TabBar() {
  const path = usePathname();
  const { setUI } = useApp();
  const moreOn = NAV_MORE.some((n) => isActive(path, n.href));
  return (
    <nav
      aria-label="Navegação principal"
      className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-5 border-t border-divider bg-card pb-[env(safe-area-inset-bottom)] lg:hidden"
    >
      {NAV_TABS.map(({ href, label, short, Icon }) => (
        <Link
          key={href}
          href={href}
          aria-current={isActive(path, href) ? "page" : undefined}
          className={tabClass}
        >
          <Icon size={20} />
          <span>{short ?? label}</span>
        </Link>
      ))}
      <button
        type="button"
        aria-current={moreOn ? "page" : undefined}
        className={tabClass}
        onClick={() => setUI((u) => ({ ...u, more: true }))}
      >
        <Ellipsis size={20} />
        <span>Mais</span>
      </button>
    </nav>
  );
}

/** Folha que sobe de baixo com as telas que não cabem na barra. */
export function MoreSheet() {
  const path = usePathname();
  const { ui, setUI } = useApp();
  if (!ui.more) return null;
  const close = () => setUI((u) => ({ ...u, more: false }));
  return (
    <div
      className="fixed inset-0 z-50 flex animate-fade items-end bg-backdrop"
      onClick={close}
    >
      <div
        role="dialog"
        aria-label="Mais"
        onClick={(e) => e.stopPropagation()}
        className="w-full animate-in rounded-t-3xl bg-card pt-2 pb-[calc(16px+env(safe-area-inset-bottom))]"
      >
        {NAV_MORE.map(({ href, label, Icon }) => (
          <Link
            key={href}
            href={href}
            onClick={close}
            aria-current={isActive(path, href) ? "page" : undefined}
            className="flex min-h-13 w-full items-center gap-3.5 border-b border-divider px-5 py-3.5 text-xl text-fg no-underline last:border-b-0 aria-[current=page]:font-extrabold aria-[current=page]:text-accent-700"
          >
            <Icon size={20} />
            {label}
          </Link>
        ))}
      </div>
    </div>
  );
}
