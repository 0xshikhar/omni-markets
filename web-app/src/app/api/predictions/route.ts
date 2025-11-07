import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const userId = searchParams.get("user")
    const postId = searchParams.get("postId")

    const where: any = {}
    
    if (userId) {
      where.userId = userId
    }
    
    if (postId) {
      where.postId = postId
    }

    const predictions = await prisma.prediction.findMany({
      where,
      include: {
        post: {
          select: {
            marketId: true,
            question: true,
            isResolved: true,
            winningOutcome: true,
            closeTime: true,
          },
        },
        user: {
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
    })

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
    const { postId, userId, outcome, amount, potentialWin } = body

    const prediction = await prisma.prediction.create({
      data: {
        postId,
        userId,
        outcome,
        amount,
        potentialWin: potentialWin || amount,
      },
      include: {
        post: {
          select: {
            marketId: true,
            question: true,
          },
        },
        user: {
          select: {
            walletAddress: true,
            username: true,
            avatar: true,
          },
        },
      },
    })

    return NextResponse.json({ prediction }, { status: 201 })
  } catch (error) {
    console.error("Error creating prediction:", error)
    return NextResponse.json(
      { error: "Failed to create prediction" },
      { status: 500 }
    )
  }
}
