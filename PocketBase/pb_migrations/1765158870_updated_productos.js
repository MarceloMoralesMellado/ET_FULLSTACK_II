/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_308246142")

  // update collection data
  unmarshal({
    "updateRule": "@request.auth.id != \"\"",
    "viewRule": "@request.auth.id != \"\""
  }, collection)

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_308246142")

  // update collection data
  unmarshal({
    "updateRule": "@request.auth.rol = \"admin\"",
    "viewRule": "@collection.categorias.id != \"\""
  }, collection)

  return app.save(collection)
})
