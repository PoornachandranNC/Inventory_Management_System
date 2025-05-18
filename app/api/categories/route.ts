import { type NextRequest, NextResponse } from "next/server"
import { executeQuery, insertRow } from "@/lib/db"
import { isAdmin } from "@/lib/auth-server"

// GET all categories
export async function GET() {
  try {
    const query = "SELECT * FROM categories ORDER BY id ASC"
    const categories = await executeQuery({ query })
    return NextResponse.json(categories)
  } catch (error) {
    console.error("Error fetching categories:", error)
    return NextResponse.json({ error: "Failed to fetch categories" }, { status: 500 })
  }
}

// POST new category
export async function POST(request: NextRequest) {
  try {
    // Check if user is admin
    const admin = await isAdmin()

    if (!admin) {
      return NextResponse.json({ error: "Unauthorized. Admin access required." }, { status: 403 })
    }

    const { name } = await request.json()

    if (!name) {
      return NextResponse.json({ error: "Category name is required" }, { status: 400 })
    }

    const categoryId = await insertRow({
      table: "categories",
      data: { name },
    })

    return NextResponse.json({ id: categoryId, name })
  } catch (error) {
    console.error("Error creating category:", error)
    return NextResponse.json({ error: "Failed to create category" }, { status: 500 })
  }
}
