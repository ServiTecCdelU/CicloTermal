export const dynamic = "force-dynamic"

import { NextResponse } from "next/server"
import { uploadToGoogleDrive } from "@/lib/google-drive"
import { adminAuth } from "@/lib/firebase/admin"

async function verifyToken(request) {
  const authorization = request.headers.get("authorization")
  if (!authorization?.startsWith("Bearer ")) return null
  try {
    return await adminAuth.verifyIdToken(authorization.slice(7))
  } catch {
    return null
  }
}

export async function POST(request) {
  const decoded = await verifyToken(request)
  if (!decoded) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }

  try {
    const formData = await request.formData()
    const file = formData.get("file")

    if (!file) {
      return NextResponse.json({ error: "No file received" }, { status: 400 })
    }

    if (!file.type.startsWith("image/")) {
      return NextResponse.json({ error: "Only image files are allowed" }, { status: 400 })
    }

    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: "File too large. Maximum 5MB allowed" }, { status: 400 })
    }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    const timestamp = Date.now()
    const originalName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_")
    const fileName = `sponsor_${timestamp}_${originalName}`

    const driveUrl = await uploadToGoogleDrive(buffer, fileName, file.type)

    return NextResponse.json({
      message: "File uploaded successfully to Google Drive",
      fileUrl: driveUrl,
      fileName: fileName,
    })
  } catch (error) {
    console.error("Error uploading file to Google Drive:", error)
    return NextResponse.json(
      { error: `Failed to upload file to Google Drive: ${error.message}` },
      { status: 500 },
    )
  }
}
