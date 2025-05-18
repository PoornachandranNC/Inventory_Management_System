import { type NextRequest, NextResponse } from "next/server"
import { executeQuery, updateRow } from "@/lib/db"
import { isAdmin } from "@/lib/auth-server"

// GET a single customer
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = params.id

    const query = "SELECT * FROM customers WHERE id = ?"
    const customers = await executeQuery<any[]>({ query, values: [id] })

    if (customers.length === 0) {
      return NextResponse.json({ error: "Customer not found" }, { status: 404 })
    }

    return NextResponse.json(customers[0])
  } catch (error) {
    console.error("Error fetching customer:", error)
    return NextResponse.json({ error: "Failed to fetch customer" }, { status: 500 })
  }
}

// UPDATE a customer
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Check if user is admin
    const admin = await isAdmin()

    if (!admin) {
      return NextResponse.json({ error: "Unauthorized. Admin access required." }, { status: 403 })
    }

    const id = params.id
    const body = await request.json()

    // Validate required fields
    if (!body.name) {
      return NextResponse.json({ error: "Customer name is required" }, { status: 400 })
    }

    // Update the customer
    const success = await updateRow({
      table: "customers",
      data: {
        name: body.name,
        contact_info: body.contact_info || null,
      },
      whereClause: "id = ?",
      whereValues: [id],
    })

    if (!success) {
      return NextResponse.json({ error: "Customer not found or no changes made" }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      id: Number(id),
      name: body.name,
      contact_info: body.contact_info || null,
    })
  } catch (error) {
    console.error("Error updating customer:", error)
    return NextResponse.json({ error: "Failed to update customer" }, { status: 500 })
  }
}

// DELETE a customer
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Check if user is admin
    const admin = await isAdmin()

    if (!admin) {
      return NextResponse.json({ error: "Unauthorized. Admin access required." }, { status: 403 })
    }

    const id = params.id

    // Check if customer exists
    const checkQuery = "SELECT id FROM customers WHERE id = ?"
    const customers = await executeQuery<any[]>({ query: checkQuery, values: [id] })

    if (customers.length === 0) {
      return NextResponse.json({ error: "Customer not found" }, { status: 404 })
    }

    // Check if customer is in use
    const usageQuery = "SELECT COUNT(*) as count FROM sales WHERE customer_id = ?"
    const usage = await executeQuery<any[]>({ query: usageQuery, values: [id] })

    if (usage[0].count > 0) {
      \
      returnquery: usageQuery, values: [id]
    }
    )

    if (usage[0].count > 0) {
      return NextResponse.json(
        {
          error: "Cannot delete customer that is in use. Remove the customer from all sales first.",
        },
        { status: 400 },
      )
    }

    // Delete the customer
    const deleteQuery = "DELETE FROM customers WHERE id = ?"
    await executeQuery({ query: deleteQuery, values: [id] })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting customer:", error)
    return NextResponse.json({ error: "Failed to delete customer" }, { status: 500 })
  }
}
