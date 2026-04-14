import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ShoppingListPanel } from "@/components/ShoppingListPanel";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "SuperCompara Rosario",
  description:
    "Compará precios de supermercados en Rosario: Carrefour y La Reina",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body className={inter.className}>
        <header className="bg-white border-b border-gray-200 shadow-sm">
          <div className="max-w-6xl mx-auto px-4 py-3 flex items-center gap-3">
            <a href="/" className="flex items-center gap-2">
              <span className="text-2xl">🛒</span>
              <span className="font-bold text-lg text-gray-800">
                SuperCompara
              </span>
              <span className="text-sm text-gray-400 font-normal hidden sm:block">
                Rosario
              </span>
            </a>
          </div>
        </header>
        <main className="min-h-screen">{children}</main>
        <ShoppingListPanel />
        <footer className="border-t border-gray-200 mt-16 py-6 text-center text-sm text-gray-400">
          Precios actualizados al momento de la búsqueda · Carrefour, Coto y La Reina ·
          Rosario, Santa Fe
        </footer>
      </body>
    </html>
  );
}
