import { NextResponse } from "next/server"
import { uploadToGoogleDrive } from "@/lib/google-drive"

export async function POST(request) {
  try {
    console.log("Iniciando upload a Google Drive...")

    const formData = await request.formData()
    const file = formData.get("file")

    if (!file) {
      console.error("No se recibió archivo")
      return NextResponse.json({ error: "No file received" }, { status: 400 })
    }

    console.log("Archivo recibido:", file.name, "Tamaño:", file.size, "Tipo:", file.type)

    // Validar tipo de archivo
    if (!file.type.startsWith("image/")) {
      console.error("Tipo de archivo inválido:", file.type)
      return NextResponse.json({ error: "Only image files are allowed" }, { status: 400 })
    }

    // Validar tamaño (5MB máximo)
    if (file.size > 5 * 1024 * 1024) {
      console.error("Archivo demasiado grande:", file.size)
      return NextResponse.json({ error: "File too large. Maximum 5MB allowed" }, { status: 400 })
    }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Crear nombre único para el archivo
    const timestamp = Date.now()
    const originalName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_")
    const fileName = `sponsor_${timestamp}_${originalName}`

    console.log("Subiendo archivo con nombre:", fileName)

    // Subir a Google Drive
    const driveUrl = await uploadToGoogleDrive(buffer, fileName, file.type)

    console.log("Archivo subido exitosamente. URL:", driveUrl)

    return NextResponse.json({
      message: "File uploaded successfully to Google Drive",
      fileUrl: driveUrl,
      fileName: fileName,
    })
  } catch (error) {
    console.error("Error uploading file to Google Drive:", error)
    return NextResponse.json(
      {
        error: `Failed to upload file to Google Drive: ${error.message}`,
      },
      { status: 500 },
    )
  }
}
