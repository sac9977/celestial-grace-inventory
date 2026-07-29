import Link from "next/link"
import { Button } from "@/components/ui/button"
import NewSupplierForm from "./NewSupplierForm"

export default function NewSupplierPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">New Supplier</h1>
        <Link href="/suppliers">
          <Button variant="outline">Back to Suppliers</Button>
        </Link>
      </div>

      <div className="rounded-lg border bg-card p-6">
        <NewSupplierForm />
      </div>
    </div>
  )
}
