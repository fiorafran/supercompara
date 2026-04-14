import type { Product } from "@/lib/scrapers/types";

const LOGOS: Record<string, string> = {
  carrefour: "🔵",
  lareina: "🟡",
};

const NAMES: Record<string, string> = {
  carrefour: "Carrefour",
  lareina: "La Reina",
};

interface ProductCardProps {
  product: Product;
  isCheapest?: boolean;
}

export function ProductCard({ product, isCheapest }: ProductCardProps) {
  return (
    <a
      href={product.url}
      target="_blank"
      rel="noopener noreferrer"
      className={`
        flex flex-col p-3 rounded-xl border transition-all hover:shadow-md
        ${isCheapest
          ? "border-green-400 bg-green-50 hover:border-green-500"
          : "border-gray-200 bg-white hover:border-blue-300"
        }
      `}
    >
      {/* Store name row */}
      <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-1">
        <span>{LOGOS[product.source]}</span>
        <span className="font-medium truncate">{NAMES[product.source]}</span>
      </div>

      {/* Badge row — always present (hidden if not cheapest) to keep layout stable */}
      <div className="h-5 mb-1">
        {isCheapest && (
          <span className="inline-block text-green-700 font-semibold bg-green-100 px-2 py-0.5 rounded-full text-xs leading-tight">
            Más barato
          </span>
        )}
      </div>

      {/* Price — same vertical position in both cards */}
      <div className="text-xl font-bold text-gray-900 leading-tight">
        {product.priceDisplay}
      </div>

      <div className="mt-auto pt-2 text-xs text-blue-600 hover:underline">
        Ver en sitio →
      </div>
    </a>
  );
}

export function EmptyCard({ source }: { source: "carrefour" | "lareina" }) {
  return (
    <div className="p-4 rounded-xl border border-dashed border-gray-200 bg-gray-50 text-center">
      <div className="text-xs text-gray-400 mb-1">
        {LOGOS[source]} {NAMES[source]}
      </div>
      <div className="text-sm text-gray-400">No disponible</div>
    </div>
  );
}
