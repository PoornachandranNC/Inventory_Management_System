"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { Header } from "@/components/layout/header"
import { Sidebar } from "@/components/layout/sidebar"

export default function AddProductPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [categories, setCategories] = useState([])
  const [suppliers, setSuppliers] = useState([])
  const [user, setUser] = useState(null)
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    category_id: "",
    supplier_id: "",
    quantity: "0",
    price: "0.00",
  })

  // Fetch user, categories and suppliers on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch user first
        const userRes = await fetch("/api/auth/me")
        const userData = await userRes.json()

        if (!userData.user) {
          // If not authenticated, redirect to login
          router.push("/login")
          return
        }

        setUser(userData.user)

        // Then fetch categories and suppliers
        const [categoriesRes, suppliersRes] = await Promise.all([fetch("/api/categories"), fetch("/api/suppliers")])

        const categoriesData = await categoriesRes.json()
        const suppliersData = await suppliersRes.json()

        setCategories(categoriesData)
        setSuppliers(suppliersData)
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

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSelectChange = (name, value) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      // Validate form data
      if (!formData.name) {
        throw new Error("Product name is required")
      }

      if (isNaN(Number.parseFloat(formData.price)) || Number.parseFloat(formData.price) < 0) {
        throw new Error("Price must be a valid number")
      }

      if (isNaN(Number.parseInt(formData.quantity)) || Number.parseInt(formData.quantity) < 0) {
        throw new Error("Quantity must be a valid number")
      }

      console.log("Submitting product data:", formData)

      const response = await fetch("/api/products", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      })

      const data = await response.json()
      console.log("API response:", data)

      if (response.ok) {
        toast({
          title: "Success",
          description: "Product added successfully",
        })
        router.push("/products")
        router.refresh()
      } else {
        throw new Error(data.error || data.details || "Failed to add product")
      }
    } catch (error) {
      console.error("Error adding product:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to add product",
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
            <h2 className="text-3xl font-bold tracking-tight">Add New Product</h2>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Product Information</CardTitle>
            </CardHeader>
            <form onSubmit={handleSubmit}>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Product Name</Label>
                  <Input id="name" name="name" value={formData.name} onChange={handleChange} required />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="category">Category</Label>
                    <Select
                      value={formData.category_id}
                      onValueChange={(value) => handleSelectChange("category_id", value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((category) => (
                          <SelectItem key={category.id} value={category.id.toString()}>
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="supplier">Supplier</Label>
                    <Select
                      value={formData.supplier_id}
                      onValueChange={(value) => handleSelectChange("supplier_id", value)}
                    >
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
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="quantity">Quantity</Label>
                    <Input
                      id="quantity"
                      name="quantity"
                      type="number"
                      min="0"
                      value={formData.quantity}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="price">Price</Label>
                    <Input
                      id="price"
                      name="price"
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.price}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button variant="outline" type="button" onClick={() => router.back()}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? "Adding..." : "Add Product"}
                </Button>
              </CardFooter>
            </form>
          </Card>
        </main>
      </div>
    </div>
  )
}
