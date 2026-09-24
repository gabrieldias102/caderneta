import type { totais } from "@/lib/derive";

/** Totais de um mês (YYYY-MM) já calculados pela página. */
export type TotaisMes = { m: string } & ReturnType<typeof totais>;
