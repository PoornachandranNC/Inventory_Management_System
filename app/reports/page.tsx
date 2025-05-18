import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { executeQuery } from "@/lib/db"
import { Download } from "lucide-react"

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

async function getReportData() {
  try {
    // Get sales by month
    const salesByMonthQuery = `
      SELECT 
        DATE_FORMAT(sale_date, '%Y-%m') as month,
        SUM(si.quantity * si.price) as total_amount
      FROM sales s
      JOIN sale_items si ON s.id = si.sale_id
      WHERE sale_date >= DATE_SUB(CURDATE(), INTERVAL 6 MONTH)
      GROUP BY DATE_FORMAT(sale_date, '%Y-%m')
      ORDER BY month
    `
    const salesByMonth = await executeQuery<any[]>({ query: salesByMonthQuery })

    // Get top selling products
    const topProductsQuery = `
      SELECT 
        p.name,
        SUM(si.quantity) as total_quantity,
        SUM(si.quantity * si.price) as total_amount
      FROM sale_items si
      JOIN products p ON si.product_id = p.id
      JOIN sales s ON si.sale_id = s.id
      WHERE s.sale_date >= DATE_SUB(CURDATE(), INTERVAL 3 MONTH)
      GROUP BY p.id
      ORDER BY total_quantity DESC
      LIMIT 5
    `
    const topProducts = await executeQuery<any[]>({ query: topProductsQuery })

    // Get inventory value by category
    const inventoryByCategoryQuery = `
      SELECT 
        c.name as category,
        SUM(p.quantity) as total_quantity,
        SUM(p.quantity * p.price) as total_value
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      GROUP BY c.id
      ORDER BY total_value DESC
    `
    const inventoryByCategory = await executeQuery<any[]>({ query: inventoryByCategoryQuery })

    // Get purchases by month
    const purchasesByMonthQuery = `
      SELECT 
        DATE_FORMAT(purchase_date, '%Y-%m') as month,
        SUM(pi.quantity * pi.price) as total_amount
      FROM purchases p
      JOIN purchase_items pi ON p.id = pi.purchase_id
      WHERE purchase_date >= DATE_SUB(CURDATE(), INTERVAL 6 MONTH)
      GROUP BY DATE_FORMAT(purchase_date, '%Y-%m')
      ORDER BY month
    `
    const purchasesByMonth = await executeQuery<any[]>({ query: purchasesByMonthQuery })

    // Get top suppliers by purchase amount
    const topSuppliersQuery = `
      SELECT 
        s.name as supplier_name,
        COUNT(p.id) as purchase_count,
        SUM(pi.quantity * pi.price) as total_amount
      FROM purchases p
      JOIN suppliers s ON p.supplier_id = s.id
      JOIN purchase_items pi ON p.id = pi.purchase_id
      WHERE p.purchase_date >= DATE_SUB(CURDATE(), INTERVAL 3 MONTH)
      GROUP BY s.id
      ORDER BY total_amount DESC
      LIMIT 5
    `
    const topSuppliers = await executeQuery<any[]>({ query: topSuppliersQuery })

    return {
      salesByMonth,
      topProducts,
      inventoryByCategory,
      purchasesByMonth,
      topSuppliers,
    }
  } catch (error) {
    console.error("Error fetching report data:", error)
    return {
      salesByMonth: [],
      topProducts: [],
      inventoryByCategory: [],
      purchasesByMonth: [],
      topSuppliers: [],
    }
  }
}

export default async function ReportsPage() {
  const reportData = await getReportData()

  return (
    <DashboardLayout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Reports</h2>
          <p className="text-muted-foreground">View and export reports for your inventory system.</p>
        </div>
        <form action="/api/reports/export" method="POST">
          <Button type="submit">
            <Download className="mr-2 h-4 w-4" />
            Export Data
          </Button>
        </form>
      </div>

      <Tabs defaultValue="sales">
        <TabsList className="mb-4">
          <TabsTrigger value="sales">Sales</TabsTrigger>
          <TabsTrigger value="inventory">Inventory</TabsTrigger>
          <TabsTrigger value="purchases">Purchases</TabsTrigger>
        </TabsList>

        <TabsContent value="sales" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Sales Overview</CardTitle>
              <CardDescription>Monthly sales for the last 6 months</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] flex items-center justify-center">
                {reportData.salesByMonth.length > 0 ? (
                  <div className="w-full">
                    <div className="flex justify-between items-end h-[250px] w-full">
                      {reportData.salesByMonth.map((item, index) => {
                        const amount =
                          typeof item.total_amount === "string"
                            ? Number.parseFloat(item.total_amount)
                            : item.total_amount

                        const maxAmount = Math.max(
                          ...reportData.salesByMonth.map((s) => {
                            return typeof s.total_amount === "string"
                              ? Number.parseFloat(s.total_amount)
                              : s.total_amount
                          }),
                        )

                        return (
                          <div key={index} className="flex flex-col items-center">
                            <div
                              className="bg-primary w-12 rounded-t-md"
                              style={{
                                height: `${Math.max(50, (amount / maxAmount) * 200)}px`,
                              }}
                            ></div>
                            <div className="text-xs mt-2">
                              {new Date(item.month + "-01").toLocaleDateString("default", { month: "short" })}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                ) : (
                  <p className="text-muted-foreground">No sales data available</p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Top Selling Products</CardTitle>
              <CardDescription>Best performing products in the last 3 months</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {reportData.topProducts.length > 0 ? (
                  reportData.topProducts.map((product, index) => {
                    const amount =
                      typeof product.total_amount === "string"
                        ? Number.parseFloat(product.total_amount)
                        : product.total_amount

                    const quantity =
                      typeof product.total_quantity === "string"
                        ? Number.parseInt(product.total_quantity)
                        : product.total_quantity

                    const maxQuantity = Math.max(
                      ...reportData.topProducts.map((p) => {
                        return typeof p.total_quantity === "string"
                          ? Number.parseInt(p.total_quantity)
                          : p.total_quantity
                      }),
                    )

                    return (
                      <div key={index} className="space-y-2">
                        <div className="flex justify-between">
                          <span className="font-medium">{product.name}</span>
                          <span>{formatPrice(amount)}</span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-2.5">
                          <div
                            className="bg-primary h-2.5 rounded-full"
                            style={{
                              width: `${(quantity / maxQuantity) * 100}%`,
                            }}
                          ></div>
                        </div>
                        <div className="text-xs text-muted-foreground">{quantity} units sold</div>
                      </div>
                    )
                  })
                ) : (
                  <p className="text-muted-foreground">No product data available</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="inventory" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Inventory Value by Category</CardTitle>
              <CardDescription>Current inventory distribution</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {reportData.inventoryByCategory.length > 0 ? (
                  reportData.inventoryByCategory.map((category, index) => {
                    const value =
                      typeof category.total_value === "string"
                        ? Number.parseFloat(category.total_value)
                        : category.total_value

                    const quantity =
                      typeof category.total_quantity === "string"
                        ? Number.parseInt(category.total_quantity)
                        : category.total_quantity

                    const maxValue = Math.max(
                      ...reportData.inventoryByCategory.map((c) => {
                        return typeof c.total_value === "string" ? Number.parseFloat(c.total_value) : c.total_value
                      }),
                    )

                    return (
                      <div key={index} className="space-y-2">
                        <div className="flex justify-between">
                          <span className="font-medium">{category.category || "Uncategorized"}</span>
                          <span>{formatPrice(value)}</span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-2.5">
                          <div
                            className="bg-primary h-2.5 rounded-full"
                            style={{
                              width: `${(value / maxValue) * 100}%`,
                            }}
                          ></div>
                        </div>
                        <div className="text-xs text-muted-foreground">{quantity} units in stock</div>
                      </div>
                    )
                  })
                ) : (
                  <p className="text-muted-foreground">No inventory data available</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="purchases" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Purchases Overview</CardTitle>
              <CardDescription>Monthly purchases for the last 6 months</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] flex items-center justify-center">
                {reportData.purchasesByMonth && reportData.purchasesByMonth.length > 0 ? (
                  <div className="w-full">
                    <div className="flex justify-between items-end h-[250px] w-full">
                      {reportData.purchasesByMonth.map((item, index) => {
                        const amount =
                          typeof item.total_amount === "string"
                            ? Number.parseFloat(item.total_amount)
                            : item.total_amount

                        const maxAmount = Math.max(
                          ...reportData.purchasesByMonth.map((s) => {
                            return typeof s.total_amount === "string"
                              ? Number.parseFloat(s.total_amount)
                              : s.total_amount
                          }),
                        )

                        return (
                          <div key={index} className="flex flex-col items-center">
                            <div
                              className="bg-secondary w-12 rounded-t-md"
                              style={{
                                height: `${Math.max(50, (amount / maxAmount) * 200)}px`,
                              }}
                            ></div>
                            <div className="text-xs mt-2">
                              {new Date(item.month + "-01").toLocaleDateString("default", { month: "short" })}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                ) : (
                  <p className="text-muted-foreground">No purchase data available</p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Top Suppliers</CardTitle>
              <CardDescription>Suppliers with highest purchase amounts in the last 3 months</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {reportData.topSuppliers && reportData.topSuppliers.length > 0 ? (
                  reportData.topSuppliers.map((supplier, index) => {
                    const amount =
                      typeof supplier.total_amount === "string"
                        ? Number.parseFloat(supplier.total_amount)
                        : supplier.total_amount

                    const maxAmount = Math.max(
                      ...reportData.topSuppliers.map((s) => {
                        return typeof s.total_amount === "string" ? Number.parseFloat(s.total_amount) : s.total_amount
                      }),
                    )

                    return (
                      <div key={index} className="space-y-2">
                        <div className="flex justify-between">
                          <span className="font-medium">{supplier.supplier_name}</span>
                          <span>{formatPrice(amount)}</span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-2.5">
                          <div
                            className="bg-secondary h-2.5 rounded-full"
                            style={{
                              width: `${(amount / maxAmount) * 100}%`,
                            }}
                          ></div>
                        </div>
                        <div className="text-xs text-muted-foreground">{supplier.purchase_count} purchases</div>
                      </div>
                    )
                  })
                ) : (
                  <p className="text-muted-foreground">No supplier data available</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </DashboardLayout>
  )
}
