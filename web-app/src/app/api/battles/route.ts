import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const status = searchParams.get("status")
    const creatorId = searchParams.get("creator")
    const limit = parseInt(searchParams.get("limit") || "50")

    const where: any = {}
    
    if (status) {
      where.status = status
    }
    
    if (creatorId) {
      where.creatorId = creatorId
    }

    const battles = await prisma.battle.findMany({
      where,
      include: {
        creator: {
          select: {
            walletAddress: true,
            username: true,
            avatar: true,
          },
        },
        opponent: {
          select: {
            walletAddress: true,
            username: true,
            avatar: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: limit,
    })

    return NextResponse.json({ battles })
  } catch (error) {
    console.error("Error fetching battles:", error)
    return NextResponse.json(
      { error: "Failed to fetch battles" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      battleId,
      creatorId,
      opponentId,
      creatorNFTAddr,
      creatorNFTId,
      opponentNFTAddr,
      opponentNFTId,
      battleType,
      condition,
      conditionType,
      closeTime,
    } = body

    const battle = await prisma.battle.create({
      data: {
        battleId,
        creatorId,
        opponentId,
        creatorNFTAddr,
        creatorNFTId,
        opponentNFTAddr,
        opponentNFTId,
        battleType,
        condition,
        conditionType,
        closeTime: new Date(closeTime),
      },
      include: {
        creator: {
          select: {
            walletAddress: true,
            username: true,
            avatar: true,
          },
        },
        opponent: {
          select: {
            walletAddress: true,
            username: true,
            avatar: true,
          },
        },
      },
    })

    return NextResponse.json({ battle }, { status: 201 })
  } catch (error) {
    console.error("Error creating battle:", error)
    return NextResponse.json(
      { error: "Failed to create battle" },
      { status: 500 }
    )
  }
}
