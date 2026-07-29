import Link from "next/link"
import { redirect } from "next/navigation"
import { revalidatePath } from "next/cache"
import { Button } from "@/components/ui/button"
import { prisma } from "@/lib/prisma"
import { NewVariantForm } from "./NewVariantForm"

type FormState = {
  message: string
  errors: Record<string, string[]>
}

async function createVariant(
  _prevState: FormState,
  formData: FormData
): Promise<FormState> {
  "use server"

  const productId = formData.get("productId") as string
  const color = formData.get("color") as string
  const material = formData.get("material") as string
  const size = (formData.get("size") as string) || null
  const sku = (formData.get("sku") as string) || null

  if (!color || !material) {
    return {
      message: "Color and material are required.",
      errors: {},
    }
  }

  try {
    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: { sku: true },
    })

    if (!product) {
      return {
        message: "Product not found.",
        errors: {},
      }
    }

    const variantSku =
      sku ||
      `${product.sku}-${color}-${material}`
        .toLowerCase()
        .replace(/\s+/g, "-")

    await prisma.productVariant.create({
      data: {
        productId,
        color,
        material,
        size,
        sku: variantSku,
      },
    })

    revalidatePath(`/products/${productId}`)
    revalidatePath("/products")
    redirect(`/products/${productId}`)
  } catch (error) {
    return {
      message: "Failed to create variant.",
      errors: {},
    }
  }
}

async function getProduct(id: string) {
  const product = await prisma.product.findUnique({
    where: { id },
    select: { id: true, sku: true, name: true },
  })

  return product
}

export default async function NewVariantPage({
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
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Add Variant</h1>
          <p className="text-muted-foreground">
            Product: {product.name} ({product.sku})
          </p>
        </div>
        <Link href={`/products/${product.id}`}>
          <Button variant="outline">Back to Product</Button>
        </Link>
      </div>

      <div className="rounded-lg border bg-card p-6">
        <NewVariantForm
          productId={product.id}
          productSku={product.sku}
          createVariantAction={createVariant}
        />
      </div>
    </div>
  )
}