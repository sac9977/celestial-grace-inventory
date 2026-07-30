import { prisma } from "@/lib/prisma"
import Link from "next/link"
import { redirect } from "next/navigation"
import { revalidatePath } from "next/cache"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { notFound } from "next/navigation"
import { toast } from "@/components/ui/toast"

async function confirmOrder(formData: FormData) {
  "use server"

  const id = formData.get("id") as string

  try {
    const order = await prisma.salesOrder.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            product: true,
            variant: true,
          },
        },
      },
    })

    if (!order) {
      redirect(`/sales-orders/${id}`)
    }

    for (const item of order.items) {
      await prisma.inventoryItem.upsert({
        where: item.variantId
          ? { productId_variantId: { productId: item.productId, variantId: item.variantId } }
          : { productId: item.productId },
        create: {
          productId: item.productId,
          variantId: item.variantId,
          quantity: -item.quantity,
          lowStockThreshold: 5,
        },
        update: {
          quantity: {
            decrement: item.quantity,
          },
        },
      })

      await prisma.inventoryMovement.create({
        data: {
          type: "SALE_RESTOCK",
          productId: item.productId,
          variantId: item.variantId,
          quantity: item.quantity,
          reason: "sale",
          relatedOrderId: id,
          createdBy: order.createdBy,
        },
      })
    }

    await prisma.salesOrder.update({
      where: { id },
      data: {
        orderStatus: "PROCESSING",
        updatedAt: new Date(),
      },
    })

    revalidatePath(`/sales-orders/${id}`)
    revalidatePath("/sales-orders")

    toast.add({
      type: "success",
      title: "Order Confirmed",
      description: `Order ${id.slice(0, 8)} has been confirmed and is now processing.`,
    })

    redirect(`/sales-orders/${id}`)
  } catch (error) {
    toast.add({
      type: "error",
      title: "Error",
      description: "Failed to confirm order.",
    })
    redirect(`/sales-orders/${id}`)
  }
}

async function getSalesOrder(id: string) {
  const order = await prisma.salesOrder.findUnique({
    where: { id },
    include: {
      customer: true,
      items: {
        include: {
          product: true,
          variant: true,
        },
      },
    },
  })

  return order
}

export default async function ConfirmOrderPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const order = await getSalesOrder(id)

  if (!order) {
    notFound()
  }

  if (order.orderStatus !== "PENDING") {
    redirect(`/sales-orders/${id}`)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Confirm Order {id.slice(0, 8)}
          </h1>
          <p className="text-muted-foreground">
            Review and confirm this sales order to deduct stock and begin processing.
          </p>
        </div>
        <Link href={`/sales-orders/${id}`}>
          <Button variant="outline">Back to Order</Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Order Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <p className="text-sm text-muted-foreground">Customer</p>
              <p className="font-medium">{order.customer.name}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total</p>
              <p className="text-lg font-semibold">
                ${order.totalAmount.toString()}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Items</p>
              <p className="font-medium">{order.items.length} item(s)</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Payment Status</p>
              <Badge variant={order.paymentStatus === "UNPAID" ? "destructive" : "secondary"}>
                {order.paymentStatus}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Line Items</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>Variant</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Unit Price</TableHead>
                  <TableHead>Subtotal</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {order.items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">
                      {item.product.name}
                    </TableCell>
                    <TableCell>
                      {item.variant ? (
                        <span className="text-sm">
                          {item.variant.color} / {item.variant.material}
                          {item.variant.size ? ` / ${item.variant.size}` : ""}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>{item.quantity}</TableCell>
                    <TableCell>
                      ${item.unitPrice.toString()}
                    </TableCell>
                    <TableCell>
                      ${(item.quantity * Number(item.unitPrice)).toFixed(2)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Stock Impact</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Confirming this order will decrement inventory for each item and create
            inventory movement records. The order status will be updated to PROCESSING.
          </p>
        </CardContent>
      </Card>

      <form action={confirmOrder}>
        <input type="hidden" name="id" defaultValue={order.id} />
        <div className="flex items-center gap-2">
          <Button type="submit" variant="destructive">
            Confirm Order
          </Button>
          <Link href={`/sales-orders/${id}`}>
            <Button variant="outline" type="button">Cancel</Button>
          </Link>
        </div>
      </form>
    </div>
  )
}