import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const userId = searchParams.get("user")
    const postId = searchParams.get("postId")

    // Map filters: user -> BetSlip.user wallet, postId -> marketId
    const where: any = {}
    if (userId) {
      let wallet = userId
      if (userId.length !== 42) {
        const u = await prisma.user.findUnique({ where: { id: userId } })
        wallet = u?.walletAddress || userId
      }
      where.betSlip = { user: wallet }
    }
    if (postId) {
      where.marketId = postId
    }

    const rows = await prisma.betSlipMarket.findMany({
      where,
      include: {
        betSlip: {
          select: { id: true, user: true, createdAt: true },
        },
        market: {
          select: {
            id: true,
            marketId: true,
            question: true,
            status: true,
            outcome: true,
            resolutionTime: true,
          },
        },
      },
    })

    // Optional: hydrate user info from User table
    const wallets = Array.from(new Set(rows.map((r) => r.betSlip.user)))
    const users = await prisma.user.findMany({
      where: { walletAddress: { in: wallets } },
      select: { walletAddress: true, username: true, avatar: true },
    })

    // Sort by associated betSlip.createdAt desc for recency
    rows.sort((a, b) => (
      (b.betSlip.createdAt?.getTime?.() || 0) - (a.betSlip.createdAt?.getTime?.() || 0)
    ))

    const predictions = rows.map((r) => ({
      id: r.id,
      postId: r.marketId, // backward compat naming
      userId: users.find((u) => u.walletAddress === r.betSlip.user)?.walletAddress,
      outcome: r.outcome,
      amount: r.amount?.toString?.() ?? String(r.amount),
      potentialWin: r.amount?.toString?.() ?? String(r.amount),
      createdAt: r.betSlip.createdAt,
      post: {
        marketId: r.market.marketId,
        question: r.market.question,
        isResolved: r.market.status === "resolved",
        winningOutcome: r.market.outcome ?? null,
        closeTime: r.market.resolutionTime,
      },
      user: users.find((u) => u.walletAddress === r.betSlip.user) || {
        walletAddress: r.betSlip.user,
        username: null,
        avatar: null,
      },
    }))

    return NextResponse.json({ predictions })
  } catch (error) {
    console.error("Error fetching predictions:", error)
    return NextResponse.json(
      { error: "Failed to fetch predictions" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { postId, userId, outcome, amount } = body

    // userId is assumed to be wallet address for BetSlip.user; if it's a DB user id,
    // resolve to walletAddress first
    let walletAddress = userId
    if (userId && userId.length !== 42) {
      const u = await prisma.user.findUnique({ where: { id: userId } })
      walletAddress = u?.walletAddress || userId
    }

    // Create or reuse an open bet slip for this user (simple model)
    const slip = await prisma.betSlip.create({
      data: {
        chainId: 0,
        betSlipId: Math.floor(Math.random() * 1e9),
        user: String(walletAddress),
        totalAmount: (amount?.toString?.() ?? String(amount)),
        status: "placed",
      },
    })

    const created = await prisma.betSlipMarket.create({
      data: {
        betSlipId: slip.id,
        marketId: postId,
        amount: (amount?.toString?.() ?? String(amount)),
        outcome,
      },
      include: {
        betSlip: { select: { user: true, createdAt: true } },
        market: { select: { question: true, marketId: true } },
      },
    })

    const user = await prisma.user.findUnique({
      where: { walletAddress: created.betSlip.user },
      select: { walletAddress: true, username: true, avatar: true },
    })

    const prediction = {
      id: created.id,
      postId: created.marketId,
      userId: created.betSlip.user,
      outcome: created.outcome,
      amount: created.amount,
      potentialWin: created.amount,
      post: {
        marketId: created.market.marketId,
        question: created.market.question,
      },
      user: user || {
        walletAddress: created.betSlip.user,
        username: null,
        avatar: null,
      },
    }

    return NextResponse.json({ prediction }, { status: 201 })
  } catch (error) {
    console.error("Error creating prediction:", error)
    return NextResponse.json(
      { error: "Failed to create prediction" },
      { status: 500 }
    )
  }
}

