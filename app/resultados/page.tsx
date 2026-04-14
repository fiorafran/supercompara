import { SearchBar } from "@/components/SearchBar";
import { ResultsClient } from "@/components/ResultsClient";
import { searchAll } from "@/lib/search";
import { Suspense } from "react";

interface PageProps {
  searchParams: Promise<{ q?: string }>;
}

async function Results({ query }: { query: string }) {
  const result = await searchAll(query);

  return (
    <div>
      {result.errors.length > 0 && (
        <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800">
          {result.errors.map((e) => (
            <div key={e.source}>
              <strong className="capitalize">{e.source}</strong>: {e.message}
            </div>
          ))}
        </div>
      )}

      {result.products.length === 0 ? (
        <div className="text-center py-16 text-gray-500">
          <p className="text-5xl mb-4">🔍</p>
          <p className="text-xl font-medium">Sin resultados para &ldquo;{query}&rdquo;</p>
          <p className="text-sm mt-2">
            Probá con otro término, marca o tamaño.
          </p>
        </div>
      ) : (
        <ResultsClient products={result.products} />
      )}
    </div>
  );
}

export default async function ResultsPage({ searchParams }: PageProps) {
  const { q } = await searchParams;
  const query = q?.trim() ?? "";

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <div className="mb-6">
        <Suspense
          fallback={
            <div className="w-full h-[52px] rounded-xl border border-gray-200 bg-white" />
          }
        >
          <SearchBar defaultValue={query} />
        </Suspense>
      </div>

      {query.length < 2 ? (
        <div className="text-center py-16 text-gray-400">
          Ingresá un producto para comparar precios.
        </div>
      ) : (
        <>
          <div className="mb-4 text-sm text-gray-500">
            Resultados para: <strong className="text-gray-700">{query}</strong>
          </div>
          <Results query={query} />
        </>
      )}
    </div>
  );
}
