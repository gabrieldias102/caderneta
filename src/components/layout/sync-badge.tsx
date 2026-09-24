"use client";

import { cn } from "@/lib/cn";
import { useApp } from "@/lib/store";

const LABEL = {
  salvo: "Tudo salvo",
  salvando: "Salvando…",
  offline: "Sem conexão — tentando de novo",
};

/** Estado do salvamento no servidor. Compacto, some quando está tudo salvo. */
export function SyncBadge({ compact }: { compact?: boolean }) {
  const { sync } = useApp();
  if (compact && sync === "salvo") return null;
  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "flex items-center gap-1.5 text-xs",
        sync === "offline" ? "text-accent-700" : "text-neutral-700",
      )}
    >
      <span
        aria-hidden
        className={cn(
          "size-1.75 rounded-full",
          sync === "salvo" ? "bg-neutral-400" : "bg-accent",
          sync === "salvando" && "animate-blink",
        )}
      />
      {compact && sync === "offline" ? "Sem conexão" : LABEL[sync]}
    </div>
  );
}
