import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const type = searchParams.get("type") || "earnings"
    const limit = parseInt(searchParams.get("limit") || "10")

    let leaderboard: any[] = []

    if (type === "earnings") {
      // Top earners based on claimed payouts
      const topEarners = await prisma.prediction.groupBy({
        by: ["userId"],
        where: {
          claimed: true,
          claimedAmount: {
            not: null,
          },
        },
        _sum: {
          claimedAmount: true,
        },
        orderBy: {
          _sum: {
            claimedAmount: "desc",
          },
        },
        take: limit,
      })

      const userIds = topEarners.map((e) => e.userId)
      const users = await prisma.user.findMany({
        where: {
          id: {
            in: userIds,
          },
        },
        select: {
          id: true,
          walletAddress: true,
          username: true,
          avatar: true,
        },
      })

      leaderboard = topEarners.map((earner) => {
        const user = users.find((u) => u.id === earner.userId)
        return {
          user,
          totalEarnings: earner._sum.claimedAmount?.toString() || "0.0",
        }
      })
    } else if (type === "accuracy") {
      // Most accurate predictions
      const predictions = await prisma.prediction.findMany({
        where: {
          post: {
            isResolved: true,
          },
        },
        include: {
          post: {
            select: {
              winningOutcome: true,
            },
          },
          user: {
            select: {
              id: true,
              walletAddress: true,
              username: true,
              avatar: true,
            },
          },
        },
      })

      const userStats: Record<
        string,
        { user: any; correct: number; total: number }
      > = {}

      predictions.forEach((pred) => {
        const userId = pred.userId
        if (!userStats[userId]) {
          userStats[userId] = {
            user: pred.user,
            correct: 0,
            total: 0,
          }
        }
        userStats[userId].total++
        if (pred.outcome === pred.post.winningOutcome) {
          userStats[userId].correct++
        }
      })

      leaderboard = Object.values(userStats)
        .filter((stat) => stat.total >= 3) // Minimum 3 predictions
        .map((stat) => ({
          user: stat.user,
          accuracy: ((stat.correct / stat.total) * 100).toFixed(1),
          totalPredictions: stat.total,
          correctPredictions: stat.correct,
        }))
        .sort((a, b) => parseFloat(b.accuracy) - parseFloat(a.accuracy))
        .slice(0, limit)
    } else if (type === "volume") {
      // Highest prediction volume
      const topVolume = await prisma.prediction.groupBy({
        by: ["userId"],
        _sum: {
          amount: true,
        },
        _count: {
          id: true,
        },
        orderBy: {
          _sum: {
            amount: "desc",
          },
        },
        take: limit,
      })

      const userIds = topVolume.map((v) => v.userId)
      const users = await prisma.user.findMany({
        where: {
          id: {
            in: userIds,
          },
        },
        select: {
          id: true,
          walletAddress: true,
          username: true,
          avatar: true,
        },
      })

      leaderboard = topVolume.map((vol) => {
        const user = users.find((u) => u.id === vol.userId)
        return {
          user,
          totalVolume: vol._sum.amount?.toString() || "0.0",
          predictionCount: vol._count.id || 0,
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
