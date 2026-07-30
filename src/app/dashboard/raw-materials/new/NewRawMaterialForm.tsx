"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"

export default function NewRawMaterialForm() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    const formData = new FormData(e.currentTarget)
    const res = await fetch("/api/raw-materials", {
      method: "POST",
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
      toast.success("Material created")
      router.push("/raw-materials")
      router.refresh()
    } else {
      toast.error("Failed to create material")
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Name</Label>
        <Input id="name" name="name" required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="category">Category</Label>
        <Input id="category" name="category" required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="unit">Unit</Label>
        <Input id="unit" name="unit" required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="costPerUnit">Cost Per Unit</Label>
        <Input id="costPerUnit" name="costPerUnit" type="number" step="0.01" required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="lowStockThreshold">Low Stock Threshold</Label>
        <Input id="lowStockThreshold" name="lowStockThreshold" type="number" defaultValue="10" required />
      </div>
      <div className="flex gap-2">
        <Button type="submit" disabled={loading}>{loading ? "Creating..." : "Create Material"}</Button>
        <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
      </div>
    </form>
  )
}
