import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Há um package-lock.json na pasta do usuário; sem isso o Next adota a raiz errada.
  turbopack: { root: process.cwd() },
};

export default nextConfig;
