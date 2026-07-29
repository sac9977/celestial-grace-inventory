import Link from "next/link"
import { redirect } from "next/navigation"
import { revalidatePath } from "next/cache"
import { Button } from "@/components/ui/button"
import { NewCustomerForm } from "./NewCustomerForm"
import { prisma } from "@/lib/prisma"

type FormState = {
  message: string
  errors: Record<string, string[]>
}

async function createCustomer(
  _prevState: FormState,
  formData: FormData
): Promise<FormState> {
  "use server"

  const name = formData.get("name") as string
  const email = (formData.get("email") as string) || null
  const phone = (formData.get("phone") as string) || null
  const address = (formData.get("address") as string) || null
  const notes = (formData.get("notes") as string) || null

  if (!name) {
    return {
      message: "Please fill in the name field.",
      errors: {},
    }
  }

  try {
    await prisma.customer.create({
      data: {
        name,
        email,
        phone,
        address,
        notes,
      },
    })

    revalidatePath("/customers")
    redirect("/customers")
  } catch (error) {
    return {
      message: "Failed to create customer.",
      errors: {},
    }
  }
}

export default function NewCustomerPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">New Customer</h1>
        <Link href="/customers">
          <Button variant="outline">Back to Customers</Button>
        </Link>
      </div>

      <div className="rounded-lg border bg-card p-6">
        <NewCustomerForm createCustomerAction={createCustomer} />
      </div>
    </div>
  )
}