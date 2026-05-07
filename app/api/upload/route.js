import { NextResponse } from "next/server"
import { writeFile, mkdir } from "fs/promises"
import path from "path"

export async function POST(request) {
  try {
    const formData = await request.formData()
    const file = formData.get("file")
    const folder = formData.get("folder") || "uploads"

    if (!file) {
      return NextResponse.json({ error: "No file received" }, { status: 400 })
    }

    // Validar tipo de archivo
    if (!file.type.startsWith("image/")) {
      return NextResponse.json({ error: "Only image files are allowed" }, { status: 400 })
    }

    // Validar tamaño (5MB máximo)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: "File too large. Maximum 5MB allowed" }, { status: 400 })
    }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Crear nombre único para el archivo
    const timestamp = Date.now()
    const originalName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_")
    const fileName = `${timestamp}_${originalName}`

    // Crear la ruta de destino
    const uploadDir = path.join(process.cwd(), "public", folder)
    const filePath = path.join(uploadDir, fileName)

    // Crear el directorio si no existe
    try {
      await mkdir(uploadDir, { recursive: true })
    } catch (error) {
      // El directorio ya existe
    }

    // Escribir el archivo
    await writeFile(filePath, buffer)

    // Retornar la ruta pública del archivo
    const publicPath = `/${folder}/${fileName}`

    return NextResponse.json({
      message: "File uploaded successfully",
      filePath: publicPath,
      fileName: fileName,
    })
  } catch (error) {
    console.error("Error uploading file:", error)
    return NextResponse.json({ error: "Failed to upload file" }, { status: 500 })
  }
}
