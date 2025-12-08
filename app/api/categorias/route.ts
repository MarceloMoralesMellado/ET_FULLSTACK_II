import { NextResponse } from "next/server"
import { obtenerCategoriasAPI, crearCategoriaAPI } from "@/lib/api/categorias"

import PocketBase from "pocketbase"
import { cookies } from "next/headers"

export async function GET() {
  try {
    const cookieStore = await cookies()
    const pbAuthCookie = cookieStore.get("pb_auth")

    // Crear cliente PB autenticado
    const pb = new PocketBase("http://127.0.0.1:8090")
    if (pbAuthCookie) {
      const encoded = pbAuthCookie.value
      try {
        const decoded = decodeURIComponent(encoded)
        pb.authStore.save(decoded, null)
      } catch (e) {
        pb.authStore.loadFromCookie(pbAuthCookie.value)
      }
    }

    const categorias = await obtenerCategoriasAPI(pb)
    return NextResponse.json(categorias)
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Error al obtener categorías" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies()
    const pbAuthCookie = cookieStore.get("pb_auth")

    // Crear cliente PB autenticado
    const pb = new PocketBase("http://127.0.0.1:8090")
    if (pbAuthCookie) {
      const encoded = pbAuthCookie.value
      try {
        const decoded = decodeURIComponent(encoded)
        pb.authStore.save(decoded, null)
      } catch (e) {
        pb.authStore.loadFromCookie(pbAuthCookie.value)
      }
    }

    // Debug: Verificar estado de autenticación
    console.log("🔍 API Categorias POST: Auth válida?", pb.authStore.isValid)
    console.log("🔍 API Categorias POST: Usuario ID:", pb.authStore.model?.id)
    console.log("🔍 API Categorias POST: Rol:", pb.authStore.model?.rol)

    const data = await request.json()
    const categoria = await crearCategoriaAPI(data, pb)
    return NextResponse.json(categoria, { status: 201 })
  } catch (error: any) {
    console.error("❌ API Categorias POST Error:", error)
    console.error("❌ API Categorias POST Detalles:", error.data)

    if (error.status === 403) {
      return NextResponse.json({
        error: "Permiso denegado. Revisa la regla 'Create' en la colección 'categorias'.",
        details: "Debes permitir que los usuarios autenticados (o admins) creen registros."
      }, { status: 403 })
    }

    return NextResponse.json({ error: error.message || "Error al crear categoría" }, { status: 500 })
  }
}
