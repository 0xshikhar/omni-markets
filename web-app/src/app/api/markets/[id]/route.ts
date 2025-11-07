import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const post = await prisma.post.findUnique({
      where: { id: params.id },
      include: {
        user: {
          select: {
            walletAddress: true,
            username: true,
            avatar: true,
          },
        },
        predictions: {
          include: {
            user: {
              select: {
                walletAddress: true,
                username: true,
                avatar: true,
              },
            },
          },
        },
      },
    })

    if (!post) {
      return NextResponse.json({ error: "Market not found" }, { status: 404 })
    }

    // Transform to market format for backward compatibility
    const market = {
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
      predictions: post.predictions,
    }

    return NextResponse.json({ market, post })
  } catch (error) {
    console.error("Error fetching market:", error)
    return NextResponse.json(
      { error: "Failed to fetch market" },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const { isResolved, winningOutcome, totalYesVolume, totalNoVolume } = body

    const updateData: any = {}
    
    if (isResolved !== undefined) updateData.isResolved = isResolved
    if (winningOutcome !== undefined) updateData.winningOutcome = winningOutcome
    if (totalYesVolume !== undefined) updateData.yesVolume = totalYesVolume
    if (totalNoVolume !== undefined) updateData.noVolume = totalNoVolume
    if (isResolved) updateData.resolvedAt = new Date()

    const post = await prisma.post.update({
      where: { id: params.id },
      data: updateData,
      include: {
        user: {
          select: {
            walletAddress: true,
            username: true,
            avatar: true,
          },
        },
      },
    })

    // Transform to market format
    const market = {
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
    }

    return NextResponse.json({ market, post })
  } catch (error) {
    console.error("Error updating market:", error)
    return NextResponse.json(
      { error: "Failed to update market" },
      { status: 500 }
    )
  }
}
