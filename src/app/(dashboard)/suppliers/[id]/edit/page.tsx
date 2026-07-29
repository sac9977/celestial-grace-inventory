import Link from "next/link"
import { Button } from "@/components/ui/button"
import { prisma } from "@/lib/prisma"
import EditSupplierForm from "./EditSupplierForm"

async function getSupplier(id: string) {
  const supplier = await prisma.supplier.findUnique({
    where: { id },
  })

  return supplier
}

export default async function EditSupplierPage({
  params,
}: {
  params: { id: string }
}) {
  const supplier = await getSupplier(params.id)

  const supplierData = supplier
    ? {
        ...supplier,
        contact: supplier.contact ?? undefined,
        email: supplier.email ?? undefined,
        phone: supplier.phone ?? undefined,
        address: supplier.address ?? undefined,
      }
    : null

  if (!supplierData) {
    return <p className="text-destructive">Supplier not found</p>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Edit Supplier</h1>
        <Link href={`/suppliers/${supplierData.id}`}>
          <Button variant="outline">Back to Supplier</Button>
        </Link>
      </div>

      <div className="rounded-lg border bg-card p-6">
        <EditSupplierForm supplier={supplierData} />
      </div>
    </div>
  )
}
