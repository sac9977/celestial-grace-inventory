"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createPurchaseOrder } from "@/app/(dashboard)/purchase-orders/new/actions"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"

interface Supplier {
  id: string
  name: string
}

import { Decimal } from "@prisma/client/runtime/library"

interface RawMaterial {
  id: string
  name: string
  unit: string
  costPerUnit: Decimal | string | number
}

export default function PurchaseOrderForm({
  suppliers,
  rawMaterials,
}: {
  suppliers: Supplier[]
  rawMaterials: RawMaterial[]
}) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [items, setItems] = useState<
    { rawMaterialId: string; quantity: string; costPerUnit: string }[]
  >([{ rawMaterialId: "", quantity: "", costPerUnit: "" }])

  const addItem = () => {
    setItems([...items, { rawMaterialId: "", quantity: "", costPerUnit: "" }])
  }

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index))
  }

  const updateItem = (index: number, field: string, value: string) => {
    const updated = [...items]
    updated[index] = { ...updated[index], [field]: value }
    if (field === "rawMaterialId") {
      const material = rawMaterials.find((m) => m.id === value)
      if (material) {
        updated[index].costPerUnit = String(material.costPerUnit)
      }
    }
    setItems(updated)
  }

  const handleSubmit = async (formData: FormData) => {
    setLoading(true)
    const result = await createPurchaseOrder({
      supplierId: formData.get("supplierId") as string,
      reference: formData.get("reference") as string,
      invoiceNo: formData.get("invoiceNo") as string,
      billType: formData.get("billType") as string,
      category: formData.get("category") as string,
      notes: formData.get("notes") as string,
      items: items.filter((i) => i.rawMaterialId && i.quantity),
    })

    if (result?.error) {
      toast.error(result.error)
      setLoading(false)
    } else {
      toast.success("Purchase order created")
      router.push("/purchase-orders")
    }
  }

  return (
    <form action={handleSubmit} className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <label className="text-sm font-medium">Supplier</label>
          <select name="supplierId" required className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
            <option value="">Select supplier</option>
            {suppliers.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Bill Reference</label>
          <input name="reference" required className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Invoice No</label>
          <input name="invoiceNo" className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Bill Type</label>
          <input name="billType" className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Category</label>
          <input name="category" className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Notes</label>
          <input name="notes" className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium">Line Items</h3>
          <Button type="button" variant="outline" size="sm" onClick={addItem}>
            Add Item
          </Button>
        </div>
        {items.map((item, index) => (
          <div key={index} className="grid gap-4 md:grid-cols-4 p-4 border rounded-lg">
            <div className="space-y-2">
              <label className="text-sm font-medium">Material</label>
              <select
                value={item.rawMaterialId}
                onChange={(e) => updateItem(index, "rawMaterialId", e.target.value)}
                required
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="">Select material</option>
                {rawMaterials.map((m) => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Quantity</label>
              <input
                type="number"
                step="0.01"
                value={item.quantity}
                onChange={(e) => updateItem(index, "quantity", e.target.value)}
                required
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Rate</label>
              <input
                type="number"
                step="0.01"
                value={item.costPerUnit}
                onChange={(e) => updateItem(index, "costPerUnit", e.target.value)}
                required
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              />
            </div>
            <div className="flex items-end">
              <Button type="button" variant="destructive" size="sm" onClick={() => removeItem(index)}>
                Remove
              </Button>
            </div>
          </div>
        ))}
      </div>

      <div className="flex gap-4">
        <Button type="submit" disabled={loading}>
          {loading ? "Creating..." : "Create Purchase Order"}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Cancel
        </Button>
      </div>
    </form>
  )
}
