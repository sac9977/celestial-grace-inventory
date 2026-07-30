"use client"

import { useActionState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

type FormState = {
  message: string
  errors: Record<string, string[]>
}

export function NewVariantForm({
  productId,
  productSku,
  createVariantAction,
}: {
  productId: string
  productSku: string
  createVariantAction: (prevState: FormState, formData: FormData) => Promise<FormState>
}) {
  const autoSku = `${productSku}-color-material`
    .toLowerCase()
    .replace(/\s+/g, "-")

  const [state, formAction, isPending] = useActionState(createVariantAction, {
    message: "",
    errors: {},
  })

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="productId" defaultValue={productId} />

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="color">Color</Label>
          <Input id="color" name="color" required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="material">Material</Label>
          <Input id="material" name="material" required />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="size">Size</Label>
        <Input id="size" name="size" />
      </div>

      <div className="space-y-2">
        <Label htmlFor="sku">
          Variant SKU (auto-generated if left blank)
        </Label>
        <Input id="sku" name="sku" placeholder={autoSku} />
      </div>

      {state.message && (
        <p className="text-sm text-destructive">{state.message}</p>
      )}

      <div className="flex items-center gap-2">
        <Button type="submit" disabled={isPending}>
          {isPending ? "Adding..." : "Add Variant"}
        </Button>
        <Link href={`/products/${productId}`}>
          <Button variant="outline" type="button">Cancel</Button>
        </Link>
      </div>
    </form>
  )
}