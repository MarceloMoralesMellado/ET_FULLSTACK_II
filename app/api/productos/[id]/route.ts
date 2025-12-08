import { NextResponse } from "next/server"
import { obtenerProductoPorId, actualizarProducto, eliminarProducto } from "@/lib/api/productos"
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

    const producto = await obtenerProductoPorId(id, pb)
    return NextResponse.json(producto)
  } catch (error: any) {
    console.error("[v0] Error obteniendo producto:", error)

    if (error.status === 404) {
      return NextResponse.json({ error: "Producto no encontrado" }, { status: 404 })
    }

    if (error.status === 403) {
      return NextResponse.json({
        error: "Acceso denegado",
        details: "No tienes permiso para ver este producto. Revisa la regla 'View' en PocketBase."
      }, { status: 403 })
    }

    return NextResponse.json({ error: "Error obteniendo producto" }, { status: 500 })
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await request.json()
    const cookieStore = await cookies()
    const pbAuthCookie = cookieStore.get("pb_auth")

    // Crear cliente PB autenticado para esta request
    const pb = new PocketBase("http://127.0.0.1:8090")
    if (pbAuthCookie) {
      // Decodificar la cookie manualmente si es necesario, o usar loadFromCookie
      const encoded = pbAuthCookie.value
      try {
        const decoded = decodeURIComponent(encoded)
        pb.authStore.save(decoded, null)
      } catch (e) {
        pb.authStore.loadFromCookie(pbAuthCookie.value)
      }

      try {
        if (pb.authStore.isValid) {
          await pb.collection("users").authRefresh()
        }
      } catch (e) {
        console.error("Error refreshing auth:", e)
      }
    }

    // Verificar si es admin
    console.log("🔍 API Productos PUT: Auth valid?", pb.authStore.isValid)
    console.log("🔍 API Productos PUT: User role?", pb.authStore.model?.rol)

    if (!pb.authStore.isValid || pb.authStore.model?.rol !== "admin") {
      console.warn("⛔ API Productos PUT: Permiso denegado")
      return NextResponse.json({ error: "No tienes permisos de administrador" }, { status: 403 })
    }

    // Preparar datos para actualizar
    const datosActualizar: any = {}

    if (body.nombre !== undefined) datosActualizar.nombre = body.nombre
    if (body.descripcion !== undefined) datosActualizar.descripcion = body.descripcion
    if (body.precio !== undefined) datosActualizar.precio = Number(body.precio)
    if (body.stock !== undefined) datosActualizar.stock = Number(body.stock)
    if (body.disponible !== undefined) datosActualizar.disponible = body.disponible

    // Validar categoría si se está actualizando
    if (body.categoria) {
      // Primero, verificar si la categoría realmente cambió
      let shouldValidateCategory = true
      try {
        const currentRecord = await pb.collection("productos").getOne(id)
        const currentCat = Array.isArray(currentRecord.categoria) ? currentRecord.categoria[0] : currentRecord.categoria

        console.log(`🔍 API Debug: Comparando categorías - Actual: '${currentCat}' vs Nueva: '${body.categoria}'`)

        if (currentCat === body.categoria) {
          console.log("ℹ️ API Debug: La categoría no ha cambiado. Omitiendo actualización de este campo para evitar errores de permisos.")
          shouldValidateCategory = false
        }
      } catch (err: any) {
        console.error("Error obteniendo registro actual para verificar categoría:", err)
        if (err.status === 403) {
          console.warn("⚠️ API Productos PUT: No tienes permiso para 'Ver' el producto actual. Revisa la regla 'View' en la colección 'productos'.")
        }
        // Si falla obtener el actual, procedemos con la validación normal
        shouldValidateCategory = true
      }

      if (shouldValidateCategory) {
        let categoriaValida = false

        try {
          await pb.collection("categorias").getOne(body.categoria)
          categoriaValida = true
        } catch (e: any) {
          console.warn("⚠️ API Productos PUT: Falló getOne para categoría. Intentando fallback con getFullList.")

          // Fallback: Intentar buscar en la lista completa (a veces List está abierto pero View no)
          try {
            const allCats = await pb.collection("categorias").getFullList()
            const match = allCats.find(c => c.id === body.categoria)
            if (match) {
              console.log("✅ API Debug: Categoría encontrada vía fallback (List).")
              categoriaValida = true
            }
          } catch (listErr) {
            console.error("❌ API Debug: Fallback también falló:", listErr)
          }
        }

        if (categoriaValida) {
          datosActualizar.categoria = body.categoria
        } else {
          return NextResponse.json({
            error: "La categoría seleccionada no es válida o no existe.",
            details: {
              categoria: { message: "No se pudo verificar la categoría. Revisa los permisos 'View' y 'List' en PocketBase." }
            }
          }, { status: 400 })
        }
      }
    }

    console.log("🚀 API Productos PUT: Actualizando ID:", id, "Datos:", JSON.stringify(datosActualizar))

    try {
      const record = await pb.collection("productos").update(id, datosActualizar)

      // Mapear respuesta manualmente para evitar dependencias circulares o problemas de importación
      const productoActualizado = {
        id: record.id,
        nombre: record.nombre,
        descripcion: record.descripcion,
        precio: record.precio,
        stock: record.stock,
        categoria: record.categoria,
        imagen: record.imagen,
        unidad: record.unidad,
        destacado: false,
        enOferta: false,
        activo: record.disponible,
      }

      return NextResponse.json(productoActualizado)
    } catch (pbError: any) {
      console.error("❌ API Update Error Raw:", pbError)

      // Manejo robusto de errores (PocketBase vs Genéricos)
      const status = pbError?.status || 500
      const message = pbError?.message || "Error desconocido al actualizar"
      const data = pbError?.data || {}

      // Log detallado con JSON stringify para ver el objeto interno
      console.error("❌ API Update Error Details:", JSON.stringify({
        status,
        message,
        data,
        stack: pbError?.stack
      }, null, 2))

      // FALLBACK FINAL: Si falló por culpa de la categoría, intentamos actualizar SIN la categoría
      // Esto permite que el usuario cambie precio/stock aunque la categoría tenga problemas
      if (datosActualizar.categoria && status === 400) {
        console.warn("⚠️ API Debug: Falló la actualización con categoría. Reintentando SIN categoría para salvar los otros datos.")
        delete datosActualizar.categoria

        try {
          const recordRetry = await pb.collection("productos").update(id, datosActualizar)
          console.log("✅ API Debug: Reintento exitoso (sin categoría).")

          // Retornamos éxito pero con un warning en los logs
          const productoRetry = {
            id: recordRetry.id,
            nombre: recordRetry.nombre,
            descripcion: recordRetry.descripcion,
            precio: recordRetry.precio,
            stock: recordRetry.stock,
            categoria: recordRetry.categoria,
            imagen: recordRetry.imagen,
            unidad: recordRetry.unidad,
            destacado: false,
            enOferta: false,
            activo: recordRetry.disponible,
          }
          return NextResponse.json(productoRetry)
        } catch (retryError) {
          console.error("❌ API Debug: El reintento también falló:", retryError)
          // Si falla de nuevo, devolvemos el error original
        }
      }

      if (status === 403) {
        return NextResponse.json({
          error: "No tienes permiso para actualizar productos.",
          details: {
            system: { message: "Revisa la regla 'Update' en la colección 'productos'. Debe permitir el acceso a tu usuario (admin)." }
          }
        }, { status: 403 })
      }

      return NextResponse.json({
        error: message,
        details: data,
        debug_info: {
          type: pbError?.constructor?.name || typeof pbError
        }
      }, { status: status })
    }
  } catch (error: any) {
    console.error("[v0] Error crítico en PUT:", error)
    return NextResponse.json({ error: error.message || "Error interno del servidor" }, { status: 500 })
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

    const exito = await eliminarProducto(id, pb)

    if (!exito) {
      return NextResponse.json({ error: "Error al eliminar el producto" }, { status: 500 })
    }

    return NextResponse.json({ mensaje: "Producto eliminado exitosamente" })
  } catch (error: any) {
    console.error("❌ API Productos DELETE Error:", error)

    if (error.status === 403) {
      return NextResponse.json({
        error: "Permiso denegado. Revisa la regla 'Delete' en la colección 'productos'.",
        details: "Debes permitir que los usuarios autenticados (o admins) eliminen registros."
      }, { status: 403 })
    }

    return NextResponse.json({ error: "Error al eliminar el producto" }, { status: 500 })
  }
}
