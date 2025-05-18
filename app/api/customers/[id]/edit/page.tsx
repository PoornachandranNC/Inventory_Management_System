"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { Header } from "@/components/layout/header"
import { Sidebar } from "@/components/layout/sidebar"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"

interface Customer {
  id: number
  name: string
  contact_info: string | null
}

export default function EditCustomerPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(true)
  const [user, setUser] = useState(null)
  const [formData, setFormData] = useState<Customer>({
    id: 0,
    name: "",
    contact_info: "",
  })

  // Fetch user and customer on component mount
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

        // Check if user is admin
        if (userData.user.role !== "admin") {
          toast({
            title: "Access Denied",
            description: "Only administrators can edit customers",
            variant: "destructive",
          })
          router.push("/customers")
          return
        }

        setUser(userData.user)

        // Fetch customer data
        const customerRes = await fetch(`/api/customers/${params.id}`)
        if (!customerRes.ok) {
          throw new Error("Customer not found")
        }
        const customerData = await customerRes.json()

        setFormData(customerData)
        setIsLoading(false)
      } catch (error) {
        console.error("Error fetching data:", error)
        toast({
          title: "Error",
          description: "Failed to load data",
          variant: "destructive",
        })
        router.push("/customers")
      }
    }

    fetchData()
  }, [params.id])

  const handleChange = (e) => {
    const { name, value } = e.target
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
        throw new Error("Customer name is required")
      }

      const response = await fetch(`/api/customers/${params.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: "Customer updated successfully",
        })
        router.push(`/customers/${params.id}`)
        router.refresh()
      } else {
        const data = await response.json()
        throw new Error(data.error || "Failed to update customer")
      }
    } catch (error) {
      console.error("Error updating customer:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to update customer",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // If user data is still loading or not available, show loading state
  if (!user || isLoading) {
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
            <div className="flex items-center mb-4">
              <Link href={`/customers/${params.id}`}>
                <Button variant="ghost" size="sm" className="mr-2">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Customer
                </Button>
              </Link>
            </div>
            <h2 className="text-3xl font-bold tracking-tight">Edit Customer</h2>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Customer Information</CardTitle>
            </CardHeader>
            <form onSubmit={handleSubmit}>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Customer Name</Label>
                  <Input id="name" name="name" value={formData.name} onChange={handleChange} required />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="contact_info">Contact Information</Label>
                  <Textarea
                    id="contact_info"
                    name="contact_info"
                    value={formData.contact_info || ""}
                    onChange={handleChange}
                    placeholder="Phone, email, address, etc."
                    rows={3}
                  />
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button variant="outline" type="button" onClick={() => router.back()}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? "Saving..." : "Save Changes"}
                </Button>
              </CardFooter>
            </form>
          </Card>
        </main>
      </div>
    </div>
  )
}
