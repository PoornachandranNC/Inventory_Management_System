import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { executeQuery } from "@/lib/db"
import { ArrowLeft, Download, Printer } from "lucide-react"
import Link from "next/link"
import { notFound } from "next/navigation"

interface Purchase {
  id: number
  supplier_name: string
  purchase_date: string
}

interface PurchaseItem {
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

async function getPurchase(id: string) {
  try {
    const query = `
      SELECT p.id, s.name as supplier_name, p.purchase_date
      FROM purchases p
      JOIN suppliers s ON p.supplier_id = s.id
      WHERE p.id = ?
    `
    const purchases = await executeQuery<Purchase[]>({ query, values: [id] })
    return purchases.length > 0 ? purchases[0] : null
  } catch (error) {
    console.error("Error fetching purchase:", error)
    return null
  }
}

async function getPurchaseItems(id: string) {
  try {
    const query = `
      SELECT pi.id, p.name as product_name, pi.quantity, pi.price, (pi.quantity * pi.price) as total
      FROM purchase_items pi
      JOIN products p ON pi.product_id = p.id
      WHERE pi.purchase_id = ?
    `
    return await executeQuery<PurchaseItem[]>({ query, values: [id] })
  } catch (error) {
    console.error("Error fetching purchase items:", error)
    return []
  }
}

export default async function PurchaseViewPage({ params }: { params: { id: string } }) {
  const purchase = await getPurchase(params.id)

  if (!purchase) {
    notFound()
  }

  const purchaseItems = await getPurchaseItems(params.id)

  // Calculate total
  const total = purchaseItems.reduce((sum, item) => {
    const itemTotal = typeof item.total === "string" ? Number.parseFloat(item.total) : item.total
    return sum + itemTotal
  }, 0)

  return (
    <DashboardLayout>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <Link href="/purchases">
            <Button variant="ghost" size="sm" className="mr-2">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Purchases
            </Button>
          </Link>
          <h2 className="text-3xl font-bold tracking-tight">Purchase #{purchase.id}</h2>
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
            <CardTitle>Purchase Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Purchase ID</p>
                <p className="text-lg font-medium">#{purchase.id}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Date</p>
                <p className="text-lg font-medium">{new Date(purchase.purchase_date).toLocaleDateString()}</p>
              </div>
            </div>

            <div>
              <p className="text-sm font-medium text-muted-foreground">Supplier</p>
              <p className="text-lg font-medium">{purchase.supplier_name}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Purchase Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Items Count</p>
                <p className="text-lg font-medium">{purchaseItems.length}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Quantity</p>
                <p className="text-lg font-medium">
                  {purchaseItems.reduce((sum, item) => sum + item.quantity, 0)} units
                </p>
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
          <CardTitle>Purchase Items</CardTitle>
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
              {purchaseItems.map((item) => (
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
