import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const material = await prisma.rawMaterial.findUnique({
    where: { id },
    include: {
      purchaseOrders: {
        include: {
          purchaseOrder: true,
        },
        orderBy: { createdAt: "desc" },
      },
      bomEntries: {
        include: {
          productVariant: {
            include: {
              product: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      },
      consumptionLogs: {
        orderBy: { createdAt: "desc" },
      },
    },
  })

  if (!material) {
    return NextResponse.json({ error: "Material not found" }, { status: 404 })
  }

  return NextResponse.json(material)
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const body = await request.json()

  const material = await prisma.rawMaterial.update({
    where: { id },
    data: {
      name: body.name,
      category: body.category,
      unit: body.unit,
      costPerUnit: body.costPerUnit,
      lowStockThreshold: body.lowStockThreshold,
      updatedAt: new Date(),
    },
  })

  return NextResponse.json(material)
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  await prisma.rawMaterial.delete({
    where: { id },
  })

  return new NextResponse(null, { status: 204 })
}
