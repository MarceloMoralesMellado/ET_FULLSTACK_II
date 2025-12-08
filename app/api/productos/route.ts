import { NextResponse } from "next/server"
import { obtenerProductos, crearProducto } from "@/lib/api/productos"
import PocketBase from "pocketbase"
import { cookies } from "next/headers"

export async function GET() {
  try {
    const productos = await obtenerProductos()
    return NextResponse.json(productos)
  } catch (error) {
    console.error("[v0] Error en API de productos:", error)
    return NextResponse.json({ error: "Error obteniendo productos" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
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

    // Validar campos requeridos
    if (!body.nombre || !body.descripcion || !body.precio || !body.categoria) {
      return NextResponse.json({ error: "Campos requeridos: nombre, descripcion, precio, categoria" }, { status: 400 })
    }

    // Preparar datos para PocketBase
    const datosProducto = {
      nombre: body.nombre,
      descripcion: body.descripcion,
      precio: Number(body.precio),
      stock: Number(body.stock) || 0,
      categoria: body.categoria,
      imagen: body.imagen || "",
      unidad: body.unidad || "kg",
      disponible: body.activo !== false,
    }

    // DIAGNÓSTICO Y RECUPERACIÓN:
    // Verificar si podemos ver la categoría y obtener su nombre para soporte legacy
    let categoriaNombre = "";
    try {
      console.log(`🔍 Verificando acceso a categoría: ${body.categoria}`)
      const catRecord = await pb.collection("categorias").getOne(body.categoria)
      categoriaNombre = catRecord.nombre
      console.log("✅ Acceso a categoría confirmado. Nombre:", categoriaNombre)
    } catch (catError: any) {
      console.error("❌ No se puede acceder a la categoría:", catError)
      return NextResponse.json({
        error: "Error de Permisos en Categorías",
        details: `No se puede leer la categoría ${body.categoria}. Verifica la regla 'View' en la colección 'categorias'.`,
        originalError: catError.data
      }, { status: 403 })
    }

    // INTENTO 1: Usar el ID (Lo ideal para campos Relation)
    try {
      const producto = await crearProducto(datosProducto, pb)
      return NextResponse.json(producto, { status: 201 })
    } catch (error: any) {
      // Si falla con 400, puede ser que el campo espere el NOMBRE (Legacy Select/Text)
      if (error.status === 400 && categoriaNombre) {
        console.warn("⚠️ Falló creación con ID, intentando con Nombre (Soporte Legacy)...")
        try {
          const datosLegacy = { ...datosProducto, categoria: categoriaNombre }
          const producto = await crearProducto(datosLegacy, pb)
          return NextResponse.json(producto, { status: 201 })
        } catch (legacyError) {
          console.error("❌ Falló también con Nombre.")
        }
      }
      throw error // Re-lanzar para que lo capture el catch principal
    }
  } catch (error: any) {
    console.error("❌ API Productos POST Error:", error)
    console.error("❌ API Productos POST Detalles:", error.data)

    return NextResponse.json({
      error: error.message || "Error al crear el producto",
      details: error.data || null
    }, { status: error.status || 500 })
  }
}
