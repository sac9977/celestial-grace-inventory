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

export function NewCustomerForm({
  createCustomerAction,
}: {
  createCustomerAction: (
    prevState: FormState,
    formData: FormData
  ) => Promise<FormState>
}) {
  const [state, formAction, isPending] = useActionState(
    createCustomerAction,
    {
      message: "",
      errors: {},
    }
  )

  return (
    <form action={formAction} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Name</Label>
        <Input id="name" name="name" required />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" name="email" type="email" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="phone">Phone</Label>
          <Input id="phone" name="phone" />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="address">Address</Label>
        <Input id="address" name="address" />
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Notes</Label>
        <Textarea id="notes" name="notes" />
      </div>

      {state.message && (
        <p className="text-sm text-destructive">{state.message}</p>
      )}

      <div className="flex items-center gap-2">
        <Button type="submit" disabled={isPending}>
          {isPending ? "Creating..." : "Create Customer"}
        </Button>
        <Link href="/customers">
          <Button variant="outline" type="button">Cancel</Button>
        </Link>
      </div>
    </form>
  )
}