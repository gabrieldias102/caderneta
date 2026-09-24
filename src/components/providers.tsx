"use client";

import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { StoreProvider } from "@/lib/store";
import { Shell } from "./layout/shell";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <StoreProvider
      loading={<Loading />}
      error={(retry) => <LoadError retry={retry} />}
    >
      <Shell>{children}</Shell>
    </StoreProvider>
  );
}

function Loading() {
  return (
    <div
      aria-busy="true"
      className="grid min-h-dvh place-items-center text-neutral-700"
    >
      Carregando…
    </div>
  );
}

function LoadError({ retry }: { retry: () => void }) {
  return (
    <div className="grid min-h-dvh place-items-center p-4">
      <div className="grid max-w-90 justify-items-center gap-3 text-center">
        <h4>Não foi possível carregar seus dados</h4>
        <div className="text-md text-neutral-700">
          Verifique a conexão e tente de novo.
        </div>
        <Button variant="primary" onClick={retry}>
          Tentar de novo
        </Button>
      </div>
    </div>
  );
}
