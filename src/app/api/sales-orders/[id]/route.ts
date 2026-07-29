import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const salesOrder = await prisma.salesOrder.findUnique({
    where: { id },
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

  if (!salesOrder) {
    return NextResponse.json({ error: "Sales order not found" }, { status: 404 })
  }

  return NextResponse.json(salesOrder)
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const body = await request.json()

  const salesOrder = await prisma.salesOrder.update({
    where: { id },
    data: {
      orderStatus: body.orderStatus,
      paymentStatus: body.paymentStatus,
      totalAmount: body.totalAmount,
      notes: body.notes ?? null,
      updatedAt: new Date(),
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

  return NextResponse.json(salesOrder)
}