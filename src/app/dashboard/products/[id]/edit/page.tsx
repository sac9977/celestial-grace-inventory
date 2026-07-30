import Link from "next/link"
import { redirect } from "next/navigation"
import { revalidatePath } from "next/cache"
import { Button } from "@/components/ui/button"
import { prisma } from "@/lib/prisma"
import { EditProductForm } from "./EditProductForm"

type FormState = {
  message: string
  errors: Record<string, string[]>
}

async function updateProduct(
  _prevState: FormState,
  formData: FormData
): Promise<FormState> {
  "use server"

  const id = formData.get("id") as string
  const sku = formData.get("sku") as string
  const name = formData.get("name") as string
  const description = (formData.get("description") as string) || ""
  const category = formData.get("category") as string
  const costPrice = parseFloat(formData.get("costPrice") as string)
  const sellingPrice = parseFloat(formData.get("sellingPrice") as string)

  if (!sku || !name || !category || isNaN(costPrice) || isNaN(sellingPrice)) {
    return {
      message: "Please fill in all required fields.",
      errors: {},
    }
  }

  try {
    await prisma.product.update({
      where: { id },
      data: {
        sku,
        name,
        description,
        category,
        costPrice,
        sellingPrice,
        updatedAt: new Date(),
      },
    })

    revalidatePath(`/products/${id}`)
    revalidatePath("/products")
    redirect(`/products/${id}`)
  } catch (error) {
    return {
      message: "Failed to update product.",
      errors: {},
    }
  }
}

async function getProduct(id: string) {
  const product = await prisma.product.findUnique({
    where: { id },
  })

  return product
}

export default async function EditProductPage({
  params,
}: {
  params: { id: string }
}) {
  const product = await getProduct(params.id)

  if (!product) {
    return <p className="text-destructive">Product not found</p>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Edit Product</h1>
        <Link href={`/products/${product.id}`}>
          <Button variant="outline">Back to Product</Button>
        </Link>
      </div>

      <div className="rounded-lg border bg-card p-6">
        <EditProductForm product={product} updateProductAction={updateProduct} />
      </div>
    </div>
  )
}