import type { Metadata } from "next";
import { AuthForm } from "@/components/auth/auth-form";

export const metadata: Metadata = { title: "Criar conta · Caderneta" };

export default function Cadastro() {
  return <AuthForm modo="cadastro" />;
}
