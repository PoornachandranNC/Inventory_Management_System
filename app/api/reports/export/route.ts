import { type NextRequest, NextResponse } from "next/server"
import { executeQuery } from "@/lib/db"
import { getCurrentUser } from "@/lib/auth-server"

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get products data
    const productsQuery = `
      SELECT p.id, p.name, p.description, p.quantity, p.price, 
             c.name as category_name, 
             s.name as supplier_name
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN suppliers s ON p.supplier_id = s.id
      ORDER BY p.name
    `
    const products = await executeQuery<any[]>({ query: productsQuery })

    // Get sales data
    const salesQuery = `
      SELECT s.id, c.name as customer_name, s.sale_date, 
             COUNT(si.id) as items_count, 
             SUM(si.quantity * si.price) as total_amount
      FROM sales s
      JOIN customers c ON s.customer_id = c.id
      JOIN sale_items si ON s.id = si.sale_id
      GROUP BY s.id
      ORDER BY s.sale_date DESC
    `
    const sales = await executeQuery<any[]>({ query: salesQuery })

    // Get purchases data
    const purchasesQuery = `
      SELECT p.id, s.name as supplier_name, p.purchase_date, 
             COUNT(pi.id) as items_count, 
             SUM(pi.quantity * pi.price) as total_amount
      FROM purchases p
      JOIN suppliers s ON p.supplier_id = s.id
      JOIN purchase_items pi ON p.id = pi.purchase_id
      GROUP BY p.id
      ORDER BY p.purchase_date DESC
    `
    const purchases = await executeQuery<any[]>({ query: purchasesQuery })

    // Prepare CSV data
    const productsCSV = generateCSV(products, [
      { header: "ID", key: "id" },
      { header: "Name", key: "name" },
      { header: "Description", key: "description" },
      { header: "Category", key: "category_name" },
      { header: "Supplier", key: "supplier_name" },
      { header: "Quantity", key: "quantity" },
      { header: "Price", key: "price" },
    ])

    const salesCSV = generateCSV(sales, [
      { header: "ID", key: "id" },
      { header: "Customer", key: "customer_name" },
      { header: "Date", key: "sale_date" },
      { header: "Items Count", key: "items_count" },
      { header: "Total Amount", key: "total_amount" },
    ])

    const purchasesCSV = generateCSV(purchases, [
      { header: "ID", key: "id" },
      { header: "Supplier", key: "supplier_name" },
      { header: "Date", key: "purchase_date" },
      { header: "Items Count", key: "items_count" },
      { header: "Total Amount", key: "total_amount" },
    ])

    // Create a simple HTML page with download links
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Inventory Management System - Export Data</title>
        <style>
          body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
          h1 { color: #333; }
          .card { border: 1px solid #ddd; border-radius: 8px; padding: 20px; margin-bottom: 20px; }
          .btn { display: inline-block; background-color: #0070f3; color: white; padding: 10px 15px; 
                 text-decoration: none; border-radius: 5px; margin-right: 10px; }
          .btn:hover { background-color: #0051a2; }
          p { color: #666; }
        </style>
      </head>
      <body>
        <h1>Inventory Management System - Export Data</h1>
        <p>Click on the links below to download your data:</p>
        
        <div class="card">
          <h2>Products</h2>
          <p>${products.length} products found</p>
          <a href="data:text/csv;charset=utf-8,${encodeURIComponent(productsCSV)}" 
             download="products.csv" class="btn">Download CSV</a>
        </div>
        
        <div class="card">
          <h2>Sales</h2>
          <p>${sales.length} sales records found</p>
          <a href="data:text/csv;charset=utf-8,${encodeURIComponent(salesCSV)}" 
             download="sales.csv" class="btn">Download CSV</a>
        </div>
        
        <div class="card">
          <h2>Purchases</h2>
          <p>${purchases.length} purchase records found</p>
          <a href="data:text/csv;charset=utf-8,${encodeURIComponent(purchasesCSV)}" 
             download="purchases.csv" class="btn">Download CSV</a>
        </div>
        
        <p><a href="/reports">← Back to Reports</a></p>
      </body>
      </html>
    `

    return new NextResponse(html, {
      headers: {
        "Content-Type": "text/html",
      },
    })
  } catch (error) {
    console.error("Error exporting data:", error)
    return NextResponse.json({ error: "Failed to export data" }, { status: 500 })
  }
}

// Helper function to generate CSV
function generateCSV(data: any[], columns: { header: string; key: string }[]): string {
  // Create header row
  const headers = columns.map((col) => `"${col.header}"`).join(",")

  // Create data rows
  const rows = data.map((item) => {
    return columns
      .map((col) => {
        const value = item[col.key] !== null && item[col.key] !== undefined ? item[col.key] : ""
        return `"${value}"`
      })
      .join(",")
  })

  // Combine header and rows
  return [headers, ...rows].join("\n")
}
