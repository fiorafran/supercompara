import Fuse from "fuse.js";
import { normalizeName } from "./normalize";
import type { CanonicalProduct, Product } from "./scrapers/types";

/**
 * Merge products from all supermarkets into canonical products.
 *
 * Matching strategy:
 * 1. Primary: exact EAN match (Carrefour always has EAN; La Reina fetched by EAN)
 * 2. Secondary: fuzzy name match for products without EAN (Coto, rare La Reina)
 *    — only matches when name similarity is high (threshold 0.2)
 *    — never fuzzy-matches an EAN-bearing product (avoids cross-brand false matches)
 */
export function matchProducts(allProducts: Product[]): CanonicalProduct[] {
  const byEan = new Map<string, CanonicalProduct>();
  const noEanProducts: Product[] = [];

  // Pass 1: Build canonical map by EAN
  for (const p of allProducts) {
    if (!p.ean) {
      noEanProducts.push(p);
      continue;
    }

    if (!byEan.has(p.ean)) {
      byEan.set(p.ean, {
        name: p.name,
        brand: p.brand,
        ean: p.ean,
        imageUrl: p.imageUrl,
      });
    }

    const canon = byEan.get(p.ean)!;

    // Prefer Carrefour for display metadata
    if (p.source === "carrefour") {
      canon.name = p.name;
      canon.brand = p.brand;
      canon.imageUrl = p.imageUrl ?? canon.imageUrl;
    } else if (!canon.imageUrl) {
      canon.imageUrl = p.imageUrl;
    }

    // Assign to source slot (first write wins)
    if (p.source === "carrefour" && !canon.carrefour) canon.carrefour = p;
    else if (p.source === "lareina" && !canon.lareina) canon.lareina = p;
    else if (p.source === "coto" && !canon.coto) canon.coto = p;
  }

  const canonical = [...byEan.values()];

  // Pass 2: Fuzzy-match no-EAN products (Coto + rare La Reina) against canonical names
  if (noEanProducts.length > 0 && canonical.length > 0) {
    const fuseItems = canonical.map((c, i) => ({
      i,
      norm: normalizeName(c.name),
    }));

    const fuse = new Fuse(fuseItems, {
      keys: ["norm"],
      threshold: 0.2,
      includeScore: true,
    });

    for (const p of noEanProducts) {
      const norm = normalizeName(p.name);
      const hits = fuse.search(norm);

      const slotFree =
        hits.length > 0 && !canonical[hits[0].item.i][p.source];

      if (slotFree) {
        const canon = canonical[hits[0].item.i];
        if (p.source === "coto") {
          canon.coto = p;
          // If canon has no image, use Coto's
          if (!canon.imageUrl) canon.imageUrl = p.imageUrl;
        } else if (p.source === "lareina") {
          canon.lareina = p;
        }
      } else {
        // No match or slot taken — show as standalone
        const standalone: CanonicalProduct = {
          name: p.name,
          brand: p.brand,
          imageUrl: p.imageUrl,
        };
        standalone[p.source] = p;
        canonical.push(standalone);
      }
    }
  } else {
    // No canonicals yet — each no-EAN product is its own entry
    for (const p of noEanProducts) {
      const standalone: CanonicalProduct = {
        name: p.name,
        brand: p.brand,
        imageUrl: p.imageUrl,
      };
      standalone[p.source] = p;
      canonical.push(standalone);
    }
  }

  return canonical;
}
