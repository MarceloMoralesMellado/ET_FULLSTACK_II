"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useAuth } from "@/contextos/ContextoAuth"
import { useToast } from "@/hooks/use-toast"
import { obtenerCategoriasAPI, eliminarCategoriaAPI, actualizarCategoriaAPI } from "@/lib/api/categorias"
import { obtenerProductos } from "@/lib/api/productos"
import { pb } from "@/lib/pocketbase"
import type { Categoria } from "@/lib/tipos"
import NavegacionAdmin from "@/componentes/NavegacionAdmin"

export default function PaginaAdminCategorias() {
  const router = useRouter()
  const { usuario } = useAuth()
  const { toast } = useToast()
  const [categorias, setCategorias] = useState<Categoria[]>([])
  const [busqueda, setBusqueda] = useState("")
  const [cargando, setCargando] = useState(true)

  const [conteoProductos, setConteoProductos] = useState<Record<string, number>>({})

  useEffect(() => {
    if (!usuario || usuario.rol !== "admin") {
      router.push("/login")
      return
    }
    cargarDatos()
  }, [usuario, router])

  const cargarDatos = async () => {
    try {
      setCargando(true)
      console.log("🔍 Admin Categorias: Iniciando carga de datos...")
      console.log("🔍 Auth State:", pb.authStore.isValid, pb.authStore.model?.email)

      const [categoriasData, productosData] = await Promise.all([
        obtenerCategoriasAPI(),
        obtenerProductos()
      ])

      console.log("✅ Categorías cargadas:", categoriasData.length)
      console.log("✅ Productos cargados:", productosData.length)

      setCategorias(categoriasData)

      // Calcular conteo de productos por categoría
      const conteo: Record<string, number> = {}

      // Crear mapa de Nombre -> ID para manejar datos antiguos (donde se guardaba el nombre en vez del ID)
      const nombreToId: Record<string, string> = {}
      categoriasData.forEach(c => {
        nombreToId[c.nombre] = c.id
        nombreToId[c.nombre.toLowerCase()] = c.id
      })

      productosData.forEach(producto => {
        if (producto.categoria) {
          let catId = producto.categoria

          // Si el valor es un nombre de categoría (ej: "Frutas"), lo convertimos al ID
          if (nombreToId[catId]) {
            catId = nombreToId[catId]
          } else if (nombreToId[catId.toLowerCase()]) {
            catId = nombreToId[catId.toLowerCase()]
          }

          // Solo contamos si el ID corresponde a una categoría que existe actualmente
          if (categoriasData.some(c => c.id === catId)) {
            conteo[catId] = (conteo[catId] || 0) + 1
          }
        }
      })

      setConteoProductos(conteo)

    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudieron cargar los datos",
        variant: "destructive",
      })
    } finally {
      setCargando(false)
    }
  }

  const eliminarCategoriaHandler = async (id: string) => {
    const cantidadProductos = conteoProductos[id] || 0
    const mensajeConfirmacion = cantidadProductos > 0
      ? `⚠️ Esta categoría tiene ${cantidadProductos} productos asociados.\n\nSi la eliminas, estos productos quedarán sin categoría (o podrían eliminarse si la base de datos está configurada en cascada).\n\n¿Estás seguro de continuar?`
      : "¿Estás seguro de eliminar esta categoría?"

    if (!confirm(mensajeConfirmacion)) return

    try {
      await eliminarCategoriaAPI(id)
      setCategorias(categorias.filter((c) => c.id !== id))

      // Actualizar conteo visualmente (opcional)
      const nuevoConteo = { ...conteoProductos }
      delete nuevoConteo[id]
      setConteoProductos(nuevoConteo)

      toast({
        title: "Categoría eliminada",
        description: "La categoría ha sido eliminada exitosamente",
      })
    } catch (error: any) {
      console.error("Error eliminando categoría:", error)
      toast({
        title: "Error al eliminar",
        description: error.message || "No se pudo eliminar. Revisa permisos o dependencias.",
        variant: "destructive",
      })
    }
  }

  const toggleActiva = async (id: string) => {
    try {
      const categoria = categorias.find((c) => c.id === id)
      if (!categoria) return

      // Optimistic update
      const nuevoEstado = !categoria.activa
      const categoriasActualizadas = categorias.map((c) => (c.id === id ? { ...c, activa: nuevoEstado } : c))
      setCategorias(categoriasActualizadas)

      // Usar la ruta de API del servidor que tiene el cliente autenticado
      const response = await fetch(`/api/categorias/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ activa: nuevoEstado }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Error al actualizar")
      }

      toast({
        title: nuevoEstado ? "Categoría activada" : "Categoría desactivada",
        description: `La categoría ahora está ${nuevoEstado ? "visible" : "oculta"} para los clientes.`,
      })
    } catch (error: any) {
      // Revertir si falla
      const categoria = categorias.find((c) => c.id === id)
      if (categoria) {
        const categoriasRevertidas = categorias.map((c) => (c.id === id ? { ...c, activa: !c.activa } : c))
        setCategorias(categoriasRevertidas)
      }

      console.error("Error actualizando estado:", error)
      toast({
        title: "Error",
        description: error.message || "No se pudo actualizar el estado. Revisa los permisos 'Update' en PocketBase.",
        variant: "destructive",
      })
    }
  }

  const categoriasFiltradas = categorias.filter((categoria) =>
    categoria.nombre.toLowerCase().includes(busqueda.toLowerCase()),
  )

  if (!usuario || usuario.rol !== "admin") {
    return null
  }

  return (
    <div className="min-h-screen bg-background">
      <NavegacionAdmin />
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Gestión de Categorías</h1>
            <p className="text-muted-foreground mt-1">Administra las categorías de productos</p>
          </div>
          <Link href="/admin/categorias/nueva">
            <Button>Agregar Categoría</Button>
          </Link>
        </div>

        <Card className="mb-6">
          <CardContent className="pt-6">
            <Input
              type="text"
              placeholder="Buscar categorías..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
            />
          </CardContent>
        </Card>

        {cargando ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">Cargando categorías...</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {categoriasFiltradas.length === 0 ? (
              <Card className="col-span-full">
                <CardContent className="py-12 text-center">
                  <p className="text-muted-foreground">No se encontraron categorías</p>
                </CardContent>
              </Card>
            ) : (
              categoriasFiltradas.map((categoria) => (
                <Card key={categoria.id} className="overflow-hidden">
                  <CardContent className="p-0">
                    <div className="relative h-48 w-full">
                      <img
                        src={categoria.imagen || "/placeholder.svg"}
                        alt={categoria.nombre}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute top-2 right-2">
                        <Badge variant={categoria.activa ? "default" : "secondary"}>
                          {categoria.activa ? "Activa" : "Inactiva"}
                        </Badge>
                      </div>
                    </div>

                    <div className="p-6">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h3 className="text-xl font-semibold text-foreground">{categoria.nombre}</h3>
                          <p className="text-sm text-muted-foreground mt-1">{categoria.descripcion}</p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between mt-4 mb-6">
                        <div className="text-sm font-medium">
                          {conteoProductos[categoria.id] || 0} productos
                        </div>
                        <Link href={`/admin/productos?categoria=${categoria.id}`}>
                          <Button variant="link" size="sm" className="h-auto p-0 text-primary">
                            Ver productos &rarr;
                          </Button>
                        </Link>
                      </div>

                      <div className="flex items-center gap-2">
                        <Link href={`/admin/categorias/${categoria.id}`} className="flex-1">
                          <Button variant="outline" size="sm" className="w-full bg-transparent">
                            Editar
                          </Button>
                        </Link>
                        <Button variant="outline" size="sm" onClick={() => toggleActiva(categoria.id)}>
                          {categoria.activa ? "Desactivar" : "Activar"}
                        </Button>
                        <Button variant="destructive" size="sm" onClick={() => eliminarCategoriaHandler(categoria.id)}>
                          Eliminar
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  )
}
