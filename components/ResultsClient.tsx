"use client";

import { useState } from "react";
import { ComparisonGrid } from "./ComparisonGrid";
import type { CanonicalProduct, SupermarketSource } from "@/lib/scrapers/types";
import { ALL_SOURCES, SUPERMARKET_META } from "@/lib/scrapers/types";

interface ResultsClientProps {
  products: CanonicalProduct[];
}

export function ResultsClient({ products }: ResultsClientProps) {
  const [selected, setSelected] = useState<Set<SupermarketSource>>(
    new Set(ALL_SOURCES)
  );

  function toggle(src: SupermarketSource) {
    setSelected((prev) => {
      if (prev.size === 1 && prev.has(src)) return prev; // keep ≥1
      const next = new Set(prev);
      next.has(src) ? next.delete(src) : next.add(src);
      return next;
    });
  }

  return (
    <div>
      {/* Supermarket filter pills */}
      <div className="flex flex-wrap gap-2 mb-5">
        {ALL_SOURCES.map((src) => {
          const meta = SUPERMARKET_META[src];
          const active = selected.has(src);
          return (
            <button
              key={src}
              onClick={() => toggle(src)}
              className={`
                flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium
                border transition-all
                ${active
                  ? "bg-gray-800 text-white border-gray-800"
                  : "bg-white text-gray-400 border-gray-200 hover:border-gray-400"
                }
              `}
            >
              <span>{meta.dot}</span>
              <span>{meta.name}</span>
            </button>
          );
        })}
      </div>

      <ComparisonGrid products={products} selected={selected} />
    </div>
  );
}
