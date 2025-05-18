import { type NextRequest, NextResponse } from "next/server"
import { executeQuery, insertRow } from "@/lib/db"
import { isAdmin } from "@/lib/auth-server"

// GET all suppliers
export async function GET() {
  try {
    const query = "SELECT * FROM suppliers ORDER BY id ASC"
    const suppliers = await executeQuery({ query })
    return NextResponse.json(suppliers)
  } catch (error) {
    console.error("Error fetching suppliers:", error)
    return NextResponse.json({ error: "Failed to fetch suppliers" }, { status: 500 })
  }
}

// POST new supplier
export async function POST(request: NextRequest) {
  try {
    // Check if user is admin
    const admin = await isAdmin()

    if (!admin) {
      return NextResponse.json({ error: "Unauthorized. Admin access required." }, { status: 403 })
    }

    const { name, contact_info } = await request.json()

    if (!name) {
      return NextResponse.json({ error: "Supplier name is required" }, { status: 400 })
    }

    const supplierId = await insertRow({
      table: "suppliers",
      data: {
        name,
        contact_info: contact_info || null,
      },
    })

    return NextResponse.json({
      id: supplierId,
      name,
      contact_info: contact_info || null,
    })
  } catch (error) {
    console.error("Error creating supplier:", error)
    return NextResponse.json({ error: "Failed to create supplier" }, { status: 500 })
  }
}
