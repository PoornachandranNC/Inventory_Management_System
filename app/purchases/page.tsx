import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { executeQuery } from "@/lib/db"
import { Plus } from "lucide-react"
import Link from "next/link"

interface Purchase {
  id: number
  supplier_name: string
  purchase_date: string
  total_amount: number
  items_count: number
}

async function getPurchases() {
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

    return await executeQuery<Purchase[]>({ query })
  } catch (error) {
    console.error("Error fetching purchases:", error)
    return []
  }
}

export default async function PurchasesPage() {
  const purchases = await getPurchases()

  return (
    <DashboardLayout>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-3xl font-bold tracking-tight">Purchases</h2>
        <Link href="/purchases/add">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            New Purchase
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Purchase History</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Supplier</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Items</TableHead>
                <TableHead className="text-right">Total Amount</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {purchases.length > 0 ? (
                purchases.map((purchase) => (
                  <TableRow key={purchase.id}>
                    <TableCell>#{purchase.id}</TableCell>
                    <TableCell>{purchase.supplier_name}</TableCell>
                    <TableCell>{new Date(purchase.purchase_date).toLocaleDateString()}</TableCell>
                    <TableCell>{purchase.items_count}</TableCell>
                    <TableCell className="text-right">${purchase.total_amount.toFixed(2)}</TableCell>
                    <TableCell className="text-right">
                      <Link href={`/purchases/${purchase.id}`}>
                        <Button variant="ghost" size="sm">
                          View
                        </Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-4">
                    No purchase records found. Create your first purchase to get started.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </DashboardLayout>
  )
}
