import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const salesOrders = await prisma.salesOrder.findMany({
    include: {
      customer: true,
      items: {
        include: {
          product: true,
          variant: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  })

  return NextResponse.json(salesOrders)
}

export async function POST(request: Request) {
  const body = await request.json()

  const { customerId, items, notes, createdBy } = body

  const totalAmount = items.reduce(
    (sum: number, item: { quantity: number; unitPrice: number }) =>
      sum + item.quantity * item.unitPrice,
    0
  )

  const salesOrder = await prisma.salesOrder.create({
    data: {
      customerId,
      orderStatus: "PENDING",
      paymentStatus: "UNPAID",
      totalAmount: totalAmount,
      notes: notes || null,
      createdBy,
      items: {
        create: items.map(
          (item: { productId: string; variantId?: string; quantity: number; unitPrice: number }) => ({
            productId: item.productId,
            variantId: item.variantId || null,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
          })
        ),
      },
    },
    include: {
      customer: true,
      items: {
        include: {
          product: true,
          variant: true,
        },
      },
    },
  })

  return NextResponse.json(salesOrder, { status: 201 })
}