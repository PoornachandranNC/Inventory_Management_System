import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { executeQuery } from "@/lib/db"
import { ArrowLeft, Download, Printer } from "lucide-react"
import Link from "next/link"
import { notFound } from "next/navigation"

interface Sale {
  id: number
  customer_name: string
  sale_date: string
}

interface SaleItem {
  id: number
  product_name: string
  quantity: number
  price: number | string
  total: number | string
}

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

async function getSale(id: string) {
  try {
    const query = `
      SELECT s.id, c.name as customer_name, s.sale_date
      FROM sales s
      JOIN customers c ON s.customer_id = c.id
      WHERE s.id = ?
    `
    const sales = await executeQuery<Sale[]>({ query, values: [id] })
    return sales.length > 0 ? sales[0] : null
  } catch (error) {
    console.error("Error fetching sale:", error)
    return null
  }
}

async function getSaleItems(id: string) {
  try {
    const query = `
      SELECT si.id, p.name as product_name, si.quantity, si.price, (si.quantity * si.price) as total
      FROM sale_items si
      JOIN products p ON si.product_id = p.id
      WHERE si.sale_id = ?
    `
    return await executeQuery<SaleItem[]>({ query, values: [id] })
  } catch (error) {
    console.error("Error fetching sale items:", error)
    return []
  }
}

export default async function SaleViewPage({ params }: { params: { id: string } }) {
  const sale = await getSale(params.id)

  if (!sale) {
    notFound()
  }

  const saleItems = await getSaleItems(params.id)

  // Calculate total
  const total = saleItems.reduce((sum, item) => {
    const itemTotal = typeof item.total === "string" ? Number.parseFloat(item.total) : item.total
    return sum + itemTotal
  }, 0)

  return (
    <DashboardLayout>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <Link href="/sales">
            <Button variant="ghost" size="sm" className="mr-2">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Sales
            </Button>
          </Link>
          <h2 className="text-3xl font-bold tracking-tight">Sale #{sale.id}</h2>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" size="sm">
            <Printer className="h-4 w-4 mr-2" />
            Print
          </Button>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Sale Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Sale ID</p>
                <p className="text-lg font-medium">#{sale.id}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Date</p>
                <p className="text-lg font-medium">{new Date(sale.sale_date).toLocaleDateString()}</p>
              </div>
            </div>

            <div>
              <p className="text-sm font-medium text-muted-foreground">Customer</p>
              <p className="text-lg font-medium">{sale.customer_name}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Sale Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Items Count</p>
                <p className="text-lg font-medium">{saleItems.length}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Quantity</p>
                <p className="text-lg font-medium">{saleItems.reduce((sum, item) => sum + item.quantity, 0)} units</p>
              </div>
            </div>

            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Amount</p>
              <p className="text-3xl font-bold">{formatPrice(total)}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Sale Items</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead className="text-right">Price</TableHead>
                <TableHead className="text-right">Quantity</TableHead>
                <TableHead className="text-right">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {saleItems.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.product_name}</TableCell>
                  <TableCell className="text-right">{formatPrice(item.price)}</TableCell>
                  <TableCell className="text-right">{item.quantity}</TableCell>
                  <TableCell className="text-right">{formatPrice(item.total)}</TableCell>
                </TableRow>
              ))}
              <TableRow>
                <TableCell colSpan={3} className="font-bold text-right">
                  Total:
                </TableCell>
                <TableCell className="font-bold text-right">{formatPrice(total)}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </DashboardLayout>
  )
}
