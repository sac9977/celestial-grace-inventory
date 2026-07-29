import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const suppliers = await prisma.supplier.findMany({
    include: {
      _count: {
        select: { purchaseOrders: true },
      },
    },
    orderBy: { createdAt: "desc" },
  })

  return NextResponse.json(suppliers)
}

export async function POST(request: Request) {
  const body = await request.json()

  const supplier = await prisma.supplier.create({
    data: {
      name: body.name,
      contact: body.contact,
      email: body.email,
      phone: body.phone,
      address: body.address,
    },
  })

  return NextResponse.json(supplier, { status: 201 })
}
