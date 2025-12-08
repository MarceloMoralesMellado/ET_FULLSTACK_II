import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import PocketBase from "pocketbase"

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params
        const body = await request.json()
        const cookieStore = await cookies()
        const pbAuthCookie = cookieStore.get("pb_auth")

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

        // Verificar si es admin
        if (!pb.authStore.isValid || pb.authStore.model?.rol !== "admin") {
            return NextResponse.json({ error: "No tienes permisos de administrador" }, { status: 403 })
        }

        // Actualizar usuario
        try {
            const record = await pb.collection("users").update(id, body)
            return NextResponse.json(record)
        } catch (error: any) {
            console.error("❌ API Usuarios PUT Error:", error)
            return NextResponse.json(
                { error: error.message || "Error al actualizar usuario" },
                { status: error.status || 500 }
            )
        }
    } catch (error: any) {
        console.error("❌ API Usuarios PUT Error Crítico:", error)
        return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
    }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params
        const cookieStore = await cookies()
        const pbAuthCookie = cookieStore.get("pb_auth")

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

        // Verificar si es admin
        if (!pb.authStore.isValid || pb.authStore.model?.rol !== "admin") {
            return NextResponse.json({ error: "No tienes permisos de administrador" }, { status: 403 })
        }

        // Eliminar usuario
        try {
            await pb.collection("users").delete(id)
            return NextResponse.json({ success: true })
        } catch (error: any) {
            console.error("❌ API Usuarios DELETE Error:", error)
            return NextResponse.json(
                { error: error.message || "Error al eliminar usuario" },
                { status: error.status || 500 }
            )
        }
    } catch (error: any) {
        console.error("❌ API Usuarios DELETE Error Crítico:", error)
        return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
    }
}
