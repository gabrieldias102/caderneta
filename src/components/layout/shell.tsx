"use client";

import { usePathname } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { Check } from "lucide-react";
import { DetailDialog } from "@/components/lancamentos/detail-dialog";
import { QuickAddDialog } from "@/components/lancamentos/quick-add-dialog";
import { RuleDialog } from "@/components/lancamentos/rule-dialog";
import { useApp } from "@/lib/store";
import { MoreSheet, Sidebar, TabBar, Topbar } from "./navigation";

export function Shell({ children }: { children: ReactNode }) {
  const path = usePathname();
  const { setUI } = useApp();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [path]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape")
        setUI((u) =>
          u.rule ? u : { ...u, more: false, detail: null, qa: false },
        );
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [setUI]);

  return (
    <div className="flex min-h-dvh">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar />
        {/* --sticky-top: altura do Topbar, para cabeçalhos grudados logo abaixo dele. */}
        <main
          key={path}
          className="w-full max-w-[1180px] animate-in px-4 pt-4 pb-24 [--sticky-top:53px] lg:px-10 lg:pt-8 lg:pb-10 lg:[--sticky-top:0px]"
        >
          {children}
        </main>
      </div>
      <TabBar />
      <MoreSheet />
      <DetailDialog />
      <QuickAddDialog />
      <RuleDialog />
      <Toast />
    </div>
  );
}

function Toast() {
  const { ui } = useApp();
  if (!ui.toast) return null;
  return (
    <div
      role="status"
      aria-live="polite"
      className="pointer-events-none fixed inset-x-4 bottom-20 z-60 flex justify-center lg:bottom-8"
    >
      <div className="flex max-w-[560px] animate-in items-center gap-2.5 rounded-full bg-fg px-4.5 py-3 text-md text-canvas shadow-lg">
        <Check size={16} />
        {ui.toast}
      </div>
    </div>
  );
}
