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
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

type FormState = {
  message: string
  errors: Record<string, string[]>
}

async function deleteCustomer(formData: FormData) {
  "use server"

  const id = formData.get("id") as string

  try {
    await prisma.customer.delete({
      where: { id },
    })

    revalidatePath("/customers")
    redirect("/customers")
  } catch (error) {
    redirect(`/customers/${id}`)
  }
}

async function getCustomer(id: string) {
  const customer = await prisma.customer.findUnique({
    where: { id },
    include: {
      salesOrders: {
        include: {
          items: {
            include: {
              product: true,
              variant: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      },
    },
  })

  return customer
}

export default async function CustomerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const customer = await getCustomer(id)

  if (!customer) {
    notFound()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {customer.name}
          </h1>
          <p className="text-muted-foreground">Customer Details</p>
        </div>
        <div className="flex items-center gap-2">
          <Dialog>
            <DialogTrigger>
              <Button variant="destructive">Delete</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Delete Customer</DialogTitle>
                <DialogDescription>
                  Are you sure you want to delete {customer.name}? This action
                  cannot be undone.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <DialogClose>
                  <Button variant="outline">Cancel</Button>
                </DialogClose>
                <form action={deleteCustomer}>
                  <input type="hidden" name="id" defaultValue={customer.id} />
                  <Button variant="destructive" type="submit">
                    Delete
                  </Button>
                </form>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Email</CardTitle>
          </CardHeader>
          <CardContent>
            {customer.email || (
              <span className="text-muted-foreground">—</span>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Phone</CardTitle>
          </CardHeader>
          <CardContent>
            {customer.phone || (
              <span className="text-muted-foreground">—</span>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Address</CardTitle>
          </CardHeader>
          <CardContent>
            {customer.address || (
              <span className="text-muted-foreground">—</span>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Notes</CardTitle>
          </CardHeader>
          <CardContent>
            {customer.notes || (
              <span className="text-muted-foreground">—</span>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Order History</CardTitle>
          <Badge variant="secondary">
            {customer.salesOrders.length} order(s)
          </Badge>
        </CardHeader>
        <CardContent>
          {customer.salesOrders.length === 0 ? (
            <p className="text-sm text-muted-foreground">No orders yet</p>
          ) : (
            <div className="rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order ID</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Payment</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Items</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {customer.salesOrders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell className="font-mono text-sm">
                        {order.id.slice(0, 8)}
                      </TableCell>
                      <TableCell>
                        {new Date(order.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
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
                      </TableCell>
                      <TableCell>
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
                      </TableCell>
                      <TableCell>
                        ${order.totalAmount.toString()}
                      </TableCell>
                      <TableCell>
                        {order.items.length}
                      </TableCell>
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