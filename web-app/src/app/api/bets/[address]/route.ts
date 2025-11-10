import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(
  request: Request,
  { params }: { params: { address: string } }
) {
  try {
    const betSlips = await prisma.betSlip.findMany({
      where: {
        user: params.address.toLowerCase()
      },
      include: {
        markets: {
          include: {
            market: {
              include: {
                externalMarkets: true
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json(betSlips);
  } catch (error) {
    console.error('[API] Get bets error:', error);
    return NextResponse.json({ error: 'Failed to fetch bets' }, { status: 500 });
  }
}