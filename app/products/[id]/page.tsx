import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { executeQuery } from "@/lib/db"
import { ArrowLeft, Edit } from "lucide-react"
import Link from "next/link"
import { notFound } from "next/navigation"

interface Product {
  id: number
  name: string
  description: string | null
  category_name: string | null
  supplier_name: string | null
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

async function getProduct(id: string) {
  try {
    const query = `
      SELECT p.id, p.name, p.description, p.quantity, p.price, 
             c.name as category_name, 
             s.name as supplier_name
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN suppliers s ON p.supplier_id = s.id
      WHERE p.id = ?
    `

    const products = await executeQuery<Product[]>({ query, values: [id] })
    return products.length > 0 ? products[0] : null
  } catch (error) {
    console.error("Error fetching product:", error)
    return null
  }
}

export default async function ProductViewPage({ params }: { params: { id: string } }) {
  const product = await getProduct(params.id)

  if (!product) {
    notFound()
  }

  return (
    <DashboardLayout>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <Link href="/products">
            <Button variant="ghost" size="sm" className="mr-2">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Products
            </Button>
          </Link>
          <h2 className="text-3xl font-bold tracking-tight">{product.name}</h2>
        </div>
        <Link href={`/products/${product.id}/edit`}>
          <Button>
            <Edit className="mr-2 h-4 w-4" />
            Edit Product
          </Button>
        </Link>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Product Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Product ID</p>
                <p className="text-lg font-medium">#{product.id}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Price</p>
                <p className="text-lg font-medium">{formatPrice(product.price)}</p>
              </div>
            </div>

            <div>
              <p className="text-sm font-medium text-muted-foreground">Description</p>
              <p className="text-base">{product.description || "No description available"}</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Category</p>
                <p className="text-base">{product.category_name || "Uncategorized"}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Supplier</p>
                <p className="text-base">{product.supplier_name || "Unknown"}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Inventory Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Current Stock</p>
                <p className="text-3xl font-bold">{product.quantity}</p>
              </div>
              <div
                className={`px-3 py-1 rounded-full text-sm font-medium ${product.quantity > 10 ? "bg-green-100 text-green-800" : product.quantity > 0 ? "bg-yellow-100 text-yellow-800" : "bg-red-100 text-red-800"}`}
              >
                {product.quantity > 10 ? "In Stock" : product.quantity > 0 ? "Low Stock" : "Out of Stock"}
              </div>
            </div>

            <div className="mt-6">
              <p className="text-sm font-medium text-muted-foreground mb-2">Stock Level</p>
              <div className="w-full bg-muted rounded-full h-2.5">
                <div
                  className={`h-2.5 rounded-full ${product.quantity > 10 ? "bg-green-500" : product.quantity > 0 ? "bg-yellow-500" : "bg-red-500"}`}
                  style={{ width: `${Math.min(100, (product.quantity / 100) * 100)}%` }}
                ></div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Transaction History</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">No recent transactions for this product.</p>
        </CardContent>
      </Card>
    </DashboardLayout>
  )
}
