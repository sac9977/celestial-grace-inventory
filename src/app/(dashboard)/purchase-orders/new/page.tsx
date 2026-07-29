import { redirect } from "next/navigation"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import PurchaseOrderForm from "./PurchaseOrderForm"

export default async function NewPurchaseOrderPage() {
  const session = await auth()
  if (!session?.user) redirect("/login")

  const suppliers = await prisma.supplier.findMany({ orderBy: { name: "asc" } })
  const rawMaterials = await prisma.rawMaterial.findMany({ orderBy: { name: "asc" } })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">New Purchase Order</h1>
        <p className="text-muted-foreground">Create a new procurement order</p>
      </div>
      <PurchaseOrderForm suppliers={suppliers} rawMaterials={rawMaterials} />
    </div>
  )
}
