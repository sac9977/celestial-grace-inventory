import express from "express"
import session from "express-session"
import cookieParser from "cookie-parser"
import bcrypt from "bcryptjs"
import prisma from "./src/lib/prisma.js"
import xlsx from "xlsx"
import path from "path"
import { fileURLToPath } from "url"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app = express()
const PORT = process.env.PORT || 3000

app.use(cookieParser())
app.use(express.json({ limit: "50mb" }))
app.use(express.urlencoded({ extended: true, limit: "50mb" }))
app.use(express.static("public"))

app.use(
  session({
    secret: process.env.NEXTAUTH_SECRET || "change-me-in-production",
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: false,
      maxAge: 24 * 60 * 60 * 1000,
    },
  })
)

app.use((req, res, next) => {
  res.setHeader("Cache-Control", "no-store")
  next()
})

app.get("/login", (req, res) => {
  if (req.session.user) {
    return res.redirect("/")
  }
  res.sendFile(path.join(__dirname, "public", "login.html"))
})

app.post("/api/auth/login", async (req, res) => {
  const { email, password } = req.body
  if (!email || !password) {
    return res.status(400).json({ error: "Email and password required" })
  }

  const user = await prisma.user.findUnique({
    where: { email },
  })

  if (!user || !user.active) {
    return res.status(401).json({ error: "Invalid email or password" })
  }

  const valid = await bcrypt.compare(password, user.password)
  if (!valid) {
    return res.status(401).json({ error: "Invalid email or password" })
  }

  req.session.user = {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    active: user.active,
  }

  res.json({ success: true, user: req.session.user })
})

app.post("/api/auth/logout", (req, res) => {
  req.session.destroy(() => {
    res.json({ success: true })
  })
})

app.get("/api/auth/session", (req, res) => {
  if (req.session.user) {
    res.json({ user: req.session.user })
  } else {
    res.status(401).json({ error: "Not authenticated" })
  }
})

function requireAuth(req, res, next) {
  if (!req.session.user) {
    return res.status(401).json({ error: "Not authenticated" })
  }
  next()
}

function requireAdmin(req, res, next) {
  if (!req.session.user || req.session.user.role !== "ADMIN") {
    return res.status(403).json({ error: "Forbidden" })
  }
  next()
}

app.get("/api/products", requireAuth, async (req, res) => {
  const products = await prisma.product.findMany({
    include: { variants: true, inventory: true },
    orderBy: { createdAt: "desc" },
  })
  res.json(products)
})

app.post("/api/products", requireAuth, async (req, res) => {
  const { sku, name, description, category, costPrice, sellingPrice } = req.body
  const product = await prisma.product.create({
    data: {
      sku,
      name,
      description: description || null,
      category: category || "Uncategorized",
      costPrice: Number(costPrice) || 0,
      sellingPrice: Number(sellingPrice) || 0,
    },
  })
  res.json(product)
})

app.get("/api/products/:id", requireAuth, async (req, res) => {
  const product = await prisma.product.findUnique({
    where: { id: req.params.id },
    include: { variants: true, inventory: true, salesOrderItems: true },
  })
  if (!product) return res.status(404).json({ error: "Not found" })
  res.json(product)
})

app.patch("/api/products/:id", requireAuth, async (req, res) => {
  const product = await prisma.product.update({
    where: { id: req.params.id },
    data: req.body,
  })
  res.json(product)
})

app.delete("/api/products/:id", requireAuth, async (req, res) => {
  await prisma.product.delete({ where: { id: req.params.id } })
  res.json({ success: true })
})

app.get("/api/raw-materials", requireAuth, async (req, res) => {
  const materials = await prisma.rawMaterial.findMany({
    orderBy: { createdAt: "desc" },
  })
  res.json(materials)
})

app.post("/api/raw-materials", requireAuth, async (req, res) => {
  const { name, category, unit, costPerUnit, lowStockThreshold } = req.body
  const material = await prisma.rawMaterial.create({
    data: {
      name,
      category: category || "material",
      unit: unit || "pcs",
      costPerUnit: Number(costPerUnit) || 0,
      lowStockThreshold: Number(lowStockThreshold) || 10,
    },
  })
  res.json(material)
})

app.get("/api/raw-materials/:id", requireAuth, async (req, res) => {
  const material = await prisma.rawMaterial.findUnique({
    where: { id: req.params.id },
  })
  if (!material) return res.status(404).json({ error: "Not found" })
  res.json(material)
})

app.patch("/api/raw-materials/:id", requireAuth, async (req, res) => {
  const material = await prisma.rawMaterial.update({
    where: { id: req.params.id },
    data: req.body,
  })
  res.json(material)
})

app.delete("/api/raw-materials/:id", requireAuth, async (req, res) => {
  await prisma.rawMaterial.delete({ where: { id: req.params.id } })
  res.json({ success: true })
})

app.get("/api/suppliers", requireAuth, async (req, res) => {
  const suppliers = await prisma.supplier.findMany({
    include: { purchaseOrders: true },
    orderBy: { createdAt: "desc" },
  })
  res.json(suppliers)
})

app.post("/api/suppliers", requireAuth, async (req, res) => {
  const { name, contact, email, phone, address } = req.body
  const supplier = await prisma.supplier.create({
    data: {
      name,
      contact: contact || null,
      email: email || null,
      phone: phone || null,
      address: address || null,
    },
  })
  res.json(supplier)
})

app.get("/api/suppliers/:id", requireAuth, async (req, res) => {
  const supplier = await prisma.supplier.findUnique({
    where: { id: req.params.id },
    include: { purchaseOrders: true },
  })
  if (!supplier) return res.status(404).json({ error: "Not found" })
  res.json(supplier)
})

app.patch("/api/suppliers/:id", requireAuth, async (req, res) => {
  const supplier = await prisma.supplier.update({
    where: { id: req.params.id },
    data: req.body,
  })
  res.json(supplier)
})

app.delete("/api/suppliers/:id", requireAuth, async (req, res) => {
  await prisma.supplier.delete({ where: { id: req.params.id } })
  res.json({ success: true })
})

app.get("/api/purchase-orders", requireAuth, async (req, res) => {
  const purchaseOrders = await prisma.purchaseOrder.findMany({
    include: { supplier: true, items: { include: { rawMaterial: true } } },
    orderBy: { createdAt: "desc" },
  })
  res.json(purchaseOrders)
})

app.post("/api/purchase-orders", requireAuth, async (req, res) => {
  const { supplierId, reference, invoiceNo, billType, category, notes, items } = req.body
  const subtotal = items.reduce((sum, item) => sum + Number(item.quantity) * Number(item.costPerUnit), 0)
  const taxAmount = subtotal * 0.18
  const grandTotal = subtotal + taxAmount

  const purchaseOrder = await prisma.purchaseOrder.create({
    data: {
      supplierId,
      reference,
      invoiceNo: invoiceNo || null,
      billType: billType || null,
      category: category || null,
      notes: notes || null,
      subtotal,
      taxAmount,
      grandTotal,
      paymentStatus: "UNPAID",
      items: {
        create: items.map((item) => ({
          rawMaterialId: item.rawMaterialId,
          quantity: Number(item.quantity),
          costPerUnit: Number(item.costPerUnit),
          amount: Number(item.quantity) * Number(item.costPerUnit),
        })),
      },
    },
    include: { supplier: true, items: { include: { rawMaterial: true } } },
  })
  res.json(purchaseOrder)
})

app.get("/api/purchase-orders/:id", requireAuth, async (req, res) => {
  const purchaseOrder = await prisma.purchaseOrder.findUnique({
    where: { id: req.params.id },
    include: { supplier: true, items: { include: { rawMaterial: true } } },
  })
  if (!purchaseOrder) return res.status(404).json({ error: "Not found" })
  res.json(purchaseOrder)
})

app.patch("/api/purchase-orders/:id", requireAuth, async (req, res) => {
  const purchaseOrder = await prisma.purchaseOrder.update({
    where: { id: req.params.id },
    data: req.body,
    include: { supplier: true, items: { include: { rawMaterial: true } } },
  })
  res.json(purchaseOrder)
})

app.post("/api/purchase-orders/:id/receive", requireAuth, async (req, res) => {
  const { itemReceipts } = req.body
  const po = await prisma.purchaseOrder.findUnique({
    where: { id: req.params.id },
    include: { items: true },
  })

  if (!po) return res.status(404).json({ error: "Not found" })

  let totalOrdered = 0
  let totalReceived = 0

  for (const receipt of itemReceipts) {
    const item = po.items.find((i) => i.id === receipt.itemId)
    if (!item) continue
    totalOrdered += Number(item.quantity)
    totalReceived += receipt.receivedQty
    await prisma.purchaseOrderItem.update({
      where: { id: receipt.itemId },
      data: { status: receipt.receivedQty >= Number(item.quantity) ? "RECEIVED" : "PARTIAL" },
    })
  }

  const newStatus = totalReceived >= totalOrdered ? "RECEIVED" : totalReceived > 0 ? "PARTIALLY_RECEIVED" : po.status

  const updated = await prisma.purchaseOrder.update({
    where: { id: req.params.id },
    data: {
      status: newStatus,
      receivedAt: newStatus === "RECEIVED" ? new Date() : null,
    },
    include: { supplier: true, items: { include: { rawMaterial: true } } },
  })

  res.json(updated)
})

app.get("/api/customers", requireAuth, async (req, res) => {
  const customers = await prisma.customer.findMany({
    include: { salesOrders: true },
    orderBy: { createdAt: "desc" },
  })
  res.json(customers)
})

app.post("/api/customers", requireAuth, async (req, res) => {
  const { name, email, phone, address, notes } = req.body
  const customer = await prisma.customer.create({
    data: {
      name,
      email: email || null,
      phone: phone || null,
      address: address || null,
      notes: notes || null,
    },
  })
  res.json(customer)
})

app.get("/api/customers/:id", requireAuth, async (req, res) => {
  const customer = await prisma.customer.findUnique({
    where: { id: req.params.id },
    include: { salesOrders: true },
  })
  if (!customer) return res.status(404).json({ error: "Not found" })
  res.json(customer)
})

app.patch("/api/customers/:id", requireAuth, async (req, res) => {
  const customer = await prisma.customer.update({
    where: { id: req.params.id },
    data: req.body,
  })
  res.json(customer)
})

app.delete("/api/customers/:id", requireAuth, async (req, res) => {
  await prisma.customer.delete({ where: { id: req.params.id } })
  res.json({ success: true })
})

app.get("/api/sales-orders", requireAuth, async (req, res) => {
  const salesOrders = await prisma.salesOrder.findMany({
    include: { customer: true, items: { include: { product: true, variant: true } } },
    orderBy: { createdAt: "desc" },
  })
  res.json(salesOrders)
})

app.post("/api/sales-orders", requireAuth, async (req, res) => {
  const { customerId, items, notes, createdBy } = req.body
  const totalAmount = items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0)

  const salesOrder = await prisma.salesOrder.create({
    data: {
      customerId,
      orderStatus: "PENDING",
      paymentStatus: "UNPAID",
      totalAmount,
      notes: notes || null,
      createdBy: createdBy || "unknown",
      items: {
        create: items.map((item) => ({
          productId: item.productId,
          variantId: item.variantId || null,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
        })),
      },
    },
    include: { customer: true, items: { include: { product: true, variant: true } } },
  })
  res.json(salesOrder)
})

app.get("/api/sales-orders/:id", requireAuth, async (req, res) => {
  const salesOrder = await prisma.salesOrder.findUnique({
    where: { id: req.params.id },
    include: { customer: true, items: { include: { product: true, variant: true } } },
  })
  if (!salesOrder) return res.status(404).json({ error: "Not found" })
  res.json(salesOrder)
})

app.patch("/api/sales-orders/:id", requireAuth, async (req, res) => {
  const salesOrder = await prisma.salesOrder.update({
    where: { id: req.params.id },
    data: req.body,
    include: { customer: true, items: { include: { product: true, variant: true } } },
  })
  res.json(salesOrder)
})

app.post("/api/sales-orders/:id/confirm", requireAuth, async (req, res) => {
  const order = await prisma.salesOrder.findUnique({
    where: { id: req.params.id },
    include: { items: { include: { product: true, variant: true } } },
  })

  if (!order) return res.status(404).json({ error: "Not found" })

  for (const item of order.items) {
    await prisma.inventoryItem.upsert({
      where: item.variantId
        ? { productId_variantId: { productId: item.productId, variantId: item.variantId } }
        : { productId: item.productId },
      create: {
        productId: item.productId,
        variantId: item.variantId,
        quantity: -item.quantity,
        lowStockThreshold: 5,
      },
      update: {
        quantity: { decrement: item.quantity },
      },
    })

    await prisma.inventoryMovement.create({
      data: {
        type: "SALE_RESTOCK",
        productId: item.productId,
        variantId: item.variantId,
        quantity: item.quantity,
        reason: "sale",
        relatedOrderId: order.id,
        createdBy: order.createdBy,
      },
    })
  }

  const updated = await prisma.salesOrder.update({
    where: { id: req.params.id },
    data: { orderStatus: "PROCESSING", updatedAt: new Date() },
    include: { customer: true, items: { include: { product: true, variant: true } } },
  })

  res.json(updated)
})

app.get("/api/inventory", requireAuth, async (req, res) => {
  const items = await prisma.inventoryItem.findMany({
    include: { product: true, variant: true },
    orderBy: { updatedAt: "desc" },
  })
  res.json(items)
})

app.post("/api/inventory/:id/adjust", requireAuth, async (req, res) => {
  const { quantityDelta, reason } = req.body
  const item = await prisma.inventoryItem.findUnique({
    where: { id: req.params.id },
  })

  if (!item) return res.status(404).json({ error: "Not found" })

  const newQuantity = item.quantity + Number(quantityDelta)
  const updated = await prisma.inventoryItem.update({
    where: { id: req.params.id },
    data: { quantity: newQuantity },
  })

  await prisma.inventoryMovement.create({
    data: {
      type: "ADJUSTMENT",
      productId: item.productId,
      variantId: item.variantId,
      quantity: Math.abs(Number(quantityDelta)),
      reason: reason || "adjustment",
      createdBy: req.session.user?.name || "unknown",
    },
  })

  res.json({ success: true, newQuantity, item: updated })
})

app.get("/api/movements", requireAuth, async (req, res) => {
  const movements = await prisma.inventoryMovement.findMany({
    take: 100,
    orderBy: { createdAt: "desc" },
    include: {
      product: { select: { name: true } },
      variant: { select: { color: true, material: true, size: true } },
      rawMaterial: { select: { name: true } },
    },
  })
  res.json(movements)
})

app.get("/api/users", requireAdmin, async (req, res) => {
  const users = await prisma.user.findMany({
    select: { id: true, email: true, name: true, role: true, active: true, createdAt: true },
    orderBy: { createdAt: "desc" },
  })
  res.json(users)
})

app.post("/api/users", requireAdmin, async (req, res) => {
  const { name, email, password, role } = req.body
  const hashedPassword = await bcrypt.hash(password || "123456", 10)
  const user = await prisma.user.create({
    data: { name, email, password: hashedPassword, role: role || "STAFF" },
    select: { id: true, email: true, name: true, role: true, active: true },
  })
  res.json(user)
})

app.patch("/api/users/:id", requireAdmin, async (req, res) => {
  const user = await prisma.user.findUnique({ where: { id: req.params.id } })
  if (!user) return res.status(404).json({ error: "Not found" })
  const updated = await prisma.user.update({
    where: { id: req.params.id },
    data: { active: !user.active },
    select: { id: true, email: true, name: true, role: true, active: true },
  })
  res.json(updated)
})

app.post("/api/users/:id/reset-password", requireAdmin, async (req, res) => {
  const hashedPassword = await bcrypt.hash("123456", 10)
  await prisma.user.update({
    where: { id: req.params.id },
    data: { password: hashedPassword },
  })
  res.json({ message: "Password reset to 123456" })
})

app.post("/api/import/sheet4", requireAuth, async (req, res) => {
  const { rows, mapping } = req.body
  const headers = rows[0] || []
  let imported = 0
  let skipped = 0
  const errors = []

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i]
    if (!row || row.length === 0) continue
    const getVal = (field) => {
      const idx = headers.findIndex((h) => mapping[h] === field)
      return idx >= 0 ? row[idx] : undefined
    }
    try {
      const sku = getVal("sku")
      const name = getVal("name")
      if (!sku || !name) { skipped++; continue }
      const existing = await prisma.product.findUnique({ where: { sku: String(sku) } })
      if (existing) { skipped++; continue }
      await prisma.product.create({
        data: { sku: String(sku), name: String(name), description: getVal("description") ? String(getVal("description")) : null, category: getVal("category") ? String(getVal("category")) : "Uncategorized", costPrice: Number(getVal("costPrice") || 0), sellingPrice: Number(getVal("sellingPrice") || 0) },
      })
      imported++
    } catch (err) {
      errors.push(`Row ${i + 1}: ${err.message}`)
    }
  }
  res.json({ imported, skipped, errors })
})

app.post("/api/import/sheet2-3", requireAuth, async (req, res) => {
  const { rows, mapping, sheetName } = req.body
  const headers = rows[0] || []
  let imported = 0
  let skipped = 0
  const errors = []

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i]
    if (!row || row.length === 0) continue
    const getVal = (field) => {
      const idx = headers.findIndex((h) => mapping[h] === field)
      return idx >= 0 ? row[idx] : undefined
    }
    try {
      const itemCode = getVal("item code") || getVal("material code")
      const name = getVal("material description") || getVal("hardware/ accessory description")
      if (!itemCode || !name) { skipped++; continue }
      const existing = await prisma.rawMaterial.findFirst({ where: { name: String(name) } })
      if (existing) { skipped++; continue }
      await prisma.rawMaterial.create({
        data: { name: String(name), category: sheetName === "Sheet2" ? "material" : "hardware", unit: getVal("unit") ? String(getVal("unit")) : "pcs", costPerUnit: Number(getVal("rate") || getVal("costPerUnit") || 0), lowStockThreshold: Number(getVal("lowStockThreshold") || 10) },
      })
      imported++
    } catch (err) {
      errors.push(`Row ${i + 1}: ${err.message}`)
    }
  }
  res.json({ imported, skipped, errors })
})

app.post("/api/import/sheet1", requireAuth, async (req, res) => {
  const { rows, mapping } = req.body
  const headers = rows[0] || []
  let imported = 0
  let skipped = 0
  const errors = []

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i]
    if (!row || row.length === 0) continue
    const getVal = (field) => {
      const idx = headers.findIndex((h) => mapping[h] === field)
      return idx >= 0 ? row[idx] : undefined
    }
    try {
      const vendorName = getVal("vendor")
      const reference = getVal("Bill Reference")
      if (!vendorName || !reference) { skipped++; continue }
      let supplier = await prisma.supplier.findUnique({ where: { name: String(vendorName) } })
      if (!supplier) {
        supplier = await prisma.supplier.create({ data: { name: String(vendorName) } })
      }
      const existing = await prisma.purchaseOrder.findFirst({ where: { reference: String(reference), supplierId: supplier.id } })
      if (existing) { skipped++; continue }
      await prisma.purchaseOrder.create({
        data: { supplierId: supplier.id, reference: String(reference), invoiceNo: getVal("invoice no.") ? String(getVal("invoice no.")) : null, billType: getVal("bill type") ? String(getVal("bill type")) : null, category: getVal("category") ? String(getVal("category")) : null, paymentStatus: getVal("payment status") ? String(getVal("payment status")).toUpperCase() : "UNPAID", subtotal: Number(getVal("subtotal") || 0), taxAmount: Number(getVal("SGST") || 0) + Number(getVal("CGST") || 0), grandTotal: Number(getVal("grand total") || 0), notes: getVal("remarks") ? String(getVal("remarks")) : null },
      })
      imported++
    } catch (err) {
      errors.push(`Row ${i + 1}: ${err.message}`)
    }
  }
  res.json({ imported, skipped, errors })
})

app.use(requireAuth, (req, res) => {
  const file = req.path === "/" ? "index.html" : `${req.path}.html`
  const filePath = path.join(__dirname, "public", file)
  res.sendFile(filePath, (err) => {
    if (err) {
      res.status(404).send("Not found")
    }
  })
})

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Celestial Grace Inventory running on http://0.0.0.0:${PORT}`)
})
