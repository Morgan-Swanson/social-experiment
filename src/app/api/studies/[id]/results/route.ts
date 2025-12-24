import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const study = await prisma.study.findUnique({
      where: { id: params.id },
      include: {
        results: {
          orderBy: {
            rowId: 'asc',
          },
        },
      },
    });

    if (!study || study.userId !== session.user.id) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    // Return results in streaming format
    const results = study.results.map(result => ({
      rowData: result.rowData,
      classifications: result.classifications,
    }));

    return NextResponse.json(results);
  } catch (error) {
    console.error('Results fetch error:', error);
    return NextResponse.json({ error: 'Fetch failed' }, { status: 500 });
  }
}