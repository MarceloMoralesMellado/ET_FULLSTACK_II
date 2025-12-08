import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import PocketBase from "pocketbase"
import { obtenerCategoriaAPI, actualizarCategoriaAPI, eliminarCategoriaAPI } from "@/lib/api/categorias"

async function createAuthClient() {
  const cookieStore = await cookies()
  const pbAuthCookie = cookieStore.get("pb_auth")
  const pb = new PocketBase("http://127.0.0.1:8090")

  if (pbAuthCookie) {
    try {
      const decoded = decodeURIComponent(pbAuthCookie.value)
      pb.authStore.save(decoded, null)
    } catch (e) {
      pb.authStore.loadFromCookie(pbAuthCookie.value)
    }
  }
  return pb
}

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const pb = await createAuthClient()
    const categoria = await obtenerCategoriaAPI(id, pb)
    return NextResponse.json(categoria)
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Error al obtener categoría" }, { status: 500 })
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const pb = await createAuthClient()
    const data = await request.json()
    const categoria = await actualizarCategoriaAPI(id, data, pb)
    return NextResponse.json(categoria)
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Error al actualizar categoría" }, { status: 500 })
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const pb = await createAuthClient()
    await eliminarCategoriaAPI(id, pb)
    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Error al eliminar categoría" }, { status: 500 })
  }
}
