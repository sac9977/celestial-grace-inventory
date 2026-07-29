import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import { hash } from "bcryptjs"

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()

  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
  }

  const { id } = await params

  const item = await prisma.inventoryItem.findUnique({
    where: { id },
    include: { product: true, variant: true },
  })

  if (!item) {
    return NextResponse.json({ error: "Inventory item not found" }, { status: 404 })
  }

  return NextResponse.json(item)
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id } = await params
  const body = await request.json()
  const { quantityDelta, reason } = body as {
    quantityDelta: number
    reason: string
  }

  if (typeof quantityDelta !== "number" || !reason?.trim()) {
    return NextResponse.json(
      { error: "quantityDelta and reason are required" },
      { status: 400 }
    )
  }

  try {
    const item = await prisma.inventoryItem.findUnique({
      where: { id },
    })

    if (!item) {
      return NextResponse.json(
        { error: "Inventory item not found" },
        { status: 404 }
      )
    }

    const newQuantity = item.quantity + quantityDelta

    await prisma.inventoryItem.update({
      where: { id },
      data: { quantity: newQuantity },
    })

    await prisma.inventoryMovement.create({
      data: {
        type: "ADJUSTMENT",
        productId: item.productId,
        variantId: item.variantId,
        quantity: Math.abs(quantityDelta),
        reason,
        createdBy: session.user.name ?? "unknown",
      },
    })

    return NextResponse.json({
      success: true,
      newQuantity,
      message: "Stock adjusted successfully",
    })
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to adjust stock" },
      { status: 500 }
    )
  }
}