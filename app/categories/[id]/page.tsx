import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { executeQuery } from "@/lib/db"
import { ArrowLeft, Edit } from "lucide-react"
import Link from "next/link"
import { notFound } from "next/navigation"

interface Category {
  id: number
  name: string
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

async function getCategory(id: string) {
  try {
    const query = "SELECT * FROM categories WHERE id = ?"
    const categories = await executeQuery<Category[]>({ query, values: [id] })
    return categories.length > 0 ? categories[0] : null
  } catch (error) {
    console.error("Error fetching category:", error)
    return null
  }
}

async function getCategoryProducts(id: string) {
  try {
    const query = `
      SELECT id, name, quantity, price
      FROM products
      WHERE category_id = ?
      ORDER BY name
    `
    return await executeQuery<Product[]>({ query, values: [id] })
  } catch (error) {
    console.error("Error fetching category products:", error)
    return []
  }
}

export default async function CategoryViewPage({ params }: { params: { id: string } }) {
  const category = await getCategory(params.id)

  if (!category) {
    notFound()
  }

  const products = await getCategoryProducts(params.id)

  return (
    <DashboardLayout>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <Link href="/categories">
            <Button variant="ghost" size="sm" className="mr-2">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Categories
            </Button>
          </Link>
          <h2 className="text-3xl font-bold tracking-tight">{category.name}</h2>
        </div>
        <Link href={`/categories/${category.id}/edit`}>
          <Button>
            <Edit className="mr-2 h-4 w-4" />
            Edit Category
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Products in this Category</CardTitle>
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
            <p className="text-muted-foreground">No products in this category.</p>
          )}
        </CardContent>
      </Card>
    </DashboardLayout>
  )
}
