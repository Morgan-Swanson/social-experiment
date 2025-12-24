import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const study = await prisma.study.findUnique({
      where: { id: params.id },
      select: {
        status: true,
        currentRow: true,
        totalRows: true,
        progressPercent: true,
        results: {
          select: {
            rowData: true,
            classifications: true,
          },
          orderBy: {
            createdAt: 'asc',
          },
        },
      },
    });

    if (!study) {
      return NextResponse.json({ error: 'Study not found' }, { status: 404 });
    }

    return NextResponse.json(study);
  } catch (error) {
    console.error('Failed to fetch study progress:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}