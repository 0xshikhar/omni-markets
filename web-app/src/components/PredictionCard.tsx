"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ThumbsUp, ThumbsDown, Clock, Coins, TrendingUp, Users } from "lucide-react"
import { toast } from "sonner"
import { useAccount } from "wagmi"
import { useCreateBetSlip } from "@/hooks/useMarketAggregator"

interface PredictionCardProps {
  marketId: number
  question: string
  closeTime: number
  minStake: string
  totalYesVolume: string
  totalNoVolume: string
  mediaUrl?: string
  creator: string
}

export function PredictionCard({
  marketId,
  question,
  closeTime,
  minStake,
  totalYesVolume,
  totalNoVolume,
  mediaUrl,
  creator,
}: PredictionCardProps) {
  const [selectedOutcome, setSelectedOutcome] = useState<"yes" | "no" | null>(null)
  const [amount, setAmount] = useState(minStake)
  const { isConnected } = useAccount()
  const { createBetSlip, isPending } = useCreateBetSlip()

  const totalVolume = parseFloat(totalYesVolume) + parseFloat(totalNoVolume)
  const yesPercent = totalVolume > 0 ? (parseFloat(totalYesVolume) / totalVolume) * 100 : 50
  const noPercent = totalVolume > 0 ? (parseFloat(totalNoVolume) / totalVolume) * 100 : 50

  const timeLeft = Math.max(0, closeTime - Date.now() / 1000)
  const hoursLeft = Math.floor(timeLeft / 3600)
  const minutesLeft = Math.floor((timeLeft % 3600) / 60)

  const handlePredict = async () => {
    if (!selectedOutcome) {
      toast.error("Please select YES or NO")
      return
    }

    if (!isConnected) {
      toast.error("Please connect your wallet")
      return
    }

    try {
      await createBetSlip(
        [marketId],
        [amount],
        [selectedOutcome === "yes" ? 1 : 0]
      )
      toast.success("Bet placed! 🎉")
      setSelectedOutcome(null)
    } catch (error: any) {
      toast.error(error.message || "Failed to place bet")
    }
  }

  return (
    <Card className="overflow-hidden dual-block-card">
      {/* Media Section */}
      {mediaUrl && (
        <div className="relative h-64 md:h-80 bg-black">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={mediaUrl} alt="Prediction" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
          <div className="absolute top-4 right-4">
            <Badge className="bg-[#a4ff31] text-black border border-[#a4ff31] font-bold shadow-lg neon-glow">
              <Coins className="mr-1 h-4 w-4" />
              {totalVolume.toFixed(0)} BNB
            </Badge>
          </div>
        </div>
      )}

      {/* Content Section */}
      <div className="p-6 space-y-5 bg-white">
        {/* Question */}
        <div>
          <h3 className="text-xl md:text-2xl font-black text-gray-900 mb-2 leading-tight">{question}</h3>
          <p className="text-sm text-gray-600">
            by <span className="font-bold text-[#a4ff31]">0x{creator.slice(2, 8)}...{creator.slice(-4)}</span>
          </p>
        </div>

        {/* Time & Stats */}
        <div className="flex items-center gap-3 text-sm flex-wrap">
          <div className="flex items-center gap-2 px-3 py-2 bg-[#e8ffe0] border border-[#a4ff31]">
            <Clock className="h-4 w-4 text-black" />
            <span className="font-bold text-black">{hoursLeft}h {minutesLeft}m</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-300">
            <Users className="h-4 w-4 text-gray-600" />
            <span className="font-bold text-gray-900">{Math.floor(totalVolume / parseFloat(minStake))}</span>
          </div>
        </div>

        {/* Odds Display */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm font-bold">
            <span className="text-[#a4ff31]">YES {yesPercent.toFixed(0)}%</span>
            <span className="text-red-600">NO {noPercent.toFixed(0)}%</span>
          </div>
          <div className="h-6 bg-gray-200 overflow-hidden flex border border-gray-300">
            <div
              className="bg-[#a4ff31] transition-all duration-500 flex items-center justify-center text-black text-xs font-bold"
              style={{ width: `${yesPercent}%` }}
            >
              {yesPercent > 15 && `${yesPercent.toFixed(0)}%`}
            </div>
            <div
              className="bg-red-500 transition-all duration-500 flex items-center justify-center text-white text-xs font-bold"
              style={{ width: `${noPercent}%` }}
            >
              {noPercent > 15 && `${noPercent.toFixed(0)}%`}
            </div>
          </div>
        </div>

        {/* Prediction Buttons */}
        <div className="grid grid-cols-2 gap-4">
          <Button
            onClick={() => setSelectedOutcome("yes")}
            className={`h-16 md:h-20 text-lg md:text-xl font-black transition-all duration-200 ${
              selectedOutcome === "yes"
                ? "bg-[#a4ff31] text-black scale-105 shadow-xl neon-glow border-2 border-[#a4ff31]"
                : "bg-white text-[#a4ff31] hover:bg-[#e8ffe0] border-2 border-[#a4ff31] shadow-lg"
            }`}
          >
            <ThumbsUp className="mr-2 h-5 w-5 md:h-7 md:w-7" />
            YES
          </Button>
          <Button
            onClick={() => setSelectedOutcome("no")}
            className={`h-16 md:h-20 text-lg md:text-xl font-black transition-all duration-200 ${
              selectedOutcome === "no"
                ? "bg-red-500 text-white scale-105 shadow-xl border-2 border-red-400"
                : "bg-white text-red-600 hover:bg-red-50 border-2 border-red-500 shadow-lg"
            }`}
          >
            <ThumbsDown className="mr-2 h-5 w-5 md:h-7 md:w-7" />
            NO
          </Button>
        </div>

        {/* Amount Input */}
        {selectedOutcome && (
          <div className="space-y-4 animate-slide-up">
            <div className="flex items-center gap-3 bg-gray-50 p-3 border border-gray-300">
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                min={minStake}
                step="0.1"
                className="flex-1 px-3 py-2 bg-white border border-gray-300 font-bold text-lg focus:border-[#a4ff31] focus:ring-2 focus:ring-[#a4ff31]/20 outline-none transition-all"
                placeholder="Amount"
              />
              <span className="font-black text-[#a4ff31] text-lg">BNB</span>
            </div>

            <Button
              onClick={handlePredict}
              disabled={isPending}
              className="w-full h-14 md:h-16 text-lg md:text-xl font-black bg-[#a4ff31] hover:bg-[#b8ff52] text-black shadow-xl hover:shadow-2xl neon-glow transition-all duration-200"
            >
              {isPending ? (
                "Placing Bet..."
              ) : (
                <>
                  <TrendingUp className="mr-2 h-5 w-5 md:h-6 md:w-6" />
                  Bet {amount} BNB on {selectedOutcome.toUpperCase()}
                </>
              )}
            </Button>
          </div>
        )}

        {/* Min Stake Info */}
        <p className="text-xs md:text-sm text-center text-gray-600">
          Minimum stake: <span className="font-bold text-[#a4ff31]">{minStake} BNB</span>
        </p>
      </div>
    </Card>
  )
}

