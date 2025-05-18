import { type NextRequest, NextResponse } from "next/server"
import { executeQuery, insertRow } from "@/lib/db"

// GET all products
export async function GET() {
  try {
    const query = `
      SELECT p.id, p.name, p.description, p.quantity, p.price, 
             c.name as category_name, 
             s.name as supplier_name
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN suppliers s ON p.supplier_id = s.id
      ORDER BY p.id ASC
    `

    const products = await executeQuery({ query })
    return NextResponse.json(products)
  } catch (error) {
    console.error("Error fetching products:", error)
    return NextResponse.json({ error: "Failed to fetch products" }, { status: 500 })
  }
}

// POST new product
export async function POST(request: NextRequest) {
  try {
    // Get the request body
    const body = await request.json()
    console.log("Received product data:", body)

    // Validate required fields
    if (!body.name || body.quantity === undefined || body.price === undefined) {
      return NextResponse.json({ error: "Name, quantity, and price are required" }, { status: 400 })
    }

    // Prepare product data with proper type conversion
    const productData = {
      name: body.name,
      description: body.description || null,
      category_id: body.category_id ? Number.parseInt(body.category_id) : null,
      supplier_id: body.supplier_id ? Number.parseInt(body.supplier_id) : null,
      quantity: Number.parseInt(body.quantity),
      price: Number.parseFloat(body.price),
    }

    console.log("Processed product data:", productData)

    // Insert the product
    const productId = await insertRow({
      table: "products",
      data: productData,
    })

    return NextResponse.json({
      success: true,
      id: productId,
      ...productData,
    })
  } catch (error) {
    console.error("Error creating product:", error)
    return NextResponse.json(
      {
        error: "Failed to create product",
        details: error.message,
      },
      { status: 500 },
    )
  }
}
