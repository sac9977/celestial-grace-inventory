import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const products = await prisma.product.findMany({
    include: {
      variants: true,
      inventory: true,
    },
    orderBy: { createdAt: "desc" },
  })

  return NextResponse.json(products)
}

export async function POST(request: Request) {
  const body = await request.json()

  const product = await prisma.product.create({
    data: {
      sku: body.sku,
      name: body.name,
      description: body.description,
      category: body.category,
      costPrice: Number(body.costPrice),
      sellingPrice: Number(body.sellingPrice),
    },
  })

  return NextResponse.json(product, { status: 201 })
}