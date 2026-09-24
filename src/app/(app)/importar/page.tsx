"use client";

import { PageHeader } from "@/components/ui/layout";
import { useApp } from "@/lib/store";
import { DoneStep } from "./_components/done-step";
import { ProcessingStep } from "./_components/processing-step";
import { ReviewStep } from "./_components/review-step";
import { Stepper } from "./_components/stepper";
import { UploadStep } from "./_components/upload-step";

const STEPS = ["upload", "processing", "review", "done"] as const;

export default function Importar() {
  const { imp } = useApp();
  return (
    <>
      <PageHeader kicker="PDF · OFX · CSV" title="Importar extrato" />
      <Stepper
        steps={["Enviar", "Processar", "Revisar", "Pronto"]}
        current={STEPS.indexOf(imp.step)}
      />
      {imp.step === "upload" && <UploadStep />}
      {imp.step === "processing" && <ProcessingStep />}
      {imp.step === "review" && <ReviewStep />}
      {imp.step === "done" && <DoneStep />}
    </>
  );
}
