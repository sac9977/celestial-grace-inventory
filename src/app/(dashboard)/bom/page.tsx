import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import { redirect } from "next/navigation"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Package } from "lucide-react"

async function getBomEntries() {
  const entries = await prisma.productBOM.findMany({
    include: {
      productVariant: { include: { product: true } },
      rawMaterial: true,
    },
    orderBy: { createdAt: "desc" },
  })
  return entries
}

export default async function BomPage() {
  const session = await auth()

  if (!session?.user) {
    redirect("/login")
  }

  const entries = await getBomEntries()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Bill of Materials</h1>
          <p className="text-muted-foreground">
            Product variant material requirements
          </p>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Variant</TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead>Material</TableHead>
                  <TableHead>Qty Per Unit</TableHead>
                  <TableHead>Unit</TableHead>
                  <TableHead>Meters</TableHead>
                  <TableHead>Wastage %</TableHead>
                  <TableHead>Net Consumption</TableHead>
                  <TableHead>Rate / Bag</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {entries.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                      No BOM entries found
                    </TableCell>
                  </TableRow>
                ) : (
                  entries.map((entry) => {
                    const meters = entry.meters ?? 0
                    const wastagePercent = entry.wastagePercent ?? 0
                    const netConsumption = entry.netConsumption ?? entry.quantityPerUnit
                    const rateCostPerBag = entry.rateCostPerBag ?? 0

                    return (
                      <TableRow key={entry.id}>
                        <TableCell className="font-medium">
                          {entry.productVariant?.sku ?? "—"}
                        </TableCell>
                        <TableCell>
                          {entry.productVariant?.product?.name ?? "—"}
                        </TableCell>
                        <TableCell>
                          {entry.rawMaterial?.name ?? "—"}
                        </TableCell>
                        <TableCell className="font-mono">
                          {entry.quantityPerUnit.toString()}
                        </TableCell>
                        <TableCell>{entry.unit}</TableCell>
                        <TableCell className="font-mono">
                          {meters.toFixed(2).toString()}
                        </TableCell>
                        <TableCell className="font-mono">
                          {wastagePercent.toFixed(1).toString()}%
                        </TableCell>
                        <TableCell className="font-mono">
                          {netConsumption.toFixed(2).toString()}
                        </TableCell>
                        <TableCell className="font-mono">
                          ${rateCostPerBag.toFixed(2).toString()}
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