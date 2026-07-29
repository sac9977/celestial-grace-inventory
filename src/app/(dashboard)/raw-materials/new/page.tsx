import Link from "next/link"
import { Button } from "@/components/ui/button"
import NewRawMaterialForm from "./NewRawMaterialForm"

export default function NewRawMaterialPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">New Raw Material</h1>
        <Link href="/raw-materials">
          <Button variant="outline">Back to Materials</Button>
        </Link>
      </div>

      <div className="rounded-lg border bg-card p-6">
        <NewRawMaterialForm />
      </div>
    </div>
  )
}
