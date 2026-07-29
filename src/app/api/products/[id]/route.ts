import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const product = await prisma.product.findUnique({
    where: { id },
    include: {
      variants: { orderBy: { createdAt: "desc" } },
      inventory: true,
      salesOrderItems: true,
    },
  })

  if (!product) {
    return NextResponse.json({ error: "Product not found" }, { status: 404 })
  }

  return NextResponse.json(product)
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const body = await request.json()

  const product = await prisma.product.update({
    where: { id },
    data: {
      sku: body.sku,
      name: body.name,
      description: body.description,
      category: body.category,
      costPrice: body.costPrice,
      sellingPrice: body.sellingPrice,
      updatedAt: new Date(),
    },
  })

  return NextResponse.json(product)
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  await prisma.product.delete({
    where: { id },
  })

  return new NextResponse(null, { status: 204 })
}