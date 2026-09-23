import type { Metadata } from "next";
import { AuthForm } from "@/components/AuthForm";

export const metadata: Metadata = { title: "Entrar · Caderneta" };

export default function Entrar() {
  return <AuthForm modo="entrar" />;
}
