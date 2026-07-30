"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"

export default function AdjustStockForm({ itemId, currentQty }: { itemId: string; currentQty: number }) {
  const [quantity, setQuantity] = useState(0)
  const [reason, setReason] = useState("ADJUSTMENT")
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    const res = await fetch(`/api/inventory/${itemId}/adjust`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ quantity, reason }),
    })
    if (res.ok) {
      toast.success("Stock adjusted")
    } else {
      toast.error("Failed to adjust stock")
    }
    setLoading(false)
  }

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-2">
      <div className="flex items-center gap-2">
        <Input type="number" value={quantity} onChange={(e) => setQuantity(Number(e.target.value))} className="w-20" />
        <select value={reason} onChange={(e) => setReason(e.target.value)} className="flex h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm">
          <option value="ADJUSTMENT">Adjustment</option>
          <option value="PRODUCTION_CONSUMPTION">Production</option>
          <option value="PO_RECEIPT">PO Receipt</option>
        </select>
        <Button type="submit" size="sm" disabled={loading}>{loading ? "..." : "Update"}</Button>
      </div>
    </form>
  )
}
