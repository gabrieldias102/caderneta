import {
  ChartColumn,
  CircleHelp,
  House,
  List,
  SlidersHorizontal,
  Target,
  Upload,
  Users,
  Wallet,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  /** Rótulo curto para a barra inferior do celular. */
  short?: string;
  Icon: LucideIcon;
}

export const NAV: NavItem[] = [
  { href: "/", label: "Início", Icon: House },
  { href: "/lancamentos", label: "Lançamentos", Icon: List },
  {
    href: "/importar",
    label: "Importar extrato",
    short: "Importar",
    Icon: Upload,
  },
  { href: "/orcamentos", label: "Orçamentos", Icon: Target },
  { href: "/relatorios", label: "Relatórios", Icon: ChartColumn },
  { href: "/contas", label: "Contas e cartões", Icon: Wallet },
  { href: "/compartilhadas", label: "Compartilhadas", Icon: Users },
  { href: "/configuracoes", label: "Configurações", Icon: SlidersHorizontal },
  { href: "/ajuda", label: "Ajuda", Icon: CircleHelp },
];

/** No celular, as quatro primeiras ficam na barra; o resto vai para "Mais". */
export const NAV_TABS = NAV.slice(0, 4);
export const NAV_MORE = NAV.slice(4);

export const isActive = (path: string, href: string) =>
  href === "/" ? path === "/" : path.startsWith(href);
