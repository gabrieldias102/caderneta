import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({ subsets: ["latin"], weight: ["400", "600", "800"], variable: "--font-jakarta", display: "swap" });

export const metadata: Metadata = {
  title: "Caderneta",
  description: "Controle financeiro pessoal — sem conexão com o banco. Importe o extrato ou a fatura e revise.",
  manifest: "/manifest.webmanifest",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#F4F5FA" },
    { media: "(prefers-color-scheme: dark)", color: "#15171F" },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={jakarta.variable} suppressHydrationWarning>
      <body>
        {children}
      </body>
    </html>
  );
}
