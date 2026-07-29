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
        const vendorName = getVal("vendor")
        const reference = getVal("Bill Reference")
        if (!vendorName || !reference) {
          skipped++
          continue
        }

        let supplier = await prisma.supplier.findUnique({
          where: { name: String(vendorName) },
        })
        if (!supplier) {
          supplier = await prisma.supplier.create({
            data: { name: String(vendorName) },
          })
        }

        const existing = await prisma.purchaseOrder.findFirst({
          where: { reference: String(reference), supplierId: supplier.id },
        })
        if (existing) {
          skipped++
          continue
        }

        await prisma.purchaseOrder.create({
          data: {
            supplierId: supplier.id,
            reference: String(reference),
            invoiceNo: getVal("invoice no.") ? String(getVal("invoice no.")) : null,
            billType: getVal("bill type") ? String(getVal("bill type")) : null,
            category: getVal("category") ? String(getVal("category")) : null,
            paymentStatus: (getVal("payment status") ? String(getVal("payment status")).toUpperCase() : "UNPAID") as any,
            subtotal: Number(getVal("subtotal") || 0),
            taxAmount: Number(getVal("SGST") || 0) + Number(getVal("CGST") || 0),
            grandTotal: Number(getVal("grand total") || 0),
            notes: getVal("remarks") ? String(getVal("remarks")) : null,
          },
        })
        imported++
      } catch (err) {
        errors.push(`Row ${i + 1}: ${err instanceof Error ? err.message : "Unknown error"}`)
      }
    }

    return NextResponse.json({ imported, skipped, errors })
  } catch (error) {
    console.error("Failed to import sheet1:", error)
    return NextResponse.json({ error: "Failed to import" }, { status: 500 })
  }
}
