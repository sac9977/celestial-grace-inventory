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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"

async function updateOrderStatus(formData: FormData) {
  "use server"

  const id = formData.get("id") as string
  const orderStatus = formData.get("orderStatus") as string
  const paymentStatus = formData.get("paymentStatus") as string

  await prisma.salesOrder.update({
    where: { id },
    data: {
      orderStatus: orderStatus as any,
      paymentStatus: paymentStatus as any,
      updatedAt: new Date(),
    },
  })

  revalidatePath(`/sales-orders/${id}`)
  revalidatePath("/sales-orders")
  redirect(`/sales-orders/${id}`)
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

export default async function SalesOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const order = await getSalesOrder(id)

  if (!order) {
    notFound()
  }

  const statusSteps = ["PENDING", "PROCESSING", "SHIPPED", "DELIVERED"] as const
  const currentStatusIndex = statusSteps.indexOf(
    order.orderStatus as any
  )

  const paymentSteps = ["UNPAID", "PARTIAL", "PAID"] as const
  const currentPaymentIndex = paymentSteps.indexOf(
    order.paymentStatus as any
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Sales Order {id.slice(0, 8)}
          </h1>
          <p className="text-muted-foreground">
            Created on {new Date(order.createdAt).toLocaleDateString()}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/sales-orders">
            <Button variant="outline">Back to Orders</Button>
          </Link>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Customer</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-medium">{order.customer.name}</p>
            <p className="text-sm text-muted-foreground">
              {order.customer.email || "—"}
            </p>
            <p className="text-sm text-muted-foreground">
              {order.customer.phone || "—"}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Order Status</CardTitle>
          </CardHeader>
          <CardContent>
            <Badge
              variant={
                order.orderStatus === "DELIVERED"
                  ? "default"
                  : order.orderStatus === "CANCELLED"
                    ? "destructive"
                    : "secondary"
              }
            >
              {order.orderStatus}
            </Badge>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Payment Status</CardTitle>
          </CardHeader>
          <CardContent>
            <Badge
              variant={
                order.paymentStatus === "PAID"
                  ? "default"
                  : order.paymentStatus === "UNPAID"
                    ? "destructive"
                    : "secondary"
              }
            >
              {order.paymentStatus}
            </Badge>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Total Amount</CardTitle>
          </CardHeader>
          <CardContent>
            <span className="text-lg font-semibold">
              ${order.totalAmount.toString()}
            </span>
          </CardContent>
        </Card>
      </div>

      {order.notes && (
        <Card>
          <CardHeader>
            <CardTitle>Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm">{order.notes}</p>
          </CardContent>
        </Card>
      )}

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
                          {item.variant.size
                            ? ` / ${item.variant.size}`
                            : ""}
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
          <CardTitle>Update Order</CardTitle>
        </CardHeader>
        <CardContent>
          <form
            action={updateOrderStatus}
            className="space-y-4"
          >
            <input type="hidden" name="id" defaultValue={order.id} />

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="orderStatus">Order Status</Label>
                <Select name="orderStatus" defaultValue={order.orderStatus}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {statusSteps.map((status) => (
                      <SelectItem key={status} value={status}>
                        {status}
                      </SelectItem>
                    ))}
                    <SelectItem value="CANCELLED">CANCELLED</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="paymentStatus">Payment Status</Label>
                <Select name="paymentStatus" defaultValue={order.paymentStatus}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {paymentSteps.map((status) => (
                      <SelectItem key={status} value={status}>
                        {status}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Button type="submit">Update Order</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}