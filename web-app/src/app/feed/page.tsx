"use client"

import { useState, useEffect, useRef } from "react"
import { PredictionCard } from "@/components/PredictionCard"
import { Button } from "@/components/ui/button"
import { Trophy, Plus, User, Loader2 } from "lucide-react"
import Link from "next/link"

interface Market {
  id: string;
  marketId: number;
  question: string;
  category: string;
  status: string;
  resolutionTime: string;
  totalVolume: number;
  creator: string;
  externalMarkets: Array<{
    price: number;
    liquidity: number;
  }>;
}

export default function FeedPage() {
  const [markets, setMarkets] = useState<Market[]>([])
  const [loading, setLoading] = useState(true)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [touchStart, setTouchStart] = useState(0)
  const [touchEnd, setTouchEnd] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)

  // Fetch markets on mount
  useEffect(() => {
    async function loadMarkets() {
      try {
        const response = await fetch('/api/markets?status=active&limit=20')
        const data = await response.json()
        setMarkets(data)
      } catch (error) {
        console.error('Failed to load markets:', error)
      } finally {
        setLoading(false)
      }
    }
    loadMarkets()
  }, [])

  const totalVolume = markets.reduce(
    (sum, m) => sum + Number(m.totalVolume),
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

    if (isLeftSwipe && currentIndex < markets.length - 1) {
      setCurrentIndex(currentIndex + 1)
    }
    if (isRightSwipe && currentIndex > 0) {
      setCurrentIndex(currentIndex - 1)
    }

    setTouchStart(0)
    setTouchEnd(0)
  }

  const handleNext = () => {
    if (currentIndex < markets.length - 1) {
      setCurrentIndex(currentIndex + 1)
    }
  }

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#FFFEE8] to-[#F6FCE5] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#a4ff31]" />
      </div>
    )
  }

  if (markets.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#FFFEE8] to-[#F6FCE5] flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl font-bold mb-4">No active markets found</p>
          <Link href="/create">
            <Button className="bg-[#a4ff31] hover:bg-[#b8ff52] text-black font-bold">
              Create First Market
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  const currentMarket = markets[currentIndex]
  const yesPrice = currentMarket.externalMarkets[0]?.price || 5000
  const totalYesVolume = (Number(currentMarket.totalVolume) * yesPrice / 10000).toFixed(2)
  const totalNoVolume = (Number(currentMarket.totalVolume) * (10000 - yesPrice) / 10000).toFixed(2)

  return (
    <div className="bg-gradient-to-b from-[#FFFEE8] to-[#F6FCE5]">
      {/* Mobile-first layout */}
      <div className="max-w-7xl mx-auto">
        {/* Header - Mobile optimized */}
        <div className="p-4 md:p-6">
          <p className="text-sm text-gray-600 font-medium mb-1">Explore aggregated markets from Polymarket and other sources</p>
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
                  <p className="text-2xl font-black text-gray-900">{markets.length}</p>
                </div>
              </div>
            </div>

            <div className="dual-block-card p-6">
              <p className="text-xs text-gray-600 font-semibold mb-1">Total Volume</p>
              <p className="text-2xl font-black text-[#a4ff31]">{totalVolume.toFixed(1)} BNB</p>
            </div>

            <div className="dual-block-card p-6">
              <p className="text-xs text-gray-600 font-semibold mb-1">Your Position</p>
              <p className="text-xl font-bold text-gray-900">{currentIndex + 1} / {markets.length}</p>
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
              <PredictionCard
                marketId={currentMarket.marketId}
                question={currentMarket.question}
                closeTime={new Date(currentMarket.resolutionTime).getTime() / 1000}
                minStake="0.01"
                totalYesVolume={totalYesVolume}
                totalNoVolume={totalNoVolume}
                creator={currentMarket.creator}
              />
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
                {markets.map((_, idx: number) => (
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
                disabled={currentIndex === markets.length - 1}
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
