import { cn } from "@/lib/cn";

export function Logo({ className }: { className?: string }) {
  return (
    <div
      className={cn("text-[19px] font-extrabold tracking-[-.02em]", className)}
    >
      Caderneta<span className="text-accent">.</span>
    </div>
  );
}
