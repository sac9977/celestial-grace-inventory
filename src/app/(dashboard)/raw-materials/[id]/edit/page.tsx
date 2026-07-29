import Link from "next/link"
import { redirect } from "next/navigation"
import { revalidatePath } from "next/cache"
import { Button } from "@/components/ui/button"
import { prisma } from "@/lib/prisma"
import EditRawMaterialForm from "./EditRawMaterialForm"

type FormState = {
  message: string
  errors: Record<string, string[]>
  success: boolean
}

async function getMaterial(id: string) {
  const material = await prisma.rawMaterial.findUnique({
    where: { id },
  })

  return material
}

export default async function EditRawMaterialPage({
  params,
}: {
  params: { id: string }
}) {
  const material = await getMaterial(params.id)

  const materialData = material
    ? {
        ...material,
        costPerUnit: material.costPerUnit.toString(),
      }
    : null

  if (!materialData) {
    return <p className="text-destructive">Material not found</p>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Edit Raw Material</h1>
        <Link href={`/raw-materials/${materialData.id}`}>
          <Button variant="outline">Back to Material</Button>
        </Link>
      </div>

      <div className="rounded-lg border bg-card p-6">
        <EditRawMaterialForm material={materialData} />
      </div>
    </div>
  )
}
