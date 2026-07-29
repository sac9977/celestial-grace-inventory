"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"

export function UserActions({ userId, active }: { userId: string; active: boolean }) {
  const [loading, setLoading] = useState(false)

  const toggleActive = async () => {
    setLoading(true)
    const res = await fetch(`/api/users/${userId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: !active }),
    })
    if (res.ok) {
      toast.success(`User ${!active ? "activated" : "deactivated"}`)
      window.location.reload()
    } else {
      toast.error("Failed to update user")
    }
    setLoading(false)
  }

  const resetPassword = async () => {
    setLoading(true)
    const res = await fetch(`/api/users/${userId}`, { method: "POST" })
    if (res.ok) {
      toast.success("Password reset to 123456")
    } else {
      toast.error("Failed to reset password")
    }
    setLoading(false)
  }

  return (
    <div className="flex items-center gap-2">
      <Button variant="outline" size="sm" onClick={toggleActive} disabled={loading}>
        {active ? "Deactivate" : "Activate"}
      </Button>
      <Button variant="ghost" size="sm" onClick={resetPassword} disabled={loading}>
        Reset Password
      </Button>
    </div>
  )
}
