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
      },
    });

    if (!study) {
      return NextResponse.json({ error: 'Study not found' }, { status: 404 });
    }

    return NextResponse.json({
      status: study.status,
      currentRow: study.currentRow,
      totalRows: study.totalRows,
      progressPercent: study.progressPercent,
    });
  } catch (error) {
    console.error('Progress fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch progress' }, { status: 500 });
  }
}