import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"
import { auth } from "@/auth"

async function getSession() {
  const session = await auth()
  if (!session?.user) throw new Error("Unauthorized")
  return session
}

export async function POST(request: Request) {
  try {
    await getSession()
    const body = await request.json()
    const { rows, mapping, sheetName } = body

    const headers = rows[0] || []
    let imported = 0
    let skipped = 0
    const errors: string[] = []

    for (let i = 1; i < rows.length; i++) {
      const row = rows[i]
      if (!row || row.length === 0) continue

      const getVal = (field: string) => {
        const idx = headers.findIndex((h: string) => mapping[h] === field)
        return idx >= 0 ? row[idx] : undefined
      }

      try {
        const itemCode = getVal("item code") || getVal("material code")
        const name = getVal("material description") || getVal("hardware/ accessory description")
        if (!itemCode || !name) {
          skipped++
          continue
        }

        const existing = await prisma.rawMaterial.findFirst({
          where: { name: String(name) },
        })
        if (existing) {
          skipped++
          continue
        }

        await prisma.rawMaterial.create({
          data: {
            name: String(name),
            category: sheetName === "Sheet2" ? "material" : "hardware",
            unit: getVal("unit") ? String(getVal("unit")) : "pcs",
            costPerUnit: Number(getVal("rate") || getVal("costPerUnit") || 0),
            lowStockThreshold: Number(getVal("lowStockThreshold") || 10),
          },
        })
        imported++
      } catch (err) {
        errors.push(`Row ${i + 1}: ${err instanceof Error ? err.message : "Unknown error"}`)
      }
    }

    return NextResponse.json({ imported, skipped, errors })
  } catch (error) {
    console.error("Failed to import sheet2-3:", error)
    return NextResponse.json({ error: "Failed to import" }, { status: 500 })
  }
}
