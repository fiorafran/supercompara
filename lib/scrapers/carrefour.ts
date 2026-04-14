import { formatArsPrice } from "../normalize";
import type { Product } from "./types";

const BASE_URL = "https://www.carrefour.com.ar";
const TIMEOUT_MS = 12000;

const HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
  Accept:
    "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
  "Accept-Language": "es-AR,es;q=0.9",
};

const API_HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
  Accept: "application/json",
  "Accept-Language": "es-AR,es;q=0.9",
};

// Intelligent Search API response types
interface ISImage {
  imageUrl: string;
}
interface ISOffer {
  Price?: number;
  spotPrice?: number;
  priceWithoutDiscount?: number;
  AvailableQuantity?: number;
}
interface ISSeller {
  commertialOffer?: ISOffer;
}
interface ISItem {
  ean?: string;
  images?: ISImage[];
  sellers?: ISSeller[];
}
interface ISProduct {
  productName: string;
  brand: string;
  linkText: string;
  link?: string;
  priceRange?: {
    sellingPrice?: { lowPrice?: number };
  };
  items?: ISItem[];
}
interface ISResponse {
  products?: ISProduct[];
  redirect?: string;
}

export async function searchCarrefour(query: string): Promise<Product[]> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    // Step 1: Intelligent Search API — may return products directly or a redirect
    const apiUrl = `${BASE_URL}/api/io/_v/api/intelligent-search/product_search/shelf?query=${encodeURIComponent(query)}&page=1&count=20`;
    const apiRes = await fetch(apiUrl, {
      headers: API_HEADERS,
      signal: controller.signal,
    });

    if (apiRes.ok) {
      const data = (await apiRes.json()) as ISResponse;

      // Products returned directly
      if (data.products && data.products.length > 0) {
        return data.products.flatMap(isProductToProduct);
      }

      // Redirect to category page — parse __STATE__ from HTML
      if (data.redirect) {
        const pageUrl = `${BASE_URL}${data.redirect}`;
        const pageRes = await fetch(pageUrl, {
          headers: HEADERS,
          signal: controller.signal,
        });
        if (!pageRes.ok) throw new Error(`Carrefour page ${pageRes.status}`);
        return parseCarrefourState(await pageRes.text());
      }
    }

    // Fallback: try full-text search page
    const ftUrl = `${BASE_URL}/${query.toLowerCase().replace(/\s+/g, "-")}?_q=${encodeURIComponent(query)}&map=ft`;
    const ftRes = await fetch(ftUrl, {
      headers: HEADERS,
      signal: controller.signal,
    });
    if (!ftRes.ok) throw new Error(`Carrefour ft ${ftRes.status}`);
    return parseCarrefourState(await ftRes.text());
  } finally {
    clearTimeout(timer);
  }
}

function isProductToProduct(p: ISProduct): Product[] {
  const item = p.items?.[0];
  if (!item) return [];

  const offer = item.sellers?.[0]?.commertialOffer;
  if (offer && (offer.AvailableQuantity ?? 0) === 0) return [];

  const price = pickBestPrice(p.priceRange?.sellingPrice?.lowPrice, offer);
  if (price <= 0) return [];

  const ean = item.ean || undefined;
  const imageUrl = item.images?.[0]?.imageUrl;
  // p.link = "/galletitas-oreo-354g-715951/p" — already has the /p suffix
  const link = p.link
    ? p.link.startsWith("http")
      ? p.link
      : `${BASE_URL}${p.link}`
    : `${BASE_URL}/${p.linkText}/p`;

  return [
    {
      source: "carrefour",
      name: p.productName,
      brand: p.brand,
      ean,
      price,
      priceDisplay: formatArsPrice(price),
      url: link,
      imageUrl,
    },
  ];
}

// ── HTML __STATE__ parser (for redirect paths) ──────────────────────────────

type StateMap = Record<string, Record<string, unknown>>;

function toPositiveNumber(value: unknown): number | undefined {
  if (typeof value !== "number" || !Number.isFinite(value) || value <= 0) {
    return undefined;
  }
  return value;
}

function pickBestPrice(
  lowPrice: number | undefined,
  offer?: Record<string, unknown> | ISOffer
): number {
  // In Carrefour VTEX, commertialOffer.Price usually reflects the effective price
  // shown to users (including promos). lowPrice can be list/base in some cases.
  const candidates = [
    toPositiveNumber(offer?.Price),
    toPositiveNumber((offer as Record<string, unknown> | undefined)?.spotPrice),
    toPositiveNumber(
      (offer as Record<string, unknown> | undefined)?.priceWithoutDiscount
    ),
    toPositiveNumber(lowPrice),
  ];
  return candidates.find((n) => n !== undefined) ?? 0;
}

function parseCarrefourState(html: string): Product[] {
  const templateIdx = html.indexOf('data-varname="__STATE__"');
  if (templateIdx === -1) return [];

  const braceStart = html.indexOf("{", templateIdx);
  if (braceStart === -1) return [];

  const scriptEnd = html.indexOf("</script>", braceStart);
  if (scriptEnd === -1) return [];

  let state: StateMap;
  try {
    state = JSON.parse(html.slice(braceStart, scriptEnd)) as StateMap;
  } catch {
    return [];
  }

  const products: Product[] = [];
  const productKeyRe = /^Product:sp-\d+-none$/;
  const seen = new Set<string>();

  for (const key of Object.keys(state)) {
    if (!productKeyRe.test(key)) continue;

    const p = state[key];
    const productName = p.productName as string | undefined;
    const brand = (p.brand as string | undefined) ?? "";
    const linkText = p.linkText as string | undefined;
    if (!productName || !linkText) continue;

    const itemKey = `${key}.items({"filter":"ALL_AVAILABLE"}).0`;
    const item = state[itemKey] as Record<string, unknown> | undefined;
    if (!item) continue;

    const ean = (item.ean as string | undefined) || undefined;
    if (ean && seen.has(ean)) continue;
    if (ean) seen.add(ean);

    const offerKey = `$${itemKey}.sellers.0.commertialOffer`;
    const offer = state[offerKey] as Record<string, unknown> | undefined;
    const availableQty = offer ? ((offer.AvailableQuantity as number) ?? 0) : 10000;
    if (availableQty <= 0) continue;

    const priceRangeKey = `$${key}.priceRange.sellingPrice`;
    const priceRange = state[priceRangeKey] as Record<string, number> | undefined;
    const price = pickBestPrice(priceRange?.lowPrice, offer);
    if (price <= 0) continue;

    let imageUrl: string | undefined;
    const images = item.images as Array<{ id?: string }> | undefined;
    if (images?.[0]?.id) {
      const imgEntry = state[images[0].id] as Record<string, string> | undefined;
      imageUrl = imgEntry?.imageUrl;
    }

    products.push({
      source: "carrefour",
      name: productName,
      brand,
      ean,
      price,
      priceDisplay: formatArsPrice(price),
      url: `${BASE_URL}/${linkText}/p`,
      imageUrl,
    });
  }

  return products;
}
