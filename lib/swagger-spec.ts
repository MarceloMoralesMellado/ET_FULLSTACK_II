export const spec = {
    openapi: '3.0.0',
    info: {
        title: 'Huerto Hogar API',
        version: '1.0.0',
        description: 'Documentación de API REST para el sistema de e-commerce Huerto Hogar'
    },
    components: {
        securitySchemes: {
            bearerAuth: {
                type: 'http',
                scheme: 'bearer',
                bearerFormat: 'JWT'
            }
        }
    },
    paths: {
        '/api/auth/register': {
            post: {
                tags: ['Autenticación'],
                summary: 'Registrar un nuevo usuario',
                requestBody: {
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                properties: {
                                    email: { type: 'string', example: 'usuario@ejemplo.cl' },
                                    password: { type: 'string', example: 'contraseña123' },
                                    passwordConfirm: { type: 'string', example: 'contraseña123' },
                                    nombre: { type: 'string', example: 'Juan' },
                                    apellido: { type: 'string', example: 'Pérez' }
                                }
                            }
                        }
                    }
                },
                responses: {
                    200: {
                        description: 'Usuario registrado exitosamente',
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    properties: {
                                        id: { type: 'string' },
                                        email: { type: 'string' },
                                        nombre: { type: 'string' },
                                        rol: { type: 'string' }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        },
        '/api/auth/login': {
            post: {
                tags: ['Autenticación'],
                summary: 'Iniciar sesión',
                requestBody: {
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                properties: {
                                    email: { type: 'string', example: 'usuario@ejemplo.cl' },
                                    password: { type: 'string', example: 'contraseña123' }
                                }
                            }
                        }
                    }
                },
                responses: {
                    200: {
                        description: 'Login exitoso',
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    properties: {
                                        token: { type: 'string' },
                                        user: {
                                            type: 'object',
                                            properties: {
                                                id: { type: 'string' },
                                                email: { type: 'string' },
                                                nombre: { type: 'string' }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        },
        '/api/auth/logout': {
            post: {
                tags: ['Autenticación'],
                summary: 'Cerrar sesión',
                security: [{ bearerAuth: [] }],
                responses: {
                    200: { description: 'Sesión cerrada exitosamente' }
                }
            }
        },
        '/api/auth/me': {
            get: {
                tags: ['Autenticación'],
                summary: 'Obtener información del usuario actual',
                security: [{ bearerAuth: [] }],
                responses: {
                    200: { description: 'Información del usuario recuperada' }
                }
            }
        },
        '/api/productos': {
            get: {
                tags: ['Productos'],
                summary: 'Obtener todos los productos',
                responses: {
                    200: {
                        description: 'Lista de productos',
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'array',
                                    items: {
                                        type: 'object',
                                        properties: {
                                            id: { type: 'string' },
                                            nombre: { type: 'string' },
                                            precio: { type: 'number' },
                                            categoria: { type: 'string' }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            },
            post: {
                tags: ['Productos'],
                summary: 'Crear un nuevo producto (Admin)',
                security: [{ bearerAuth: [] }],
                requestBody: {
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                properties: {
                                    nombre: { type: 'string' },
                                    precio: { type: 'number' },
                                    stock: { type: 'number' },
                                    categoria: { type: 'string' }
                                }
                            }
                        }
                    }
                },
                responses: {
                    201: { description: 'Producto creado' }
                }
            }
        },
        '/api/productos/{id}': {
            get: {
                tags: ['Productos'],
                summary: 'Obtener producto específico',
                parameters: [
                    {
                        name: 'id',
                        in: 'path',
                        required: true,
                        schema: { type: 'string' }
                    }
                ],
                responses: {
                    200: { description: 'Detalle del producto' }
                }
            },
            put: {
                tags: ['Productos'],
                summary: 'Actualizar producto (Admin)',
                security: [{ bearerAuth: [] }],
                parameters: [
                    {
                        name: 'id',
                        in: 'path',
                        required: true,
                        schema: { type: 'string' }
                    }
                ],
                requestBody: {
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                properties: {
                                    nombre: { type: 'string' },
                                    precio: { type: 'number' }
                                }
                            }
                        }
                    }
                },
                responses: {
                    200: { description: 'Producto actualizado' }
                }
            },
            delete: {
                tags: ['Productos'],
                summary: 'Eliminar producto (Admin)',
                security: [{ bearerAuth: [] }],
                parameters: [
                    {
                        name: 'id',
                        in: 'path',
                        required: true,
                        schema: { type: 'string' }
                    }
                ],
                responses: {
                    200: { description: 'Producto eliminado' }
                }
            }
        },
        '/api/categorias': {
            get: {
                tags: ['Categorías'],
                summary: 'Obtener todas las categorías',
                responses: {
                    200: { description: 'Lista de categorías' }
                }
            },
            post: {
                tags: ['Categorías'],
                summary: 'Crear categoría (Admin)',
                security: [{ bearerAuth: [] }],
                responses: {
                    201: { description: 'Categoría creada' }
                }
            }
        },
        '/api/categorias/{id}': {
            get: {
                tags: ['Categorías'],
                summary: 'Obtener categoría específica',
                parameters: [
                    {
                        name: 'id',
                        in: 'path',
                        required: true,
                        schema: { type: 'string' }
                    }
                ],
                responses: {
                    200: { description: 'Detalle de categoría' }
                }
            },
            put: {
                tags: ['Categorías'],
                summary: 'Actualizar categoría (Admin)',
                security: [{ bearerAuth: [] }],
                parameters: [
                    {
                        name: 'id',
                        in: 'path',
                        required: true,
                        schema: { type: 'string' }
                    }
                ],
                responses: {
                    200: { description: 'Categoría actualizada' }
                }
            },
            delete: {
                tags: ['Categorías'],
                summary: 'Eliminar categoría (Admin)',
                security: [{ bearerAuth: [] }],
                parameters: [
                    {
                        name: 'id',
                        in: 'path',
                        required: true,
                        schema: { type: 'string' }
                    }
                ],
                responses: {
                    200: { description: 'Categoría eliminada' }
                }
            }
        },
        '/api/ordenes': {
            get: {
                tags: ['Órdenes'],
                summary: 'Obtener todas las órdenes (Admin)',
                security: [{ bearerAuth: [] }],
                responses: {
                    200: { description: 'Lista de órdenes' }
                }
            },
            post: {
                tags: ['Órdenes'],
                summary: 'Crear nueva orden',
                security: [{ bearerAuth: [] }],
                requestBody: {
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                properties: {
                                    items: { type: 'array', items: { type: 'object' } },
                                    total: { type: 'number' }
                                }
                            }
                        }
                    }
                },
                responses: {
                    201: { description: 'Orden creada' }
                }
            }
        },
        '/api/ordenes/{id}': {
            get: {
                tags: ['Órdenes'],
                summary: 'Obtener orden específica',
                security: [{ bearerAuth: [] }],
                parameters: [
                    {
                        name: 'id',
                        in: 'path',
                        required: true,
                        schema: { type: 'string' }
                    }
                ],
                responses: {
                    200: { description: 'Detalle de la orden' }
                }
            },
            put: {
                tags: ['Órdenes'],
                summary: 'Actualizar estado de orden (Admin)',
                security: [{ bearerAuth: [] }],
                parameters: [
                    {
                        name: 'id',
                        in: 'path',
                        required: true,
                        schema: { type: 'string' }
                    }
                ],
                requestBody: {
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                properties: {
                                    estado: { type: 'string' }
                                }
                            }
                        }
                    }
                },
                responses: {
                    200: { description: 'Estado actualizado' }
                }
            },
            delete: {
                tags: ['Órdenes'],
                summary: 'Eliminar orden (Admin)',
                security: [{ bearerAuth: [] }],
                parameters: [
                    {
                        name: 'id',
                        in: 'path',
                        required: true,
                        schema: { type: 'string' }
                    }
                ],
                responses: {
                    200: { description: 'Orden eliminada' }
                }
            }
        }
    }
}
