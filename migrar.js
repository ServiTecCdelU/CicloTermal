const admin = require("firebase-admin");

const serviceAccount = {
  type: "service_account",
  project_id: "cicloturismo-29b4d",
  private_key_id: "b61d915d9fabad86b82a7f8c8a21391aa333df31",
  private_key: "-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQCquCMzcTM8C6L1\nDeAM/4KFcaQ0pJD3eeVja3SFMz0HDsez1RCuUVUM7dNreA15rzdMOPXSvV3s1iIZ\nA42QPcQBsg2dw8l+CWuMvR9vhXOAvVNDu/VdS83SZg8bo4dWAWggBprALeNAxovc\nlz50SyvEmuk5XD9MnEjhzVrKhn9GLLBg+CNm+gPEbSf33zZmljX0CdkRpseXZLC/\nAQ9IGsmulRtikjGdOV/Gb+wx37Vhvq5hdpHaHuMLNoAnOlSv5qn21xwJtXg9JW06\nmwNNceq9vbjOpL/UO4FDTeCfmLMpsZnohlIRa796t8whz4RLr507zqrzh7c7yprE\nh+Ns8CQnAgMBAAECggEAEDbFiRji5SdfG70XSW9ppbjhqpTypmkaWIiXxsrTV1Ht\nCkRd0uCAnmYRYq9ClbWxdSN3yBhvd5NC0R4IROnI2DcL71mX+nN0lnz5I64IsUfJ\n77CbS3gWnTlPjVrI+2nOH4nhCrLmVtGZ7k0jA7KGqU6OgKx6ipEmpDjNEFfDy2tC\nwx0IWwWhi4ZB2gN4hCPNK/H5rNDqSeEKViGe9WZLxb2iqsoRboIpPZ9KkmkpACTF\nmjjQKzpgxjxx45q9YOGMbXs+TvTTdUgvqHqlJJeesilWTUSAc6QjtFwi0rKd+zqE\nxp5Lbuedy3+gIEsEOXnwp1SK1Ws0cwLGiGX7eSZO6QKBgQDSYmIXeyRi+SrtS+2M\n9XAr/36P3kqKBnZKw7Y81l3UCPAXM8/ygYeejcyLPi9K47FCH5vEgEUWm2M8BGvD\nP4Ar1Zz8F51SyC0zkdoLEjGVdQ4cRukU517rFvtX+tMZnVV4YNHx5rCnluLD4vAn\nHWzVwF56imsopCSvRGIviQav8wKBgQDPvBpTQ5Af1bMq2nKQxFbcG2Cfm3lzkCnn\nLJSFdr7RJoaa9RtgoccR4kloeh+EAdo91jCGsJi4Bnww7T6zLiwQMOWgkzDSAH5V\n2KSNKcR+8VqwSdCSnLffKAmv3CsJcF8lnCSLttdceXuiJz60+HwijtDLTbtY8A1k\nP3Uuxyv7/QKBgQCbxRRz5k1OqsZJ5IoCcEeZjBadVy1BfP9g4/+uk9ntAKEjzM0O\n9TEBCGSGRIinnmbEWrruhzqgPnT/Hxba/c1cp1EQpjtp66TsJfWXdOUZkA3eifJR\n8+2niuCWh7R9pqx98NIBlZj+vQ0xlHnTvEm1CjXp7UriUIaI7szz/TTiWQKBgQDC\nP2BWb5z7R7bL4YyzdgTKuQb2+EjvGOU19+fBjTINHPtNNtks2NnvDSwbd+a0Z48N\nt5WUvNlxaw8CKTYyEoC9exudtUU3eaKo33WvUlkdYs6sfbl8/vKoxyWXvka4As3V\nu1YpFwX2wNos3Im0a46YOfdfxAXlukKrdPM8lJ26eQKBgBXuOoC7m+wZ0p3gmOmf\nDGILA2QVshfxU2uGCbwUBJAgVxcX0ULpft6f2Lg6rMLx+hvrnJx2GUxZSSrT+vC1\ny5FkIfs4tdn0YYihF05QHw3AV7W5tpPlm5AMhx3rJpM8lEfKK8iPlSmzIUbR5OQO\nDNOzOEhokND6wAbd/Ub4Fot3\n-----END PRIVATE KEY-----\n",
  client_email: "firebase-adminsdk-fbsvc@cicloturismo-29b4d.iam.gserviceaccount.com",
  client_id: "117216095251839859315",
  auth_uri: "https://accounts.google.com/o/oauth2/auth",
  token_uri: "https://oauth2.googleapis.com/token",
  auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
  client_x509_cert_url: "https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-fbsvc%40cicloturismo-29b4d.iam.gserviceaccount.com",
  universe_domain: "googleapis.com"
};

admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });

const db = admin.firestore();

async function migrar() {
  const origen = await db.collection("participantes2025").get();

  if (origen.empty) {
    console.log("La colección participantes2025 está vacía.");
    return;
  }

  let ok = 0;
  let errores = 0;

  for (const doc of origen.docs) {
    const data = doc.data();
    const dni = data.dni?.trim();

    if (!dni) {
      console.warn(`Sin DNI, saltando doc: ${doc.id}`);
      errores++;
      continue;
    }

    const nuevo = {
      // Perfil personal
      nombre: data.nombre ?? "",
      apellido: data.apellido ?? "",
      email: data.email ?? "",
      telefono: data.telefono ?? "",
      paisTelefono: data.paisTelefono ?? "",
      telefonoEmergencia: data.telefonoEmergencia ?? "",
      paisTelefonoEmergencia: data.paisTelefonoEmergencia ?? "",
      dni: dni,
      fechaNacimiento: data.fechaNacimiento ?? "",
      genero: data.genero ?? "",
      grupoSanguineo: data.grupoSanguineo ?? "",
      condicionSalud: data.condicionSalud ?? "",
      localidad: data.localidad ?? "",
      grupoCiclistas: data.grupoCiclistas ?? "",
      imagenBase64: data.imagenBase64 ?? "",
      nombreArchivo: data.nombreArchivo ?? "",

      // Datos del ciclo vigente
      talleRemera: data.talleRemera ?? "",
      recorrido: data.recorrido ?? "",
      precio: "",
      estado: "pendiente",
      comprobantePagoUrl: data.comprobantePagoUrl ?? "",
      transferidoA: "",
      numeroInscripcion: data.numeroInscripcion ?? null,
      aceptaTerminos: data.aceptaTerminos ?? false,
      fechaInscripcion: data.fechaInscripcion ?? "",
      fechaActualizacion: data.fechaActualizacion ?? "",
      nota: data.nota ?? "",
      emailEnviado: data.emailEnviado ?? false,
      fechaEmailEnviado: data.fechaEmailEnviado ?? "",

      // Historial
      años: [2025],
    };

    try {
      await db.collection("participantesCicloTermal").doc(dni).set(nuevo);
      console.log(`✓ ${data.apellido} ${data.nombre} (${dni})`);
      ok++;
    } catch (e) {
      console.error(`✗ Error con DNI ${dni}:`, e.message);
      errores++;
    }
  }

  console.log(`\nMigración completa: ${ok} ok, ${errores} errores`);
}

migrar().catch(console.error);
