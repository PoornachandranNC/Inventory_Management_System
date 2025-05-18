import { type NextRequest, NextResponse } from "next/server"
import { executeQuery, insertRow } from "@/lib/db"
import { getCurrentUser } from "@/lib/auth-server"

// GET all purchases
export async function GET() {
  try {
    const query = `
      SELECT p.id, s.name as supplier_name, p.purchase_date, 
             COUNT(pi.id) as items_count, 
             SUM(pi.quantity * pi.price) as total_amount
      FROM purchases p
      JOIN suppliers s ON p.supplier_id = s.id
      JOIN purchase_items pi ON p.id = pi.purchase_id
      GROUP BY p.id
      ORDER BY p.id ASC
    `

    const purchases = await executeQuery({ query })
    return NextResponse.json(purchases)
  } catch (error) {
    console.error("Error fetching purchases:", error)
    return NextResponse.json({ error: "Failed to fetch purchases" }, { status: 500 })
  }
}

// POST new purchase
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { supplier_id, purchase_date, items } = await request.json()

    if (!supplier_id || !purchase_date || !items || items.length === 0) {
      return NextResponse.json({ error: "Supplier, date, and items are required" }, { status: 400 })
    }

    console.log("Purchase data received:", { supplier_id, purchase_date, items })

    // Insert purchase record first (without transaction)
    const purchaseId = await insertRow({
      table: "purchases",
      data: {
        supplier_id: Number(supplier_id),
        purchase_date,
      },
    })

    console.log("Purchase record created with ID:", purchaseId)

    // Insert purchase items and update product quantities
    for (const item of items) {
      // Convert price to number if it's a string
      const itemPrice = typeof item.price === "string" ? Number.parseFloat(item.price) : item.price
      const itemQuantity = Number(item.quantity)
      const productId = Number(item.product_id)

      console.log("Processing item:", {
        product_id: productId,
        quantity: itemQuantity,
        price: itemPrice,
      })

      // Insert purchase item
      await insertRow({
        table: "purchase_items",
        data: {
          purchase_id: purchaseId,
          product_id: productId,
          quantity: itemQuantity,
          price: itemPrice,
        },
      })

      // Update product quantity
      const updateQuery = `
        UPDATE products 
        SET quantity = quantity + ? 
        WHERE id = ?
      `
      await executeQuery({
        query: updateQuery,
        values: [itemQuantity, productId],
      })
    }

    console.log("Purchase completed successfully")

    return NextResponse.json({
      success: true,
      id: purchaseId,
      supplier_id,
      purchase_date,
      items,
    })
  } catch (error) {
    console.error("Error creating purchase:", error)
    return NextResponse.json(
      {
        error: "Failed to create purchase",
        message: error.message || "An unexpected error occurred",
        details: error.toString(),
      },
      { status: 500 },
    )
  }
}
