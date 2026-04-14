export type SupermarketSource = "carrefour" | "lareina" | "coto";

export const ALL_SOURCES: SupermarketSource[] = ["carrefour", "coto", "lareina"];

export const SUPERMARKET_META: Record<SupermarketSource, { name: string; color: string; dot: string }> = {
  carrefour: { name: "Carrefour", color: "blue", dot: "🔵" },
  lareina:   { name: "La Reina",  color: "yellow", dot: "🟡" },
  coto:      { name: "Coto",      color: "red", dot: "🔴" },
};

export interface Product {
  source: SupermarketSource;
  name: string;
  brand: string;
  ean?: string;
  size?: string;
  price: number;
  /** Price formatted as ARS string, e.g. "$1.553,00" */
  priceDisplay: string;
  url: string;
  imageUrl?: string;
}

export interface CanonicalProduct {
  /** Display name — prefer Carrefour's (more complete) */
  name: string;
  brand: string;
  ean?: string;
  size?: string;
  imageUrl?: string;
  carrefour?: Product;
  lareina?: Product;
  coto?: Product;
}

export interface SearchResult {
  query: string;
  products: CanonicalProduct[];
  errors: { source: SupermarketSource; message: string }[];
  cachedAt: number;
}
