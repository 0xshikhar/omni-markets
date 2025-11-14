import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const type = searchParams.get("type") || "earnings"
    const limit = parseInt(searchParams.get("limit") || "10")

    let leaderboard: any[] = []

    if (type === "earnings") {
      // Top earners based on settled bet slip actual payouts
      const topEarners = await prisma.betSlip.groupBy({
        by: ["user"],
        where: {
          status: "settled",
          actualPayout: { not: null },
        },
        _sum: { actualPayout: true },
        orderBy: { _sum: { actualPayout: "desc" } },
        take: limit,
      })

      const walletAddresses = topEarners.map((e) => e.user)
      const users = await prisma.user.findMany({
        where: { walletAddress: { in: walletAddresses } },
        select: { id: true, walletAddress: true, username: true, avatar: true },
      })

      leaderboard = topEarners.map((earner) => {
        const user = users.find((u) => u.walletAddress === earner.user)
        return {
          user,
          totalEarnings: earner._sum.actualPayout?.toString() || "0.0",
        }
      })
    } else if (type === "accuracy") {
      // Accuracy based on BetSlipMarket outcomes vs resolved Market outcomes
      const entries = await prisma.betSlipMarket.findMany({
        where: { market: { status: "resolved" } },
        include: {
          market: { select: { outcome: true } },
          betSlip: { select: { user: true } },
        },
      })

      const stats: Record<string, { wallet: string; correct: number; total: number }> = {}

      for (const e of entries) {
        const wallet = e.betSlip.user
        if (!stats[wallet]) stats[wallet] = { wallet, correct: 0, total: 0 }
        stats[wallet].total++
        if (e.market.outcome !== null && e.outcome === e.market.outcome) {
          stats[wallet].correct++
        }
      }

      const wallets = Object.values(stats)
        .filter((s) => s.total >= 3)
        .sort((a, b) => (b.correct / b.total) - (a.correct / a.total))
        .slice(0, limit)

      const users = await prisma.user.findMany({
        where: { walletAddress: { in: wallets.map((w) => w.wallet) } },
        select: { id: true, walletAddress: true, username: true, avatar: true },
      })

      leaderboard = wallets.map((s) => {
        const user = users.find((u) => u.walletAddress === s.wallet)
        const accuracy = ((s.correct / s.total) * 100).toFixed(1)
        return {
          user,
          accuracy,
          totalPredictions: s.total,
          correctPredictions: s.correct,
        }
      })
    } else if (type === "volume") {
      // Highest volume by total bet amount and count of bet slips
      const topVolume = await prisma.betSlip.groupBy({
        by: ["user"],
        _sum: { totalAmount: true },
        _count: { id: true },
        orderBy: { _sum: { totalAmount: "desc" } },
        take: limit,
      })

      const walletAddresses = topVolume.map((v) => v.user)
      const users = await prisma.user.findMany({
        where: { walletAddress: { in: walletAddresses } },
        select: { id: true, walletAddress: true, username: true, avatar: true },
      })

      leaderboard = topVolume.map((vol) => {
        const user = users.find((u) => u.walletAddress === vol.user)
        return {
          user,
          totalVolume: vol._sum.totalAmount?.toString() || "0.0",
          betSlipCount: vol._count.id || 0,
        }
      })
    }

    return NextResponse.json({ leaderboard, type })
  } catch (error) {
    console.error("Error fetching leaderboard:", error)
    return NextResponse.json(
      { error: "Failed to fetch leaderboard" },
      { status: 500 }
    )
  }
}
