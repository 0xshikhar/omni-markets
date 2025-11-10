"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, TrendingUp, Wallet, Award, Loader2 } from "lucide-react"
import Link from "next/link"
import { useAccount } from "wagmi"
import { useClaimWinnings } from "@/hooks/useMarketAggregator"

interface BetSlip {
  id: string
  user: string
  totalStake: number
  expectedPayout: number
  status: "pending" | "settled" | "won" | "lost"
  createdAt: string
  markets: Array<{
    marketId: number
    amount: number
    outcome: number
    market: {
      question: string
      category: string
    }
  }>
}

export default function PortfolioPage() {
  const { isConnected, address } = useAccount()
  const { claimWinnings, isPending } = useClaimWinnings()
  const [bets, setBets] = useState<BetSlip[]>([])
  const [loading, setLoading] = useState(true)
  const [claimingId, setClaimingId] = useState<string | null>(null)

  useEffect(() => {
    if (!address) return

    async function loadBets() {
      try {
        const response = await fetch(`/api/bets/${address}`)
        const data = await response.json()
        setBets(data)
      } catch (error) {
        console.error("Failed to load bets:", error)
      } finally {
        setLoading(false)
      }
    }

    loadBets()
  }, [address])

  const handleClaim = async (betSlipId: string) => {
    if (!isConnected) {
      alert("Please connect your wallet")
      return
    }

    setClaimingId(betSlipId)
    try {
      const id = parseInt(betSlipId)
      await claimWinnings(id)
      // Refresh bets
      if (address) {
        const response = await fetch(`/api/bets/${address}`)
        const data = await response.json()
        setBets(data)
      }
    } catch (error) {
      console.error("Failed to claim:", error)
    } finally {
      setClaimingId(null)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-blue-100 text-blue-800"
      case "settled":
        return "bg-gray-100 text-gray-800"
      case "won":
        return "bg-green-100 text-green-800"
      case "lost":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const totalStaked = bets.reduce((sum, bet) => sum + bet.totalStake, 0)
  const totalWinnings = bets.filter(b => b.status === "won").reduce((sum, bet) => sum + bet.expectedPayout, 0)
  const totalLosses = bets.filter(b => b.status === "lost").reduce((sum, bet) => sum + bet.totalStake, 0)
  const roi = totalStaked > 0 ? ((totalWinnings - totalLosses) / totalStaked * 100).toFixed(2) : "0"

  if (!isConnected) {
    return (
      <div className="min-h-screen p-6 md:p-10 bg-gradient-to-b from-[#FFFEE8] to-[#F6FCE5] flex items-center justify-center">
        <Card className="dual-block-card p-12 text-center max-w-md">
          <Wallet className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-xl font-bold text-gray-900 mb-2">Connect Wallet</p>
          <p className="text-gray-600 mb-6">Connect your wallet to view your portfolio.</p>
          <Link href="/">
            <Button className="w-full bg-[#a4ff31] hover:bg-[#b8ff52] text-black font-bold">
              Go Home
            </Button>
          </Link>
        </Card>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#FFFEE8] to-[#F6FCE5] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#a4ff31]" />
      </div>
    )
  }

  return (
    <div className="min-h-screen p-6 md:p-10 bg-gradient-to-b from-[#FFFEE8] to-[#F6FCE5]">
      <main className="max-w-6xl mx-auto">
        <div className="mb-8 flex items-center gap-4">
          <Link href="/feed">
            <Button variant="outline" size="icon" className="border border-gray-400 hover:border-[#a4ff31] hover:bg-[#e8ffe0]">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-4xl font-black text-gray-900">Portfolio</h1>
            <p className="text-gray-600 font-medium">Your prediction history and earnings</p>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid md:grid-cols-4 gap-4 mb-8">
          <Card className="dual-block-card p-6">
            <p className="text-sm text-gray-600 mb-1">Total Staked</p>
            <p className="text-3xl font-black text-[#a4ff31]">{totalStaked.toFixed(2)} BNB</p>
          </Card>
          <Card className="dual-block-card p-6">
            <p className="text-sm text-gray-600 mb-1">Total Winnings</p>
            <p className="text-3xl font-black text-green-600">{totalWinnings.toFixed(2)} BNB</p>
          </Card>
          <Card className="dual-block-card p-6">
            <p className="text-sm text-gray-600 mb-1">Total Losses</p>
            <p className="text-3xl font-black text-red-600">{totalLosses.toFixed(2)} BNB</p>
          </Card>
          <Card className="dual-block-card p-6">
            <p className="text-sm text-gray-600 mb-1">ROI</p>
            <p className={`text-3xl font-black ${parseFloat(roi) >= 0 ? "text-green-600" : "text-red-600"}`}>
              {roi}%
            </p>
          </Card>
        </div>

        {/* Bets List */}
        {bets.length === 0 ? (
          <Card className="dual-block-card p-12 text-center">
            <TrendingUp className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-xl font-bold text-gray-900 mb-2">No Bets Yet</p>
            <p className="text-gray-600 mb-6">Start predicting to build your portfolio.</p>
            <Link href="/feed">
              <Button className="bg-[#a4ff31] hover:bg-[#b8ff52] text-black font-bold">
                Explore Markets
              </Button>
            </Link>
          </Card>
        ) : (
          <div className="space-y-4">
            {bets.map((bet) => (
              <Card key={bet.id} className="dual-block-card p-6 hover-lift">
                <div className="space-y-4">
                  {/* Header */}
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-gray-900 mb-2">
                        {bet.markets[0]?.market.question || "Multi-market bet"}
                      </h3>
                      <div className="flex items-center gap-2 flex-wrap">
                        {bet.markets.map((m, idx) => (
                          <Badge key={idx} className="bg-gray-100 text-gray-800 border border-gray-300 text-xs">
                            {m.market.category}
                          </Badge>
                        ))}
                        <Badge className={`${getStatusColor(bet.status)} border-0`}>
                          {bet.status.charAt(0).toUpperCase() + bet.status.slice(1)}
                        </Badge>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-600">Payout</p>
                      <p className="text-2xl font-black text-[#a4ff31]">{bet.expectedPayout.toFixed(2)} BNB</p>
                    </div>
                  </div>

                  {/* Bet Details */}
                  <div className="grid md:grid-cols-3 gap-4 text-sm">
                    <div className="bg-gray-50 p-3 rounded border border-gray-300">
                      <p className="text-gray-600 text-xs mb-1">Stake</p>
                      <p className="font-bold text-gray-900">{bet.totalStake.toFixed(2)} BNB</p>
                    </div>
                    <div className="bg-gray-50 p-3 rounded border border-gray-300">
                      <p className="text-gray-600 text-xs mb-1">Outcomes</p>
                      <p className="font-bold text-gray-900">
                        {bet.markets.map(m => m.outcome === 1 ? "YES" : "NO").join(", ")}
                      </p>
                    </div>
                    <div className="bg-gray-50 p-3 rounded border border-gray-300">
                      <p className="text-gray-600 text-xs mb-1">Date</p>
                      <p className="font-bold text-gray-900">{new Date(bet.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>

                  {/* Claim Button */}
                  {bet.status === "won" && (
                    <Button
                      onClick={() => handleClaim(bet.id)}
                      disabled={isPending || claimingId !== bet.id}
                      className="w-full bg-[#a4ff31] hover:bg-[#b8ff52] text-black font-bold"
                    >
                      {claimingId === bet.id && isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : (
                        <Award className="h-4 w-4 mr-2" />
                      )}
                      Claim Winnings
                    </Button>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
