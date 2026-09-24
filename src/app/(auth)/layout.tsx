import { Logo } from "@/components/layout/logo";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main className="grid min-h-dvh place-items-center p-4">
      <div className="grid w-[min(420px,100%)] gap-5">
        <Logo className="text-[26px]" />
        {children}
      </div>
    </main>
  );
}
