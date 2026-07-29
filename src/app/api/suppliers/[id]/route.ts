import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supplier = await prisma.supplier.findUnique({
    where: { id },
    include: {
      purchaseOrders: {
        orderBy: { createdAt: "desc" },
      },
    },
  })

  if (!supplier) {
    return NextResponse.json({ error: "Supplier not found" }, { status: 404 })
  }

  return NextResponse.json(supplier)
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const body = await request.json()

  const supplier = await prisma.supplier.update({
    where: { id },
    data: {
      name: body.name,
      contact: body.contact,
      email: body.email,
      phone: body.phone,
      address: body.address,
      updatedAt: new Date(),
    },
  })

  return NextResponse.json(supplier)
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  await prisma.supplier.delete({
    where: { id },
  })

  return new NextResponse(null, { status: 204 })
}
