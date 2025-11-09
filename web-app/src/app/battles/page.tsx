"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Swords, Trophy, Clock, Users } from "lucide-react"
import Link from "next/link"

interface Battle {
  id: string
  battleType: string
  condition: string
  closeTime: string
  status: string
  totalPool: string
  creatorPool: string
  opponentPool: string
  bettorsCount: number
  creator: {
    id: string
    walletAddress: string
    username?: string
    avatar?: string
  }
  opponent?: {
    id: string
    walletAddress: string
    username?: string
    avatar?: string
  }
  creatorNFTImage?: string
  creatorNFTName?: string
  opponentNFTImage?: string
  opponentNFTName?: string
}

export default function BattlesPage() {
  const [activeBattles, setActiveBattles] = useState<Battle[]>([])
  const [pendingBattles, setPendingBattles] = useState<Battle[]>([])
  const [resolvedBattles, setResolvedBattles] = useState<Battle[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchBattles()
  }, [])

  const fetchBattles = async () => {
    try {
      const [active, pending, resolved] = await Promise.all([
        fetch("/api/battles?status=active").then((r) => r.json()),
        fetch("/api/battles?status=pending").then((r) => r.json()),
        fetch("/api/battles?status=resolved&limit=20").then((r) => r.json()),
      ])

      setActiveBattles(active.battles || [])
      setPendingBattles(pending.battles || [])
      setResolvedBattles(resolved.battles || [])
    } catch (error) {
      console.error("Error fetching battles:", error)
    } finally {
      setLoading(false)
    }
  }

  const renderBattleCard = (battle: Battle) => {
    const creatorName = battle.creator.username || battle.creator.walletAddress.slice(0, 8)
    const opponentName = battle.opponent
      ? battle.opponent.username || battle.opponent.walletAddress.slice(0, 8)
      : "Waiting..."

    const totalPool = parseFloat(battle.totalPool)
    const creatorOdds = totalPool > 0
      ? ((parseFloat(battle.creatorPool) / totalPool) * 100).toFixed(1)
      : "50.0"
    const opponentOdds = totalPool > 0
      ? ((parseFloat(battle.opponentPool) / totalPool) * 100).toFixed(1)
      : "50.0"

    return (
      <Card key={battle.id} className="overflow-hidden hover:shadow-lg transition-shadow">
        <CardHeader>
          <div className="flex items-center justify-between">
            <Badge variant={battle.status === "active" ? "default" : "secondary"}>
              {battle.status.toUpperCase()}
            </Badge>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Users className="h-4 w-4" />
              {battle.bettorsCount} bettors
            </div>
          </div>
          <CardTitle className="text-lg mt-2">{battle.condition}</CardTitle>
          <CardDescription className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Closes {new Date(battle.closeTime).toLocaleDateString()}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Battle Participants */}
            <div className="grid grid-cols-2 gap-4">
              {/* Creator */}
              <div className="flex flex-col items-center p-4 rounded-lg bg-blue-50 dark:bg-blue-950">
                <Avatar className="h-16 w-16 mb-2">
                  <AvatarImage src={battle.creatorNFTImage || battle.creator.avatar} />
                  <AvatarFallback>{creatorName[0].toUpperCase()}</AvatarFallback>
                </Avatar>
                <div className="text-sm font-semibold text-center">{creatorName}</div>
                {battle.creatorNFTName && (
                  <div className="text-xs text-muted-foreground text-center mt-1">
                    {battle.creatorNFTName}
                  </div>
                )}
                <div className="text-lg font-bold text-blue-600 mt-2">
                  {creatorOdds}%
                </div>
                <div className="text-xs text-muted-foreground">
                  {parseFloat(battle.creatorPool).toFixed(2)} BNB
                </div>
              </div>

              {/* VS Divider */}
              <div className="flex flex-col items-center justify-center">
                <Swords className="h-8 w-8 text-muted-foreground" />
                <div className="text-xs text-muted-foreground mt-2">VS</div>
              </div>

              {/* Opponent */}
              <div className="flex flex-col items-center p-4 rounded-lg bg-red-50 dark:bg-red-950">
                <Avatar className="h-16 w-16 mb-2">
                  <AvatarImage src={battle.opponentNFTImage || battle.opponent?.avatar} />
                  <AvatarFallback>{opponentName[0].toUpperCase()}</AvatarFallback>
                </Avatar>
                <div className="text-sm font-semibold text-center">{opponentName}</div>
                {battle.opponentNFTName && (
                  <div className="text-xs text-muted-foreground text-center mt-1">
                    {battle.opponentNFTName}
                  </div>
                )}
                <div className="text-lg font-bold text-red-600 mt-2">
                  {opponentOdds}%
                </div>
                <div className="text-xs text-muted-foreground">
                  {parseFloat(battle.opponentPool).toFixed(2)} BNB
                </div>
              </div>
            </div>

            {/* Total Pool */}
            <div className="text-center p-3 bg-accent rounded-lg">
              <div className="text-sm text-muted-foreground">Total Pool</div>
              <div className="text-2xl font-bold text-primary">
                {totalPool.toFixed(2)} BNB
              </div>
            </div>

            {/* Action Button */}
            <Link href={`/battles/${battle.id}`}>
              <Button className="w-full" variant="outline">
                View Battle Details
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-20">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading battles...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-orange-500 to-amber-500 bg-clip-text text-transparent">
            NFT Battles
          </h1>
          <p className="text-muted-foreground">
            Stake your NFTs and battle for glory
          </p>
        </div>
        <Link href="/battles/create">
          <Button className="flex items-center gap-2">
            <Swords className="h-4 w-4" />
            Create Battle
          </Button>
        </Link>
      </div>

      <Tabs defaultValue="active" className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-8">
          <TabsTrigger value="active">
            Active ({activeBattles.length})
          </TabsTrigger>
          <TabsTrigger value="pending">
            Pending ({pendingBattles.length})
          </TabsTrigger>
          <TabsTrigger value="resolved">
            Resolved ({resolvedBattles.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="active">
          {activeBattles.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Swords className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No active battles</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {activeBattles.map(renderBattleCard)}
            </div>
          )}
        </TabsContent>

        <TabsContent value="pending">
          {pendingBattles.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Clock className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No pending battles</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {pendingBattles.map(renderBattleCard)}
            </div>
          )}
        </TabsContent>

        <TabsContent value="resolved">
          {resolvedBattles.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Trophy className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No resolved battles yet</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {resolvedBattles.map(renderBattleCard)}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
