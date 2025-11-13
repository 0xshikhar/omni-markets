import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { ADDRESSES, CHAIN_ID } from "@/contracts"

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const resolved = searchParams.get("resolved")
    const userId = searchParams.get("userId")
    const status = searchParams.get("status")
    const limit = parseInt(searchParams.get("limit") || "50")

    const where: any = {}

    if (resolved !== null) {
      where.status = resolved === "true" ? "resolved" : { not: "resolved" }
    }

    if (status) {
      where.status = status
    }

    if (userId) {
      const user = await prisma.user.findUnique({ where: { id: userId } })
      if (user) where.creator = user.walletAddress
    }

    const markets = await prisma.market.findMany({
      where,
      include: {
        creatorUser: {
          select: { id: true, walletAddress: true, username: true, avatar: true },
        },
        externalMarkets: {
          select: { marketplace: true, price: true, liquidity: true, lastUpdate: true },
        },
        _count: { select: { betSlipMarkets: true } },
      },
      orderBy: { createdAt: "desc" },
      take: limit,
    })

    // Keep response key compatible
    return NextResponse.json({ posts: markets })
  } catch (error) {
    console.error("Error fetching posts:", error)
    return NextResponse.json(
      { error: "Failed to fetch posts" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      userId,
      question,
      marketType,
      closeTime,
      category,
      marketId,
      contractAddress,
    } = body

    // Map userId -> wallet address for Market.creator
    let creator = "0x0000000000000000000000000000000000000000"
    if (userId) {
      const user = await prisma.user.findUnique({ where: { id: userId } })
      if (user) creator = user.walletAddress
    }

    const created = await prisma.market.create({
      data: {
        chainId: CHAIN_ID,
        contractAddress: contractAddress || ADDRESSES.MarketAggregator,
        marketId: marketId || 0,
        question: String(question || ""),
        category: String(category || "General"),
        marketType: String(marketType || "public"),
        status: "active",
        resolutionTime: new Date(closeTime || Date.now() + 24 * 60 * 60 * 1000),
        totalVolume: 0,
        creator,
      },
      include: {
        creatorUser: { select: { id: true, walletAddress: true, username: true, avatar: true } },
        _count: { select: { betSlipMarkets: true } },
      },
    })

    return NextResponse.json({ post: created }, { status: 201 })
  } catch (error) {
    console.error("Error creating post:", error)
    return NextResponse.json(
      { error: "Failed to create post" },
      { status: 500 }
    )
  }
}
