import { cn } from "@/lib/cn";

/** Indicador de etapas: as concluídas e a atual ganham um traço em cima. */
export function Stepper({
  steps,
  current,
}: {
  steps: string[];
  current: number;
}) {
  return (
    <div className="mb-6 grid auto-cols-fr grid-flow-col border-y border-divider">
      {steps.map((label, i) => (
        <div
          key={label}
          aria-current={i === current ? "step" : undefined}
          className={cn(
            "-mt-px grid gap-0.5 border-t-3 py-2.5 pr-2.5",
            i <= current ? "border-accent" : "border-transparent",
          )}
        >
          <span className="text-2xs text-neutral-700">0{i + 1}</span>
          <span className={cn("text-sm", i === current && "font-extrabold")}>
            {label}
          </span>
        </div>
      ))}
    </div>
  );
}
