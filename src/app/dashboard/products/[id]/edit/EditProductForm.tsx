"use client"

import { useActionState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

type FormState = {
  message: string
  errors: Record<string, string[]>
}

export function EditProductForm({
  product,
  updateProductAction,
}: {
  product: {
    id: string
    sku: string
    name: string
    description: string | null
    category: string
    costPrice: { toString: () => string } | number | string
    sellingPrice: { toString: () => string } | number | string
  }
  updateProductAction: (
    prevState: FormState,
    formData: FormData
  ) => Promise<FormState>
}) {
  const costPriceNum =
    typeof product.costPrice === "number"
      ? product.costPrice
      : parseFloat(product.costPrice.toString())
  const sellingPriceNum =
    typeof product.sellingPrice === "number"
      ? product.sellingPrice
      : parseFloat(product.sellingPrice.toString())

  const [state, formAction, isPending] = useActionState(updateProductAction, {
    message: "",
    errors: {},
  })

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="id" defaultValue={product.id} />

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="sku">SKU</Label>
          <Input id="sku" name="sku" required defaultValue={product.sku} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="name">Name</Label>
          <Input id="name" name="name" required defaultValue={product.name} />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          name="description"
          defaultValue={product.description ?? ""}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="category">Category</Label>
          <Input
            id="category"
            name="category"
            required
            defaultValue={product.category}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="costPrice">Cost Price</Label>
          <Input
            id="costPrice"
            name="costPrice"
            type="number"
            step="0.01"
            required
            defaultValue={costPriceNum}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="sellingPrice">Selling Price</Label>
        <Input
          id="sellingPrice"
          name="sellingPrice"
          type="number"
          step="0.01"
          required
          defaultValue={sellingPriceNum}
        />
      </div>

      {state.message && (
        <p className="text-sm text-destructive">{state.message}</p>
      )}

      <div className="flex items-center gap-2">
        <Button type="submit" disabled={isPending}>
          {isPending ? "Updating..." : "Update Product"}
        </Button>
        <Link href={`/products/${product.id}`}>
          <Button variant="outline" type="button">Cancel</Button>
        </Link>
      </div>
    </form>
  )
}