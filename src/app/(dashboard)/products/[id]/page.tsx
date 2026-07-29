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

type FormState = {
  message: string
  errors: Record<string, string[]>
}

async function deleteProduct(formData: FormData) {
  "use server"

  const id = formData.get("id") as string

  try {
    await prisma.product.delete({
      where: { id },
    })

    revalidatePath("/products")
    redirect("/products")
  } catch (error) {
    redirect(`/products/${id}`)
  }
}

async function getProduct(id: string) {
  const product = await prisma.product.findUnique({
    where: { id },
    include: {
      variants: { orderBy: { createdAt: "desc" } },
      inventory: true,
      salesOrderItems: true,
    },
  })

  return product
}

export default async function ProductDetailPage({
  params,
}: {
  params: { id: string }
}) {
  const product = await getProduct(params.id)

  if (!product) {
    notFound()
  }

  const isLowStock =
    product.inventory &&
    product.inventory.quantity <= product.inventory.lowStockThreshold

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {product.name}
          </h1>
          <p className="text-muted-foreground font-mono">{product.sku}</p>
        </div>
        <div className="flex items-center gap-2">
          <Link href={`/products/${product.id}/edit`}>
            <Button variant="outline">Edit Product</Button>
          </Link>
          <Dialog>
            <DialogTrigger>
              <Button variant="destructive">Delete</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Delete Product</DialogTitle>
                <DialogDescription>
                  Are you sure you want to delete {product.name}? This action
                  cannot be undone.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <DialogClose>
                  <Button variant="outline">Cancel</Button>
                </DialogClose>
                <form action={deleteProduct}>
                  <input type="hidden" name="id" defaultValue={product.id} />
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
            <Badge variant="secondary">{product.category}</Badge>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Cost Price</CardTitle>
          </CardHeader>
          <CardContent>
            <span className="text-lg font-semibold">
              ${product.costPrice.toString()}
            </span>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Selling Price</CardTitle>
          </CardHeader>
          <CardContent>
            <span className="text-lg font-semibold">
              ${product.sellingPrice.toString()}
            </span>
          </CardContent>
        </Card>
      </div>

      {product.description && (
        <Card>
          <CardHeader>
            <CardTitle>Description</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm">{product.description}</p>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Inventory</CardTitle>
          {isLowStock && <Badge variant="destructive">Low Stock</Badge>}
        </CardHeader>
        <CardContent>
          {product.inventory ? (
            <div className="flex items-center gap-4">
              <span className="text-2xl font-bold">
                {product.inventory.quantity}
              </span>
              <span className="text-sm text-muted-foreground">
                (Threshold: {product.inventory.lowStockThreshold})
              </span>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              No inventory record
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Variants</CardTitle>
          <Link href={`/products/${product.id}/variants/new`}>
            <Button>Add Variant</Button>
          </Link>
        </CardHeader>
        <CardContent>
          {product.variants.length === 0 ? (
            <p className="text-sm text-muted-foreground">No variants yet</p>
          ) : (
            <div className="rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>SKU</TableHead>
                    <TableHead>Color</TableHead>
                    <TableHead>Material</TableHead>
                    <TableHead>Size</TableHead>
                    <TableHead>Created</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {product.variants.map((variant) => (
                    <TableRow key={variant.id}>
                      <TableCell className="font-mono text-sm">
                        {variant.sku}
                      </TableCell>
                      <TableCell>{variant.color}</TableCell>
                      <TableCell>{variant.material}</TableCell>
                      <TableCell>
                        {variant.size || (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {new Date(variant.createdAt).toLocaleDateString()}
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