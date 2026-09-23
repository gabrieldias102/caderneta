"use client";

import type { ReactNode } from "react";
import { StoreProvider } from "@/lib/store";
import { Shell } from "./Shell";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <StoreProvider>
      <Shell>{children}</Shell>
    </StoreProvider>
  );
}
