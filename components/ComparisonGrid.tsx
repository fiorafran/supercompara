import Image from "next/image";
import type { CanonicalProduct, SupermarketSource } from "@/lib/scrapers/types";
import { SUPERMARKET_META } from "@/lib/scrapers/types";
import { ProductCard, EmptyCard } from "./ProductCard";

interface ComparisonGridProps {
  products: CanonicalProduct[];
  selected: Set<SupermarketSource>;
}

export function ComparisonGrid({ products, selected }: ComparisonGridProps) {
  const selectedArr = (["carrefour", "coto", "lareina"] as SupermarketSource[]).filter((s) =>
    selected.has(s)
  );

  // Split: products visible in ≥2 selected supers vs only 1
  const withComparison = products.filter(
    (p) => selectedArr.filter((s) => p[s]).length >= 2
  );
  const withoutComparison = products.filter(
    (p) => selectedArr.filter((s) => p[s]).length === 1
  );

  // Group "only in X" by source
  const onlyInGroups = new Map<SupermarketSource, CanonicalProduct[]>();
  for (const src of selectedArr) {
    const group = withoutComparison.filter((p) => p[src]);
    if (group.length > 0) onlyInGroups.set(src, group);
  }

  if (withComparison.length === 0 && withoutComparison.length === 0) {
    return (
      <div className="text-center py-12 text-gray-400 text-sm">
        Ningún producto disponible para los supermercados seleccionados.
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {withComparison.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-3">
            Comparación directa ({withComparison.length})
          </h2>
          <div className="space-y-3">
            {withComparison.map((p, i) => (
              <ProductRow key={p.ean ?? `${p.name}-${i}`} product={p} sources={selectedArr} />
            ))}
          </div>
        </section>
      )}

      {[...onlyInGroups.entries()].map(([src, group]) => (
        <section key={src}>
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-3">
            Solo en {SUPERMARKET_META[src].name} ({group.length})
          </h2>
          <div className="space-y-3">
            {group.map((p, i) => (
              <ProductRow key={p.ean ?? `${p.name}-${src}-${i}`} product={p} sources={selectedArr} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

function ProductRow({
  product,
  sources,
}: {
  product: CanonicalProduct;
  sources: SupermarketSource[];
}) {
  // Find cheapest among selected sources that have the product
  const available = sources.filter((s) => product[s]);
  const cheapest =
    available.length >= 2
      ? available.reduce((best, s) =>
          product[s]!.price < product[best]!.price ? s : best
        )
      : null;

  const prices = available.map((s) => product[s]!.price);
  const maxPrice = Math.max(...prices);
  const minPrice = Math.min(...prices);
  const savingsPct =
    available.length >= 2 && maxPrice > 0
      ? Math.round(((maxPrice - minPrice) / maxPrice) * 100)
      : 0;

  // Grid: 2 or 3 cols depending on how many supers selected
  const colClass =
    sources.length === 3
      ? "grid grid-cols-3 gap-2"
      : "grid grid-cols-2 gap-3";

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
      {/* Product header */}
      <div className="flex items-start gap-3 mb-4">
        {product.imageUrl && (
          <div className="relative w-14 h-14 flex-shrink-0 rounded-lg overflow-hidden bg-gray-50 border border-gray-100">
            <Image
              src={product.imageUrl}
              alt={product.name}
              fill
              className="object-contain p-1"
              sizes="56px"
            />
          </div>
        )}

        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-800 leading-tight line-clamp-2 text-sm">
            {product.name}
          </h3>
          {product.brand && (
            <p className="text-xs text-gray-500 mt-0.5">{product.brand}</p>
          )}
          {product.ean && (
            <p className="text-xs text-gray-300 mt-0.5">EAN: {product.ean}</p>
          )}
        </div>

        {savingsPct > 0 && (
          <div className="flex-shrink-0">
            <div className="text-xs text-green-700 font-semibold bg-green-100 px-2 py-1 rounded-lg whitespace-nowrap">
              {savingsPct}% dif.
            </div>
          </div>
        )}
      </div>

      {/* Price columns */}
      <div className={colClass}>
        {sources.map((src) =>
          product[src] ? (
            <ProductCard
              key={src}
              product={product[src]!}
              isCheapest={cheapest === src}
              compact={sources.length === 3}
            />
          ) : (
            <EmptyCard key={src} source={src} />
          )
        )}
      </div>
    </div>
  );
}
