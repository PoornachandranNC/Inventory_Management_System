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

interface Customer {
  id: number
  name: string
}

interface Product {
  id: number
  name: string
  price: number | string
  quantity: number
}

interface SaleItem {
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

export default function AddSalePage() {
  const router = useRouter()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [customers, setCustomers] = useState<Customer[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [selectedCustomer, setSelectedCustomer] = useState("")
  const [selectedProduct, setSelectedProduct] = useState("")
  const [saleDate, setSaleDate] = useState(new Date().toISOString().split("T")[0])
  const [quantity, setQuantity] = useState(1)
  const [saleItems, setSaleItems] = useState<SaleItem[]>([])
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

        // Then fetch customers and products
        const [customersRes, productsRes] = await Promise.all([fetch("/api/customers"), fetch("/api/products")])

        const customersData = await customersRes.json()
        const productsData = await productsRes.json()

        setCustomers(customersData)
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
    // Calculate total whenever sale items change
    const newTotal = saleItems.reduce((sum, item) => {
      const itemPrice = typeof item.price === "string" ? Number.parseFloat(item.price) : item.price
      return sum + item.quantity * itemPrice
    }, 0)
    setTotal(newTotal)
  }, [saleItems])

  const handleAddItem = () => {
    if (!selectedProduct || quantity <= 0) {
      toast({
        title: "Error",
        description: "Please select a product and enter a valid quantity",
        variant: "destructive",
      })
      return
    }

    const product = products.find((p) => p.id.toString() === selectedProduct)
    if (!product) return

    if (quantity > product.quantity) {
      toast({
        title: "Error",
        description: `Only ${product.quantity} units available in stock`,
        variant: "destructive",
      })
      return
    }

    // Check if product already exists in sale items
    const existingItemIndex = saleItems.findIndex((item) => item.product_id.toString() === selectedProduct)
    const productPrice = typeof product.price === "string" ? Number.parseFloat(product.price) : product.price

    if (existingItemIndex >= 0) {
      // Update existing item
      const updatedItems = [...saleItems]
      const newQuantity = updatedItems[existingItemIndex].quantity + quantity

      if (newQuantity > product.quantity) {
        toast({
          title: "Error",
          description: `Only ${product.quantity} units available in stock`,
          variant: "destructive",
        })
        return
      }

      updatedItems[existingItemIndex].quantity = newQuantity
      updatedItems[existingItemIndex].total = newQuantity * Number(updatedItems[existingItemIndex].price)
      setSaleItems(updatedItems)
    } else {
      // Add new item
      const newItem: SaleItem = {
        product_id: product.id,
        product_name: product.name,
        quantity: quantity,
        price: productPrice,
        total: quantity * productPrice,
      }
      setSaleItems([...saleItems, newItem])
    }

    // Reset selection
    setSelectedProduct("")
    setQuantity(1)
  }

  const handleRemoveItem = (index: number) => {
    const updatedItems = [...saleItems]
    updatedItems.splice(index, 1)
    setSaleItems(updatedItems)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    if (!selectedCustomer) {
      toast({
        title: "Error",
        description: "Please select a customer",
        variant: "destructive",
      })
      setIsLoading(false)
      return
    }

    if (saleItems.length === 0) {
      toast({
        title: "Error",
        description: "Please add at least one product",
        variant: "destructive",
      })
      setIsLoading(false)
      return
    }

    try {
      const saleData = {
        customer_id: Number.parseInt(selectedCustomer),
        sale_date: saleDate,
        items: saleItems.map((item) => ({
          product_id: Number(item.product_id),
          quantity: Number(item.quantity),
          price: typeof item.price === "string" ? Number.parseFloat(item.price) : item.price,
        })),
      }

      console.log("Submitting sale data:", saleData)

      const response = await fetch("/api/sales", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(saleData),
      })

      const responseData = await response.json()
      console.log("Response from server:", responseData)

      if (response.ok) {
        toast({
          title: "Success",
          description: "Sale recorded successfully",
        })
        router.push("/sales")
        router.refresh()
      } else {
        throw new Error(responseData.message || responseData.error || "Failed to record sale")
      }
    } catch (error) {
      console.error("Error recording sale:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to record sale",
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
            <h2 className="text-3xl font-bold tracking-tight">Record New Sale</h2>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Sale Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="customer">Customer</Label>
                  <Select value={selectedCustomer} onValueChange={setSelectedCustomer}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select customer" />
                    </SelectTrigger>
                    <SelectContent>
                      {customers.map((customer) => (
                        <SelectItem key={customer.id} value={customer.id.toString()}>
                          {customer.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="date">Sale Date</Label>
                  <Input id="date" type="date" value={saleDate} onChange={(e) => setSaleDate(e.target.value)} />
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
                          {product.name} ({formatPrice(product.price)} - {product.quantity} in stock)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="quantity">Quantity</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="quantity"
                      type="number"
                      min="1"
                      value={quantity}
                      onChange={(e) => setQuantity(Number.parseInt(e.target.value) || 0)}
                    />
                    <Button type="button" onClick={handleAddItem}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Sale Items</CardTitle>
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
                  {saleItems.length > 0 ? (
                    saleItems.map((item, index) => (
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
                  {saleItems.length > 0 && (
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
              <Button type="button" disabled={isLoading || saleItems.length === 0} onClick={handleSubmit}>
                {isLoading ? "Processing..." : "Complete Sale"}
              </Button>
            </CardFooter>
          </Card>
        </main>
      </div>
    </div>
  )
}
