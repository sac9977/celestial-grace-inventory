import { prisma } from "@/lib/prisma"
import Link from "next/link"
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

async function getSalesOrders() {
  const salesOrders = await prisma.salesOrder.findMany({
    include: {
      customer: true,
      items: {
        include: {
          product: true,
          variant: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  })

  return salesOrders
}

export default async function SalesOrdersPage() {
  const salesOrders = await getSalesOrders()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Sales Orders</h1>
          <p className="text-muted-foreground">
            Manage sales orders and track fulfillment
          </p>
        </div>
        <Link href="/sales-orders/new">
          <Button>New Sales Order</Button>
        </Link>
      </div>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Order ID</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Payment</TableHead>
              <TableHead>Total</TableHead>
              <TableHead>Items</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {salesOrders.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                  No sales orders found
                </TableCell>
              </TableRow>
            ) : (
              salesOrders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell className="font-mono text-sm">
                    {order.id.slice(0, 8)}
                  </TableCell>
                  <TableCell className="font-medium">
                    {order.customer.name}
                  </TableCell>
                  <TableCell>
                    {new Date(order.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <Badge variant={
                      order.orderStatus === "DELIVERED"
                        ? "default"
                        : order.orderStatus === "CANCELLED"
                          ? "destructive"
                          : "secondary"
                    }>
                      {order.orderStatus}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={
                      order.paymentStatus === "PAID"
                        ? "default"
                        : order.paymentStatus === "UNPAID"
                          ? "destructive"
                          : "secondary"
                    }>
                      {order.paymentStatus}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    ${order.totalAmount.toString()}
                  </TableCell>
                  <TableCell>
                    {order.items.length}
                  </TableCell>
                  <TableCell>
                    <Link href={`/sales-orders/${order.id}`}>
                      <Button variant="outline" size="sm">
                        View
                      </Button>
                    </Link>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}