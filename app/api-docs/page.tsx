"use client"

import SwaggerUI from "swagger-ui-react"
import "swagger-ui-react/swagger-ui.css"
import { spec } from "@/lib/swagger-spec"

export default function PaginaDocumentacionAPI() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-12">
        <SwaggerUI spec={spec} />
      </div>
    </div>
  )
}
