import { google } from "googleapis"
import { Readable } from "stream"

// Configuración de Google Drive
const GOOGLE_DRIVE_FOLDER_ID = "1my8e7bOyAyq3kpRWtZr_tLVOnisaQygH" // Tu folder ID

// Configurar la autenticación con Google
const auth = new google.auth.GoogleAuth({
  credentials: {
    type: "service_account",
    project_id: process.env.GOOGLE_PROJECT_ID,
    private_key_id: process.env.GOOGLE_PRIVATE_KEY_ID,
    private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    client_email: process.env.GOOGLE_CLIENT_EMAIL,
    client_id: process.env.GOOGLE_CLIENT_ID,
    auth_uri: "https://accounts.google.com/o/oauth2/auth",
    token_uri: "https://oauth2.googleapis.com/token",
    auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
    client_x509_cert_url: `https://www.googleapis.com/robot/v1/metadata/x509/${process.env.GOOGLE_CLIENT_EMAIL}`,
  },
  scopes: ["https://www.googleapis.com/auth/drive.file"],
})

const drive = google.drive({ version: "v3", auth })

export async function uploadToGoogleDrive(fileBuffer, fileName, mimeType) {
  try {
    console.log("Iniciando subida a Google Drive...")
    console.log("Nombre del archivo:", fileName)
    console.log("Tipo MIME:", mimeType)
    console.log("Tamaño del buffer:", fileBuffer.length)

    // Verificar que las variables de entorno estén configuradas
    if (!process.env.GOOGLE_CLIENT_EMAIL) {
      throw new Error("GOOGLE_CLIENT_EMAIL no está configurado")
    }
    if (!process.env.GOOGLE_PRIVATE_KEY) {
      throw new Error("GOOGLE_PRIVATE_KEY no está configurado")
    }

    // Convertir el buffer a stream
    const stream = new Readable()
    stream.push(fileBuffer)
    stream.push(null)

    console.log("Creando archivo en Google Drive...")
    const response = await drive.files.create({
      requestBody: {
        name: fileName,
        parents: [GOOGLE_DRIVE_FOLDER_ID],
      },
      media: {
        mimeType: mimeType,
        body: stream,
      },
    })

    const fileId = response.data.id
    console.log("Archivo creado con ID:", fileId)

    // Hacer el archivo público
    console.log("Haciendo el archivo público...")
    await drive.permissions.create({
      fileId: fileId,
      requestBody: {
        role: "reader",
        type: "anyone",
      },
    })

    // Retornar la URL pública
    const publicUrl = `https://drive.google.com/uc?id=${fileId}`
    console.log("URL pública generada:", publicUrl)

    return publicUrl
  } catch (error) {
    console.error("Error detallado en uploadToGoogleDrive:", error)
    if (error.response) {
      console.error("Respuesta de error:", error.response.data)
    }
    throw new Error(`Error al subir a Google Drive: ${error.message}`)
  }
}

export async function deleteFromGoogleDrive(fileId) {
  try {
    await drive.files.delete({
      fileId: fileId,
    })
    console.log("Archivo eliminado de Google Drive:", fileId)
  } catch (error) {
    console.error("Error deleting from Google Drive:", error)
    throw error
  }
}
