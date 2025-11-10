"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { ArrowLeft, Lock, Calendar, Coins, Info, Sparkles } from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { useAccount } from "wagmi"
import { useCreateMarket } from "@/hooks/useMarketAggregator"

export default function CreatePage() {
  const router = useRouter()
  const { isConnected } = useAccount()
  const { createMarket, isPending } = useCreateMarket()
  const [formData, setFormData] = useState({
    question: "",
    category: "general",
    marketType: "public",
    resolutionTime: "",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.question || !formData.resolutionTime) {
      toast.error("Please fill in all required fields")
      return
    }

    if (!isConnected) {
      toast.error("Please connect your wallet")
      return
    }

    try {
      const resolutionTimeUnix = Math.floor(new Date(formData.resolutionTime).getTime() / 1000)

      await createMarket(
        formData.question,
        formData.category,
        resolutionTimeUnix
      )

      toast.success("Market created successfully! 🎉")
      router.push("/feed")
    } catch (error: any) {
      toast.error(error.message || "Failed to create market")
    }
  }

  return (
    <div className="min-h-screen p-6 md:p-10 bg-gradient-to-b from-[#FFFEE8] to-[#F6FCE5]">
      <main className="max-w-4xl mx-auto">
        <div className="mb-8 flex items-center gap-4">
          <Link href="/feed">
            <Button variant="outline" size="icon" className="border border-gray-400 hover:border-[#a4ff31] hover:bg-[#e8ffe0]">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-4xl font-black text-gray-900">Create Market</h1>
            <p className="text-gray-600 font-medium">Launch a new prediction market on BSC</p>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Card className="dual-block-card p-8">
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Question */}
                <div className="space-y-2">
                  <Label htmlFor="question" className="text-lg font-bold text-gray-900 flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-[#a4ff31]" />
                    Market Question
                  </Label>
                  <Textarea
                    id="question"
                    value={formData.question}
                    onChange={(e) => setFormData({ ...formData, question: e.target.value })}
                    placeholder="e.g., Will Bitcoin reach $100k by end of 2025?"
                    className="min-h-24 text-lg border border-gray-300 focus:border-[#a4ff31] focus:ring-2 focus:ring-[#a4ff31]/20"
                    required
                  />
                  <p className="text-sm text-gray-500">Be clear and specific. Binary YES/NO outcomes work best.</p>
                </div>

                {/* Category */}
                <div className="space-y-2">
                  <Label htmlFor="category" className="text-lg font-bold text-gray-900">Category</Label>
                  <select
                    id="category"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-4 py-2 text-lg border border-gray-300 rounded focus:border-[#a4ff31] focus:ring-2 focus:ring-[#a4ff31]/20"
                  >
                    <option value="general">General</option>
                    <option value="crypto">Crypto</option>
                    <option value="politics">Politics</option>
                    <option value="sports">Sports</option>
                    <option value="tech">Technology</option>
                    <option value="finance">Finance</option>
                  </select>
                </div>

                {/* Market Type */}
                <div className="space-y-2">
                  <Label htmlFor="marketType" className="text-lg font-bold text-gray-900 flex items-center gap-2">
                    <Lock className="h-5 w-5 text-[#a4ff31]" />
                    Market Type
                  </Label>
                  <div className="grid grid-cols-2 gap-4">
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, marketType: "public" })}
                      className={`p-4 border-2 rounded font-bold transition-all ${
                        formData.marketType === "public"
                          ? "border-[#a4ff31] bg-[#e8ffe0]"
                          : "border-gray-300 hover:border-[#a4ff31]"
                      }`}
                    >
                      Public
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, marketType: "subjective" })}
                      className={`p-4 border-2 rounded font-bold transition-all ${
                        formData.marketType === "subjective"
                          ? "border-[#a4ff31] bg-[#e8ffe0]"
                          : "border-gray-300 hover:border-[#a4ff31]"
                      }`}
                    >
                      Subjective
                    </button>
                  </div>
                  <p className="text-sm text-gray-500">
                    {formData.marketType === "public"
                      ? "Public markets use external data sources for resolution."
                      : "Subjective markets use verifier circles for resolution."}
                  </p>
                </div>

                {/* Resolution Time */}
                <div className="space-y-2">
                  <Label htmlFor="resolutionTime" className="text-lg font-bold text-gray-900 flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-[#a4ff31]" />
                    Resolution Time
                  </Label>
                  <Input
                    id="resolutionTime"
                    type="datetime-local"
                    value={formData.resolutionTime}
                    onChange={(e) => setFormData({ ...formData, resolutionTime: e.target.value })}
                    className="text-lg border border-gray-300 focus:border-[#a4ff31] focus:ring-2 focus:ring-[#a4ff31]/20"
                    required
                  />
                  <p className="text-sm text-gray-500">When should this market close for new bets?</p>
                </div>

                {/* Submit Button */}
                <Button
                  type="submit"
                  disabled={isPending || !isConnected}
                  className="w-full h-14 text-lg font-black bg-[#a4ff31] hover:bg-[#b8ff52] text-black shadow-lg hover:shadow-xl neon-glow transition-all duration-200"
                >
                  {!isConnected ? (
                    "Connect Wallet First"
                  ) : isPending ? (
                    "Creating Market..."
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-5 w-5" />
                      Create Market
                    </>
                  )}
                </Button>
              </form>
            </Card>
          </div>

          {/* Info Sidebar */}
          <div className="lg:col-span-1 space-y-4">
            <div className="dual-block-card p-6">
              <h3 className="font-bold text-lg text-gray-900 mb-4 flex items-center gap-2">
                <Info className="h-5 w-5 text-[#a4ff31]" />
                Guidelines
              </h3>
              <ul className="space-y-3 text-sm text-gray-700">
                <li className="flex items-start gap-2">
                  <span className="text-[#a4ff31] font-bold">✓</span>
                  <span>Clear, verifiable questions work best</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#a4ff31] font-bold">✓</span>
                  <span>Set resolution time before the event</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#a4ff31] font-bold">✓</span>
                  <span>Use categories to help discovery</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#a4ff31] font-bold">✓</span>
                  <span>Subjective markets need verifiers</span>
                </li>
              </ul>
            </div>

            <div className="dual-block-card p-6">
              <h3 className="font-bold text-lg text-gray-900 mb-4">🔄 Liquidity</h3>
              <p className="text-sm text-gray-700 mb-3">
                Your market will be aggregated with Polymarket and other sources for maximum liquidity.
              </p>
              <div className="bg-[#e8ffe0] border border-[#a4ff31] p-3 rounded">
                <p className="text-xs text-gray-600">Aggregated Liquidity</p>
                <p className="text-2xl font-bold text-[#a4ff31]">Coming Soon</p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
