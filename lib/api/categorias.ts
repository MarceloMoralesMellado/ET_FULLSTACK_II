import { pb } from "@/lib/pocketbase"
import type { Categoria } from "@/lib/tipos"

export async function obtenerCategoriasAPI(pbClient?: any): Promise<Categoria[]> {
  try {
    const client = pbClient || pb
    const records = await client.collection("categorias").getFullList({
      sort: "-created",
    })
    return records as any[]
  } catch (error) {
    console.error("Error al obtener categorías:", error)
    throw error
  }
}

export async function crearCategoriaAPI(data: Partial<Categoria>, pbClient?: any): Promise<Categoria> {
  try {
    const client = pbClient || pb
    const record = await client.collection("categorias").create(data)
    return record as any
  } catch (error) {
    console.error("Error al crear categoría:", error)
    throw error
  }
}

export async function obtenerCategoriaAPI(id: string, pbClient?: any): Promise<Categoria> {
  try {
    const client = pbClient || pb
    const record = await client.collection("categorias").getOne(id)
    return record as any
  } catch (error) {
    console.error("Error al obtener categoría:", error)
    throw error
  }
}

export async function actualizarCategoriaAPI(id: string, data: Partial<Categoria>, pbClient?: any): Promise<Categoria> {
  try {
    const client = pbClient || pb
    const record = await client.collection("categorias").update(id, data)
    return record as any
  } catch (error) {
    console.error("Error al actualizar categoría:", error)
    throw error
  }
}

export async function eliminarCategoriaAPI(id: string, pbClient?: any): Promise<void> {
  try {
    const client = pbClient || pb
    await client.collection("categorias").delete(id)
  } catch (error) {
    console.error("Error al eliminar categoría:", error)
    throw error
  }
}