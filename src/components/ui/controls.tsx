import { cn } from "@/lib/cn";

/** Controle segmentado (grupo de rádios com cara de botões). */
export function Segmented<T extends string | number>({
  name,
  options,
  value,
  onChange,
  stretch,
  className,
}: {
  name: string;
  options: [T, string][];
  value: T;
  onChange: (v: T) => void;
  stretch?: boolean;
  className?: string;
}) {
  return (
    <div
      role="radiogroup"
      className={cn(
        "inline-flex overflow-hidden rounded-md border border-divider bg-card",
        stretch && "flex",
        className,
      )}
    >
      {options.map(([v, label]) => (
        <label
          key={String(v)}
          className={cn(
            "relative inline-flex cursor-pointer items-center justify-center gap-1.5 px-3 py-2 text-sm whitespace-nowrap not-first:border-l not-first:border-divider",
            "not-has-checked:hover:bg-fg/7 has-checked:bg-accent has-checked:font-semibold has-checked:text-canvas",
            "has-focus-visible:outline-2 has-focus-visible:-outline-offset-2 has-focus-visible:outline-accent",
            stretch && "flex-1",
          )}
        >
          <input
            type="radio"
            name={name}
            className="sr-only"
            checked={value === v}
            onChange={() => onChange(v)}
          />
          {label}
        </label>
      ))}
    </div>
  );
}

export function Switch({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: () => void;
  label: string;
}) {
  return (
    <span className="relative h-6.5 w-11 flex-none">
      <input
        type="checkbox"
        role="switch"
        aria-label={label}
        checked={checked}
        onChange={onChange}
        className="peer absolute inset-0 z-10 m-0 size-full cursor-pointer opacity-0"
      />
      <span
        aria-hidden
        className={cn(
          "absolute inset-0 rounded-full bg-neutral-300 transition-colors peer-checked:bg-accent",
          "peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-accent",
          "after:absolute after:top-0.75 after:left-0.75 after:size-5 after:rounded-full after:bg-card after:shadow-sm after:transition-transform peer-checked:after:translate-x-4.5",
        )}
      />
    </span>
  );
}
