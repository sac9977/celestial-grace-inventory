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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { notFound } from "next/navigation"
import { Edit, Trash2 } from "lucide-react"

async function deleteSupplier(formData: FormData) {
  "use server"

  const id = formData.get("id") as string

  try {
    await prisma.supplier.delete({
      where: { id },
    })

    revalidatePath("/suppliers")
    redirect("/suppliers")
  } catch (error) {
    redirect(`/suppliers/${id}`)
  }
}

async function getSupplier(id: string) {
  const supplier = await prisma.supplier.findUnique({
    where: { id },
    include: {
      purchaseOrders: {
        include: {
          items: true,
        },
        orderBy: { createdAt: "desc" },
      },
    },
  })

  return supplier
}

export default async function SupplierDetailPage({
  params,
}: {
  params: { id: string }
}) {
  const supplier = await getSupplier(params.id)

  if (!supplier) {
    notFound()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {supplier.name}
          </h1>
          <p className="text-muted-foreground">Supplier Details</p>
        </div>
        <div className="flex items-center gap-2">
          <Link href={`/suppliers/${supplier.id}/edit`}>
            <Button variant="outline">
              <Edit className="mr-2 h-4 w-4" />
              Edit Supplier
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
                <DialogTitle>Delete Supplier</DialogTitle>
                <DialogDescription>
                  Are you sure you want to delete {supplier.name}? This action
                  cannot be undone.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <DialogClose>
                  <Button variant="outline">Cancel</Button>
                </DialogClose>
                <form action={deleteSupplier}>
                  <input type="hidden" name="id" defaultValue={supplier.id} />
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
            <CardTitle className="text-sm">Contact</CardTitle>
          </CardHeader>
          <CardContent>
            <span className="text-lg font-semibold">
              {supplier.contact || "-"}
            </span>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Email</CardTitle>
          </CardHeader>
          <CardContent>
            <span className="text-lg font-semibold">
              {supplier.email || "-"}
            </span>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Phone</CardTitle>
          </CardHeader>
          <CardContent>
            <span className="text-lg font-semibold">
              {supplier.phone || "-"}
            </span>
          </CardContent>
        </Card>
      </div>

      {supplier.address && (
        <Card>
          <CardHeader>
            <CardTitle>Address</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm">{supplier.address}</p>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Purchase Orders</CardTitle>
          <Badge variant="secondary">
            {supplier.purchaseOrders.length} order(s)
          </Badge>
        </CardHeader>
        <CardContent>
          {supplier.purchaseOrders.length === 0 ? (
            <p className="text-sm text-muted-foreground">No purchase orders found</p>
          ) : (
            <div className="rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Reference</TableHead>
                    <TableHead>Invoice No</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Payment</TableHead>
                    <TableHead>Grand Total</TableHead>
                    <TableHead>Items</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {supplier.purchaseOrders.map((po) => {
                    const totalQty = po.items.reduce(
                      (sum, item) => sum + Number(item.quantity),
                      0
                    )
                    return (
                      <TableRow key={po.id}>
                        <TableCell>
                          <Link
                            href={`/purchase-orders/${po.id}`}
                            className="font-mono text-sm hover:underline"
                          >
                            {po.reference}
                          </Link>
                        </TableCell>
                        <TableCell>{po.invoiceNo || "-"}</TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              po.status === "RECEIVED"
                                ? "default"
                                : po.status === "PENDING"
                                  ? "secondary"
                                  : "outline"
                            }
                          >
                            {po.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              po.paymentStatus === "PAID"
                                ? "default"
                                : po.paymentStatus === "PARTIAL"
                                  ? "secondary"
                                  : "outline"
                            }
                          >
                            {po.paymentStatus}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          ${po.grandTotal?.toString() || "0.00"}
                        </TableCell>
                        <TableCell>{totalQty}</TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
