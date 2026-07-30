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

export function NewProductForm({
  createProductAction,
}: {
  createProductAction: (
    prevState: FormState,
    formData: FormData
  ) => Promise<FormState>
}) {
  const [state, formAction, isPending] = useActionState(
    createProductAction,
    {
      message: "",
      errors: {},
    }
  )

  return (
    <form action={formAction} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="sku">SKU</Label>
          <Input id="sku" name="sku" required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="name">Name</Label>
          <Input id="name" name="name" required />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea id="description" name="description" />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="category">Category</Label>
          <Input id="category" name="category" required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="costPrice">Cost Price</Label>
          <Input id="costPrice" name="costPrice" type="number" step="0.01" required />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="sellingPrice">Selling Price</Label>
        <Input id="sellingPrice" name="sellingPrice" type="number" step="0.01" required />
      </div>

      {state.message && (
        <p className="text-sm text-destructive">{state.message}</p>
      )}

      <div className="flex items-center gap-2">
        <Button type="submit" disabled={isPending}>
          {isPending ? "Creating..." : "Create Product"}
        </Button>
        <Link href="/products">
          <Button variant="outline" type="button">Cancel</Button>
        </Link>
      </div>
    </form>
  )
}