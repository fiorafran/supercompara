import * as cheerio from "cheerio";
import { parseArsPrice, formatArsPrice } from "../normalize";
import type { Product } from "./types";

const BASE_URL = "https://www.lareinaonline.com.ar";
const TIMEOUT_MS = 8000;
const EAN_CONCURRENCY = 5;

const HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
  Accept:
    "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
  "Accept-Language": "es-AR,es;q=0.9",
};

/**
 * Fetch a single La Reina product by EAN.
 * URL: /productosdet.asp?Pr=<EAN>&P=1
 * Price selector: div.TotPreTik  →  "$5.593,<b>00</b>"
 * Name selector:  div.DetallDesc b  →  "galletitas relleno vainilla oreo  354 gr"
 */
async function fetchByEan(ean: string): Promise<Product | null> {
  const url = `${BASE_URL}/productosdet.asp?Pr=${ean}&P=1`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const res = await fetch(url, { headers: HEADERS, signal: controller.signal });
    if (!res.ok) return null;
    const html = await res.text();
    return parseProductPage(html, ean, url);
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

function parseProductPage(html: string, ean: string, url: string): Product | null {
  const $ = cheerio.load(html);

  // Price: div.TotPreTik contains "$5.593,<b>00</b>"
  const priceEl = $(".TotPreTik");
  if (!priceEl.length) return null;

  // Get full text including the bold cents
  const priceHtml = priceEl.html() ?? "";
  // Strip tags, normalize: "$5.593,00"
  const priceText = priceHtml.replace(/<[^>]+>/g, "").replace(/\s+/g, "").trim();
  const price = parseArsPrice(priceText);
  if (price <= 0) return null;

  // Name: div.DetallDesc > b
  const nameEl = $(".DetallDesc b").first();
  const name = nameEl.text().trim();
  if (!name) return null;

  const imageUrl = `${BASE_URL}/Fotos/Articulos/${ean}.jpg`;

  return {
    source: "lareina",
    name,
    brand: "",
    ean,
    price,
    priceDisplay: formatArsPrice(price),
    url,
    imageUrl,
  };
}

/**
 * For each EAN from Carrefour results, look up the product on La Reina.
 * Runs with limited concurrency to avoid hammering the server.
 */
export async function searchLaReinaByEans(eans: string[]): Promise<Product[]> {
  const results: Product[] = [];

  for (let i = 0; i < eans.length; i += EAN_CONCURRENCY) {
    const batch = eans.slice(i, i + EAN_CONCURRENCY);
    const settled = await Promise.allSettled(batch.map(fetchByEan));
    for (const r of settled) {
      if (r.status === "fulfilled" && r.value) {
        results.push(r.value);
      }
    }
  }

  return results;
}
