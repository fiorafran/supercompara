import { SearchBar } from "@/components/SearchBar";
import { Suspense } from "react";

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] px-4">
      <div className="w-full max-w-2xl text-center">
        <h1 className="text-4xl font-bold text-gray-800 mb-2">
          Compará precios
        </h1>
        <p className="text-gray-500 mb-8 text-lg">
          Carrefour vs La Reina vs Coto · Rosario
        </p>

        <Suspense
          fallback={
            <div className="w-full h-[52px] rounded-xl border border-gray-200 bg-white" />
          }
        >
          <SearchBar autoFocus />
        </Suspense>

        <div className="mt-6 flex flex-wrap justify-center gap-2 text-sm">
          {[
            "coca cola 2,25",
            "leche la serenísima",
            "aceite girasol",
            "fideos spaghetti",
            "yerba mate",
          ].map((s) => (
            <a
              key={s}
              href={`/resultados?q=${encodeURIComponent(s)}`}
              className="px-3 py-1.5 bg-white border border-gray-200 rounded-full text-gray-600 hover:border-blue-400 hover:text-blue-600 transition-colors"
            >
              {s}
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
