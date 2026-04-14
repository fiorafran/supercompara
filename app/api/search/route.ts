import { NextRequest, NextResponse } from "next/server";
import { searchAll } from "@/lib/search";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q")?.trim() ?? "";

  if (!q || q.length < 2) {
    return NextResponse.json(
      { error: "Ingresá al menos 2 caracteres para buscar." },
      { status: 400 }
    );
  }

  if (q.length > 200) {
    return NextResponse.json({ error: "Búsqueda demasiado larga." }, { status: 400 });
  }

  try {
    const result = await searchAll(q);
    return NextResponse.json(result);
  } catch (e) {
    console.error("[search]", e);
    return NextResponse.json(
      { error: "Error al buscar. Intentá de nuevo." },
      { status: 500 }
    );
  }
}
