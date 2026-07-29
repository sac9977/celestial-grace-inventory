"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"

export default function EditSupplierForm({ supplier }: { supplier: { id: string; name: string; contact?: string; email?: string; phone?: string; address?: string } }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    const formData = new FormData(e.currentTarget)
    const res = await fetch(`/api/suppliers/${supplier.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: formData.get("name"),
        contact: formData.get("contact"),
        email: formData.get("email"),
        phone: formData.get("phone"),
        address: formData.get("address"),
      }),
    })
    if (res.ok) {
      toast.success("Supplier updated")
      router.push("/suppliers")
      router.refresh()
    } else {
      toast.error("Failed to update supplier")
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Name</Label>
        <Input id="name" name="name" defaultValue={supplier.name} required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="contact">Contact</Label>
        <Input id="contact" name="contact" defaultValue={supplier.contact || ""} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" type="email" defaultValue={supplier.email || ""} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="phone">Phone</Label>
        <Input id="phone" name="phone" defaultValue={supplier.phone || ""} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="address">Address</Label>
        <Textarea id="address" name="address" defaultValue={supplier.address || ""} />
      </div>
      <div className="flex gap-2">
        <Button type="submit" disabled={loading}>{loading ? "Saving..." : "Save Changes"}</Button>
        <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
      </div>
    </form>
  )
}
