# SuperCompara

App web para comparar precios entre **Carrefour** y **La Reina** en Rosario.

## Requisitos

- Node.js 18+
- npm

## Ejecutar local

```bash
npm install
npm run dev
```

Abrir: `http://localhost:3000`

## Qué hace

- Buscás un producto.
- La app consulta Carrefour y La Reina.
- Muestra resultados comparados y cuál es más barato.

## Estructura básica

- `app/`: páginas y API route
- `components/`: UI
- `lib/`: lógica de búsqueda, scraping, cache y matching
