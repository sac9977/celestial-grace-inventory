import Link from "next/link"
import { redirect } from "next/navigation"
import { revalidatePath } from "next/cache"
import { Button } from "@/components/ui/button"
import { prisma } from "@/lib/prisma"
import { NewSalesOrderForm } from "./NewSalesOrderForm"

type FormState = {
  message: string
  errors: Record<string, string[]>
}

async function createSalesOrder(
  _prevState: FormState,
  formData: FormData
): Promise<FormState> {
  "use server"

  const customerId = formData.get("customerId") as string
  const notes = (formData.get("notes") as string) || null
  const itemCount = parseInt(formData.get("itemCount") as string, 10)
  const createdBy = formData.get("createdBy") as string

  if (!customerId) {
    return {
      message: "Please select a customer.",
      errors: {},
    }
  }

  const items = []
  for (let i = 0; i < itemCount; i++) {
    const productId = formData.get(`productId_${i}`) as string
    const variantId = (formData.get(`variantId_${i}`) as string) || null
    const quantity = parseInt(formData.get(`quantity_${i}`) as string, 10)
    const unitPrice = parseFloat(formData.get(`unitPrice_${i}`) as string)

    if (!productId || isNaN(quantity) || isNaN(unitPrice)) {
      return {
        message: `Invalid item data for item ${i + 1}.`,
        errors: {},
      }
    }

    items.push({ productId, variantId, quantity, unitPrice })
  }

  if (items.length === 0) {
    return {
      message: "Please add at least one line item.",
      errors: {},
    }
  }

  try {
    const totalAmount = items.reduce(
      (sum, item) => sum + item.quantity * item.unitPrice,
      0
    )

    await prisma.salesOrder.create({
      data: {
        customerId,
        orderStatus: "PENDING",
        paymentStatus: "UNPAID",
        totalAmount,
        notes,
        createdBy,
        items: {
          create: items.map((item) => ({
            productId: item.productId,
            variantId: item.variantId,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
          })),
        },
      },
    })

    revalidatePath("/sales-orders")
    redirect("/sales-orders")
  } catch (error) {
    return {
      message: "Failed to create sales order.",
      errors: {},
    }
  }
}

export default async function NewSalesOrderPage() {
  const customers = await prisma.customer.findMany({
    orderBy: { name: "asc" },
  })

  const products = await prisma.product.findMany({
    include: {
      variants: true,
    },
    orderBy: { name: "asc" },
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">New Sales Order</h1>
        <Link href="/sales-orders">
          <Button variant="outline">Back to Sales Orders</Button>
        </Link>
      </div>

      <div className="rounded-lg border bg-card p-6">
        <NewSalesOrderForm
          createSalesOrderAction={createSalesOrder}
          customers={customers}
          products={products}
        />
      </div>
    </div>
  )
}