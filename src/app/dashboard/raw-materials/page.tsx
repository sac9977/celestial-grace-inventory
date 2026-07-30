import { prisma } from "@/lib/prisma"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { AlertTriangle, Plus } from "lucide-react"

async function getMaterials(search: string | null) {
  const where = search
    ? {
        OR: [
          { name: { contains: search, mode: "insensitive" as const } },
          { category: { contains: search, mode: "insensitive" as const } },
        ],
      }
    : {}

  const materials = await prisma.rawMaterial.findMany({
    where,
    orderBy: { createdAt: "desc" },
  })

  return materials
}

export default async function RawMaterialsPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string }>
}) {
  const params = await searchParams
  const search = params.search || null
  const materials = await getMaterials(search)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Raw Materials</h1>
          <p className="text-muted-foreground">
            Manage raw materials inventory
          </p>
        </div>
        <Link href="/raw-materials/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add Material
          </Button>
        </Link>
      </div>

      <div className="flex items-center gap-2">
        <Input
          placeholder="Search by name or category..."
          defaultValue={search || ""}
          className="max-w-sm"
          onChange={(e) => {
            const url = new URL(window.location.href)
            if (e.target.value) {
              url.searchParams.set("search", e.target.value)
            } else {
              url.searchParams.delete("search")
            }
            window.location.href = url.toString()
          }}
        />
      </div>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Unit</TableHead>
              <TableHead>Cost / Unit</TableHead>
              <TableHead>Low Stock Threshold</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {materials.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  No raw materials found
                </TableCell>
              </TableRow>
            ) : (
              materials.map((material) => (
                <TableRow key={material.id}>
                  <TableCell className="font-medium">{material.name}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">{material.category}</Badge>
                  </TableCell>
                  <TableCell>{material.unit}</TableCell>
                  <TableCell>${material.costPerUnit.toString()}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      {material.lowStockThreshold}
                      <AlertTriangle className="h-3 w-3 text-muted-foreground" />
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Link href={`/raw-materials/${material.id}`}>
                        <Button variant="outline" size="sm">
                          View
                        </Button>
                      </Link>
                      <Link href={`/raw-materials/${material.id}/edit`}>
                        <Button variant="ghost" size="sm">
                          Edit
                        </Button>
                      </Link>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
