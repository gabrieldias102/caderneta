/**
 * Paletas extras do tema. As cores de verdade ficam em globals.css
 * (`:root[data-theme="<id>"]`); aqui só o nome e a amostra do seletor.
 * O seletor mostra 4 por linha: mantenha as claras antes das escuras.
 */
export const PALETAS = [
  {
    id: "lavanda",
    nome: "Lavanda",
    modo: "claro",
    amostra: { bg: "#f8f4fb", card: "#fffdfe", accent: "#7659bf" },
  },
  {
    id: "pessego",
    nome: "Pêssego",
    modo: "claro",
    amostra: { bg: "#fcf6f2", card: "#fffdfb", accent: "#ad502f" },
  },
  {
    id: "menta",
    nome: "Menta",
    modo: "claro",
    amostra: { bg: "#f2f8f5", card: "#fdfffe", accent: "#2e7d64" },
  },
  {
    id: "rosa",
    nome: "Rosa",
    modo: "claro",
    amostra: { bg: "#fcf4f7", card: "#fffdfe", accent: "#b0466e" },
  },
  {
    id: "verde-agua",
    nome: "Verde-água",
    modo: "escuro",
    amostra: { bg: "#121a1c", card: "#182224", accent: "#05a1ad" },
  },
  {
    id: "ameixa",
    nome: "Ameixa",
    modo: "escuro",
    amostra: { bg: "#1b1822", card: "#231f2c", accent: "#c2acf3" },
  },
  {
    id: "ambar",
    nome: "Âmbar",
    modo: "escuro",
    amostra: { bg: "#1a1712", card: "#221e17", accent: "#f0b45a" },
  },
  {
    id: "coral",
    nome: "Coral",
    modo: "escuro",
    amostra: { bg: "#1c1718", card: "#241e20", accent: "#f29e8e" },
  },
] as const;

export type PaletaId = (typeof PALETAS)[number]["id"];
export const PALETA_IDS = PALETAS.map((p) => p.id) as [PaletaId, ...PaletaId[]];
