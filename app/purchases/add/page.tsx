"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useToast } from "@/hooks/use-toast"
import { Trash, Plus } from "lucide-react"
import { Header } from "@/components/layout/header"
import { Sidebar } from "@/components/layout/sidebar"

interface Supplier {
  id: number
  name: string
}

interface Product {
  id: number
  name: string
  price: number | string
  quantity: number
}

interface PurchaseItem {
  product_id: number
  product_name: string
  quantity: number
  price: number | string
  total: number
}

// Helper function to safely format price
function formatPrice(price: number | string): string {
  // Convert to number if it's a string
  const numPrice = typeof price === "string" ? Number.parseFloat(price) : price

  // Check if it's a valid number
  if (isNaN(numPrice)) {
    return "$0.00"
  }

  // Format the number
  return `$${numPrice.toFixed(2)}`
}

export default function AddPurchasePage() {
  const router = useRouter()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [selectedSupplier, setSelectedSupplier] = useState("")
  const [selectedProduct, setSelectedProduct] = useState("")
  const [purchaseDate, setPurchaseDate] = useState(new Date().toISOString().split("T")[0])
  const [quantity, setQuantity] = useState(1)
  const [price, setPrice] = useState(0)
  const [purchaseItems, setPurchaseItems] = useState<PurchaseItem[]>([])
  const [total, setTotal] = useState(0)
  const [user, setUser] = useState(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch user first
        const userRes = await fetch("/api/auth/me")
        const userData = await userRes.json()

        if (!userData.user) {
          router.push("/login")
          return
        }

        setUser(userData.user)

        // Then fetch suppliers and products
        const [suppliersRes, productsRes] = await Promise.all([fetch("/api/suppliers"), fetch("/api/products")])

        const suppliersData = await suppliersRes.json()
        const productsData = await productsRes.json()

        setSuppliers(suppliersData)
        setProducts(productsData)
      } catch (error) {
        console.error("Error fetching data:", error)
        toast({
          title: "Error",
          description: "Failed to load data",
          variant: "destructive",
        })
      }
    }

    fetchData()
  }, [])

  useEffect(() => {
    // Calculate total whenever purchase items change
    const newTotal = purchaseItems.reduce((sum, item) => {
      const itemPrice = typeof item.price === "string" ? Number.parseFloat(item.price) : item.price
      return sum + item.quantity * itemPrice
    }, 0)
    setTotal(newTotal)
  }, [purchaseItems])

  // Set default price when product is selected
  useEffect(() => {
    if (selectedProduct) {
      const product = products.find((p) => p.id.toString() === selectedProduct)
      if (product) {
        const productPrice = typeof product.price === "string" ? Number.parseFloat(product.price) : product.price
        setPrice(productPrice)
      }
    } else {
      setPrice(0)
    }
  }, [selectedProduct, products])

  const handleAddItem = () => {
    if (!selectedProduct || quantity <= 0 || price <= 0) {
      toast({
        title: "Error",
        description: "Please select a product and enter valid quantity and price",
        variant: "destructive",
      })
      return
    }

    const product = products.find((p) => p.id.toString() === selectedProduct)
    if (!product) return

    // Check if product already exists in purchase items
    const existingItemIndex = purchaseItems.findIndex((item) => item.product_id.toString() === selectedProduct)

    if (existingItemIndex >= 0) {
      // Update existing item
      const updatedItems = [...purchaseItems]
      updatedItems[existingItemIndex].quantity += quantity
      updatedItems[existingItemIndex].price = price
      updatedItems[existingItemIndex].total = updatedItems[existingItemIndex].quantity * Number(price)
      setPurchaseItems(updatedItems)
    } else {
      // Add new item
      const newItem: PurchaseItem = {
        product_id: product.id,
        product_name: product.name,
        quantity: quantity,
        price: price,
        total: quantity * Number(price),
      }
      setPurchaseItems([...purchaseItems, newItem])
    }

    // Reset selection
    setSelectedProduct("")
    setQuantity(1)
    setPrice(0)
  }

  const handleRemoveItem = (index: number) => {
    const updatedItems = [...purchaseItems]
    updatedItems.splice(index, 1)
    setPurchaseItems(updatedItems)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    if (!selectedSupplier) {
      toast({
        title: "Error",
        description: "Please select a supplier",
        variant: "destructive",
      })
      setIsLoading(false)
      return
    }

    if (purchaseItems.length === 0) {
      toast({
        title: "Error",
        description: "Please add at least one product",
        variant: "destructive",
      })
      setIsLoading(false)
      return
    }

    try {
      const purchaseData = {
        supplier_id: Number(selectedSupplier),
        purchase_date: purchaseDate,
        items: purchaseItems.map((item) => ({
          ...item,
          product_id: Number(item.product_id),
          quantity: Number(item.quantity),
          price: typeof item.price === "string" ? Number.parseFloat(item.price) : item.price,
        })),
      }

      console.log("Submitting purchase data:", purchaseData)

      const response = await fetch("/api/purchases", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(purchaseData),
      })

      const responseData = await response.json()
      console.log("Response from server:", responseData)

      if (response.ok) {
        toast({
          title: "Success",
          description: "Purchase recorded successfully",
        })
        router.push("/purchases")
        router.refresh()
      } else {
        throw new Error(responseData.message || responseData.error || "Failed to record purchase")
      }
    } catch (error) {
      console.error("Error recording purchase:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to record purchase",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // If user data is still loading or not available, show loading state
  if (!user) {
    return <div>Loading...</div>
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header username={user.username} userRole={user.role} />
      <div className="flex flex-1">
        <aside className="hidden w-64 md:block border-r">
          <Sidebar userRole={user.role} />
        </aside>
        <main className="flex-1 p-6 pt-3">
          <div className="mb-6">
            <h2 className="text-3xl font-bold tracking-tight">Record New Purchase</h2>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Purchase Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="supplier">Supplier</Label>
                  <Select value={selectedSupplier} onValueChange={setSelectedSupplier}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select supplier" />
                    </SelectTrigger>
                    <SelectContent>
                      {suppliers.map((supplier) => (
                        <SelectItem key={supplier.id} value={supplier.id.toString()}>
                          {supplier.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="date">Purchase Date</Label>
                  <Input id="date" type="date" value={purchaseDate} onChange={(e) => setPurchaseDate(e.target.value)} />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Add Products</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="product">Product</Label>
                  <Select value={selectedProduct} onValueChange={setSelectedProduct}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select product" />
                    </SelectTrigger>
                    <SelectContent>
                      {products.map((product) => (
                        <SelectItem key={product.id} value={product.id.toString()}>
                          {product.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="quantity">Quantity</Label>
                    <Input
                      id="quantity"
                      type="number"
                      min="1"
                      value={quantity}
                      onChange={(e) => setQuantity(Number.parseInt(e.target.value) || 0)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="price">Unit Price</Label>
                    <Input
                      id="price"
                      type="number"
                      step="0.01"
                      min="0"
                      value={price}
                      onChange={(e) => setPrice(Number.parseFloat(e.target.value) || 0)}
                    />
                  </div>
                </div>

                <Button type="button" onClick={handleAddItem} className="w-full">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Item
                </Button>
              </CardContent>
            </Card>
          </div>

          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Purchase Items</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead className="text-right">Price</TableHead>
                    <TableHead className="text-right">Quantity</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {purchaseItems.length > 0 ? (
                    purchaseItems.map((item, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">{item.product_name}</TableCell>
                        <TableCell className="text-right">{formatPrice(item.price)}</TableCell>
                        <TableCell className="text-right">{item.quantity}</TableCell>
                        <TableCell className="text-right">{formatPrice(item.total)}</TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="sm" onClick={() => handleRemoveItem(index)}>
                            <Trash className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-4">
                        No items added yet. Add products to continue.
                      </TableCell>
                    </TableRow>
                  )}
                  {purchaseItems.length > 0 && (
                    <TableRow>
                      <TableCell colSpan={3} className="font-bold text-right">
                        Total:
                      </TableCell>
                      <TableCell className="font-bold text-right">{formatPrice(total)}</TableCell>
                      <TableCell></TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline" type="button" onClick={() => router.back()}>
                Cancel
              </Button>
              <Button type="button" disabled={isLoading || purchaseItems.length === 0} onClick={handleSubmit}>
                {isLoading ? "Processing..." : "Complete Purchase"}
              </Button>
            </CardFooter>
          </Card>
        </main>
      </div>
    </div>
  )
}
