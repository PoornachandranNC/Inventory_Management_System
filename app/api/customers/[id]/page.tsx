import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { executeQuery } from "@/lib/db"
import { ArrowLeft, Edit, ShoppingCart } from "lucide-react"
import Link from "next/link"
import { notFound } from "next/navigation"

interface Customer {
  id: number
  name: string
  contact_info: string | null
}

interface Sale {
  id: number
  sale_date: string
  total_amount: number
  items_count: number
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

async function getCustomer(id: string) {
  try {
    const query = "SELECT * FROM customers WHERE id = ?"
    const customers = await executeQuery<Customer[]>({ query, values: [id] })
    return customers.length > 0 ? customers[0] : null
  } catch (error) {
    console.error("Error fetching customer:", error)
    return null
  }
}

async function getCustomerSales(id: string) {
  try {
    const query = `
      SELECT s.id, s.sale_date, 
             COUNT(si.id) as items_count, 
             SUM(si.quantity * si.price) as total_amount
      FROM sales s
      JOIN sale_items si ON s.id = si.sale_id
      WHERE s.customer_id = ?
      GROUP BY s.id
      ORDER BY s.sale_date DESC
      LIMIT 10
    `
    return await executeQuery<Sale[]>({ query, values: [id] })
  } catch (error) {
    console.error("Error fetching customer sales:", error)
    return []
  }
}

export default async function CustomerViewPage({ params }: { params: { id: string } }) {
  const customer = await getCustomer(params.id)

  if (!customer) {
    notFound()
  }

  const sales = await getCustomerSales(params.id)

  return (
    <DashboardLayout>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <Link href="/customers">
            <Button variant="ghost" size="sm" className="mr-2">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Customers
            </Button>
          </Link>
          <h2 className="text-3xl font-bold tracking-tight">{customer.name}</h2>
        </div>
        <Link href={`/customers/${customer.id}/edit`}>
          <Button>
            <Edit className="mr-2 h-4 w-4" />
            Edit Customer
          </Button>
        </Link>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Customer Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Customer ID</p>
              <p className="text-lg font-medium">#{customer.id}</p>
            </div>

            <div>
              <p className="text-sm font-medium text-muted-foreground">Contact Information</p>
              {customer.contact_info ? (
                <div className="mt-2 space-y-2">
                  {customer.contact_info.split("\n").map((line, index) => (
                    <p key={index} className="text-base">
                      {line}
                    </p>
                  ))}
                </div>
              ) : (
                <p className="text-base">No contact information available</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Purchase Statistics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Purchases</p>
                <p className="text-3xl font-bold">{sales.length}</p>
              </div>

              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Spent</p>
                <p className="text-3xl font-bold">
                  {formatPrice(
                    sales.reduce((total, sale) => {
                      const amount =
                        typeof sale.total_amount === "string" ? Number.parseFloat(sale.total_amount) : sale.total_amount
                      return total + amount
                    }, 0),
                  )}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Recent Purchases</CardTitle>
        </CardHeader>
        <CardContent>
          {sales.length > 0 ? (
            <div className="space-y-4">
              {sales.map((sale) => (
                <div key={sale.id} className="flex items-center justify-between border-b pb-4">
                  <div className="flex items-center">
                    <ShoppingCart className="h-5 w-5 text-muted-foreground mr-3" />
                    <div>
                      <p className="font-medium">Sale #{sale.id}</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(sale.sale_date).toLocaleDateString()} • {sale.items_count} items
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{formatPrice(sale.total_amount)}</p>
                    <Link href={`/sales/${sale.id}`}>
                      <Button variant="ghost" size="sm">
                        View
                      </Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground">No purchase history for this customer.</p>
          )}
        </CardContent>
      </Card>
    </DashboardLayout>
  )
}
