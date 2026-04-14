"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, FormEvent } from "react";

interface SearchBarProps {
  defaultValue?: string;
  autoFocus?: boolean;
}

export function SearchBar({ defaultValue = "", autoFocus }: SearchBarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [value, setValue] = useState(defaultValue);
  const [isLoading, setIsLoading] = useState(false);

  const currentQuery = searchParams.get("q") ?? "";

  useEffect(() => {
    setIsLoading(false);
  }, [currentQuery]);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const q = value.trim();
    if (q.length < 2) return;
    setIsLoading(true);
    router.push(`/resultados?q=${encodeURIComponent(q)}`);
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <input
        type="search"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Buscá un producto... ej: coca cola 2.25"
        autoFocus={autoFocus}
        className="flex-1 px-4 py-3 text-base border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
        minLength={2}
        maxLength={200}
      />
      <button
        type="submit"
        disabled={isLoading}
        className="px-6 py-3 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 active:bg-blue-800 transition-colors shadow-sm whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
      >
        {isLoading ? (
          <>
            <div className="inline-block animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
            Buscando...
          </>
        ) : (
          "Buscar"
        )}
      </button>
    </form>
  );
}
