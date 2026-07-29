# Celestial Grace Inventory — Implementation Plan

> **Status:** In Progress — Core app scaffolded, auth working, CRUD modules built, Draft  
> **Last updated:** 2026-07-29  
> **Scope:** Self-hosted inventory + backend for handbag business, LAN-only access, PostgreSQL-backed

---

## 1. Problem Statement

Replace an Excel workbook used for inventory, purchase, and sales tracking with a self-hosted web app that staff can access over the LAN. The admin manages master data and settings; staff perform day-to-day transactions.

**Constraints:**
- Must run on a local Mac mini / MacBook
- Accessible over LAN only (no public internet exposure)
- Future-proof data layer (PostgreSQL, migration-safe)
- Admin + staff roles with simple username/password auth

---

## 2. Tech Stack

| Layer | Choice | Version / Notes |
|-------|--------|-----------------|
| Framework | Next.js | v16 App Router + TypeScript |
| ORM | Prisma | v6 |
| Database | PostgreSQL | 16+ |
| Auth | NextAuth v5 | Credentials provider + bcrypt |
| UI | Tailwind CSS + shadcn/ui | base-ui tokens |
| Notifications | sonner | Toast notifications |
| Charts | Recharts | Dashboard charts |
| Excel | xlsx (SheetJS) | Workbook read/parse |
| Container | Docker + docker-compose | Self-hosted deployment |
| Process | PM2 / launchd | Process supervision |

---

## 3. Database Schema (Prisma)

```prisma
model User {
  id        String   @id @default(uuid())
  email     String   @unique
  name      String
  password  String
  role      Role     @default(STAFF)
  active    Boolean  @default(true)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

enum Role { ADMIN STAFF }

model Product {
  id           String   @id @default(uuid())
  sku          String   @unique
  name         String
  description  String?
  category     String
  costPrice    Decimal
  sellingPrice Decimal
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  variants     ProductVariant[]
  inventory    InventoryItem?
  salesOrderItems SalesOrderItem[]
}

model ProductVariant {
  id        String   @id @default(uuid())
  productId String
  product   Product  @relation(fields: [productId], references: [id], onDelete: Cascade)
  color     String
  material  String
  size      String?
  sku       String   @unique
  createdAt DateTime @default(now())

  bomEntries ProductBOM[]
  inventory InventoryItem?
  salesOrderItems SalesOrderItem[]
}

model InventoryItem {
  id              String   @id @default(uuid())
  productId       String   @unique
  product         Product  @relation(fields: [productId], references: [id], onDelete: Cascade)
  variantId       String?  @unique
  variant         ProductVariant? @relation(fields: [variantId], references: [id], onDelete: SetNull)
  quantity        Int      @default(0)
  lowStockThreshold Int    @default(5)
  updatedAt       DateTime @updatedAt

  @@unique([productId, variantId])
}

model RawMaterial {
  id              String   @id @default(uuid())
  name            String
  category        String
  unit            String
  costPerUnit     Decimal
  lowStockThreshold Int    @default(10)
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  purchaseOrders  PurchaseOrderItem[]
  bomEntries      ProductBOM[]
  consumptionLogs ConsumptionLog[]
}

model Supplier {
  id          String   @id @default(uuid())
  name        String   @unique
  contact     String?
  email       String?
  phone       String?
  address     String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  purchaseOrders PurchaseOrder[]
}

model PurchaseOrder {
  id             String   @id @default(uuid())
  supplierId     String
  supplier       Supplier @relation(fields: [supplierId], references: [id])
  reference      String
  invoiceNo      String?
  billType       String?
  category       String?
  status         POStatus @default(PENDING)
  paymentStatus  PaymentStatus @default(UNPAID)
  subtotal       Decimal?
  taxAmount      Decimal?
  grandTotal     Decimal?
  notes          String?
  createdAt      DateTime @default(now())
  receivedAt     DateTime?
  updatedAt      DateTime @updatedAt

  items          PurchaseOrderItem[]
}

enum POStatus { PENDING PARTIALLY_RECEIVED RECEIVED CANCELLED }
enum PaymentStatus { UNPAID PARTIAL PAID REFUNDED }

model PurchaseOrderItem {
  id             String   @id @default(uuid())
  purchaseOrderId String
  purchaseOrder  PurchaseOrder @relation(fields: [purchaseOrderId], references: [id], onDelete: Cascade)
  rawMaterialId  String
  rawMaterial    RawMaterial @relation(fields: [rawMaterialId], references: [id])
  quantity       Decimal
  costPerUnit    Decimal
  amount         Decimal
  gstPercent     Decimal?
  status         String?
  createdAt      DateTime @default(now())

  @@unique([purchaseOrderId, rawMaterialId])
}

model ProductBOM {
  id              String   @id @default(uuid())
  productVariantId String
  productVariant  ProductVariant @relation(fields: [productVariantId], references: [id], onDelete: Cascade)
  rawMaterialId   String
  rawMaterial     RawMaterial @relation(fields: [rawMaterialId], references: [id])
  componentType   String?
  quantityPerUnit Decimal
  unit            String
  meters          Decimal?
  wastagePercent  Decimal?
  netConsumption  Decimal?
  wastageCalc     Decimal?
  rateCostPerBag  Decimal?
  sourceSheet     String?
  notes           String?
  createdAt       DateTime @default(now())

  @@unique([productVariantId, rawMaterialId])
}

model ConsumptionLog {
  id             String   @id @default(uuid())
  rawMaterialId  String
  rawMaterial    RawMaterial @relation(fields: [rawMaterialId], references: [id])
  quantity       Decimal
  reason         String
  relatedOrderId String?
  createdAt      DateTime @default(now())
  createdBy      String
}

model Customer {
  id        String   @id @default(uuid())
  name      String
  email     String?
  phone     String?
  address   String?
  notes     String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  salesOrders SalesOrder[]
}

model SalesOrder {
  id           String   @id @default(uuid())
  customerId   String
  customer     Customer @relation(fields: [customerId], references: [id])
  orderStatus  SOStatus @default(PENDING)
  paymentStatus PaymentStatus @default(UNPAID)
  totalAmount  Decimal
  notes        String?
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
  createdBy    String

  items        SalesOrderItem[]
}

enum SOStatus { PENDING PROCESSING SHIPPED DELIVERED CANCELLED }

model SalesOrderItem {
  id            String   @id @default(uuid())
  salesOrderId  String
  salesOrder    SalesOrder @relation(fields: [salesOrderId], references: [id], onDelete: Cascade)
  productId     String
  product       Product   @relation(fields: [productId], references: [id])
  variantId     String?
  variant       ProductVariant? @relation(fields: [variantId], references: [id])
  quantity      Int
  unitPrice     Decimal
  createdAt     DateTime @default(now())

  @@unique([salesOrderId, productId, variantId])
}

model InventoryMovement {
  id             String   @id @default(uuid())
  type           MovementType
  productId      String?
  variantId      String?
  rawMaterialId  String?
  quantity       Decimal
  reason         String
  relatedOrderId String?
  createdAt      DateTime @default(now())
  createdBy      String
}

enum MovementType { SALE_RESTOCK PRODUCTION_CONSUMPTION ADJUSTMENT PO_RECEIPT }
```

---

## 4. Feature Breakdown

### 4.1 Authentication & Authorization
| Feature | Status | Notes |
|---------|--------|-------|
| NextAuth v5 credentials provider | ✅ Done | bcrypt password hashing |
| Login page | ✅ Done | Server + client components |
| Session handling | ✅ Done | JWT strategy |
| Role-based access (ADMIN / STAFF) | ✅ Done | Server-side guards in pages |
| Logout | ✅ Done | Server action via form POST |
| Trust host for LAN | 🔲 TODO | `trustHost: true` in NextAuth config |

### 4.2 Dashboard
| Feature | Status | Notes |
|---------|--------|-------|
| Summary cards (products, low stock, POs, recent orders) | ✅ Done | Server Component |
| Low stock alerts table | ✅ Done | Highlighted with destructive badges |
| Recent sales orders | ✅ Done | Last 5 orders with status |
| Sales chart (over time) | 🔲 TODO | Recharts integration pending |

### 4.3 Product Management
| Feature | Status | Notes |
|---------|--------|-------|
| Product CRUD | ✅ Done | SKU, name, category, cost, price |
| Product variants | ✅ Done | Color, material, size per product |
| Variant SKU auto-generation | ✅ Done | Based on product SKU + attributes |
| Product search/filter | 🔲 TODO | URLSearchParams-based, needs polish |
| Product detail page | ✅ Done | Shows variants + BOM |

### 4.4 Bill of Materials (BOM)
| Feature | Status | Notes |
|---------|--------|-------|
| BOM CRUD per variant | ✅ Done | Link raw materials to variants |
| BOM fields (qty, wastage, net consumption) | ✅ Done | From Excel columns |
| BOM overview page | ✅ Done | Lists all BOM entries |

### 4.5 Raw Materials
| Feature | Status | Notes |
|---------|--------|-------|
| Raw material CRUD | ✅ Done | Name, category, unit, cost, threshold |
| Category field (material/hardware) | ✅ Done | Distinguishes material types |
| Low stock threshold | ✅ Done | Per material |

### 4.6 Suppliers
| Feature | Status | Notes |
|---------|--------|-------|
| Supplier CRUD | ✅ Done | Contact, email, phone, address |
| Supplier linking to POs | ✅ Done | Auto-create on import |
| Supplier detail page | ✅ Done | Shows order history |

### 4.7 Purchase Orders
| Feature | Status | Notes |
|---------|--------|-------|
| PO creation with line items | ✅ Done | Dynamic items, supplier select |
| PO financial fields | ✅ Done | Subtotal, tax, grand total |
| PO receive workflow | ✅ Done | Mark items received, update status |
| PO status (PENDING → RECEIVED) | ✅ Done | PARTIALLY_RECEIVED supported |
| PO payment status | ✅ Done | UNPAID, PARTIAL, PAID, REFUNDED |

### 4.8 Customers
| Feature | Status | Notes |
|---------|--------|-------|
| Customer CRUD | ✅ Done | Name, email, phone, address |
| Customer order history | ✅ Done | Linked sales orders |
| Customer view page | ✅ Done | Details + order list |

### 4.9 Sales Orders
| Feature | Status | Notes |
|---------|--------|-------|
| Sales order creation | ✅ Done | Select customer + products |
| Line items with auto-price | ✅ Done | Pulls sellingPrice from product |
| Sales order detail | ✅ Done | Status, payment, items table |
| Status workflow (PENDING → PROCESSING → SHIPPED → DELIVERED) | ✅ Done | Page-level status updates |
| Payment status update | ✅ Done | UNPAID, PARTIAL, PAID, REFUNDED |
| Confirm order + stock deduction | ✅ Done | Deducts inventory, creates movement |

### 4.10 Inventory
| Feature | Status | Notes |
|---------|--------|-------|
| Inventory list | ✅ Done | Shows product, variant, qty, threshold |
| Low stock highlighting | ✅ Done | Red background + badges |
| Stock adjustment form | ✅ Done | Creates InventoryMovement |
| Movement log | ✅ Done | Paginated, filtered by type |
| Movement icons | ✅ Done | Color-coded by type |

### 4.11 Excel Import Wizard
| Feature | Status | Notes |
|---------|--------|-------|
| .xlsx file upload | ✅ Done | SheetJS parsing |
| Column mapping UI | ✅ Done | Tabs per sheet, dropdown mappings |
| Preview mapped rows | ✅ Done | First 5 rows preview |
| Import progress indicator | ✅ Done | Progress bar |
| Import report (imported/skipped/errors) | ✅ Done | Final summary card |
| Sheet4 → Products + Variants + BOM | ✅ Done | API route `/api/import/sheet4` |
| Sheet2+3 → Raw Materials | ✅ Done | API route `/api/import/sheet2-3` |
| Sheet1 → Suppliers + Purchase Orders | ✅ Done | API route `/api/import/sheet1` |
| Deduplication | ✅ Done | Skip existing SKUs/material codes |
| Ordered import (products → materials → POs) | ✅ Done | Follows dependency chain |

### 4.12 Admin Panel
| Feature | Status | Notes |
|---------|--------|-------|
| User list | ✅ Done | Table with all users |
| Add user | ✅ Done | Dialog form with role select |
| Toggle user active/inactive | ✅ Done | Server action via API |
| Reset password | ✅ Done | Hashed reset to default |
| Role badges | ✅ Done | ADMIN vs STAFF |

---

## 5. API Routes

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET/POST | `/api/products` | Session | List / create products |
| GET/PATCH/DELETE | `/api/products/[id]` | Session | Product detail / update / delete |
| GET/POST | `/api/raw-materials` | Session | List / create raw materials |
| GET/PATCH/DELETE | `/api/raw-materials/[id]` | Session | Material detail / update / delete |
| GET/POST | `/api/suppliers` | Session | List / create suppliers |
| GET/PATCH/DELETE | `/api/suppliers/[id]` | Session | Supplier detail / update / delete |
| GET/POST | `/api/purchase-orders` | Session | List / create POs |
| GET/PATCH | `/api/purchase-orders/[id]` | Session | PO detail / update |
| GET/POST | `/api/sales-orders` | Session | List / create sales orders |
| GET/PATCH | `/api/sales-orders/[id]` | Session | Order detail / update |
| GET/POST | `/api/customers` | Session | List / create customers |
| GET/PATCH/DELETE | `/api/customers/[id]` | Session | Customer detail / update / delete |
| POST | `/api/inventory/[id]/adjust` | Session | Adjust stock quantity |
| POST | `/api/users` | ADMIN | Create user |
| PATCH | `/api/users/[id]` | ADMIN | Toggle active |
| POST | `/api/users/[id]` | ADMIN | Reset password |
| POST | `/api/import/sheet4` | Session | Import products from Sheet4 |
| POST | `/api/import/sheet2-3` | Session | Import materials from Sheet2/3 |
| POST | `/api/import/sheet1` | Session | Import POs from Sheet1 |

---

## 6. Deployment

### Docker (Recommended)
- `docker-compose.yml` — postgres:16-alpine + app service
- Dockerfile — 3-stage build (deps → builder → runner)
- `server.js` — Custom Node entry point
- `.env.production` — Environment template
- `.dockerignore` — Excludes node_modules, .next, uploads

### Native (macOS)
- `deploy.sh` — One-command setup
- `backup.sh` — PostgreSQL dump + compress
- launchd plist generation for auto-start
- Directory layout: `data/`, `backups/`, `logs/`

### LAN Access
- App binds to `0.0.0.0:3000` (Docker) or `localhost:3000` (native)
- Staff access via `http://<mac-ip>:3000`
- No internet exposure, no cloud dependencies

---

## 7. Testing Status

### Automated
| Test | Status | Command |
|------|--------|---------|
| Build | ✅ Pass | `npm run build` |
| TypeScript | ✅ Pass | `npm run build` includes type check |
| Lint | 🔲 TODO | Add `npm run lint` via ESLint |

### Manual Smoke Tests
| Flow | Status | Notes |
|------|--------|-------|
| Login | ✅ Pass | admin@celestialgrace.in / admin123 |
| Create product | ✅ Pass | API returns 201 |
| Create raw material | ✅ Pass | API returns 201 |
| Create supplier | ✅ Pass | API returns 201 |
| Create customer | ✅ Pass | API returns 201 |
| Create sales order | ✅ Pass | API returns 201 |
| Confirm order | 🔲 TODO | Needs browser-based testing |
| Excel import | 🔲 TODO | Needs testing against actual workbook |

---

## 8. Known Issues / TODOs

### High Priority
1. **`trustHost` in NextAuth** — Set `trustHost: true` for LAN deployment
2. **Sales order confirm** — Server action uses `toast.add()` from base-ui; switch to `sonner` for consistency
3. **Excel import validation** — Test against actual workbook; adjust column mappings
4. **Stock validation** — Prevent negative inventory on sales order confirm
5. **PO receive workflow** — Need `receivedQty` tracking in PurchaseOrderItem schema

### Medium Priority
6. **Sales chart on dashboard** — Add Recharts line/bar chart for sales over time
7. **Product search/filter** — URLSearchParams-based filtering needs polish
8. **Low stock email alerts** — Optional email notifications for low stock
9. **Barcode/QR code support** — For product labeling
10. **Batch operations** — Bulk stock updates, bulk import

### Low Priority
11. **Dark mode toggle** — Light theme only for now
12. **Export to Excel** — Export products, inventory, orders
13. **Multi-language support** — English only for now
14. **Mobile responsive** — Works on tablets, not fully optimized for phones
15. **Audit log UI** — Movement log exists, but could be filtered/exported

---

## 9. File Structure

```
celestial-grace-inventory/
├── src/
│   ├── app/
│   │   ├── (auth)/
│   │   │   └── login/
│   │   │       ├── page.tsx
│   │   │       └── LoginForm.tsx
│   │   ├── (dashboard)/
│   │   │   ├── layout.tsx
│   │   │   ├── page.tsx
│   │   │   ├── products/
│   │   │   │   ├── page.tsx
│   │   │   │   ├── new/
│   │   │   │   ├── [id]/
│   │   │   │   └── ...
│   │   │   ├── raw-materials/
│   │   │   ├── suppliers/
│   │   │   ├── purchase-orders/
│   │   │   ├── customers/
│   │   │   ├── sales-orders/
│   │   │   ├── inventory/
│   │   │   ├── bom/
│   │   │   ├── import/
│   │   │   └── admin/
│   │   └── api/
│   │       ├── auth/[...nextauth]/
│   │       ├── products/
│   │       ├── raw-materials/
│   │       ├── suppliers/
│   │       ├── purchase-orders/
│   │       ├── customers/
│   │       ├── sales-orders/
│   │       ├── inventory/[id]/adjust/
│   │       ├── users/
│   │       └── import/
│   ├── components/
│   │   ├── ui/
│   │   └── auth/
│   └── lib/
│       ├── prisma.ts
│       └── utils.ts
├── prisma/
│   ├── schema.prisma
│   └── seed.ts
├── docker-compose.yml
├── Dockerfile
├── server.js
├── deploy.sh
├── backup.sh
├── .env
├── .env.production
├── README.md
└── package.json
```

---

## 10. Migration Strategy (Excel → App)

### Source: Celestial Grace Master Costing Workbook
- **Sheet4**: Back Product Master → Products + ProductVariants + ProductBOM
- **Sheet2**: Material costing → RawMaterials (category: material)
- **Sheet3**: Hardware costing → RawMaterials (category: hardware)
- **Sheet1**: Purchase Register → Suppliers + PurchaseOrders

### Process
1. Upload `.xlsx` via `/import` page
2. Auto-detect sheet names + column headers
3. Map columns to app fields via dropdown UI
4. Preview first 5 mapped rows
5. Run import with progress bar
6. Receive report: imported/skipped/errors count

### Deduplication Rules
- Product: SKU uniqueness
- RawMaterial: Name uniqueness
- Supplier: Name uniqueness
- PurchaseOrder: Reference + supplierId uniqueness

---

## 11. Validation Plan

### Build Validation
```bash
npm run build  # Must pass TypeScript + compile
```

### Manual Testing Checklist
- [ ] Login as admin, create test product, verify list
- [ ] Add variant to product, verify BOM linking
- [ ] Create raw material, verify low stock threshold
- [ ] Create supplier, verify linked PO creation
- [ ] Create PO, mark received, verify status update
- [ ] Create customer, create sales order, confirm order
- [ ] Confirm order deducts stock + creates movement
- [ ] Adjust stock manually via inventory page
- [ ] View movement log, verify entries
- [ ] Add new user via admin panel
- [ ] Toggle user active/inactive
- [ ] Run Excel import wizard against actual workbook
- [ ] Verify all 3 sheets import correctly
- [ ] Check duplicate handling
- [ ] Login as staff, verify restricted nav items
- [ ] Test on mobile/tablet screen sizes

---

## 12. Next Implementation Steps

1. **Fix trustedHost for NextAuth** — Update `authConfig` for LAN
2. **Polish Excel import** — Test against actual workbook, refine column detection
3. **Sales chart** — Add Recharts visualization to dashboard
4. **Stock validation** — Prevent negative inventory
5. **PO receipts** — Add `receivedQty` tracking to schema
6. **Product search** — Implement URLSearchParams filtering
7. **Lint setup** — Add ESLint + `npm run lint`
8. **E2E tests** — Playwright or similar for critical flows
9. **Performance audit** — Check bundle size, optimize images
10. **Production hardening** — Rate limiting, CSP headers, input sanitization

---

## 13. Credentials & Secrets

**Default admin account:**
- Email: `admin@celestialgrace.in`
- Password: `admin123`
- **Action required:** Change password after first login

**Secrets management:**
- `NEXTAUTH_SECRET` — Auto-generated by `deploy.sh`, stored in `.env`
- `DATABASE_URL` — PostgreSQL connection string
- No other secrets or API keys needed

---

## 14. Support & Maintenance

### Logs
- Docker: `docker compose logs -f app`
- Native: `tail -f logs/app.log`

### Backups
```bash
# Daily backup (add to crontab)
0 2 * * * /path/to/celestial-grace/backup.sh
```

### Updates
```bash
git pull  # if using git
npm install
npm run build
docker compose up -d --build  # or restart launchd service
npx prisma migrate deploy
```

### Troubleshooting
- **Port 3000 in use:** Change `PORT` in `.env` or `docker-compose.yml`
- **Database connection refused:** Check PostgreSQL is running, verify `DATABASE_URL`
- **Login loop:** Ensure `NEXTAUTH_URL` matches access URL exactly (including LAN IP)

---

*This document is a living artifact. Update it as features are completed or requirements change.*
