import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"
import { auth } from "@/auth"

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const purchaseOrders = await prisma.purchaseOrder.findMany({
      include: { supplier: true, items: { include: { rawMaterial: true } } },
      orderBy: { createdAt: "desc" },
    })
    return NextResponse.json(purchaseOrders)
  } catch (error) {
    console.error("Failed to fetch purchase orders:", error)
    return NextResponse.json({ error: "Failed to fetch purchase orders" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth()
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const body = await request.json()
    const { supplierId, reference, invoiceNo, billType, category, notes, items } = body

    const subtotal = items.reduce((sum: number, item: any) => sum + Number(item.quantity) * Number(item.costPerUnit), 0)
    const taxAmount = subtotal * 0.18
    const grandTotal = subtotal + taxAmount

    const purchaseOrder = await prisma.purchaseOrder.create({
      data: {
        supplierId,
        reference,
        invoiceNo,
        billType,
        category,
        notes,
        subtotal,
        taxAmount,
        grandTotal,
        paymentStatus: "UNPAID",
        items: {
          create: items.map((item: any) => ({
            rawMaterialId: item.rawMaterialId,
            quantity: Number(item.quantity),
            costPerUnit: Number(item.costPerUnit),
            amount: Number(item.quantity) * Number(item.costPerUnit),
          })),
        },
      },
      include: { supplier: true, items: { include: { rawMaterial: true } } },
    })

    return NextResponse.json(purchaseOrder, { status: 201 })
  } catch (error) {
    console.error("Failed to create purchase order:", error)
    return NextResponse.json({ error: "Failed to create purchase order" }, { status: 500 })
  }
}
