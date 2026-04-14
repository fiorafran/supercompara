/**
 * Normalize a product name for fuzzy matching.
 * Lowercase, remove accents, collapse whitespace, strip common noise.
 */
export function normalizeName(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // strip diacritics
    .replace(/\s+x\s+/g, " ") // "6 x 1.5L" → "6 1.5L"
    .replace(/[^a-z0-9\s.,]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Parse Argentine price string "$1.553,00" → 1553 */
export function parseArsPrice(raw: string): number {
  const cleaned = raw
    .replace(/\$/g, "")
    .replace(/\./g, "")
    .replace(",", ".")
    .trim();
  const n = parseFloat(cleaned);
  return isNaN(n) ? 0 : n;
}

/** Format number as ARS display string */
export function formatArsPrice(price: number): string {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    minimumFractionDigits: 2,
  }).format(price);
}
