import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { executeQuery } from "@/lib/db"
import { Package, ShoppingCart, Users, AlertTriangle } from "lucide-react"

// Helper function to safely format price
function formatPrice(price: number | string): string {
  // Convert to number if it's a string
  const numPrice = typeof price === "string" ? Number.parseFloat(price) : price

  // Check if it's a valid number
  if (isNaN(numPrice)) {
    return "$0.00"
  }

  // Format the number
  return `$${numPrice.toFixed(2)}`
}

async function getStats() {
  try {
    // Get total products
    const productsQuery = "SELECT COUNT(*) as count FROM products"
    const productsResult = await executeQuery<any[]>({ query: productsQuery })
    const totalProducts = productsResult[0]?.count || 0

    // Get total suppliers
    const suppliersQuery = "SELECT COUNT(*) as count FROM suppliers"
    const suppliersResult = await executeQuery<any[]>({ query: suppliersQuery })
    const totalSuppliers = suppliersResult[0]?.count || 0

    // Get total customers
    const customersQuery = "SELECT COUNT(*) as count FROM customers"
    const customersResult = await executeQuery<any[]>({ query: customersQuery })
    const totalCustomers = customersResult[0]?.count || 0

    // Get low stock products (less than 10 items)
    const lowStockQuery = "SELECT COUNT(*) as count FROM products WHERE quantity < 10"
    const lowStockResult = await executeQuery<any[]>({ query: lowStockQuery })
    const lowStockProducts = lowStockResult[0]?.count || 0

    // Get recent sales
    const recentSalesQuery = `
      SELECT s.id, c.name as customer_name, s.sale_date, 
             COUNT(si.id) as items_count, 
             SUM(si.quantity * si.price) as total_amount
      FROM sales s
      JOIN customers c ON s.customer_id = c.id
      JOIN sale_items si ON s.id = si.sale_id
      GROUP BY s.id
      ORDER BY s.sale_date DESC
      LIMIT 5
    `
    const recentSales = await executeQuery<any[]>({ query: recentSalesQuery })

    // Get recent purchases
    const recentPurchasesQuery = `
      SELECT p.id, s.name as supplier_name, p.purchase_date, 
             COUNT(pi.id) as items_count, 
             SUM(pi.quantity * pi.price) as total_amount
      FROM purchases p
      JOIN suppliers s ON p.supplier_id = s.id
      JOIN purchase_items pi ON p.id = pi.purchase_id
      GROUP BY p.id
      ORDER BY p.purchase_date DESC
      LIMIT 5
    `
    const recentPurchases = await executeQuery<any[]>({ query: recentPurchasesQuery })

    return {
      totalProducts,
      totalSuppliers,
      totalCustomers,
      lowStockProducts,
      recentSales,
      recentPurchases,
    }
  } catch (error) {
    console.error("Error fetching dashboard stats:", error)
    return {
      totalProducts: 0,
      totalSuppliers: 0,
      totalCustomers: 0,
      lowStockProducts: 0,
      recentSales: [],
      recentPurchases: [],
    }
  }
}

export default async function DashboardPage() {
  const stats = await getStats()

  return (
    <DashboardLayout>
      <div className="space-y-4">
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
        <p className="text-muted-foreground">Welcome to your inventory management dashboard.</p>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Products</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalProducts}</div>
              <p className="text-xs text-muted-foreground">Items in inventory</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Suppliers</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalSuppliers}</div>
              <p className="text-xs text-muted-foreground">Active suppliers</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Customers</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalCustomers}</div>
              <p className="text-xs text-muted-foreground">Registered customers</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Low Stock Alert</CardTitle>
              <AlertTriangle className="h-4 w-4 text-destructive" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.lowStockProducts}</div>
              <p className="text-xs text-muted-foreground">Products need restocking</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Card className="col-span-1">
            <CardHeader>
              <CardTitle>Recent Sales</CardTitle>
              <CardDescription>Latest 5 sales transactions</CardDescription>
            </CardHeader>
            <CardContent>
              {stats.recentSales.length > 0 ? (
                <div className="space-y-4">
                  {stats.recentSales.map((sale) => (
                    <div key={sale.id} className="flex items-center">
                      <ShoppingCart className="mr-2 h-4 w-4 text-muted-foreground" />
                      <div className="ml-2 space-y-1">
                        <p className="text-sm font-medium leading-none">{sale.customer_name}</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(sale.sale_date).toLocaleDateString()} - {formatPrice(sale.total_amount)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No recent sales</p>
              )}
            </CardContent>
          </Card>

          <Card className="col-span-1">
            <CardHeader>
              <CardTitle>Recent Purchases</CardTitle>
              <CardDescription>Latest 5 purchase transactions</CardDescription>
            </CardHeader>
            <CardContent>
              {stats.recentPurchases.length > 0 ? (
                <div className="space-y-4">
                  {stats.recentPurchases.map((purchase) => (
                    <div key={purchase.id} className="flex items-center">
                      <ShoppingCart className="mr-2 h-4 w-4 text-muted-foreground" />
                      <div className="ml-2 space-y-1">
                        <p className="text-sm font-medium leading-none">{purchase.supplier_name}</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(purchase.purchase_date).toLocaleDateString()} - {formatPrice(purchase.total_amount)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No recent purchases</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  )
}
