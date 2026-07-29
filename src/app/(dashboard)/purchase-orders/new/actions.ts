"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

export async function createPurchaseOrder(data: {
  supplierId: string
  reference: string
  invoiceNo?: string
  billType?: string
  category?: string
  notes?: string
  items: { rawMaterialId: string; quantity: string; costPerUnit: string }[]
}) {
  try {
    const subtotal = data.items.reduce((sum, item) => sum + Number(item.quantity) * Number(item.costPerUnit), 0)
    const taxAmount = subtotal * 0.18 // 18% GST placeholder
    const grandTotal = subtotal + taxAmount

    const purchaseOrder = await prisma.purchaseOrder.create({
      data: {
        supplierId: data.supplierId,
        reference: data.reference,
        invoiceNo: data.invoiceNo,
        billType: data.billType,
        category: data.category,
        notes: data.notes,
        subtotal,
        taxAmount,
        grandTotal,
        paymentStatus: "UNPAID",
        items: {
          create: data.items.map((item) => ({
            rawMaterialId: item.rawMaterialId,
            quantity: Number(item.quantity),
            costPerUnit: Number(item.costPerUnit),
            amount: Number(item.quantity) * Number(item.costPerUnit),
          })),
        },
      },
    })

    revalidatePath("/purchase-orders")
    redirect(`/purchase-orders/${purchaseOrder.id}`)
  } catch (error) {
    console.error("Failed to create purchase order:", error)
    return { error: "Failed to create purchase order" }
  }
}

export async function receivePurchaseOrder(poId: string, itemReceipts: { itemId: string; receivedQty: number }[]) {
  try {
    const po = await prisma.purchaseOrder.findUnique({
      where: { id: poId },
      include: { items: true },
    })

    if (!po) return { error: "Purchase order not found" }

    let totalOrdered = 0
    let totalReceived = 0

    for (const receipt of itemReceipts) {
      const item = po.items.find((i) => i.id === receipt.itemId)
      if (!item) continue

      totalOrdered += Number(item.quantity)
      totalReceived += receipt.receivedQty

      await prisma.purchaseOrderItem.update({
        where: { id: receipt.itemId },
        data: { status: receipt.receivedQty >= Number(item.quantity) ? "RECEIVED" : "PARTIAL" },
      })
    }

    const newStatus = totalReceived >= totalOrdered ? "RECEIVED" : totalReceived > 0 ? "PARTIALLY_RECEIVED" : po.status

    await prisma.purchaseOrder.update({
      where: { id: poId },
      data: {
        status: newStatus as any,
        receivedAt: newStatus === "RECEIVED" ? new Date() : null,
      },
    })

    revalidatePath("/purchase-orders")
    return { success: true }
  } catch (error) {
    console.error("Failed to receive purchase order:", error)
    return { error: "Failed to receive purchase order" }
  }
}
