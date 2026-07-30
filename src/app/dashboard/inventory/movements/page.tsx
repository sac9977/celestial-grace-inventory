import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { RefreshCw, Package, ArrowUpCircle, ArrowDownCircle } from "lucide-react"
import Link from "next/link"

function getMovementIcon(type: string) {
  switch (type) {
    case "SALE_RESTOCK":
      return <ArrowUpCircle className="h-4 w-4 text-green-600" />
    case "PRODUCTION_CONSUMPTION":
      return <Package className="h-4 w-4 text-orange-600" />
    case "ADJUSTMENT":
      return <RefreshCw className="h-4 w-4 text-blue-600" />
    case "PO_RECEIPT":
      return <ArrowDownCircle className="h-4 w-4 text-purple-600" />
    default:
      return <RefreshCw className="h-4 w-4 text-muted-foreground" />
  }
}

export default async function MovementsPage() {
  const session = await auth()

  if (!session?.user) {
    redirect("/login")
  }

  const movements = await (prisma.inventoryMovement.findMany as any)({
    take: 100,
    orderBy: { createdAt: "desc" },
    include: {
      product: { select: { name: true } },
      variant: { select: { color: true, material: true, size: true } },
      rawMaterial: { select: { name: true } },
    },
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Movement Log</h1>
          <p className="text-muted-foreground">
            Recent inventory movements
          </p>
        </div>
        <Link href="/inventory">
          <Button variant="outline">Back to Inventory</Button>
        </Link>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead>Variant</TableHead>
                  <TableHead>Material</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {movements.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      No movements found
                    </TableCell>
                  </TableRow>
                ) : (
                  movements.map((movement: any) => (
                    <TableRow key={movement.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getMovementIcon(movement.type)}
                          <span className="text-sm font-medium">
                            {movement.type.replace(/_/g, " ")}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {movement.product?.name ?? "-"}
                      </TableCell>
                      <TableCell>
                        {movement.variant ? (
                          <span>
                            {movement.variant.color} / {movement.variant.material}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {movement.rawMaterial?.name ?? "-"}
                      </TableCell>
                      <TableCell className="font-mono">
                          {movement.quantity.toString()}
                        </TableCell>
                      <TableCell>{movement.reason}</TableCell>
                      <TableCell>
                        {new Date(movement.createdAt).toLocaleString()}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
