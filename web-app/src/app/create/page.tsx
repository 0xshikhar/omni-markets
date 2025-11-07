"use client"

import { useState, useEffect } from "react"
import { AuthButton } from "@/components/AuthButton"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { ArrowLeft, Upload, Calendar, Coins, Percent, Sparkles } from "lucide-react"
import Link from "next/link"
import { createMarket } from "@/lib/flow/transactions"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { fcl } from "@/lib/flow/config"

export default function CreatePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [user, setUser] = useState<any>({ loggedIn: false })
  const [formData, setFormData] = useState({
    question: "",
    closeTime: "",
    minStake: "1.0",
    creatorFee: "5.0",
    mediaFile: null as File | null,
  })

  useEffect(() => {
    fcl.currentUser.subscribe(setUser)
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.question || !formData.closeTime) {
      toast.error("Please fill in all required fields")
      return
    }

    setLoading(true)
    try {
      const closeTimeUnix = new Date(formData.closeTime).getTime() / 1000

      const result = await createMarket({
        question: formData.question,
        closeTime: closeTimeUnix,
        minStake: formData.minStake,
        creatorFeePercent: formData.creatorFee,
      })

      // Extract market ID from events
      const marketCreatedEvent = result.events?.find((e: any) => e.type.includes("MarketCreated"))
      const marketId = marketCreatedEvent?.data?.marketId

      if (marketId && user?.addr) {
        // Sync with database
        await fetch("/api/markets", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            marketId: parseInt(marketId),
            creatorAddress: user.addr,
            question: formData.question,
            closeTime: closeTimeUnix,
            minStake: formData.minStake,
            creatorFeePercent: formData.creatorFee,
          }),
        })
      }

      toast.success("Market created successfully! 🎉")
      router.push("/feed")
    } catch (error: any) {
      toast.error(error.message || "Failed to create market")
    } finally {
      setLoading(false)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFormData({ ...formData, mediaFile: e.target.files[0] })
    }
  }

  return (
    <div className="min-h-screen p-6 md:p-10">
      <main className="max-w-6xl mx-auto">
        <div className="mb-8 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/feed">
              <Button variant="outline" size="icon" className="border border-gray-400 hover:border-[#00EF8C] hover:bg-[#E6FFF8]">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-4xl font-black text-gray-900">Create Market</h1>
              <p className="text-gray-600 font-medium">Launch your prediction and earn fees</p>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Card className="dual-block-card p-8">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="question" className="text-lg font-bold text-gray-900 flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-[#a4ff31]" />
                    Prediction Question
                  </Label>
                  <Textarea
                    id="question"
                    value={formData.question}
                  onChange={(e) => setFormData({ ...formData, question: e.target.value })}
                  placeholder="e.g., Will LeBron score 40+ points tonight vs Celtics?"
                  className="min-h-24 text-lg border border-gray-300 focus:border-[#a4ff31] focus:ring-2 focus:ring-[#a4ff31]/20"
                  required
                />
                <p className="text-sm text-gray-500">Make it clear and specific!</p>
              </div>

              {/* Media Upload */}
              <div className="space-y-2">
                <Label htmlFor="media" className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <Upload className="h-5 w-5 text-[#a4ff31]" />
                  Upload Image/Video (Optional)
                </Label>
                <div className="border-2 border-dashed border-[#a4ff31] p-8 text-center hover:border-[#b8ff52] transition-colors cursor-pointer bg-[#e8ffe0]">
                  <input
                    id="media"
                    type="file"
                    accept="image/*,video/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <label htmlFor="media" className="cursor-pointer">
                    {formData.mediaFile ? (
                      <div className="space-y-2">
                        <Upload className="h-12 w-12 mx-auto text-[#a4ff31]" />
                        <p className="font-semibold text-[#a4ff31]">{formData.mediaFile.name}</p>
                        <p className="text-sm text-gray-500">Click to change</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <Upload className="h-12 w-12 mx-auto text-gray-400" />
                        <p className="font-semibold text-gray-600">Click to upload</p>
                        <p className="text-sm text-gray-500">Max 10 seconds for video</p>
                      </div>
                    )}
                  </label>
                </div>
              </div>

              {/* Close Time */}
              <div className="space-y-2">
                <Label htmlFor="closeTime" className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-[#a4ff31]" />
                  Close Time
                </Label>
                <Input
                  id="closeTime"
                  type="datetime-local"
                  value={formData.closeTime}
                  onChange={(e) => setFormData({ ...formData, closeTime: e.target.value })}
                  className="text-lg border border-gray-300 focus:border-[#a4ff31] focus:ring-2 focus:ring-[#a4ff31]/20"
                  required
                />
                <p className="text-sm text-gray-500">When should predictions close?</p>
              </div>

              {/* Min Stake */}
              <div className="space-y-2">
                <Label htmlFor="minStake" className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <Coins className="h-5 w-5 text-[#a4ff31]" />
                  Minimum Stake (FLOW)
                </Label>
                <Input
                  id="minStake"
                  type="number"
                  step="0.1"
                  min="0.1"
                  value={formData.minStake}
                  onChange={(e) => setFormData({ ...formData, minStake: e.target.value })}
                  className="text-lg border border-gray-300 focus:border-[#a4ff31] focus:ring-2 focus:ring-[#a4ff31]/20"
                  required
                />
                <p className="text-sm text-gray-500">Minimum amount users can bet</p>
              </div>

              {/* Creator Fee */}
              <div className="space-y-2">
                <Label htmlFor="creatorFee" className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <Percent className="h-5 w-5 text-[#a4ff31]" />
                  Creator Fee (%)
                </Label>
                <Input
                  id="creatorFee"
                  type="number"
                  step="0.1"
                  min="0"
                  max="20"
                  value={formData.creatorFee}
                  onChange={(e) => setFormData({ ...formData, creatorFee: e.target.value })}
                  className="text-lg border border-gray-300 focus:border-[#a4ff31] focus:ring-2 focus:ring-[#a4ff31]/20"
                  required
                />
                <p className="text-sm text-gray-500">Your earnings from total pool (max 20%)</p>
              </div>

              {/* Estimated Earnings */}
              <div className="bg-[#e8ffe0] border border-[#a4ff31] p-4">
                <p className="text-sm text-gray-600 mb-1">Estimated earnings (if pool reaches 100 FLOW):</p>
                <p className="text-3xl font-bold text-[#a4ff31]">
                  {(100 * parseFloat(formData.creatorFee) / 100).toFixed(2)} FLOW
                </p>
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={loading}
                className="w-full h-16 text-xl font-black bg-[#a4ff31] hover:bg-[#b8ff52] text-black shadow-lg hover:shadow-xl neon-glow transition-all duration-200"
              >
                {loading ? (
                  "Creating Market..."
                ) : (
                  <>
                    <Sparkles className="mr-2 h-6 w-6" />
                    Create Prediction Market
                  </>
                )}
              </Button>
            </form>
          </Card>
          </div>

          {/* Tips Sidebar */}
          <div className="lg:col-span-1 space-y-4">
            <div className="dual-block-card p-6">
              <h3 className="font-bold text-xl text-gray-900 mb-4">💡 Tips</h3>
            <ul className="space-y-2 text-sm text-gray-700">
              <li className="flex items-start gap-2">
                <span className="text-[#a4ff31] font-bold">✓</span>
                <span>Make questions clear and verifiable (sports stats work best!)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#a4ff31] font-bold">✓</span>
                <span>Set close time before the event happens</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#a4ff31] font-bold">✓</span>
                <span>Lower min stake = more participants</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#a4ff31] font-bold">✓</span>
                <span>Add engaging media to attract more bets</span>
              </li>
            </ul>
            </div>

            <div className="dual-block-card p-6">
              <h3 className="font-bold text-xl text-gray-900 mb-4">📊 Preview</h3>
              <div className="space-y-3">
                <div className="bg-gray-50 p-3 border border-gray-300">
                  <p className="text-xs text-gray-600">Min Stake</p>
                  <p className="text-lg font-bold text-[#a4ff31]">{formData.minStake} FLOW</p>
                </div>
                <div className="bg-gray-50 p-3 border border-gray-300">
                  <p className="text-xs text-gray-600">Creator Fee</p>
                  <p className="text-lg font-bold text-[#a4ff31]">{formData.creatorFee}%</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
