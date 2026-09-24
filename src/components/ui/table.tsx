import type { ComponentProps } from "react";
import { cn } from "@/lib/cn";

/** Tabela com rolagem horizontal no celular. Use <Th> e <Td> nas células. */
export function Table({ className, ...props }: ComponentProps<"table">) {
  return (
    <div className="overflow-x-auto">
      <table
        className={cn(
          "w-full border-collapse text-md [&_tbody_tr:hover]:bg-surface",
          className,
        )}
        {...props}
      />
    </div>
  );
}

export function Th({ className, ...props }: ComponentProps<"th">) {
  return (
    <th
      className={cn(
        "border-b border-divider px-2 py-2.5 text-left text-2xs font-normal tracking-caps text-neutral-700 uppercase",
        className,
      )}
      {...props}
    />
  );
}

export function Td({ className, ...props }: ComponentProps<"td">) {
  return (
    <td
      className={cn(
        "border-b border-divider px-2 py-2.5 align-middle",
        className,
      )}
      {...props}
    />
  );
}
