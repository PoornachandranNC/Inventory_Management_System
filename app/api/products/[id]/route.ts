import { type NextRequest, NextResponse } from "next/server"
import { executeQuery, updateRow } from "@/lib/db"
import { isAdmin } from "@/lib/auth-server"

// GET a single product
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = params.id

    const query = `
      SELECT p.id, p.name, p.description, p.quantity, p.price, 
             p.category_id, p.supplier_id,
             c.name as category_name, 
             s.name as supplier_name
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN suppliers s ON p.supplier_id = s.id
      WHERE p.id = ?
    `

    const products = await executeQuery<any[]>({ query, values: [id] })

    if (products.length === 0) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 })
    }

    return NextResponse.json(products[0])
  } catch (error) {
    console.error("Error fetching product:", error)
    return NextResponse.json({ error: "Failed to fetch product" }, { status: 500 })
  }
}

// UPDATE a product
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = params.id
    const body = await request.json()

    // Validate required fields
    if (!body.name || body.quantity === undefined || body.price === undefined) {
      return NextResponse.json({ error: "Name, quantity, and price are required" }, { status: 400 })
    }

    // Prepare product data with proper type conversion
    const productData = {
      name: body.name,
      description: body.description || null,
      category_id: body.category_id || null,
      supplier_id: body.supplier_id || null,
      quantity: Number.parseInt(body.quantity),
      price: Number.parseFloat(body.price),
    }

    // Update the product
    const success = await updateRow({
      table: "products",
      data: productData,
      whereClause: "id = ?",
      whereValues: [id],
    })

    if (!success) {
      return NextResponse.json({ error: "Product not found or no changes made" }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      id: Number(id),
      ...productData,
    })
  } catch (error) {
    console.error("Error updating product:", error)
    return NextResponse.json(
      {
        error: "Failed to update product",
        details: error.message,
      },
      { status: 500 },
    )
  }
}

// DELETE a product
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Check if user is admin
    const admin = await isAdmin()

    if (!admin) {
      return NextResponse.json({ error: "Unauthorized. Admin access required." }, { status: 403 })
    }

    const id = params.id

    // Check if product exists
    const checkQuery = "SELECT id FROM products WHERE id = ?"
    const products = await executeQuery<any[]>({ query: checkQuery, values: [id] })

    if (products.length === 0) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 })
    }

    // Delete the product
    const deleteQuery = "DELETE FROM products WHERE id = ?"
    await executeQuery({ query: deleteQuery, values: [id] })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting product:", error)
    return NextResponse.json({ error: "Failed to delete product" }, { status: 500 })
  }
}
