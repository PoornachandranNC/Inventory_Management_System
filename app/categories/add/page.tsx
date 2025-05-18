"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { Header } from "@/components/layout/header"
import { Sidebar } from "@/components/layout/sidebar"

export default function AddCategoryPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [user, setUser] = useState(null)

  // Fetch user on component mount
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const userRes = await fetch("/api/auth/me")
        const userData = await userRes.json()

        if (!userData.user) {
          router.push("/login")
          return
        }

        // Check if user is admin
        if (userData.user.role !== "admin") {
          toast({
            title: "Access Denied",
            description: "Only administrators can manage categories",
            variant: "destructive",
          })
          router.push("/dashboard")
          return
        }

        setUser(userData.user)
      } catch (error) {
        console.error("Error fetching user:", error)
        toast({
          title: "Error",
          description: "Failed to authenticate user",
          variant: "destructive",
        })
      }
    }

    fetchUser()
  }, [])

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)

    const formData = new FormData(e.currentTarget)
    const categoryData = {
      name: formData.get("name") as string,
    }

    try {
      const response = await fetch("/api/categories", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(categoryData),
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: "Category added successfully",
        })
        router.push("/categories")
        router.refresh()
      } else {
        const error = await response.json()
        throw new Error(error.message || "Failed to add category")
      }
    } catch (error) {
      console.error("Error adding category:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to add category",
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
            <h2 className="text-3xl font-bold tracking-tight">Add New Category</h2>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Category Information</CardTitle>
            </CardHeader>
            <form onSubmit={handleSubmit}>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Category Name</Label>
                  <Input id="name" name="name" required />
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button variant="outline" type="button" onClick={() => router.back()}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? "Adding..." : "Add Category"}
                </Button>
              </CardFooter>
            </form>
          </Card>
        </main>
      </div>
    </div>
  )
}
