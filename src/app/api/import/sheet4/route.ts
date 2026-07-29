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
    const { rows, mapping } = body

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
        const sku = getVal("sku")
        const name = getVal("name")
        if (!sku || !name) {
          skipped++
          continue
        }

        const existing = await prisma.product.findUnique({ where: { sku: String(sku) } })
        if (existing) {
          skipped++
          continue
        }

        await prisma.product.create({
          data: {
            sku: String(sku),
            name: String(name),
            description: getVal("description") ? String(getVal("description")) : null,
            category: getVal("category") ? String(getVal("category")) : "Uncategorized",
            costPrice: Number(getVal("costPrice") || 0),
            sellingPrice: Number(getVal("sellingPrice") || 0),
          },
        })
        imported++
      } catch (err) {
        errors.push(`Row ${i + 1}: ${err instanceof Error ? err.message : "Unknown error"}`)
      }
    }

    return NextResponse.json({ imported, skipped, errors })
  } catch (error) {
    console.error("Failed to import sheet4:", error)
    return NextResponse.json({ error: "Failed to import" }, { status: 500 })
  }
}
