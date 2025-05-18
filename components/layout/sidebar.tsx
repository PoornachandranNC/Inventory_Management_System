"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { BarChart3, Package, ShoppingCart, Users, Tag, Truck, LogOut, Home, Settings } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { useState } from "react"

interface SidebarProps {
  className?: string
  userRole?: "admin" | "staff"
}

export function Sidebar({ className, userRole = "staff" }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  const isAdmin = userRole === "admin"

  const routes = [
    {
      href: "/dashboard",
      icon: Home,
      title: "Dashboard",
      adminOnly: false,
    },
    {
      href: "/products",
      icon: Package,
      title: "Products",
      adminOnly: false,
    },
    {
      href: "/categories",
      icon: Tag,
      title: "Categories",
      adminOnly: true,
    },
    {
      href: "/suppliers",
      icon: Truck,
      title: "Suppliers",
      adminOnly: true,
    },
    {
      href: "/customers",
      icon: Users,
      title: "Customers",
      adminOnly: true,
    },
    {
      href: "/purchases",
      icon: ShoppingCart,
      title: "Purchases",
      adminOnly: false,
    },
    {
      href: "/sales",
      icon: ShoppingCart,
      title: "Sales",
      adminOnly: false,
    },
    {
      href: "/reports",
      icon: BarChart3,
      title: "Reports",
      adminOnly: false,
    },
    {
      href: "/settings",
      icon: Settings,
      title: "Settings",
      adminOnly: true,
    },
  ]

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true)
      const response = await fetch("/api/auth/logout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      })

      if (response.ok) {
        router.push("/login")
        router.refresh()
      } else {
        console.error("Logout failed")
      }
    } catch (error) {
      console.error("Logout error:", error)
    } finally {
      setIsLoggingOut(false)
    }
  }

  return (
    <div className={cn("pb-12 min-h-screen relative", className)}>
      <div className="space-y-4 py-4">
        <div className="px-4 py-2">
          <h2 className="mb-2 px-2 text-xl font-semibold tracking-tight">Inventory System</h2>
          <div className="space-y-1">
            {routes.map((route) => {
              // Skip admin-only routes for staff users
              if (route.adminOnly && !isAdmin) {
                return null
              }

              return (
                <Link
                  key={route.href}
                  href={route.href}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all hover:text-primary",
                    pathname === route.href ? "bg-muted text-primary" : "text-muted-foreground",
                  )}
                >
                  <route.icon className="h-4 w-4" />
                  {route.title}
                </Link>
              )
            })}
          </div>
        </div>
      </div>
      <div className="px-3 absolute bottom-4 left-0 w-full pr-4">
        <Button
          variant="outline"
          className="w-full justify-start"
          type="button"
          onClick={handleLogout}
          disabled={isLoggingOut}
        >
          <LogOut className="mr-2 h-4 w-4" />
          {isLoggingOut ? "Logging out..." : "Log out"}
        </Button>
      </div>
    </div>
  )
}
