"use client"

import type React from "react"
import { useSession } from "next-auth/react"
import { usePathname } from "next/navigation"
import Sidebar from "./sidebar"
import Header from "./header"
import { useState, useEffect } from "react"

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession()
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  // Close sidebar when route changes (mobile navigation)
  useEffect(() => {
    setSidebarOpen(false)
  }, [pathname])

  // Close sidebar when clicking outside on mobile
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setSidebarOpen(false)
      }
    }

    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [])

  if (!session || pathname.startsWith("/auth")) {
    return <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">{children}</div>
  }

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />

      {/* Main content area */}
      <div className="flex-1 flex flex-col min-w-0 lg:ml-0">
        <Header onMenuClick={() => setSidebarOpen(true)} />

        {/* Main content with mobile-optimized spacing */}
        <main className="flex-1 overflow-auto custom-scrollbar bg-gray-50">
          <div className="fade-in px-4 py-4 lg:px-6 lg:py-6">{children}</div>
        </main>
      </div>

      {/* Mobile overlay - improved */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden transition-opacity duration-300"
          onClick={() => setSidebarOpen(false)}
          onTouchStart={() => setSidebarOpen(false)}
        />
      )}
    </div>
  )
}
