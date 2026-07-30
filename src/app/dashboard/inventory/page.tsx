import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import { redirect } from "next/navigation"
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Package, AlertTriangle, ArrowDownCircle, ArrowUpCircle } from "lucide-react"
import AdjustStockForm from "./AdjustStockForm"

async function getInventoryItems() {
  const items = await prisma.inventoryItem.findMany({
    include: { product: true, variant: true },
    orderBy: { updatedAt: "desc" },
  })
  return items
}

export default async function InventoryPage() {
  const session = await auth()

  if (!session?.user) {
    redirect("/login")
  }

  const items = await getInventoryItems()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Inventory</h1>
          <p className="text-muted-foreground">
            Manage stock levels and adjustments
          </p>
        </div>
        <Link href="/inventory/movements">
          <Button variant="outline">
            <ArrowDownCircle className="mr-2 h-4 w-4" />
            Movement Log
          </Button>
        </Link>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>Variant</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Threshold</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      No inventory items found
                    </TableCell>
                  </TableRow>
                ) : (
                  items.map((item) => {
                    const isLowStock = item.quantity <= item.lowStockThreshold

                    return (
                      <TableRow
                        key={item.id}
                        className={isLowStock ? "bg-destructive/5" : undefined}
                      >
                        <TableCell className="font-medium">
                          {item.product?.name ?? "—"}
                        </TableCell>
                        <TableCell>
                          {item.variant ? (
                            <span>
                              {item.variant.color} / {item.variant.material}
                              {item.variant.size && ` / ${item.variant.size}`}
                            </span>
                          ) : (
                            <span className="text-muted-foreground">Default</span>
                          )}
                        </TableCell>
                        <TableCell className="font-mono">
                          {item.quantity}
                        </TableCell>
                        <TableCell className="font-mono">
                          {item.lowStockThreshold}
                        </TableCell>
                        <TableCell>
                          {isLowStock ? (
                            <Badge variant="destructive">Low Stock</Badge>
                          ) : (
                            <Badge variant="secondary">In Stock</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <AdjustStockForm itemId={item.id} currentQty={item.quantity} />
                        </TableCell>
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}