"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, TrendingUp, Users, Clock, AlertCircle, CheckCircle, Loader2 } from "lucide-react"
import Link from "next/link"
import { useAccount } from "wagmi"
import { useVoteOnDispute } from "@/hooks/useDispute"

interface Dispute {
  id: string
  marketId: number
  submitter: string
  stake: string
  status: "active" | "resolved" | "rejected"
  votesFor: number
  votesAgainst: number
  proposedOutcome: number
  aiConfidence: number
  submittedAt: string
  market: {
    question: string
    category: string
  }
}

export default function DisputesPage() {
  const { isConnected, address } = useAccount()
  const { voteOnDispute, isPending } = useVoteOnDispute()
  const [disputes, setDisputes] = useState<Dispute[]>([])
  const [loading, setLoading] = useState(true)
  const [votingId, setVotingId] = useState<string | null>(null)

  useEffect(() => {
    async function loadDisputes() {
      try {
        const response = await fetch("/api/disputes")
        const data = await response.json()
        setDisputes(data)
      } catch (error) {
        console.error("Failed to load disputes:", error)
      } finally {
        setLoading(false)
      }
    }
    loadDisputes()
  }, [])

  const handleVote = async (disputeId: string, support: boolean) => {
    if (!isConnected) {
      alert("Please connect your wallet")
      return
    }

    setVotingId(disputeId)
    try {
      const id = parseInt(disputeId)
      await voteOnDispute(id, support)
      // Refresh disputes
      const response = await fetch("/api/disputes")
      const data = await response.json()
      setDisputes(data)
    } catch (error) {
      console.error("Failed to vote:", error)
    } finally {
      setVotingId(null)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-blue-100 text-blue-800"
      case "resolved":
        return "bg-green-100 text-green-800"
      case "rejected":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "active":
        return <Clock className="h-4 w-4" />
      case "resolved":
        return <CheckCircle className="h-4 w-4" />
      case "rejected":
        return <AlertCircle className="h-4 w-4" />
      default:
        return null
    }
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
            <h1 className="text-4xl font-black text-gray-900">Disputes</h1>
            <p className="text-gray-600 font-medium">Vote on market resolutions and earn rewards</p>
          </div>
        </div>

        {disputes.length === 0 ? (
          <Card className="dual-block-card p-12 text-center">
            <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-xl font-bold text-gray-900 mb-2">No Active Disputes</p>
            <p className="text-gray-600">Check back later for markets that need community resolution.</p>
          </Card>
        ) : (
          <div className="space-y-4">
            {disputes.map((dispute) => {
              const totalVotes = dispute.votesFor + dispute.votesAgainst
              const forPercent = totalVotes > 0 ? (dispute.votesFor / totalVotes) * 100 : 50
              const againstPercent = totalVotes > 0 ? (dispute.votesAgainst / totalVotes) * 100 : 50

              return (
                <Card key={dispute.id} className="dual-block-card p-6 hover-lift">
                  <div className="space-y-4">
                    {/* Header */}
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="text-xl font-bold text-gray-900 mb-2">{dispute.market.question}</h3>
                        <div className="flex items-center gap-3 flex-wrap">
                          <Badge className="bg-gray-100 text-gray-800 border border-gray-300">
                            {dispute.market.category}
                          </Badge>
                          <Badge className={`${getStatusColor(dispute.status)} border-0`}>
                            <span className="flex items-center gap-1">
                              {getStatusIcon(dispute.status)}
                              {dispute.status.charAt(0).toUpperCase() + dispute.status.slice(1)}
                            </span>
                          </Badge>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-600">AI Confidence</p>
                        <p className="text-2xl font-black text-[#a4ff31]">{dispute.aiConfidence}%</p>
                      </div>
                    </div>

                    {/* Voting Info */}
                    <div className="bg-gray-50 p-4 rounded border border-gray-200">
                      <div className="flex items-center justify-between mb-3">
                        <span className="font-bold text-gray-900">Community Votes</span>
                        <span className="text-sm text-gray-600">{totalVotes} votes</span>
                      </div>

                      {/* Vote Bar */}
                      <div className="h-8 bg-gray-200 overflow-hidden flex border border-gray-300 mb-3">
                        <div
                          className="bg-[#a4ff31] flex items-center justify-center text-black text-xs font-bold transition-all"
                          style={{ width: `${forPercent}%` }}
                        >
                          {forPercent > 15 && `YES ${forPercent.toFixed(0)}%`}
                        </div>
                        <div
                          className="bg-red-500 flex items-center justify-center text-white text-xs font-bold transition-all"
                          style={{ width: `${againstPercent}%` }}
                        >
                          {againstPercent > 15 && `NO ${againstPercent.toFixed(0)}%`}
                        </div>
                      </div>

                      <div className="flex justify-between text-sm">
                        <span className="text-[#a4ff31] font-bold">YES: {dispute.votesFor}</span>
                        <span className="text-red-600 font-bold">NO: {dispute.votesAgainst}</span>
                      </div>
                    </div>

                    {/* Dispute Details */}
                    <div className="grid md:grid-cols-3 gap-4 text-sm">
                      <div className="bg-[#e8ffe0] p-3 rounded border border-[#a4ff31]">
                        <p className="text-gray-600 text-xs mb-1">Submitter Stake</p>
                        <p className="font-bold text-[#a4ff31]">{dispute.stake} BNB</p>
                      </div>
                      <div className="bg-gray-50 p-3 rounded border border-gray-300">
                        <p className="text-gray-600 text-xs mb-1">Proposed Outcome</p>
                        <p className="font-bold text-gray-900">{dispute.proposedOutcome === 1 ? "YES" : "NO"}</p>
                      </div>
                      <div className="bg-gray-50 p-3 rounded border border-gray-300">
                        <p className="text-gray-600 text-xs mb-1">Submitted</p>
                        <p className="font-bold text-gray-900">{new Date(dispute.submittedAt).toLocaleDateString()}</p>
                      </div>
                    </div>

                    {/* Voting Buttons */}
                    {dispute.status === "active" && (
                      <div className="flex gap-3 pt-2">
                        <Button
                          onClick={() => handleVote(dispute.id, true)}
                          disabled={isPending || votingId !== dispute.id}
                          className="flex-1 bg-[#a4ff31] hover:bg-[#b8ff52] text-black font-bold"
                        >
                          {votingId === dispute.id && isPending ? (
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          ) : (
                            <TrendingUp className="h-4 w-4 mr-2" />
                          )}
                          Vote YES
                        </Button>
                        <Button
                          onClick={() => handleVote(dispute.id, false)}
                          disabled={isPending || votingId !== dispute.id}
                          variant="outline"
                          className="flex-1 border-2 border-red-500 text-red-600 hover:bg-red-50 font-bold"
                        >
                          {votingId === dispute.id && isPending ? (
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          ) : (
                            <AlertCircle className="h-4 w-4 mr-2" />
                          )}
                          Vote NO
                        </Button>
                      </div>
                    )}

                    {dispute.status !== "active" && (
                      <div className="text-center py-2">
                        <p className="text-sm text-gray-600">
                          {dispute.status === "resolved" ? "✅ Dispute Resolved" : "❌ Dispute Rejected"}
                        </p>
                      </div>
                    )}
                  </div>
                </Card>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}
