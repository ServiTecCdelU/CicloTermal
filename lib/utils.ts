import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export interface CondicionSalud {
  tieneAlergias?: boolean
  tomaMedicamentos?: boolean
  tieneProblemasSalud?: boolean
  condicionesSalud?: string
  esCeliaco?: string
  [key: string]: any
}

export function parseHealthConditions(condicionSalud: any): CondicionSalud {
  if (!condicionSalud) return { condicionesSalud: "", esCeliaco: "no" }

  if (typeof condicionSalud === "string" && condicionSalud.trim().startsWith("{")) {
    try {
      const parsed = JSON.parse(condicionSalud)
      return {
        condicionesSalud: parsed.condicionesSalud || parsed.condicionSalud || "",
        esCeliaco: parsed.esCeliaco || "no",
      }
    } catch {
      return { condicionesSalud: condicionSalud, esCeliaco: "no" }
    }
  } else if (typeof condicionSalud === "object") {
    return {
      condicionesSalud: condicionSalud.condicionesSalud || condicionSalud.condicionSalud || "",
      esCeliaco: condicionSalud.esCeliaco || "no",
    }
  } else {
    return { condicionesSalud: condicionSalud || "", esCeliaco: "no" }
  }
}
