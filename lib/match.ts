import Fuse from "fuse.js";
import { normalizeName } from "./normalize";
import type { CanonicalProduct, Product } from "./scrapers/types";

/**
 * Merge Carrefour and La Reina product lists into canonical products.
 *
 * Matching strategy:
 * 1. Primary: match by EAN (exact)
 * 2. Secondary: fuzzy match by normalized name (threshold 0.35)
 *
 * La Reina products come pre-fetched by EAN from Carrefour results,
 * so in most cases matching is direct EAN-to-EAN.
 */
export function matchProducts(
  carrefourItems: Product[],
  laReinaItems: Product[]
): CanonicalProduct[] {
  // Build EAN map for La Reina
  const laReinaByEan = new Map<string, Product>();
  const laReinaUnmatched: Product[] = [];

  for (const p of laReinaItems) {
    if (p.ean) {
      laReinaByEan.set(p.ean, p);
    } else {
      laReinaUnmatched.push(p);
    }
  }

  const canonical: CanonicalProduct[] = [];
  const usedLaReinaEans = new Set<string>();

  // For each Carrefour product, find its La Reina counterpart
  for (const cp of carrefourItems) {
    const canon: CanonicalProduct = {
      name: cp.name,
      brand: cp.brand,
      ean: cp.ean,
      imageUrl: cp.imageUrl,
      carrefour: cp,
    };

    // EAN match
    if (cp.ean && laReinaByEan.has(cp.ean)) {
      const lr = laReinaByEan.get(cp.ean)!;
      canon.lareina = lr;
      usedLaReinaEans.add(cp.ean);
    }

    canonical.push(canon);
  }

  // Fuzzy match: only La Reina items with no EAN (rare) against canonical names.
  // We intentionally skip EAN-having La Reina products that didn't match —
  // different EAN = different product, don't fuzzy-match across brands.
  const unmatchedLaReina = laReinaUnmatched; // only those with no EAN at all

  if (unmatchedLaReina.length > 0 && canonical.length > 0) {
    const fuseItems = canonical.map((c, i) => ({
      i,
      norm: normalizeName(c.name),
    }));

    // Tight threshold — only match when names are very similar
    const fuse = new Fuse(fuseItems, {
      keys: ["norm"],
      threshold: 0.2,
      includeScore: true,
    });

    for (const lr of unmatchedLaReina) {
      const normLr = normalizeName(lr.name);
      const hits = fuse.search(normLr);
      if (hits.length > 0 && !canonical[hits[0].item.i].lareina) {
        canonical[hits[0].item.i].lareina = lr;
      } else {
        canonical.push({
          name: lr.name,
          brand: lr.brand,
          ean: lr.ean,
          imageUrl: lr.imageUrl,
          lareina: lr,
        });
      }
    }
  }

  // La Reina EAN products that didn't match any Carrefour EAN → show as La Reina-only
  for (const lr of [...laReinaByEan.values()]) {
    if (!usedLaReinaEans.has(lr.ean!)) {
      canonical.push({
        name: lr.name,
        brand: lr.brand,
        ean: lr.ean,
        imageUrl: lr.imageUrl,
        lareina: lr,
      });
    }
  }

  return canonical;
}
