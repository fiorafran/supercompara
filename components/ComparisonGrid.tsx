import Image from "next/image";
import type { CanonicalProduct } from "@/lib/scrapers/types";
import { ProductCard, EmptyCard } from "./ProductCard";

interface ComparisonGridProps {
  products: CanonicalProduct[];
}

export function ComparisonGrid({ products }: ComparisonGridProps) {
  const both = products.filter((p) => p.carrefour && p.lareina);
  const carrefourOnly = products.filter((p) => p.carrefour && !p.lareina);
  const laReinaOnly = products.filter((p) => !p.carrefour && p.lareina);

  return (
    <div className="space-y-8">
      {both.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-3">
            Comparación directa ({both.length})
          </h2>
          <div className="space-y-3">
            {both.map((p) => (
              <ProductRow key={p.ean ?? p.name} product={p} />
            ))}
          </div>
        </section>
      )}

      {carrefourOnly.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-3">
            Solo en Carrefour ({carrefourOnly.length})
          </h2>
          <div className="space-y-3">
            {carrefourOnly.map((p) => (
              <ProductRow key={p.ean ?? p.name} product={p} />
            ))}
          </div>
        </section>
      )}

      {laReinaOnly.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-3">
            Solo en La Reina ({laReinaOnly.length})
          </h2>
          <div className="space-y-3">
            {laReinaOnly.map((p) => (
              <ProductRow key={p.ean ?? p.name} product={p} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function ProductRow({ product }: { product: CanonicalProduct }) {
  const { carrefour, lareina } = product;

  const isCheapestCarrefour =
    carrefour && lareina
      ? carrefour.price <= lareina.price
      : false;
  const isCheapestLaReina =
    carrefour && lareina
      ? lareina.price < carrefour.price
      : false;

  const savings =
    carrefour && lareina
      ? Math.abs(carrefour.price - lareina.price)
      : 0;

  const savingsPct =
    carrefour && lareina
      ? Math.round(
          (savings / Math.max(carrefour.price, lareina.price)) * 100
        )
      : 0;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
      {/* Product header */}
      <div className="flex items-start gap-3 mb-4">
        {product.imageUrl && (
          <div className="relative w-16 h-16 flex-shrink-0 rounded-lg overflow-hidden bg-gray-50 border border-gray-100">
            <Image
              src={product.imageUrl}
              alt={product.name}
              fill
              className="object-contain p-1"
              sizes="64px"
            />
          </div>
        )}

        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-800 leading-tight line-clamp-2">
            {product.name}
          </h3>
          {product.brand && (
            <p className="text-sm text-gray-500 mt-0.5">{product.brand}</p>
          )}
          {product.ean && (
            <p className="text-xs text-gray-300 mt-0.5">EAN: {product.ean}</p>
          )}
        </div>

        {savingsPct > 0 && (
          <div className="flex-shrink-0 text-right">
            <div className="text-xs text-green-700 font-semibold bg-green-100 px-2 py-1 rounded-lg">
              {savingsPct}% diferencia
            </div>
          </div>
        )}
      </div>

      {/* Price comparison */}
      <div className="grid grid-cols-2 gap-3">
        {carrefour ? (
          <ProductCard product={carrefour} isCheapest={isCheapestCarrefour} />
        ) : (
          <EmptyCard source="carrefour" />
        )}
        {lareina ? (
          <ProductCard product={lareina} isCheapest={isCheapestLaReina} />
        ) : (
          <EmptyCard source="lareina" />
        )}
      </div>
    </div>
  );
}
