import type { ISODate } from "./types";

const NBSP = " ";
const brlFmt = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const brl0Fmt = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0, minimumFractionDigits: 0 });

/** R$ 1.234,56 (sem sinal). */
export const brl = (v: number) => brlFmt.format(Math.abs(v) < 0.005 ? 0 : v);
export const brl0 = (v: number) => brl0Fmt.format(v);
/** "− R$ 58,90" / "+ R$ 85,00", com espaço não separável. */
export const sgn = (v: number) => (v < 0 ? "−" : "+") + NBSP + brl(Math.abs(v));

export const MON = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];
export const MES = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"];
export const DOW = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
export const DOW_LONG = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];

export const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

export function parseISO(d: ISODate): Date {
  const [y, m, dd] = d.split("-").map(Number);
  return new Date(y, m - 1, dd, 12);
}

export function toISO(d: Date): ISODate {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

export function addDays(d: ISODate, n: number): ISODate {
  const dt = parseISO(d);
  dt.setDate(dt.getDate() + n);
  return toISO(dt);
}

export function addMonths(ym: string, n: number): string {
  const [y, m] = ym.split("-").map(Number);
  const dt = new Date(y, m - 1 + n, 1);
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}`;
}

export const monthOf = (d: ISODate) => d.slice(0, 7);
export const monIdx = (ym: string) => Number(ym.slice(5, 7)) - 1;
/** "set" / "set/26" */
export const monLabel = (ym: string, withYear = false) =>
  MON[monIdx(ym)] + (withYear ? "/" + ym.slice(2, 4) : "");

/** dd/mm */
export const fmtD = (d: ISODate) => `${d.slice(8, 10)}/${d.slice(5, 7)}`;
export const fmtDFull = (d: ISODate) => `${fmtD(d)}/${d.slice(0, 4)}`;

export function daysBetween(a: ISODate, b: ISODate) {
  return Math.round((parseISO(b).getTime() - parseISO(a).getTime()) / 86400000);
}

export function daysInMonth(ym: string) {
  const [y, m] = ym.split("-").map(Number);
  return new Date(y, m, 0).getDate();
}

/** Aceita "1.234,56", "1234.56", "25", "25,5". */
export function parseValorBR(raw: string): number {
  let s = String(raw).trim().replace(/[R$\s ]/g, "");
  let neg = false;
  if (/^\(.*\)$/.test(s)) { neg = true; s = s.slice(1, -1); }
  if (s.startsWith("−") || s.startsWith("-")) { neg = !neg; s = s.slice(1); }
  if (s.endsWith("-")) { neg = !neg; s = s.slice(0, -1); }
  if (s.startsWith("+")) s = s.slice(1);
  const lastComma = s.lastIndexOf(",");
  const lastDot = s.lastIndexOf(".");
  if (lastComma > lastDot) s = s.replace(/\./g, "").replace(",", ".");
  else if (lastDot > lastComma && lastComma >= 0) s = s.replace(/,/g, "");
  else if (lastDot >= 0 && lastComma < 0 && /\.\d{3}$/.test(s) && (s.match(/\./g) || []).length >= 1 && !/\.\d{1,2}$/.test(s)) s = s.replace(/\./g, "");
  const v = parseFloat(s);
  if (!isFinite(v)) return NaN;
  return neg ? -v : v;
}

export const initials = (s: string) =>
  s.replace(/[^\p{L}\s]/gu, "").trim().split(/\s+/).map((w) => w[0]).join("").slice(0, 2).toUpperCase() || "?";
