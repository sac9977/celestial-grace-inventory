import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const materials = await prisma.rawMaterial.findMany({
    orderBy: { createdAt: "desc" },
  })

  return NextResponse.json(materials)
}

export async function POST(request: Request) {
  const body = await request.json()

  const material = await prisma.rawMaterial.create({
    data: {
      name: body.name,
      category: body.category,
      unit: body.unit,
      costPerUnit: Number(body.costPerUnit),
      lowStockThreshold: Number(body.lowStockThreshold ?? 10),
    },
  })

  return NextResponse.json(material, { status: 201 })
}
