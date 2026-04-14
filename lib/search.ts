import { searchCarrefour } from "./scrapers/carrefour";
import { searchLaReinaByEans } from "./scrapers/lareina";
import { searchCoto } from "./scrapers/coto";
import { matchProducts } from "./match";
import { cacheGet, cacheSet } from "./cache";
import { normalizeName } from "./normalize";
import type { SearchResult } from "./scrapers/types";

export async function searchAll(query: string): Promise<SearchResult> {
  const cacheKey = normalizeName(query);
  const cached = cacheGet(cacheKey);
  if (cached) return cached;

  const errors: SearchResult["errors"] = [];

  // Step 1: Search Carrefour and Coto in parallel (both have search APIs with EANs)
  const [carrefourResult, cotoResult] = await Promise.allSettled([
    searchCarrefour(query),
    searchCoto(query),
  ]);

  const carrefourItems =
    carrefourResult.status === "fulfilled"
      ? carrefourResult.value
      : (errors.push({
          source: "carrefour",
          message:
            carrefourResult.reason instanceof Error
              ? carrefourResult.reason.message
              : "Error desconocido",
        }),
        []);

  const cotoItems =
    cotoResult.status === "fulfilled"
      ? cotoResult.value
      : (errors.push({
          source: "coto",
          message:
            cotoResult.reason instanceof Error
              ? cotoResult.reason.message
              : "Error desconocido",
        }),
        []);

  // Step 2: Collect all unique EANs from Carrefour + Coto for La Reina lookup
  const eanSet = new Set<string>();
  for (const p of [...carrefourItems, ...cotoItems]) {
    if (p.ean) eanSet.add(p.ean);
  }

  let laReinaItems: Awaited<ReturnType<typeof searchLaReinaByEans>> = [];
  if (eanSet.size > 0) {
    try {
      laReinaItems = await searchLaReinaByEans([...eanSet]);
    } catch (e) {
      errors.push({
        source: "lareina",
        message: e instanceof Error ? e.message : "Error desconocido",
      });
    }
  }

  const products = matchProducts([...carrefourItems, ...cotoItems, ...laReinaItems]);

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
