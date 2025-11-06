"use client"

import { usePathname } from "next/navigation"
import Sidebar from "@/components/navigation/sidebar"
import { AuthButton } from "@/components/AuthButton"

export function ConditionalLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isLandingPage = pathname === "/"

  if (isLandingPage) {
    return <>{children}</>
  }

  return (
    <div className="flex border border-gray-400 shadow-lg min-h-screen m-3 md:m-6">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="border-b border-gray-400 bg-white p-4 flex justify-end items-center">
          <AuthButton />
        </header>
        
        {/* Main Content */}
        <main className="flex-1 overflow-y-auto border-l border-gray-400 bg-gradient-to-b from-[#FFFEE8] to-[#F6FCE5]">
          {children}
        </main>
      </div>
    </div>
  )
}
