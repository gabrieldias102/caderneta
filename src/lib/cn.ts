import { clsx, type ClassValue } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

// Ensina ao tailwind-merge os tokens próprios do tema (globals.css), para que
// um `className` vindo de fora substitua a classe padrão em vez de somar.
const twMerge = extendTailwindMerge({
  extend: {
    theme: {
      radius: ["icon"],
      tracking: ["label", "caps"],
      animate: ["in", "fade", "blink"],
    },
  },
});

/** Junta classes condicionais e resolve conflitos do Tailwind (a última vence). */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
