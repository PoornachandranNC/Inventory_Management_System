"use client"

import { useState } from "react"
import { Bell, Menu, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Sidebar } from "./sidebar"

interface HeaderProps {
  username?: string
  userRole?: "admin" | "staff"
}

export function Header({ username = "User", userRole = "staff" }: HeaderProps) {
  const [isSearchOpen, setIsSearchOpen] = useState(false)

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-14 items-center px-4">
        <div className="md:hidden">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" className="mr-2">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle Menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0">
              <Sidebar userRole={userRole} />
            </SheetContent>
          </Sheet>
        </div>

        <div className="flex w-full items-center gap-2">
          <div className="hidden md:block font-semibold">Inventory Management System</div>

          {isSearchOpen ? (
            <div className="flex-1 md:flex-initial md:w-2/3 lg:w-1/3 ml-auto">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search..."
                  className="w-full pl-8"
                  onBlur={() => setIsSearchOpen(false)}
                  autoFocus
                />
              </div>
            </div>
          ) : (
            <Button variant="outline" size="icon" className="ml-auto" onClick={() => setIsSearchOpen(true)}>
              <Search className="h-4 w-4" />
              <span className="sr-only">Search</span>
            </Button>
          )}

          <Button variant="outline" size="icon">
            <Bell className="h-4 w-4" />
            <span className="sr-only">Notifications</span>
          </Button>

          <div className="ml-2">
            <div className="text-sm font-medium">{username}</div>
            <div className="text-xs text-muted-foreground capitalize">{userRole}</div>
          </div>
        </div>
      </div>
    </header>
  )
}
