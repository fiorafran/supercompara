import type { Product, SupermarketSource } from "@/lib/scrapers/types";
import { SUPERMARKET_META } from "@/lib/scrapers/types";

interface ProductCardProps {
  product: Product;
  isCheapest?: boolean;
  compact?: boolean;
}

export function ProductCard({ product, isCheapest, compact }: ProductCardProps) {
  const meta = SUPERMARKET_META[product.source];

  return (
    <a
      href={product.url}
      target="_blank"
      rel="noopener noreferrer"
      className={`
        flex flex-col rounded-xl border transition-all hover:shadow-md
        ${compact ? "p-2" : "p-3"}
        ${isCheapest
          ? "border-green-400 bg-green-50 hover:border-green-500"
          : "border-gray-200 bg-white hover:border-blue-300"
        }
      `}
    >
      {/* Store name */}
      <div className={`flex items-center gap-1 text-gray-500 mb-1 ${compact ? "text-xs" : "text-xs"}`}>
        <span>{meta.dot}</span>
        <span className="font-medium truncate">{meta.name}</span>
      </div>

      {/* Badge row — fixed height to keep prices aligned */}
      <div className="h-5 mb-1">
        {isCheapest && (
          <span className="inline-block text-green-700 font-semibold bg-green-100 px-2 py-0.5 rounded-full text-xs leading-tight">
            Más barato
          </span>
        )}
      </div>

      {/* Price */}
      <div className={`font-bold text-gray-900 leading-tight ${compact ? "text-base" : "text-xl"}`}>
        {product.priceDisplay}
      </div>

      <div className={`mt-auto pt-1.5 text-blue-600 hover:underline ${compact ? "text-xs" : "text-xs"}`}>
        Ver en sitio →
      </div>
    </a>
  );
}

export function EmptyCard({ source }: { source: SupermarketSource }) {
  const meta = SUPERMARKET_META[source];
  return (
    <div className="p-3 rounded-xl border border-dashed border-gray-200 bg-gray-50 text-center">
      <div className="text-xs text-gray-400 mb-1">
        {meta.dot} {meta.name}
      </div>
      <div className="text-sm text-gray-400">No disponible</div>
    </div>
  );
}
