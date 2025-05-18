import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { executeQuery } from "@/lib/db"
import { ArrowLeft, Edit } from "lucide-react"
import Link from "next/link"
import { notFound } from "next/navigation"

interface Supplier {
  id: number
  name: string
  contact_info: string | null
}

interface Product {
  id: number
  name: string
  quantity: number
  price: number | string
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

async function getSupplier(id: string) {
  try {
    const query = "SELECT * FROM suppliers WHERE id = ?"
    const suppliers = await executeQuery<Supplier[]>({ query, values: [id] })
    return suppliers.length > 0 ? suppliers[0] : null
  } catch (error) {
    console.error("Error fetching supplier:", error)
    return null
  }
}

async function getSupplierProducts(id: string) {
  try {
    const query = `
      SELECT id, name, quantity, price
      FROM products
      WHERE supplier_id = ?
      ORDER BY name
    `
    return await executeQuery<Product[]>({ query, values: [id] })
  } catch (error) {
    console.error("Error fetching supplier products:", error)
    return []
  }
}

export default async function SupplierViewPage({ params }: { params: { id: string } }) {
  const supplier = await getSupplier(params.id)

  if (!supplier) {
    notFound()
  }

  const products = await getSupplierProducts(params.id)

  return (
    <DashboardLayout>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <Link href="/suppliers">
            <Button variant="ghost" size="sm" className="mr-2">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Suppliers
            </Button>
          </Link>
          <h2 className="text-3xl font-bold tracking-tight">{supplier.name}</h2>
        </div>
        <Link href={`/suppliers/${supplier.id}/edit`}>
          <Button>
            <Edit className="mr-2 h-4 w-4" />
            Edit Supplier
          </Button>
        </Link>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Supplier Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Supplier ID</p>
              <p className="text-lg font-medium">#{supplier.id}</p>
            </div>

            <div>
              <p className="text-sm font-medium text-muted-foreground">Contact Information</p>
              {supplier.contact_info ? (
                <div className="mt-2 space-y-2">
                  {supplier.contact_info.split("\n").map((line, index) => (
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
            <CardTitle>Supply Statistics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Products Supplied</p>
                <p className="text-3xl font-bold">{products.length}</p>
              </div>

              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Inventory Value</p>
                <p className="text-3xl font-bold">
                  {formatPrice(
                    products.reduce((total, product) => {
                      const price = typeof product.price === "string" ? Number.parseFloat(product.price) : product.price
                      return total + price * product.quantity
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
          <CardTitle>Products from this Supplier</CardTitle>
        </CardHeader>
        <CardContent>
          {products.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {products.map((product) => (
                <Card key={product.id} className="overflow-hidden">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-medium">{product.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          {product.quantity} in stock • {formatPrice(product.price)}
                        </p>
                      </div>
                      <Link href={`/products/${product.id}`}>
                        <Button variant="ghost" size="sm">
                          View
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground">No products from this supplier.</p>
          )}
        </CardContent>
      </Card>
    </DashboardLayout>
  )
}
