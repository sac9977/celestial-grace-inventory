"use client"

import { useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { Upload, CheckCircle, AlertCircle, FileSpreadsheet } from "lucide-react"
import * as XLSX from "xlsx"
import { toast } from "sonner"

type SheetMapping = Record<string, string>

const SHEET_CONFIGS = {
  "Sheet4": {
    name: "Back Product Master",
    fields: ["SKIP", "sku", "name", "description", "category", "color", "material", "size", "costPrice", "sellingPrice"],
  },
  "Sheet2+3": {
    name: "Material & Hardware Costing",
    fields: ["SKIP", "name", "category", "unit", "costPerUnit", "lowStockThreshold"],
  },
  "Sheet1": {
    name: "Purchase Register",
    fields: ["SKIP", "supplier", "reference", "invoiceNo", "billType", "paymentStatus", "subtotal", "taxAmount", "grandTotal"],
  },
}

export default function ImportPage() {
  const router = useRouter()
  const [file, setFile] = useState<File | null>(null)
  const [sheets, setSheets] = useState<Record<string, any[][]>>({})
  const [mappings, setMappings] = useState<Record<string, SheetMapping>>({})
  const [preview, setPreview] = useState<Record<string, any[]>>({})
  const [importing, setImporting] = useState(false)
  const [progress, setProgress] = useState(0)
  const [report, setReport] = useState<{ imported: number; skipped: number; errors: string[] } | null>(null)

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0]
    if (!selected) return
    setFile(selected)
    setReport(null)
    setProgress(0)

    const reader = new FileReader()
    reader.onload = (event) => {
      const data = event.target?.result
      if (!data) return
      const workbook = XLSX.read(data, { type: "array" })
      const parsed: Record<string, any[][]> = {}
      const initialMappings: Record<string, SheetMapping> = {}

      workbook.SheetNames.forEach((sheetName) => {
        const worksheet = workbook.Sheets[sheetName]
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][]
        parsed[sheetName] = jsonData.slice(0, 6) // preview first 6 rows

        const headers = jsonData[0] || []
        const mapping: SheetMapping = {}
        headers.forEach((header: string, idx: number) => {
          mapping[header] = "SKIP"
        })
        initialMappings[sheetName] = mapping
      })

      setSheets(parsed)
      setMappings(initialMappings)
      setPreview(parsed)
    }
    reader.readAsArrayBuffer(selected)
  }, [])

  const handleMappingChange = (sheet: string, header: string, value: string) => {
    setMappings((prev) => ({
      ...prev,
      [sheet]: { ...prev[sheet], [header]: value },
    }))
  }

  const runImport = async () => {
    if (!file) return
    setImporting(true)
    setProgress(0)
    setReport(null)

    const reader = new FileReader()
    reader.onload = async (event) => {
      const data = event.target?.result
      if (!data) {
        setImporting(false)
        return
      }

      const workbook = XLSX.read(data, { type: "array" })
      let totalImported = 0
      let totalSkipped = 0
      const allErrors: string[] = []

      // Import Sheet4 first (products)
      if (workbook.Sheets["Sheet4"]) {
        setProgress(10)
        const ws = workbook.Sheets["Sheet4"]
        const jsonData = XLSX.utils.sheet_to_json(ws, { header: 1 })
        try {
          const res = await fetch("/api/import/sheet4", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ rows: jsonData, mapping: mappings["Sheet4"] }),
          })
          const result = await res.json()
          totalImported += result.imported || 0
          totalSkipped += result.skipped || 0
          if (result.errors) allErrors.push(...result.errors)
        } catch (err) {
          allErrors.push("Failed to import Sheet4")
        }
      }

      // Import Sheet2+3 (materials)
      setProgress(40)
      for (const sheetName of ["Sheet2", "Sheet3"]) {
        if (workbook.Sheets[sheetName]) {
          const ws = workbook.Sheets[sheetName]
          const jsonData = XLSX.utils.sheet_to_json(ws, { header: 1 })
          try {
            const res = await fetch("/api/import/sheet2-3", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ rows: jsonData, mapping: mappings[sheetName], sheetName }),
            })
            const result = await res.json()
            totalImported += result.imported || 0
            totalSkipped += result.skipped || 0
            if (result.errors) allErrors.push(...result.errors)
          } catch (err) {
            allErrors.push(`Failed to import ${sheetName}`)
          }
        }
      }

      // Import Sheet1 (purchase register)
      setProgress(70)
      if (workbook.Sheets["Sheet1"]) {
        const ws = workbook.Sheets["Sheet1"]
        const jsonData = XLSX.utils.sheet_to_json(ws, { header: 1 })
        try {
          const res = await fetch("/api/import/sheet1", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ rows: jsonData, mapping: mappings["Sheet1"] }),
          })
          const result = await res.json()
          totalImported += result.imported || 0
          totalSkipped += result.skipped || 0
          if (result.errors) allErrors.push(...result.errors)
        } catch (err) {
          allErrors.push("Failed to import Sheet1")
        }
      }

      setProgress(100)
      setReport({ imported: totalImported, skipped: totalSkipped, errors: allErrors })
      setImporting(false)
      toast.success("Import completed")
    }
    reader.readAsArrayBuffer(file)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Excel Import Wizard</h1>
        <p className="text-muted-foreground">Migrate data from your Excel workbook</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Upload Workbook</CardTitle>
          <CardDescription>Select your Excel file to begin import</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="excel-file">Excel File</Label>
            <Input id="excel-file" type="file" accept=".xlsx,.xls" onChange={handleFileChange} />
          </div>
          {file && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <FileSpreadsheet className="h-4 w-4" />
              {file.name}
            </div>
          )}
        </CardContent>
      </Card>

      {Object.keys(sheets).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Column Mapping</CardTitle>
            <CardDescription>Map Excel columns to app fields</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="Sheet4">
              <TabsList className="grid w-full grid-cols-4">
                {Object.keys(sheets).map((sheet) => (
                  <TabsTrigger key={sheet} value={sheet}>
                    {sheet}
                  </TabsTrigger>
                ))}
              </TabsList>
              {Object.entries(sheets).map(([sheetName, rows]) => {
                const headers = rows[0] || []
                const config = SHEET_CONFIGS[sheetName as keyof typeof SHEET_CONFIGS]
                return (
                  <TabsContent key={sheetName} value={sheetName}>
                    <div className="space-y-4">
                      <div className="grid gap-2">
                        {headers.map((header: string, idx: number) => (
                          <div key={idx} className="flex items-center gap-4">
                            <div className="w-1/3 text-sm font-medium truncate">{header}</div>
                            <select
                              value={mappings[sheetName]?.[header] || "SKIP"}
                              onChange={(e) => handleMappingChange(sheetName, header, e.target.value)}
                              className="flex h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm"
                            >
                              {config?.fields.map((field) => (
                                <option key={field} value={field}>{field}</option>
                              ))}
                            </select>
                          </div>
                        ))}
                      </div>

                      <div className="border rounded-lg overflow-hidden">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              {headers.slice(0, 6).map((h: string, i: number) => (
                                <TableHead key={i}>{h}</TableHead>
                              ))}
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {rows.slice(1, 4).map((row: any[], i: number) => (
                              <TableRow key={i}>
                                {row.slice(0, 6).map((cell: any, j: number) => (
                                  <TableCell key={j}>{String(cell ?? "")}</TableCell>
                                ))}
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </div>
                  </TabsContent>
                )
              })}
            </Tabs>
          </CardContent>
        </Card>
      )}

      {Object.keys(sheets).length > 0 && !report && (
        <Button onClick={runImport} disabled={importing} className="w-full">
          {importing ? "Importing..." : "Run Import"}
        </Button>
      )}

      {importing && (
        <div className="space-y-2">
          <Progress value={progress} />
          <p className="text-sm text-muted-foreground text-center">{progress}% complete</p>
        </div>
      )}

      {report && (
        <Card>
          <CardHeader>
            <CardTitle>Import Report</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <div>
                  <p className="text-sm font-medium">Imported</p>
                  <p className="text-2xl font-bold">{report.imported}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-yellow-500" />
                <div>
                  <p className="text-sm font-medium">Skipped</p>
                  <p className="text-2xl font-bold">{report.skipped}</p>
                </div>
              </div>
            </div>
            {report.errors.length > 0 && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Errors</AlertTitle>
                <AlertDescription>
                  <ul className="list-disc list-inside text-sm">
                    {report.errors.map((err, i) => (
                      <li key={i}>{err}</li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            )}
            <Button onClick={() => router.push("/products")} className="w-full">
              View Products
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
