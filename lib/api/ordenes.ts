import pb from "@/lib/pocketbase"
import type { Orden, ItemOrden } from "@/lib/tipos"
import { obtenerProductosPorIds } from "./productos"
import PocketBase from "pocketbase"

// Helper para parsear productos
function parsearProductos(productosRaw: any): ItemOrden[] {
  let items: any[] = []
  try {
    // console.log("🔍 Parseando productos (raw):", JSON.stringify(productosRaw, null, 2))
    if (!productosRaw) return []

    if (typeof productosRaw === "string") {
      try {
        items = JSON.parse(productosRaw)
      } catch {
        // Si no es JSON válido, asumimos que podría ser un ID suelto o nada
        // Si es un string que parece un ID (alfanumérico de 15 chars), lo tratamos como tal
        if (productosRaw.length === 15) {
          items = [productosRaw]
        } else {
          items = []
        }
      }
    } else if (Array.isArray(productosRaw)) {
      items = productosRaw
    } else if (typeof productosRaw === "object") {
      // Si es un objeto único (no array), lo metemos en un array
      items = [productosRaw]
    }
  } catch (e) {
    console.error("Error parseando productos:", e)
  }

  // Normalizar items: si son strings (IDs), convertirlos a objetos parciales
  return items.map((item: any) => {
    if (typeof item === "string") {
      return {
        productoId: item,
        cantidad: 1, // Cantidad por defecto si solo tenemos ID
        precio: 0,
        nombreProducto: "",
        imagenProducto: "",
        unidadProducto: "",
      } as ItemOrden
    }
    return item as ItemOrden
  })
}

// Helper para hidratar productos (completar info faltante)
async function hidratarProductos(items: ItemOrden[]): Promise<ItemOrden[]> {
  // Identificar items que necesitan hidratación (falta nombre, imagen, o precio es 0)
  const itemsIncompletos = items.filter(
    (i) => !i.nombreProducto || !i.imagenProducto || i.nombreProducto === "Producto no encontrado"
  )

  if (itemsIncompletos.length === 0) return items

  try {
    const ids = itemsIncompletos.map((i) => i.productoId).filter(Boolean)

    // Evitar llamadas vacías
    if (ids.length === 0) return items

    // Obtener datos frescos de los productos
    const productosInfo = await obtenerProductosPorIds(ids)

    return items.map((item) => {
      // Si ya tiene datos, lo dejamos igual
      if (item.nombreProducto && item.imagenProducto && item.nombreProducto !== "Producto no encontrado") {
        return item
      }

      const info = productosInfo.find((p) => p.id === item.productoId)
      if (info) {
        return {
          ...item,
          nombreProducto: info.nombre,
          imagenProducto: info.imagen,
          unidadProducto: info.unidad,
          precio: item.precio || info.precio, // Usar precio actual si el histórico es 0/faltante
        }
      }

      return {
        ...item,
        nombreProducto: item.nombreProducto || "Producto no encontrado",
        imagenProducto: item.imagenProducto || "/placeholder.svg",
      }
    })
  } catch (error) {
    console.error("Error hidratando productos:", error)
    return items
  }
}

// Obtener todas las órdenes (admin)
export async function obtenerOrdenesAPI(pbClient?: any): Promise<Orden[]> {
  try {
    const client = pbClient || pb
    const records = await client.collection("pedidos").getFullList({
      sort: "-created",
      expand: "usuario",
    })

    return records.map((record: any) => {
      let direccionEnvio = {}
      try {
        if (typeof record.direccion_envio === "string") {
          direccionEnvio = JSON.parse(record.direccion_envio)
        } else {
          direccionEnvio = record.direccion_envio || {}
        }
      } catch (e) {
        console.error("Error parseando dirección:", e)
      }

      return {
        id: record.id,
        usuarioId: record.usuario,
        items: parsearProductos(record.productos),
        subtotal: record.total || 0,
        envio: 0,
        total: record.total || 0,
        estado: record.estado || "pendiente",
        estado: record.estado || "pendiente",
        direccionEnvio: direccionEnvio as any,
        metodoPago: record.pago || "",
        metodoPago: record.pago || "",
        notas: record.notas || "",
        fechaCreacion: record.created,
        fechaActualizacion: record.updated,
      }
    })
  } catch (error) {
    console.error("Error al obtener órdenes:", error)
    throw new Error("No se pudieron cargar las órdenes")
  }
}

// Obtener órdenes de un usuario específico
export async function obtenerOrdenesUsuarioAPI(usuarioId: string, pbClient: PocketBase = pb): Promise<Orden[]> {
  try {
    console.log("📚 Lib: Filtro usado:", `usuario = "${usuarioId}"`)
    const records = await pbClient.collection("pedidos").getFullList({
      filter: `usuario = "${usuarioId}"`,
      sort: "-created",
    })
    console.log("📚 Lib: Registros raw encontrados:", records.length)

    return records.map((record: any) => {
      let direccionEnvio = {}
      try {
        if (typeof record.direccion_envio === "string") {
          direccionEnvio = JSON.parse(record.direccion_envio)
        } else {
          direccionEnvio = record.direccion_envio || {}
        }
      } catch (e) {
        console.error("Error parseando dirección:", e)
      }

      return {
        id: record.id,
        usuarioId: record.usuario,
        items: parsearProductos(record.productos),
        subtotal: record.total || 0,
        envio: 0,
        total: record.total || 0,
        estado: record.estado || "pendiente",
        estado: record.estado || "pendiente",
        direccionEnvio: direccionEnvio as any,
        metodoPago: record.pago || "",
        metodoPago: record.pago || "",
        notas: record.notas || "",
        fechaCreacion: record.created,
        fechaActualizacion: record.updated,
      }
    })
  } catch (error) {
    console.error("Error al obtener órdenes del usuario:", error)
    throw new Error("No se pudieron cargar las órdenes")
  }
}

// Obtener una orden por ID
export async function obtenerOrdenAPI(id: string, pbClient?: any): Promise<Orden> {
  try {
    const client = pbClient || pb
    console.log("🔍 Buscando orden con ID:", id)
    const record = await client.collection("pedidos").getOne(id, {
      expand: "usuario,productos", // Intentar expandir productos también por si acaso es relación
    })
    console.log("✅ Orden encontrada (raw):", record.id)
    // console.log("📦 Productos raw:", JSON.stringify(record.productos, null, 2))
    // console.log("📦 Expand:", JSON.stringify(record.expand, null, 2))

    let direccionEnvio = {}
    try {
      if (typeof record.direccion_envio === "string") {
        direccionEnvio = JSON.parse(record.direccion_envio)
      } else {
        direccionEnvio = record.direccion_envio || {}
      }
    } catch (e) {
      console.error("Error parseando dirección:", e)
    }

    // Intentar usar expand.productos si existe y productos está vacío o son solo IDs
    let itemsRaw = record.productos
    if (record.expand && record.expand.productos) {
      // Si tenemos la expansión, usémosla para enriquecer o reemplazar
      // Pero cuidado, parsearProductos espera IDs o JSON de items
      // Si expand.productos es un array de objetos Producto, podemos mapearlos a ItemOrden
      const productosExpandidos = record.expand.productos as any[]
      // Si itemsRaw son IDs, podemos usarlos para correlacionar, o simplemente usar los expandidos
      // Vamos a dejar que hidratarProductos haga su trabajo, pero si itemsRaw está vacío y expand no, usémoslo
      if ((!itemsRaw || itemsRaw.length === 0) && productosExpandidos.length > 0) {
        itemsRaw = productosExpandidos.map(p => ({
          productoId: p.id,
          cantidad: 1,
          precio: p.precio,
          nombreProducto: p.nombre,
          imagenProducto: p.imagen,
          unidadProducto: p.unidad
        }))
      }
    }

    const items = parsearProductos(itemsRaw)
    // Hidratar items si faltan detalles (importante para Ver Detalle)
    const itemsCompletos = await hidratarProductos(items)

    return {
      id: record.id,
      usuarioId: record.usuario,
      items: itemsCompletos,
      subtotal: record.total || 0,
      envio: 0,
      total: record.total || 0,
      estado: record.estado || "pendiente",
      direccionEnvio: direccionEnvio as any,
      metodoPago: record.pago || "",
      notas: record.notas || "",
      fechaCreacion: record.created,
      fechaActualizacion: record.updated,
    }
  } catch (error: any) {
    console.error("❌ Error al obtener orden:", error)
    console.error("❌ Detalles:", error.data)
    throw new Error("No se pudo cargar la orden: " + (error.message || "Error desconocido"))
  }
}

// Crear una nueva orden
export async function crearOrdenAPI(data: {
  usuarioId: string
  items: any[]
  total: number
  direccionEnvio: any
  metodoPago: string
  notas?: string
}): Promise<Orden> {
  try {
    console.log("🚀 API: Intentando crear orden con datos:", {
      usuario: data.usuarioId,
      total: data.total,
      estado: "pendiente",
    })

    const record = await pb.collection("pedidos").create({
      usuario: data.usuarioId,
      productos: data.items,
      total: data.total,
      estado: "pendiente",
      direccion_envio: data.direccionEnvio, // Enviar objeto directo para campo JSON
      pago: data.metodoPago,
      notas: data.notas || "",
    })

    console.log("✅ API: Orden creada exitosamente:", record.id)

    return {
      id: record.id,
      usuarioId: record.usuario,
      items: parsearProductos(record.productos),
      subtotal: record.total || 0,
      envio: 0,
      total: record.total || 0,
      estado: record.estado || "pendiente",
      direccionEnvio: data.direccionEnvio,
      metodoPago: record.pago || "",
      notas: record.notas || "",
      fechaCreacion: record.created,
      fechaActualizacion: record.updated,
    }
  } catch (error: any) {
    console.error("❌ API: Error al crear orden:", error)
    console.error("❌ API: Detalles del error:", error.data)
    throw new Error("No se pudo crear la orden: " + (error.message || "Error desconocido"))
  }
}

// Actualizar el estado de una orden
export async function actualizarEstadoOrdenAPI(id: string, estado: string): Promise<Orden> {
  try {
    const record = await pb.collection("pedidos").update(id, {
      estado,
    })

    let direccionEnvio = {}
    try {
      if (typeof record.direccion_envio === "string") {
        direccionEnvio = JSON.parse(record.direccion_envio)
      } else {
        direccionEnvio = record.direccion_envio || {}
      }
    } catch (e) {
      console.error("Error parseando dirección:", e)
    }

    return {
      id: record.id,
      usuarioId: record.usuario,
      items: parsearProductos(record.productos),
      subtotal: record.total || 0, // PocketBase no tiene subtotal separado por defecto
      envio: 0, // PocketBase no tiene envio separado por defecto
      total: record.total || 0,
      estado: record.estado || "pendiente",
      direccionEnvio: direccionEnvio,
      metodoPago: record.pago || "",
      notas: record.notas || "",
      fechaCreacion: record.created,
      fechaActualizacion: record.updated,
    }
  } catch (error) {
    console.error("Error al actualizar estado de orden:", error)
    throw new Error("No se pudo actualizar el estado de la orden")
  }
}

// Eliminar una orden
export async function eliminarOrdenAPI(id: string): Promise<void> {
  try {
    await pb.collection("pedidos").delete(id)
  } catch (error) {
    console.error("Error al eliminar orden:", error)
    throw new Error("No se pudo eliminar la orden")
  }
}
