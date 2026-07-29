import { prisma } from "@/lib/prisma"
import Link from "next/link"
import { redirect } from "next/navigation"
import { revalidatePath } from "next/cache"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
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
import { Edit, Trash2 } from "lucide-react"

async function deleteMaterial(formData: FormData) {
  "use server"

  const id = formData.get("id") as string

  try {
    await prisma.rawMaterial.delete({
      where: { id },
    })

    revalidatePath("/raw-materials")
    redirect("/raw-materials")
  } catch (error) {
    redirect(`/raw-materials/${id}`)
  }
}

async function getMaterial(id: string) {
  const material = await prisma.rawMaterial.findUnique({
    where: { id },
    include: {
      purchaseOrders: {
        include: {
          purchaseOrder: {
            include: {
              supplier: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      },
      bomEntries: {
        include: {
          productVariant: {
            include: {
              product: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      },
      consumptionLogs: {
        orderBy: { createdAt: "desc" },
      },
    },
  })

  return material
}

export default async function MaterialDetailPage({
  params,
}: {
  params: { id: string }
}) {
  const material = await getMaterial(params.id)

  if (!material) {
    notFound()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {material.name}
          </h1>
          <p className="text-muted-foreground">{material.category}</p>
        </div>
        <div className="flex items-center gap-2">
          <Link href={`/raw-materials/${material.id}/edit`}>
            <Button variant="outline">
              <Edit className="mr-2 h-4 w-4" />
              Edit Material
            </Button>
          </Link>
          <Dialog>
            <DialogTrigger>
              <Button variant="destructive">
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Delete Material</DialogTitle>
                <DialogDescription>
                  Are you sure you want to delete {material.name}? This action
                  cannot be undone.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <DialogClose>
                  <Button variant="outline">Cancel</Button>
                </DialogClose>
                <form action={deleteMaterial}>
                  <input type="hidden" name="id" defaultValue={material.id} />
                  <Button variant="destructive" type="submit">
                    Delete
                  </Button>
                </form>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Category</CardTitle>
          </CardHeader>
          <CardContent>
            <Badge variant="secondary">{material.category}</Badge>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Cost / Unit</CardTitle>
          </CardHeader>
          <CardContent>
            <span className="text-lg font-semibold">
              ${material.costPerUnit.toString()}
            </span>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Unit</CardTitle>
          </CardHeader>
          <CardContent>
            <span className="text-lg font-semibold">{material.unit}</span>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Purchase Order Items</CardTitle>
        </CardHeader>
        <CardContent>
          {material.purchaseOrders.length === 0 ? (
            <p className="text-sm text-muted-foreground">No purchase order items found</p>
          ) : (
            <div className="rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>PO Reference</TableHead>
                    <TableHead>Supplier</TableHead>
                    <TableHead>Quantity</TableHead>
                    <TableHead>Cost / Unit</TableHead>
                    <TableHead>Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {material.purchaseOrders.map((po) => (
                    <TableRow key={po.id}>
                      <TableCell>
                        <Link
                          href={`/purchase-orders/${po.purchaseOrder.id}`}
                          className="font-mono text-sm hover:underline"
                        >
                          {po.purchaseOrder.reference}
                        </Link>
                      </TableCell>
                      <TableCell>{po.purchaseOrder.supplier?.name || "-"}</TableCell>
                      <TableCell>{po.quantity.toString()}</TableCell>
                      <TableCell>${po.costPerUnit.toString()}</TableCell>
                      <TableCell>${po.amount.toString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>BOM Entries</CardTitle>
        </CardHeader>
        <CardContent>
          {material.bomEntries.length === 0 ? (
            <p className="text-sm text-muted-foreground">No BOM entries found</p>
          ) : (
            <div className="rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead>Variant</TableHead>
                    <TableHead>Qty / Unit</TableHead>
                    <TableHead>Unit</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {material.bomEntries.map((bom) => (
                    <TableRow key={bom.id}>
                      <TableCell>{bom.productVariant?.product?.name || "-"}</TableCell>
                      <TableCell>
                        {bom.productVariant
                          ? `${bom.productVariant.color} / ${bom.productVariant.material}`
                          : "-"}
                      </TableCell>
                      <TableCell>{bom.quantityPerUnit.toString()}</TableCell>
                      <TableCell>{bom.unit}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Consumption Logs</CardTitle>
        </CardHeader>
        <CardContent>
          {material.consumptionLogs.length === 0 ? (
            <p className="text-sm text-muted-foreground">No consumption logs found</p>
          ) : (
            <div className="rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Quantity</TableHead>
                    <TableHead>Reason</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {material.consumptionLogs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell>
                        {new Date(log.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell>{log.quantity.toString()}</TableCell>
                      <TableCell>{log.reason}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
