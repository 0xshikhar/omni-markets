import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'active';
    const limit = parseInt(searchParams.get('limit') || '50');

    const disputes = await prisma.dispute.findMany({
      where: {
        status
      },
      include: {
        market: {
          select: {
            question: true,
            category: true
          }
        },
        votes: true
      },
      orderBy: {
        submittedAt: 'desc'
      },
      take: limit
    });

    // Calculate vote counts
    const disputesWithVotes = disputes.map(dispute => ({
      ...dispute,
      votesFor: dispute.votes.filter(v => v.support).length,
      votesAgainst: dispute.votes.filter(v => !v.support).length
    }));

    return NextResponse.json(disputesWithVotes);
  } catch (error) {
    console.error('[API] Get disputes error:', error);
    return NextResponse.json({ error: 'Failed to fetch disputes' }, { status: 500 });
  }
}
