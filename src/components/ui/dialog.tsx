import { X } from "lucide-react";
import type { FormEvent, ReactNode } from "react";
import { cn } from "@/lib/cn";
import { IconButton } from "./button";
import { Kicker } from "./layout";

const panel =
  "flex max-h-[90dvh] w-[min(460px,100%)] flex-col gap-3.5 overflow-auto rounded-lg bg-card p-5 shadow-lg animate-in";

/**
 * Diálogo modal centralizado. Clique fora fecha (se houver `onClose`);
 * com `onSubmit`, o painel vira um <form>.
 */
export function Dialog({
  labelledBy,
  role = "dialog",
  onClose,
  onSubmit,
  overlayClassName,
  className,
  children,
}: {
  labelledBy: string;
  role?: "dialog" | "alertdialog";
  onClose?: () => void;
  onSubmit?: () => void;
  overlayClassName?: string;
  className?: string;
  children: ReactNode;
}) {
  const props = {
    role,
    "aria-modal": true,
    "aria-labelledby": labelledBy,
    className: cn(panel, className),
    onClick: (e: { stopPropagation: () => void }) => e.stopPropagation(),
  };
  return (
    <div
      className={cn(
        "fixed inset-0 z-50 grid animate-fade place-items-center bg-backdrop p-4",
        overlayClassName,
      )}
      onClick={onClose}
    >
      {onSubmit ? (
        <form
          {...props}
          onSubmit={(e: FormEvent) => {
            e.preventDefault();
            onSubmit();
          }}
        >
          {children}
        </form>
      ) : (
        <div {...props}>{children}</div>
      )}
    </div>
  );
}

export function DialogTitle({
  id,
  children,
}: {
  id: string;
  children: ReactNode;
}) {
  return (
    <div id={id} className="text-2xl leading-tight font-extrabold">
      {children}
    </div>
  );
}

/** Kicker + título, com botão de fechar à direita quando há `onClose`. */
export function DialogHeader({
  kicker,
  title,
  titleId,
  onClose,
}: {
  kicker: ReactNode;
  title: ReactNode;
  titleId: string;
  onClose?: () => void;
}) {
  return (
    <div className="flex items-start gap-2">
      <div className="mr-auto min-w-0">
        <Kicker>{kicker}</Kicker>
        <DialogTitle id={titleId}>{title}</DialogTitle>
      </div>
      {onClose && (
        <IconButton label="Fechar" onClick={onClose}>
          <X size={18} />
        </IconButton>
      )}
    </div>
  );
}

export function DialogActions({ children }: { children: ReactNode }) {
  return (
    <div className="mt-1 flex flex-wrap justify-end gap-2">{children}</div>
  );
}
