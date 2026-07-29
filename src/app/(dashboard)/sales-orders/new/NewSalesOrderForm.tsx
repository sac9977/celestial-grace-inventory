"use client"

import { useActionState } from "react"
import { useEffect, useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { toast } from "@/components/ui/toast"

type Customer = {
  id: string
  name: string
  email: string | null
  phone: string | null
}

type Product = {
  id: string
  name: string
  sku: string
  sellingPrice: { toString: () => string } | number | string
  variants: {
    id: string
    color: string
    material: string
    size: string | null
    sku: string
  }[]
}

type LineItem = {
  productId: string
  variantId: string | null
  quantity: number
  unitPrice: number
}

type FormState = {
  message: string
  errors: Record<string, string[]>
}

export function NewSalesOrderForm({
  createSalesOrderAction,
  customers,
  products,
}: {
  createSalesOrderAction: (
    prevState: FormState,
    formData: FormData
  ) => Promise<FormState>
  customers: Customer[]
  products: Product[]
}) {
  const [lineItems, setLineItems] = useState<LineItem[]>([
    { productId: "", variantId: null, quantity: 1, unitPrice: 0 },
  ])

  const [state, formAction, isPending] = useActionState(
    createSalesOrderAction,
    {
      message: "",
      errors: {},
    }
  )

  useEffect(() => {
    if (state.message) {
      if (state.message.includes("Failed") || state.message.includes("Please")) {
        toast.add({
          type: "error",
          title: "Error",
          description: state.message,
        })
      } else {
        toast.add({
          type: "success",
          title: "Success",
          description: state.message,
        })
      }
    }
  }, [state.message])

  const handleProductChange = (index: number, productId: string | null) => {
    if (!productId) return
    const product = products.find((p) => p.id === productId)
    const sellingPrice = product
      ? parseFloat(product.sellingPrice.toString())
      : 0

    setLineItems((prev) => {
      const updated = [...prev]
      updated[index] = {
        ...updated[index],
        productId,
        variantId: null,
        unitPrice: sellingPrice,
      }
      return updated
    })
  }

  const handleVariantChange = (index: number, variantId: string | null) => {
    if (!variantId) {
      setLineItems((prev) => {
        const updated = [...prev]
        updated[index] = { ...updated[index], variantId: null }
        return updated
      })
      return
    }
    const product = products.find((p) =>
      p.variants.some((v) => v.id === variantId)
    )
    setLineItems((prev) => {
      const updated = [...prev]
      updated[index] = {
        ...updated[index],
        variantId,
        unitPrice: product
          ? parseFloat(product.sellingPrice.toString())
          : 0,
      }
      return updated
    })
  }

  const handleQuantityChange = (index: number, quantity: number) => {
    setLineItems((prev) => {
      const updated = [...prev]
      updated[index] = { ...updated[index], quantity }
      return updated
    })
  }

  const handleUnitPriceChange = (index: number, unitPrice: number) => {
    setLineItems((prev) => {
      const updated = [...prev]
      updated[index] = { ...updated[index], unitPrice }
      return updated
    })
  }

  const removeLineItem = (index: number) => {
    setLineItems((prev) => prev.filter((_, i) => i !== index))
  }

  const addLineItem = () => {
    setLineItems((prev) => [
      ...prev,
      { productId: "", variantId: null, quantity: 1, unitPrice: 0 },
    ])
  }

  const total = lineItems.reduce(
    (sum, item) => sum + item.quantity * item.unitPrice,
    0
  )

  return (
    <form action={formAction} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="customerId">Customer</Label>
        <Select name="customerId" required>
          <SelectTrigger>
            <SelectValue placeholder="Select a customer" />
          </SelectTrigger>
          <SelectContent>
            {customers.map((customer) => (
              <SelectItem key={customer.id} value={customer.id}>
                {customer.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label>Line Items</Label>
          <Button type="button" variant="outline" size="sm" onClick={addLineItem}>
            Add Item
          </Button>
        </div>

        {lineItems.map((item, index) => (
          <div
            key={index}
            className="rounded-lg border p-4 space-y-3"
          >
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">
                Item {index + 1}
              </Label>
              {lineItems.length > 1 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeLineItem(index)}
                >
                  Remove
                </Button>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor={`productId_${index}`}>Product</Label>
                <Select
                  name={`productId_${index}`}
                  required
                  onValueChange={(value: string | null) =>
                    handleProductChange(index, value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select product" />
                  </SelectTrigger>
                  <SelectContent>
                    {products.map((product) => (
                      <SelectItem key={product.id} value={product.id}>
                        {product.name} ({product.sku})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor={`variantId_${index}`}>Variant</Label>
                <Select
                  name={`variantId_${index}`}
                  onValueChange={(value: string | null) =>
                    handleVariantChange(index, value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select variant (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">None</SelectItem>
                    {products
                      .find((p) => p.id === item.productId)
                      ?.variants.map((variant) => (
                        <SelectItem key={variant.id} value={variant.id}>
                          {variant.color} / {variant.material}
                          {variant.size ? ` / ${variant.size}` : ""}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor={`quantity_${index}`}>Quantity</Label>
                <Input
                  id={`quantity_${index}`}
                  name={`quantity_${index}`}
                  type="number"
                  min={1}
                  required
                  value={item.quantity}
                  onChange={(e) =>
                    handleQuantityChange(
                      index,
                      parseInt(e.target.value, 10) || 0
                    )
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor={`unitPrice_${index}`}>Unit Price</Label>
                <Input
                  id={`unitPrice_${index}`}
                  name={`unitPrice_${index}`}
                  type="number"
                  step="0.01"
                  min={0}
                  required
                  value={item.unitPrice}
                  onChange={(e) =>
                    handleUnitPriceChange(
                      index,
                      parseFloat(e.target.value) || 0
                    )
                  }
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between border-t pt-4">
        <span className="text-lg font-semibold">Total:</span>
        <span className="text-lg font-semibold">
          ${total.toFixed(2)}
        </span>
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Notes</Label>
        <Textarea id="notes" name="notes" />
      </div>

      <input type="hidden" name="itemCount" value={lineItems.length} />
      <input type="hidden" name="createdBy" value="system" />

      {state.message && (
        <p className="text-sm text-destructive">{state.message}</p>
      )}

      <div className="flex items-center gap-2">
        <Button type="submit" disabled={isPending}>
          {isPending ? "Creating..." : "Create Sales Order"}
        </Button>
        <Link href="/sales-orders">
          <Button variant="outline" type="button">Cancel</Button>
        </Link>
      </div>
    </form>
  )
}