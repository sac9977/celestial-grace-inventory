import Link from "next/link"
import { redirect } from "next/navigation"
import { revalidatePath } from "next/cache"
import { Button } from "@/components/ui/button"
import { prisma } from "@/lib/prisma"
import { NewBomForm } from "./NewBomForm"

type FormState = {
  message: string
  errors: Record<string, string[]>
}

async function createBomEntry(
  _prevState: FormState,
  formData: FormData
): Promise<FormState> {
  "use server"

  const productVariantId = formData.get("productVariantId") as string
  const productId = formData.get("productId") as string
  const rawMaterialId = formData.get("rawMaterialId") as string
  const quantityPerUnit = parseFloat(formData.get("quantityPerUnit") as string)
  const unit = formData.get("unit") as string
  const componentType = (formData.get("componentType") as string) || null
  const meters = formData.get("meters") ? parseFloat(formData.get("meters") as string) : null
  const wastagePercent = formData.get("wastagePercent") ? parseFloat(formData.get("wastagePercent") as string) : null
  const sourceSheet = (formData.get("sourceSheet") as string) || null
  const notes = (formData.get("notes") as string) || null

  if (!productVariantId || !rawMaterialId || isNaN(quantityPerUnit) || !unit) {
    return {
      message: "Please fill in all required fields.",
      errors: {},
    }
  }

  try {
    await prisma.productBOM.create({
      data: {
        productVariantId,
        rawMaterialId,
        componentType,
        quantityPerUnit,
        unit,
        meters,
        wastagePercent,
        sourceSheet,
        notes,
      },
    })

    revalidatePath(`/products/${productId}`)
    revalidatePath("/products")
    redirect(`/products/${productId}`)
  } catch (error) {
    return {
      message: "Failed to create BOM entry.",
      errors: {},
    }
  }
}

async function getProduct(id: string) {
  const product = await prisma.product.findUnique({
    where: { id },
    include: {
      variants: {
        select: { id: true, sku: true, color: true, material: true },
      },
    },
  })

  return product
}

async function getRawMaterials() {
  const materials = await prisma.rawMaterial.findMany({
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  })

  return materials
}

export default async function NewBomPage({
  params,
}: {
  params: { id: string }
}) {
  const [product, rawMaterials] = await Promise.all([
    getProduct(params.id),
    getRawMaterials(),
  ])

  if (!product) {
    return <p className="text-destructive">Product not found</p>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Add BOM Entry</h1>
          <p className="text-muted-foreground">
            Product: {product.name} ({product.sku})
          </p>
        </div>
        <Link href={`/products/${product.id}`}>
          <Button variant="outline">Back to Product</Button>
        </Link>
      </div>

      <div className="rounded-lg border bg-card p-6">
        <NewBomForm
          productId={product.id}
          variants={product.variants}
          rawMaterials={rawMaterials}
          createBomEntryAction={createBomEntry}
        />
      </div>
    </div>
  )
}