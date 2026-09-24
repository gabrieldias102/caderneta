import type { ReactNode } from "react";

/** Linha de configuração: título e descrição à esquerda, controle à direita e conteúdo extra embaixo. */
export function SettingRow({
  title,
  description,
  action,
  children,
}: {
  title: ReactNode;
  description: ReactNode;
  action?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <div className="grid gap-2.5 border-b border-divider py-3.5">
      <div className="flex flex-wrap items-center gap-3">
        <div className="mr-auto min-w-0">
          <div className="text-md font-semibold">{title}</div>
          <div className="text-xs text-neutral-700">{description}</div>
        </div>
        {action}
      </div>
      {children}
    </div>
  );
}

/** Lista de linhas com divisória no topo. */
export function SettingList({ children }: { children: ReactNode }) {
  return <div className="max-w-160 border-t border-divider">{children}</div>;
}
