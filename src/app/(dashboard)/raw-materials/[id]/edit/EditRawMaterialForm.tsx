"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"

export default function EditRawMaterialForm({ material }: { material: { id: string; name: string; category: string; unit: string; costPerUnit: string; lowStockThreshold: number } }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    const formData = new FormData(e.currentTarget)
    const res = await fetch(`/api/raw-materials/${material.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: formData.get("name"),
        category: formData.get("category"),
        unit: formData.get("unit"),
        costPerUnit: formData.get("costPerUnit"),
        lowStockThreshold: formData.get("lowStockThreshold"),
      }),
    })
    if (res.ok) {
      toast.success("Material updated")
      router.push("/raw-materials")
      router.refresh()
    } else {
      toast.error("Failed to update material")
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Name</Label>
        <Input id="name" name="name" defaultValue={material.name} required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="category">Category</Label>
        <Input id="category" name="category" defaultValue={material.category} required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="unit">Unit</Label>
        <Input id="unit" name="unit" defaultValue={material.unit} required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="costPerUnit">Cost Per Unit</Label>
        <Input id="costPerUnit" name="costPerUnit" type="number" step="0.01" defaultValue={material.costPerUnit} required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="lowStockThreshold">Low Stock Threshold</Label>
        <Input id="lowStockThreshold" name="lowStockThreshold" type="number" defaultValue={material.lowStockThreshold} required />
      </div>
      <div className="flex gap-2">
        <Button type="submit" disabled={loading}>{loading ? "Saving..." : "Save Changes"}</Button>
        <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
      </div>
    </form>
  )
}
