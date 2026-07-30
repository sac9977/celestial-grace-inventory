import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { notFound } from "next/navigation"
import { receivePurchaseOrder } from "../../new/actions"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { ArrowLeft } from "lucide-react"

export default async function ReceivePurchaseOrderPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const session = await auth()
  if (!session?.user) redirect("/login")

  const { id } = await params
  const purchaseOrder = await prisma.purchaseOrder.findUnique({
    where: { id },
    include: { items: { include: { rawMaterial: true } } },
  })

  if (!purchaseOrder || purchaseOrder.status === "CANCELLED") {
    notFound()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon">
            <a href={`/purchase-orders/${id}`}>
              <ArrowLeft className="h-4 w-4" />
            </a>
          </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Receive Purchase Order</h1>
          <p className="text-muted-foreground">{purchaseOrder.reference}</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Receive Items</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={async (formData) => {
            "use server"
            const itemReceipts = purchaseOrder.items.map((item) => ({
              itemId: item.id,
              receivedQty: Number(formData.get(`qty_${item.id}`) || 0),
            }))
            const result = await receivePurchaseOrder(id, itemReceipts)
            if (result?.error) {
              redirect(`/purchase-orders/${id}/receive?error=${result.error}`)
            }
            redirect(`/purchase-orders/${id}`)
          }} className="space-y-6">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Material</TableHead>
                  <TableHead>Ordered Qty</TableHead>
                  <TableHead>Received Qty</TableHead>
                  <TableHead>Remaining</TableHead>
                  <TableHead>Enter Received</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {purchaseOrder.items.map((item) => {
                  const ordered = Number(item.quantity)
                  const remaining = ordered // In a real app, track cumulative received
                  return (
                    <TableRow key={item.id}>
                      <TableCell>{item.rawMaterial?.name || "-"}</TableCell>
                      <TableCell>{ordered.toFixed(2)}</TableCell>
                      <TableCell>-</TableCell>
                      <TableCell>{remaining.toFixed(2)}</TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          step="0.01"
                          name={`qty_${item.id}`}
                          defaultValue="0"
                          min="0"
                          max={remaining}
                          className="w-24"
                        />
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
            <div className="flex gap-4">
              <Button type="submit">Confirm Receipt</Button>
              <Button type="button" variant="outline">
                <a href={`/purchase-orders/${id}`}>Cancel</a>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
