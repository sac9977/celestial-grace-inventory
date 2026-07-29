import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const customer = await prisma.customer.findUnique({
    where: { id },
    include: {
      salesOrders: {
        include: {
          items: {
            include: {
              product: true,
              variant: true,
            },
          },
        },
      },
    },
  })

  if (!customer) {
    return NextResponse.json({ error: "Customer not found" }, { status: 404 })
  }

  return NextResponse.json(customer)
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const body = await request.json()

  const customer = await prisma.customer.update({
    where: { id },
    data: {
      name: body.name,
      email: body.email ?? null,
      phone: body.phone ?? null,
      address: body.address ?? null,
      notes: body.notes ?? null,
      updatedAt: new Date(),
    },
  })

  return NextResponse.json(customer)
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  await prisma.customer.delete({
    where: { id },
  })

  return new NextResponse(null, { status: 204 })
}