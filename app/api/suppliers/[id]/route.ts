import { type NextRequest, NextResponse } from "next/server"
import { executeQuery, updateRow } from "@/lib/db"
import { isAdmin } from "@/lib/auth-server"

// GET a single supplier
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = params.id

    const query = "SELECT * FROM suppliers WHERE id = ?"
    const suppliers = await executeQuery<any[]>({ query, values: [id] })

    if (suppliers.length === 0) {
      return NextResponse.json({ error: "Supplier not found" }, { status: 404 })
    }

    return NextResponse.json(suppliers[0])
  } catch (error) {
    console.error("Error fetching supplier:", error)
    return NextResponse.json({ error: "Failed to fetch supplier" }, { status: 500 })
  }
}

// UPDATE a supplier
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
      return NextResponse.json({ error: "Supplier name is required" }, { status: 400 })
    }

    // Update the supplier
    const success = await updateRow({
      table: "suppliers",
      data: {
        name: body.name,
        contact_info: body.contact_info || null,
      },
      whereClause: "id = ?",
      whereValues: [id],
    })

    if (!success) {
      return NextResponse.json({ error: "Supplier not found or no changes made" }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      id: Number(id),
      name: body.name,
      contact_info: body.contact_info || null,
    })
  } catch (error) {
    console.error("Error updating supplier:", error)
    return NextResponse.json({ error: "Failed to update supplier" }, { status: 500 })
  }
}

// DELETE a supplier
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Check if user is admin
    const admin = await isAdmin()

    if (!admin) {
      return NextResponse.json({ error: "Unauthorized. Admin access required." }, { status: 403 })
    }

    const id = params.id

    // Check if supplier exists
    const checkQuery = "SELECT id FROM suppliers WHERE id = ?"
    const suppliers = await executeQuery<any[]>({ query: checkQuery, values: [id] })

    if (suppliers.length === 0) {
      return NextResponse.json({ error: "Supplier not found" }, { status: 404 })
    }

    // Check if supplier is in use
    const usageQuery = "SELECT COUNT(*) as count FROM products WHERE supplier_id = ?"
    const usage = await executeQuery<any[]>({ query: usageQuery, values: [id] })

    if (usage[0].count > 0) {
      return NextResponse.json(
        {
          error: "Cannot delete supplier that is in use. Remove the supplier from all products first.",
        },
        { status: 400 },
      )
    }

    // Delete the supplier
    const deleteQuery = "DELETE FROM suppliers WHERE id = ?"
    await executeQuery({ query: deleteQuery, values: [id] })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting supplier:", error)
    return NextResponse.json({ error: "Failed to delete supplier" }, { status: 500 })
  }
}
