import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const marketRecord = await prisma.market.findUnique({
      where: { id: params.id },
      include: {
        creatorUser: {
          select: {
            walletAddress: true,
            username: true,
            avatar: true,
            id: true,
          },
        },
        externalMarkets: true,
        _count: { select: { betSlipMarkets: true } },
      },
    })

    if (!marketRecord) {
      return NextResponse.json({ error: "Market not found" }, { status: 404 })
    }

    // Transform to market format for backward compatibility
    const market = {
      id: marketRecord.id,
      marketId: marketRecord.marketId,
      question: marketRecord.question,
      closeTime: marketRecord.resolutionTime,
      isResolved: marketRecord.status === "resolved",
      winningOutcome: marketRecord.outcome ?? null,
      totalYesVolume: marketRecord.totalVolume.toString(),
      totalNoVolume: "0",
      creator: {
        walletAddress: marketRecord.creator,
        username: marketRecord.creatorUser?.username ?? null,
      },
      externalMarkets: marketRecord.externalMarkets,
      _counts: marketRecord._count,
    }

    return NextResponse.json({ market, post: marketRecord })
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
    const { isResolved, winningOutcome, status, resolutionTime } = body

    const updateData: any = {}
    
    if (status) updateData.status = String(status)
    if (isResolved !== undefined) updateData.status = isResolved ? "resolved" : "active"
    if (winningOutcome !== undefined) updateData.outcome = Number(winningOutcome)
    if (resolutionTime !== undefined) updateData.resolutionTime = new Date(resolutionTime)

    const marketRecord = await prisma.market.update({
      where: { id: params.id },
      data: updateData,
      include: {
        creatorUser: {
          select: {
            walletAddress: true,
            username: true,
            avatar: true,
            id: true,
          },
        },
        externalMarkets: true,
        _count: { select: { betSlipMarkets: true } },
      },
    })

    // Transform to market format
    const market = {
      id: marketRecord.id,
      marketId: marketRecord.marketId,
      question: marketRecord.question,
      closeTime: marketRecord.resolutionTime,
      isResolved: marketRecord.status === "resolved",
      winningOutcome: marketRecord.outcome ?? null,
      totalYesVolume: marketRecord.totalVolume.toString(),
      totalNoVolume: "0",
      creator: {
        walletAddress: marketRecord.creator,
        username: marketRecord.creatorUser?.username ?? null,
      },
    }

    return NextResponse.json({ market, post: marketRecord })
  } catch (error) {
    console.error("Error updating market:", error)
    return NextResponse.json(
      { error: "Failed to update market" },
      { status: 500 }
    )
  }
}

