import Link from "next/link"
import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import {
  LayoutDashboard,
  Package,
  Box,
  ShoppingCart,
  Users,
  ClipboardList,
  Warehouse,
  Upload,
  Settings,
  UserCog,
  LogOut,
} from "lucide-react"

const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard, roles: ["ADMIN", "STAFF"] },
  { href: "/products", label: "Products", icon: Package, roles: ["ADMIN", "STAFF"] },
  { href: "/raw-materials", label: "Raw Materials", icon: Box, roles: ["ADMIN", "STAFF"] },
  { href: "/suppliers", label: "Suppliers", icon: Users, roles: ["ADMIN"] },
  { href: "/purchase-orders", label: "Purchase Orders", icon: ShoppingCart, roles: ["ADMIN"] },
  { href: "/customers", label: "Customers", icon: Users, roles: ["ADMIN", "STAFF"] },
  { href: "/sales-orders", label: "Sales Orders", icon: ClipboardList, roles: ["ADMIN", "STAFF"] },
  { href: "/inventory", label: "Inventory", icon: Warehouse, roles: ["ADMIN", "STAFF"] },
  { href: "/bom", label: "BOM", icon: Package, roles: ["ADMIN"] },
  { href: "/import", label: "Import", icon: Upload, roles: ["ADMIN"] },
  { href: "/admin", label: "Admin", icon: UserCog, roles: ["ADMIN"] },
]

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()

  if (!session?.user) {
    redirect("/login")
  }

  const role = session.user.role as string
  if (session.user.active === false) {
    redirect("/login?callbackUrl=%2F")
  }
  const filteredNav = navItems.filter((item) => item.roles.includes(role))

  return (
    <div className="flex h-screen">
      <aside className="w-64 border-r bg-muted/40 flex flex-col">
        <div className="p-4 border-b">
          <h2 className="text-lg font-semibold">Celestial Grace</h2>
          <p className="text-sm text-muted-foreground">Inventory</p>
        </div>
        <nav className="flex-1 overflow-y-auto p-2 space-y-1">
          {filteredNav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground"
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="p-4 border-t">
          <form
            action={async () => {
              "use server"
              await fetch(`${process.env.NEXTAUTH_URL}/api/auth/signout`, { method: "POST" })
              redirect("/login")
            }}
            className="w-full"
          >
            <button
              type="submit"
              className="inline-flex items-center gap-2 rounded-md border px-3 py-1.5 text-sm font-medium hover:bg-accent w-full justify-center"
            >
              <LogOut className="h-4 w-4" />
              Logout
            </button>
          </form>
        </div>
      </aside>
      <main className="flex-1 overflow-y-auto">
        <div className="p-6">
          {children}
        </div>
      </main>
    </div>
  )
}
