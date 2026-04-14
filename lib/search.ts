import { searchCarrefour } from "./scrapers/carrefour";
import { searchLaReinaByEans } from "./scrapers/lareina";
import { matchProducts } from "./match";
import { cacheGet, cacheSet } from "./cache";
import { normalizeName } from "./normalize";
import type { SearchResult } from "./scrapers/types";

export async function searchAll(query: string): Promise<SearchResult> {
  const cacheKey = normalizeName(query);
  const cached = cacheGet(cacheKey);
  if (cached) return cached;

  const errors: SearchResult["errors"] = [];

  // Step 1: Get Carrefour results (with EANs)
  let carrefourItems: Awaited<ReturnType<typeof searchCarrefour>> = [];
  try {
    carrefourItems = await searchCarrefour(query);
  } catch (e) {
    errors.push({
      source: "carrefour",
      message: e instanceof Error ? e.message : "Error desconocido",
    });
  }

  // Step 2: Look up each Carrefour EAN directly on La Reina
  const eans = carrefourItems.flatMap((p) => (p.ean ? [p.ean] : []));
  let laReinaItems: Awaited<ReturnType<typeof searchLaReinaByEans>> = [];
  try {
    if (eans.length > 0) {
      laReinaItems = await searchLaReinaByEans(eans);
    }
  } catch (e) {
    errors.push({
      source: "lareina",
      message: e instanceof Error ? e.message : "Error desconocido",
    });
  }

  const products = matchProducts(carrefourItems, laReinaItems);

  const result: SearchResult = {
    query,
    products,
    errors,
    cachedAt: Date.now(),
  };

  if (products.length > 0) {
    cacheSet(cacheKey, result);
  }

  return result;
}
