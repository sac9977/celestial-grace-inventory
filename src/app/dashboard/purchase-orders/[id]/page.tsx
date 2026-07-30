import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { ArrowLeft, CheckCircle } from "lucide-react"

export default async function PurchaseOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const session = await auth()
  if (!session?.user) redirect("/login")

  const { id } = await params
  const purchaseOrder = await prisma.purchaseOrder.findUnique({
    where: { id },
    include: { supplier: true, items: { include: { rawMaterial: true } } },
  })

  if (!purchaseOrder) {
    redirect("/purchase-orders")
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      PENDING: "secondary",
      PARTIALLY_RECEIVED: "outline",
      RECEIVED: "default",
      CANCELLED: "destructive",
    }
    return <Badge variant={variants[status] || "default"}>{status}</Badge>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon">
            <Link href="/purchase-orders">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Purchase Order</h1>
            <p className="text-muted-foreground">{purchaseOrder.reference}</p>
          </div>
        </div>
        <Button variant="default">
            <Link href={`/purchase-orders/${id}/receive`}>
              <CheckCircle className="h-4 w-4 mr-2" />
              Receive
            </Link>
          </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Supplier</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm">{purchaseOrder.supplier?.name || "-"}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Status</CardTitle>
          </CardHeader>
          <CardContent>
            {getStatusBadge(purchaseOrder.status)}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Payment</CardTitle>
          </CardHeader>
          <CardContent>
            <Badge variant="outline">{purchaseOrder.paymentStatus}</Badge>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Grand Total</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-bold">
              {purchaseOrder.grandTotal ? `$${Number(purchaseOrder.grandTotal).toFixed(2)}` : "-"}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Line Items</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Material</TableHead>
                <TableHead>Quantity</TableHead>
                <TableHead>Rate</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {purchaseOrder.items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>{item.rawMaterial?.name || "-"}</TableCell>
                  <TableCell>{Number(item.quantity).toFixed(2)}</TableCell>
                  <TableCell>${Number(item.costPerUnit).toFixed(2)}</TableCell>
                  <TableCell>${Number(item.amount).toFixed(2)}</TableCell>
                  <TableCell>
                    <Badge variant={item.status === "RECEIVED" ? "default" : "secondary"}>
                      {item.status || "PENDING"}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {purchaseOrder.notes && (
        <Card>
          <CardHeader>
            <CardTitle>Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">{purchaseOrder.notes}</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
