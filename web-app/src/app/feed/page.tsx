"use client"

import { useState, useEffect, useRef } from "react"
import { PredictionCard } from "@/components/PredictionCard"
import { Button } from "@/components/ui/button"
import { Trophy, Plus, User } from "lucide-react"
import Link from "next/link"

// Mock data - replace with actual API calls
const mockMarkets = [
  {
    marketId: 1,
    question: "Will LeBron score 40+ points tonight vs Celtics?",
    closeTime: Date.now() / 1000 + 14400, // 4 hours from now
    minStake: "1.0",
    totalYesVolume: "125.5",
    totalNoVolume: "89.3",
    creator: "0x1234567890abcdef",
    mediaUrl: "https://images.unsplash.com/photo-1546519638-68e109498ffc?w=800",
  },
  {
    marketId: 2,
    question: "Will Steph Curry hit 8+ three-pointers this game?",
    closeTime: Date.now() / 1000 + 7200,
    minStake: "0.5",
    totalYesVolume: "67.2",
    totalNoVolume: "103.8",
    creator: "0xabcdef1234567890",
    mediaUrl: "https://images.unsplash.com/photo-1608245449230-4ac19066d2d0?w=800",
  },
  {
    marketId: 3,
    question: "Will the Lakers win by 10+ points?",
    closeTime: Date.now() / 1000 + 10800,
    minStake: "2.0",
    totalYesVolume: "234.7",
    totalNoVolume: "198.4",
    creator: "0x9876543210fedcba",
    mediaUrl: "https://images.unsplash.com/photo-1504450758481-7338eba7524a?w=800",
  },
]

export default function FeedPage() {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [touchStart, setTouchStart] = useState(0)
  const [touchEnd, setTouchEnd] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)

  const totalVolume = mockMarkets.reduce(
    (sum, m) => sum + parseFloat(m.totalYesVolume) + parseFloat(m.totalNoVolume),
    0
  )

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.targetTouches[0].clientX)
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX)
  }

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return
    
    const distance = touchStart - touchEnd
    const isLeftSwipe = distance > 50
    const isRightSwipe = distance < -50

    if (isLeftSwipe && currentIndex < mockMarkets.length - 1) {
      setCurrentIndex(currentIndex + 1)
    }
    if (isRightSwipe && currentIndex > 0) {
      setCurrentIndex(currentIndex - 1)
    }

    setTouchStart(0)
    setTouchEnd(0)
  }

  const handleNext = () => {
    if (currentIndex < mockMarkets.length - 1) {
      setCurrentIndex(currentIndex + 1)
    }
  }

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1)
    }
  }

  const currentMarket = mockMarkets[currentIndex]

  return (
    <div className="bg-gradient-to-b from-[#FFFEE8] to-[#F6FCE5]">
      {/* Mobile-first layout */}
      <div className="max-w-7xl mx-auto">
        {/* Header - Mobile optimized */}
        <div className="p-4 md:p-6">
          <p className="text-sm text-gray-600 font-medium mb-1">Swipe through markets and place your bets</p>
        </div>

        <div className="grid lg:grid-cols-[300px_1fr] gap-6 px-4 md:px-6">
          {/* Left Sidebar - Stats */}
          <div className="hidden lg:block space-y-4">
            <div className="dual-block-card p-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-[#a4ff31] flex items-center justify-center neon-glow">
                  <Trophy className="h-5 w-5 text-black" />
                </div>
                <div>
                  <p className="text-xs text-gray-600 font-semibold">Active Markets</p>
                  <p className="text-2xl font-black text-gray-900">{mockMarkets.length}</p>
                </div>
              </div>
            </div>

            <div className="dual-block-card p-6">
              <p className="text-xs text-gray-600 font-semibold mb-1">Total Volume</p>
              <p className="text-2xl font-black text-[#a4ff31]">{totalVolume.toFixed(1)} FLOW</p>
            </div>

            <div className="dual-block-card p-6">
              <p className="text-xs text-gray-600 font-semibold mb-1">Your Position</p>
              <p className="text-xl font-bold text-gray-900">{currentIndex + 1} / {mockMarkets.length}</p>
            </div>

            {/* Quick Actions */}
            <div className="dual-block-card p-6">
              <h3 className="font-bold text-gray-900 mb-3 text-sm">Quick Actions</h3>
              <div className="space-y-2">
                <Link href="/create">
                  <Button className="w-full bg-[#a4ff31] hover:bg-[#b8ff52] text-black font-bold text-sm neon-glow">
                    <Plus className="mr-2 h-4 w-4" />
                    Create Market
                  </Button>
                </Link>
                <Link href="/profile">
                  <Button variant="outline" className="w-full border border-gray-800 hover:border-[#a4ff31] hover:bg-[#e8ffe0] font-bold text-sm">
                    <User className="mr-2 h-4 w-4" />
                    View Profile
                  </Button>
                </Link>
              </div>
            </div>
          </div>

          {/* Main Card Area - Swipeable */}
          <div className="pb-10 lg:pb-6">
            <div
              ref={containerRef}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
              className="relative"
            >
              <PredictionCard {...currentMarket} />
            </div>

            {/* Navigation - Desktop & Mobile */}
            <div className="mt-6 flex justify-center items-center gap-4">
              <Button
                onClick={handlePrevious}
                disabled={currentIndex === 0}
                variant="outline"
                className="border border-gray-800 hover:border-[#a4ff31] hover:bg-[#e8ffe0] disabled:opacity-30 font-bold"
              >
                Previous
              </Button>

              {/* Progress Dots */}
              <div className="flex gap-2">
                {mockMarkets.map((_, idx) => (
                  <div
                    key={idx}
                    className={`h-2 transition-all duration-300 cursor-pointer ${
                      idx === currentIndex
                        ? "w-8 bg-[#a4ff31] shadow-lg"
                        : "w-2 bg-gray-300 hover:bg-gray-400"
                    }`}
                    onClick={() => setCurrentIndex(idx)}
                  />
                ))}
              </div>

              <Button
                onClick={handleNext}
                disabled={currentIndex === mockMarkets.length - 1}
                className="bg-[#a4ff31] hover:bg-[#b8ff52] text-black disabled:opacity-30 font-bold neon-glow"
              >
                Next
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
