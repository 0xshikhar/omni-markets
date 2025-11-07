import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const resolved = searchParams.get("resolved")
    const userId = searchParams.get("userId")
    const limit = parseInt(searchParams.get("limit") || "50")

    const where: any = {}
    
    if (resolved !== null) {
      where.isResolved = resolved === "true"
    }
    
    if (userId) {
      where.userId = userId
    }

    const posts = await prisma.post.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            walletAddress: true,
            username: true,
            avatar: true,
          },
        },
        predictions: {
          select: {
            id: true,
            outcome: true,
            amount: true,
            userId: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: limit,
    })

    // Transform posts to markets format for backward compatibility
    const markets = posts.map(post => ({
      id: post.id,
      marketId: post.marketId ? parseInt(post.marketId) : 0,
      question: post.question,
      closeTime: post.closeTime,
      isResolved: post.isResolved,
      winningOutcome: post.winningOutcome,
      totalYesVolume: post.yesVolume.toString(),
      totalNoVolume: post.noVolume.toString(),
      creator: {
        walletAddress: post.user.walletAddress,
        username: post.user.username,
      },
    }))

    return NextResponse.json({ markets, posts })
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
      mediaUrl,
      mediaType,
      thumbnailUrl,
      caption,
      question,
      marketType,
      closeTime,
      minStake,
      maxStake,
      creatorFeePercent,
      nftContractAddr,
      nftTokenId,
      nftImageUrl,
      nftName,
      marketId,
      contractAddress,
    } = body

    const post = await prisma.post.create({
      data: {
        userId,
        mediaUrl,
        mediaType,
        thumbnailUrl,
        caption,
        question,
        marketType: marketType || "binary",
        closeTime: new Date(closeTime),
        minStake,
        maxStake: maxStake || minStake,
        creatorFeePercent: creatorFeePercent || 5,
        nftContractAddr,
        nftTokenId,
        nftImageUrl,
        nftName,
        marketId,
        contractAddress,
      },
      include: {
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

    return NextResponse.json({ post }, { status: 201 })
  } catch (error) {
    console.error("Error creating post:", error)
    return NextResponse.json(
      { error: "Failed to create post" },
      { status: 500 }
    )
  }
}
