import { type NextRequest, NextResponse } from "next/server"
import { executeQuery, insertRow } from "@/lib/db"
import { getCurrentUser } from "@/lib/auth-server"

// GET all sales
export async function GET() {
  try {
    const query = `
      SELECT s.id, c.name as customer_name, s.sale_date, 
             COUNT(si.id) as items_count, 
             SUM(si.quantity * si.price) as total_amount
      FROM sales s
      JOIN customers c ON s.customer_id = c.id
      JOIN sale_items si ON s.id = si.sale_id
      GROUP BY s.id
      ORDER BY s.id ASC
    `

    const sales = await executeQuery({ query })
    return NextResponse.json(sales)
  } catch (error) {
    console.error("Error fetching sales:", error)
    return NextResponse.json({ error: "Failed to fetch sales" }, { status: 500 })
  }
}

// POST new sale
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { customer_id, sale_date, items } = await request.json()

    if (!customer_id || !sale_date || !items || items.length === 0) {
      return NextResponse.json({ error: "Customer, date, and items are required" }, { status: 400 })
    }

    console.log("Sale data received:", { customer_id, sale_date, items })

    // Insert sale record first (without transaction)
    const saleId = await insertRow({
      table: "sales",
      data: {
        customer_id: Number(customer_id),
        sale_date,
      },
    })

    console.log("Sale record created with ID:", saleId)

    // Process each item individually
    for (const item of items) {
      // Convert values to numbers
      const productId = Number(item.product_id)
      const quantity = Number(item.quantity)
      const price = typeof item.price === "string" ? Number.parseFloat(item.price) : item.price

      console.log("Processing item:", {
        product_id: productId,
        quantity,
        price,
      })

      // Check if there's enough stock
      const stockCheckQuery = "SELECT quantity FROM products WHERE id = ?"
      const stockResult = await executeQuery<any[]>({ query: stockCheckQuery, values: [productId] })

      if (stockResult.length === 0) {
        throw new Error(`Product with ID ${productId} not found`)
      }

      const currentStock = Number(stockResult[0].quantity)

      if (currentStock < quantity) {
        throw new Error(
          `Insufficient stock for product ID ${productId}. Available: ${currentStock}, Requested: ${quantity}`,
        )
      }

      // Insert sale item
      await insertRow({
        table: "sale_items",
        data: {
          sale_id: saleId,
          product_id: productId,
          quantity,
          price,
        },
      })

      // Update product quantity
      const updateQuery = "UPDATE products SET quantity = quantity - ? WHERE id = ?"
      await executeQuery({
        query: updateQuery,
        values: [quantity, productId],
      })
    }

    console.log("Sale completed successfully")

    return NextResponse.json({
      success: true,
      id: saleId,
      customer_id,
      sale_date,
      items,
    })
  } catch (error) {
    console.error("Error creating sale:", error)
    return NextResponse.json(
      {
        error: "Failed to create sale",
        message: error.message || "An unexpected error occurred",
        details: error.toString(),
      },
      { status: 500 },
    )
  }
}
