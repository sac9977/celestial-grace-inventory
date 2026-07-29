import { prisma } from "@/lib/prisma"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Package, AlertTriangle } from "lucide-react"

async function getProducts(search: string | null) {
  const where = search
    ? {
        OR: [
          { name: { contains: search, mode: "insensitive" as const } },
          { sku: { contains: search, mode: "insensitive" as const } },
        ],
      }
    : {}

  const products = await prisma.product.findMany({
    where,
    include: {
      variants: true,
      inventory: true,
    },
    orderBy: { createdAt: "desc" },
  })

  return products
}

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string }>
}) {
  const params = await searchParams
  const search = params.search || null
  const products = await getProducts(search)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Products</h1>
          <p className="text-muted-foreground">
            Manage products and variants
          </p>
        </div>
        <Link href="/products/new">
          <Button>Add Product</Button>
        </Link>
      </div>

      <div className="flex items-center gap-2">
        <Input
          placeholder="Search by name or SKU..."
          defaultValue={search || ""}
          className="max-w-sm"
          onChange={(e) => {
            const url = new URL(window.location.href)
            if (e.target.value) {
              url.searchParams.set("search", e.target.value)
            } else {
              url.searchParams.delete("search")
            }
            window.location.href = url.toString()
          }}
        />
      </div>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>SKU</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Cost</TableHead>
              <TableHead>Selling Price</TableHead>
              <TableHead>Variants</TableHead>
              <TableHead>Stock</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {products.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                  No products found
                </TableCell>
              </TableRow>
            ) : (
              products.map((product) => {
                const isLowStock =
                  product.inventory &&
                  product.inventory.quantity <= product.inventory.lowStockThreshold

                return (
                  <TableRow
                    key={product.id}
                    className={isLowStock ? "bg-destructive/5" : undefined}
                  >
                    <TableCell className="font-mono text-sm">
                      {product.sku}
                    </TableCell>
                    <TableCell className="font-medium">
                      {product.name}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{product.category}</Badge>
                    </TableCell>
                    <TableCell>
                      ${product.costPrice.toString()}
                    </TableCell>
                    <TableCell>
                      ${product.sellingPrice.toString()}
                    </TableCell>
                    <TableCell>
                      {product.variants.length}
                    </TableCell>
                    <TableCell>
                      {product.inventory ? (
                        <span
                          className={
                            isLowStock
                              ? "text-destructive font-medium"
                              : undefined
                          }
                        >
                          {product.inventory.quantity}
                          {isLowStock && (
                            <AlertTriangle className="inline h-3 w-3 ml-1" />
                          )}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Link href={`/products/${product.id}`}>
                          <Button variant="outline" size="sm">
                            View
                          </Button>
                        </Link>
                        <Link href={`/products/${product.id}/edit`}>
                          <Button variant="ghost" size="sm">
                            Edit
                          </Button>
                        </Link>
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}