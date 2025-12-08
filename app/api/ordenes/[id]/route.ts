import { NextResponse } from "next/server"
import { obtenerOrdenAPI, actualizarEstadoOrdenAPI, eliminarOrdenAPI } from "@/lib/api/ordenes"
import PocketBase from "pocketbase"
import { cookies } from "next/headers"

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
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

    // Intentar refrescar para obtener el modelo de usuario si el token es válido
    if (pb.authStore.isValid && !pb.authStore.model) {
      try {
        await pb.collection("users").authRefresh()
      } catch (e) {
        console.warn("⚠️ API Orden: Could not refresh auth:", e)
      }
    }

    const orden = await obtenerOrdenAPI(id, pb)
    return NextResponse.json(orden)
  } catch (error: any) {
    console.error("[v0] API Error:", error)
    return NextResponse.json({ error: error.message || "Error al obtener orden" }, { status: 500 })
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const { estado } = await request.json()
    const orden = await actualizarEstadoOrdenAPI(id, estado)
    return NextResponse.json(orden)
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Error al actualizar orden" }, { status: 500 })
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    await eliminarOrdenAPI(id)
    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Error al eliminar orden" }, { status: 500 })
  }
}
