"use client"

import { useActionState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

type RawMaterial = { id: string; name: string }

type FormState = {
  message: string
  errors: Record<string, string[]>
}

export function NewBomForm({
  productId,
  variants,
  rawMaterials,
  createBomEntryAction,
}: {
  productId: string
  variants: { id: string; sku: string; color: string; material: string }[]
  rawMaterials: RawMaterial[]
  createBomEntryAction: (prevState: FormState, formData: FormData) => Promise<FormState>
}) {
  const [state, formAction, isPending] = useActionState(createBomEntryAction, {
    message: "",
    errors: {},
  })

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="productId" defaultValue={productId} />

      <div className="space-y-2">
        <Label htmlFor="productVariantId">Product Variant</Label>
        <Select name="productVariantId" required>
          <SelectTrigger>
            <SelectValue placeholder="Select variant..." />
          </SelectTrigger>
          <SelectContent>
            {variants.map((variant) => (
              <SelectItem key={variant.id} value={variant.id}>
                {variant.sku} — {variant.color} / {variant.material}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="rawMaterialId">Raw Material</Label>
        <Select name="rawMaterialId" required>
          <SelectTrigger>
            <SelectValue placeholder="Select raw material..." />
          </SelectTrigger>
          <SelectContent>
            {rawMaterials.map((rm) => (
              <SelectItem key={rm.id} value={rm.id}>
                {rm.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="quantityPerUnit">Quantity Per Unit</Label>
          <Input
            id="quantityPerUnit"
            name="quantityPerUnit"
            type="number"
            step="0.01"
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="unit">Unit</Label>
          <Input id="unit" name="unit" required />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="componentType">Component Type</Label>
          <Input id="componentType" name="componentType" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="meters">Meters</Label>
          <Input id="meters" name="meters" type="number" step="0.01" />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="wastagePercent">Wastage %</Label>
        <Input id="wastagePercent" name="wastagePercent" type="number" step="0.01" />
      </div>

      <div className="space-y-2">
        <Label htmlFor="sourceSheet">Source Sheet</Label>
        <Input id="sourceSheet" name="sourceSheet" />
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Notes</Label>
        <Input id="notes" name="notes" />
      </div>

      {state.message && (
        <p className="text-sm text-destructive">{state.message}</p>
      )}

      <div className="flex items-center gap-2">
        <Button type="submit" disabled={isPending}>
          {isPending ? "Adding..." : "Add BOM Entry"}
        </Button>
        <Link href={`/products/${productId}`}>
          <Button variant="outline" type="button">Cancel</Button>
        </Link>
      </div>
    </form>
  )
}