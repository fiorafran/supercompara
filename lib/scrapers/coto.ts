import { formatArsPrice } from "../normalize";
import type { Product } from "./types";

const SITE_BASE = "https://www.cotodigital.com.ar/sitios/cdigi";
const CNSTRC_KEY = "key_r6xzz4IAoTWcipni";
const CONCURRENCY = 5;

const HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
  Accept: "application/json",
  Referer: "https://www.cotodigital.com.ar/",
};

// ─── Types ────────────────────────────────────────────────────────────────────

interface CnstrcData {
  sku_plu?: string | number;
  image_url?: string;
  product_brand?: string;
  sku_display_name?: string;
  [key: string]: unknown;
}

interface CnstrcResult {
  value?: string;
  data?: CnstrcData;
}

interface AtgProductResponse {
  contents?: Array<{
    Main?: Array<{
      "@type"?: string;
      record?: {
        attributes?: Record<string, string[]>;
      };
    }>;
  }>;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function slugify(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-");
}

function padPlu(plu: string | number): string {
  return String(plu).padStart(8, "0");
}

// ─── ATG product detail (EAN + verified price + correct URL) ──────────────────

interface AtgDetail {
  ean?: string;
  price?: number;
  productUrl: string;
}

async function fetchAtgDetail(plu: string | number, name: string): Promise<AtgDetail | null> {
  const id = padPlu(plu);
  const slug = slugify(name);
  const path = `/productos/${slug}/_/R-${id}-${id}-200`;
  const url = `${SITE_BASE}${path}?format=json`;
  const productUrl = `${SITE_BASE}${path}`;

  try {
    const res = await fetch(url, {
      headers: HEADERS,
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return { productUrl };

    const json: AtgProductResponse = await res.json();
    const main = json?.contents?.[0]?.Main;
    if (!main) return { productUrl };

    // Find the Product_Detail cartridge (index 0 for product pages)
    const detail = main.find((m) => m["@type"] === "Product_Detail") ?? main[0];
    const attrs = detail?.record?.attributes;
    if (!attrs) return { productUrl };

    const ean = attrs["product.eanPrincipal"]?.[0];
    const priceStr = attrs["sku.activePrice"]?.[0];
    const price = priceStr ? parseFloat(priceStr) : undefined;

    return {
      ean: ean && ean.length >= 8 ? ean : undefined,
      price: price && price > 0 ? price : undefined,
      productUrl,
    };
  } catch {
    return { productUrl: `${SITE_BASE}/productos/${slug}/_/R-${id}-${id}-200` };
  }
}

// ─── Constructor.io search ────────────────────────────────────────────────────

async function searchConstructorIo(query: string): Promise<CnstrcResult[]> {
  const url =
    `https://ac.cnstrc.com/search/${encodeURIComponent(query)}` +
    `?key=${CNSTRC_KEY}&num_results_per_page=24&page=1&c=ciojs-client-2.30.0`;

  const res = await fetch(url, {
    headers: HEADERS,
    signal: AbortSignal.timeout(10000),
  });
  if (!res.ok) throw new Error(`Constructor.io HTTP ${res.status}`);

  const json = (await res.json()) as { response?: { results?: CnstrcResult[] } };
  return json.response?.results ?? [];
}

// ─── Public API ───────────────────────────────────────────────────────────────

export async function searchCoto(query: string): Promise<Product[]> {
  const cnstrcItems = await searchConstructorIo(query);

  const products: Product[] = [];
  const seenEans = new Set<string>();

  // Batch-fetch ATG detail (EAN + price) for each Constructor.io result
  for (let i = 0; i < cnstrcItems.length; i += CONCURRENCY) {
    const batch = cnstrcItems.slice(i, i + CONCURRENCY);

    const settled = await Promise.allSettled(
      batch.map(async (item) => {
        const data = item.data ?? {};
        const plu = data.sku_plu;
        if (!plu) return null;

        const name = (data.sku_display_name || item.value)?.trim();
        if (!name) return null;

        const atg = await fetchAtgDetail(plu, name);
        if (!atg) return null;

        // Deduplicate by EAN
        if (atg.ean) {
          if (seenEans.has(atg.ean)) return null;
          seenEans.add(atg.ean);
        }

        const price = atg.price ?? 0;
        if (price <= 0) return null;

        const brand = (data.product_brand as string | undefined)?.trim() ?? "";
        const imageUrl = (data.image_url as string | undefined) || undefined;

        return {
          source: "coto" as const,
          name,
          brand,
          ean: atg.ean,
          price,
          priceDisplay: formatArsPrice(price),
          url: atg.productUrl,
          imageUrl,
        } satisfies Product;
      })
    );

    for (const result of settled) {
      if (result.status === "fulfilled" && result.value) {
        products.push(result.value);
      }
    }
  }

  return products;
}
