import { type NextRequest, NextResponse } from "next/server"
import { executeQuery, insertRow } from "@/lib/db"
import { isAdmin } from "@/lib/auth-server"

// GET all customers
export async function GET() {
  try {
    const query = "SELECT * FROM customers ORDER BY id ASC"
    const customers = await executeQuery({ query })
    return NextResponse.json(customers)
  } catch (error) {
    console.error("Error fetching customers:", error)
    return NextResponse.json({ error: "Failed to fetch customers" }, { status: 500 })
  }
}

// POST new customer
export async function POST(request: NextRequest) {
  try {
    // Check if user is admin
    const admin = await isAdmin()

    if (!admin) {
      return NextResponse.json({ error: "Unauthorized. Admin access required." }, { status: 403 })
    }

    const { name, contact_info } = await request.json()

    if (!name) {
      return NextResponse.json({ error: "Customer name is required" }, { status: 400 })
    }

    const customerId = await insertRow({
      table: "customers",
      data: {
        name,
        contact_info: contact_info || null,
      },
    })

    return NextResponse.json({
      id: customerId,
      name,
      contact_info: contact_info || null,
    })
  } catch (error) {
    console.error("Error creating customer:", error)
    return NextResponse.json({ error: "Failed to create customer" }, { status: 500 })
  }
}
