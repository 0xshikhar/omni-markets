"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Trophy, Target, TrendingUp } from "lucide-react"

interface LeaderboardEntry {
  user: {
    walletAddress: string
    username?: string
    avatar?: string
  }
  totalEarnings?: string
  accuracy?: string
  totalPredictions?: number
  correctPredictions?: number
  totalVolume?: string
  predictionCount?: number
}

export default function LeaderboardPage() {
  const [earningsLeaderboard, setEarningsLeaderboard] = useState<LeaderboardEntry[]>([])
  const [accuracyLeaderboard, setAccuracyLeaderboard] = useState<LeaderboardEntry[]>([])
  const [volumeLeaderboard, setVolumeLeaderboard] = useState<LeaderboardEntry[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchLeaderboards()
  }, [])

  const fetchLeaderboards = async () => {
    try {
      const [earnings, accuracy, volume] = await Promise.all([
        fetch("/api/leaderboard?type=earnings&limit=10").then((r) => r.json()),
        fetch("/api/leaderboard?type=accuracy&limit=10").then((r) => r.json()),
        fetch("/api/leaderboard?type=volume&limit=10").then((r) => r.json()),
      ])

      setEarningsLeaderboard(earnings.leaderboard || [])
      setAccuracyLeaderboard(accuracy.leaderboard || [])
      setVolumeLeaderboard(volume.leaderboard || [])
    } catch (error) {
      console.error("Error fetching leaderboards:", error)
    } finally {
      setLoading(false)
    }
  }

  const getRankBadge = (rank: number) => {
    if (rank === 1) return <Badge className="bg-yellow-500">🥇 1st</Badge>
    if (rank === 2) return <Badge className="bg-gray-400">🥈 2nd</Badge>
    if (rank === 3) return <Badge className="bg-amber-600">🥉 3rd</Badge>
    return <Badge variant="outline">#{rank}</Badge>
  }

  const renderLeaderboardEntry = (entry: LeaderboardEntry, rank: number, type: string) => {
    const displayName = entry.user.username || entry.user.walletAddress.slice(0, 8)
    
    return (
      <div
        key={entry.user.walletAddress}
        className="flex items-center justify-between p-4 rounded-lg hover:bg-accent transition-colors"
      >
        <div className="flex items-center gap-4">
          <div className="w-12 text-center">
            {getRankBadge(rank)}
          </div>
          <Avatar>
            <AvatarImage src={entry.user.avatar} />
            <AvatarFallback>{displayName[0].toUpperCase()}</AvatarFallback>
          </Avatar>
          <div>
            <div className="font-semibold">{displayName}</div>
            <div className="text-sm text-muted-foreground">
              {entry.user.walletAddress.slice(0, 8)}...{entry.user.walletAddress.slice(-6)}
            </div>
          </div>
        </div>
        <div className="text-right">
          {type === "earnings" && (
            <>
              <div className="text-2xl font-bold text-green-600">
                {parseFloat(entry.totalEarnings || "0").toFixed(2)} FLOW
              </div>
              <div className="text-sm text-muted-foreground">Total Earnings</div>
            </>
          )}
          {type === "accuracy" && (
            <>
              <div className="text-2xl font-bold text-blue-600">
                {entry.accuracy}%
              </div>
              <div className="text-sm text-muted-foreground">
                {entry.correctPredictions}/{entry.totalPredictions} correct
              </div>
            </>
          )}
          {type === "volume" && (
            <>
              <div className="text-2xl font-bold text-purple-600">
                {parseFloat(entry.totalVolume || "0").toFixed(2)} FLOW
              </div>
              <div className="text-sm text-muted-foreground">
                {entry.predictionCount} predictions
              </div>
            </>
          )}
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-20">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading leaderboards...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-orange-500 to-amber-500 bg-clip-text text-transparent">
          Leaderboards
        </h1>
        <p className="text-muted-foreground">
          Top performers in the Moments prediction market
        </p>
      </div>

      <Tabs defaultValue="earnings" className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-8">
          <TabsTrigger value="earnings" className="flex items-center gap-2">
            <Trophy className="h-4 w-4" />
            Top Earners
          </TabsTrigger>
          <TabsTrigger value="accuracy" className="flex items-center gap-2">
            <Target className="h-4 w-4" />
            Most Accurate
          </TabsTrigger>
          <TabsTrigger value="volume" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Highest Volume
          </TabsTrigger>
        </TabsList>

        <TabsContent value="earnings">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="h-5 w-5 text-yellow-500" />
                Top Earners
              </CardTitle>
              <CardDescription>
                Users who have earned the most FLOW from winning predictions
              </CardDescription>
            </CardHeader>
            <CardContent>
              {earningsLeaderboard.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  No earnings data yet
                </div>
              ) : (
                <div className="space-y-2">
                  {earningsLeaderboard.map((entry, index) =>
                    renderLeaderboardEntry(entry, index + 1, "earnings")
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="accuracy">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5 text-blue-500" />
                Most Accurate Predictors
              </CardTitle>
              <CardDescription>
                Users with the highest prediction accuracy (minimum 3 predictions)
              </CardDescription>
            </CardHeader>
            <CardContent>
              {accuracyLeaderboard.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  No accuracy data yet
                </div>
              ) : (
                <div className="space-y-2">
                  {accuracyLeaderboard.map((entry, index) =>
                    renderLeaderboardEntry(entry, index + 1, "accuracy")
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="volume">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-purple-500" />
                Highest Volume Traders
              </CardTitle>
              <CardDescription>
                Users who have placed the most FLOW in predictions
              </CardDescription>
            </CardHeader>
            <CardContent>
              {volumeLeaderboard.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  No volume data yet
                </div>
              ) : (
                <div className="space-y-2">
                  {volumeLeaderboard.map((entry, index) =>
                    renderLeaderboardEntry(entry, index + 1, "volume")
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
