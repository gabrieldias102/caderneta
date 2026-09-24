import type { Metadata } from "next";
import { AuthForm } from "@/components/auth/auth-form";

export const metadata: Metadata = { title: "Entrar · Caderneta" };

export default function Entrar() {
  return <AuthForm modo="entrar" />;
}
