"use client";

import { Eye, EyeOff } from "lucide-react";
import { IconButton } from "@/components/ui/button";
import { useApp } from "@/lib/store";

/** Olho que mostra/esconde os valores em todas as telas. */
export function ValoresToggle({ className }: { className?: string }) {
  const { ocultos, alternarValores } = useApp();
  return (
    <IconButton
      label={ocultos ? "Mostrar valores" : "Ocultar valores"}
      title={ocultos ? "Mostrar valores" : "Ocultar valores"}
      aria-pressed={ocultos}
      onClick={alternarValores}
      className={className}
    >
      {ocultos ? <EyeOff size={18} /> : <Eye size={18} />}
    </IconButton>
  );
}
