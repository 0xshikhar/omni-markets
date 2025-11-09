"use client"

import React, { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { Home, TrendingUp, PlusSquare, User, Menu, X } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { SidebarFooter } from "@/components/navigation/sidebar-footer"

interface SidebarLink {
  label: string
  href: string
  icon: React.ElementType
  isComingSoon?: boolean
}

const navigation: SidebarLink[] = [
  {
    label: "Home",
    href: "/",
    icon: Home,
  },
  {
    label: "Feed",
    href: "/feed",
    icon: TrendingUp,
  },
  {
    label: "Create",
    href: "/create",
    icon: PlusSquare,
  },
  {
    label: "Profile",
    href: "/profile",
    icon: User,
  },
]

export default function Sidebar() {
  const pathname = usePathname()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen)
  }

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        className="md:hidden fixed top-4 left-4 z-50 p-2 bg-white border border-gray-400 shadow-lg"
        onClick={toggleMobileMenu}
      >
        {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Sidebar Container */}
      <aside
        className={cn(
          "fixed top-0 left-0 z-40 h-screen transition-transform duration-300 ease-in-out bg-white border-r border-gray-400",
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full",
          "md:translate-x-0 md:w-64 md:static md:h-full md:transform-none"
        )}
      >
        <div className="flex w-64 flex-col bg-white border-r border-gray-400 h-full">
          <div className="p-6">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2 mb-8">
              <div className="w-10 h-10 bg-[#a4ff31] flex items-center justify-center neon-glow">
                <span className="text-black text-2xl font-bold">M</span>
              </div>
              <div>
                <div className="text-xl font-bold text-foreground">OmniMarkets</div>
                <div className="text-xs font-semibold text-[#a4ff31]">Predict & Win</div>
              </div>
            </Link>

            {/* Navigation */}
            <nav className="space-y-2">
              {navigation.map((item) => {
                const Icon = item.icon
                const isActive = pathname === item.href
                return (
                  <Link key={item.href} href={item.href}>
                    <Button
                      variant={isActive ? "secondary" : "ghost"}
                      className={cn(
                        "w-full justify-start font-semibold",
                        isActive
                          ? "bg-[#e8ffe0] text-black border border-[#a4ff31]"
                          : "hover:bg-gray-100"
                      )}
                    >
                      <Icon className="mr-2 h-5 w-5" />
                      {item.label}
                      {item.isComingSoon && (
                        <Badge variant="outline" className="ml-auto">
                          Soon
                        </Badge>
                      )}
                    </Button>
                  </Link>
                )
              })}
            </nav>
          </div>

          {/* Footer */}
          <div className="mt-auto">
            <SidebarFooter />
          </div>
        </div>
      </aside>

      {/* Overlay for mobile */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-30 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}
    </>
  )
}
