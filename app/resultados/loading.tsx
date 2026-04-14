export default function Loading() {
  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <div className="mb-6">
        {/* Placeholder for SearchBar, but since it's client component, maybe just space */}
        <div className="h-12 bg-gray-100 rounded-xl animate-pulse"></div>
      </div>
      <div className="text-center py-16 text-gray-400">
        <div className="inline-block animate-spin text-4xl mb-4">⚙️</div>
        <p>Buscando en Carrefour y La Reina...</p>
      </div>
    </div>
  );
}