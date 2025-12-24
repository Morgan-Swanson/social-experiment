import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import Papa from 'papaparse';

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
        classifiers: {
          include: {
            classifier: true,
          },
        },
      },
    });

    if (!study || study.userId !== session.user.id) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    // Transform results to CSV format
    const rows = study.results.map(result => {
      const row: any = { ...result.rowData };
      
      // Add classification scores
      const classifications = result.classifications as any;
      for (const [classifierId, classification] of Object.entries(classifications)) {
        const classifier = study.classifiers.find(sc => sc.classifier.id === classifierId);
        if (classifier) {
          row[`${classifier.classifier.name}_classification`] = (classification as any).reasoning || '';
          row[`${classifier.classifier.name}_confidence`] = (classification as any).score || 0;
        }
      }
      
      return row;
    });

    const csv = Papa.unparse(rows);

    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="study-${params.id}.csv"`,
      },
    });
  } catch (error) {
    console.error('Export error:', error);
    return NextResponse.json({ error: 'Export failed' }, { status: 500 });
  }
}