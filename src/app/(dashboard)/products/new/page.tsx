import Link from "next/link"
import { redirect } from "next/navigation"
import { revalidatePath } from "next/cache"
import { Button } from "@/components/ui/button"
import { NewProductForm } from "./NewProductForm"
import { prisma } from "@/lib/prisma"

type FormState = {
  message: string
  errors: Record<string, string[]>
}

async function createProduct(
  _prevState: FormState,
  formData: FormData
): Promise<FormState> {
  "use server"

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
    await prisma.product.create({
      data: {
        sku,
        name,
        description,
        category,
        costPrice,
        sellingPrice,
      },
    })

    revalidatePath("/products")
    redirect("/products")
  } catch (error) {
    return {
      message: "Failed to create product.",
      errors: {},
    }
  }
}

export default function NewProductPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">New Product</h1>
        <Link href="/products">
          <Button variant="outline">Back to Products</Button>
        </Link>
      </div>

      <div className="rounded-lg border bg-card p-6">
        <NewProductForm createProductAction={createProduct} />
      </div>
    </div>
  )
}