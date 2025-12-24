import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const studies = await prisma.study.findMany({
    where: { userId: session.user.id },
    include: {
      dataset: true,
      classifiers: {
        include: {
          classifier: true,
        },
      },
      constraints: {
        include: {
          constraint: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json(studies);
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { datasetId, classifierIds, constraintIds, modelProvider, modelName, temperature, sampleSize } = body;

    if (!datasetId || !classifierIds || classifierIds.length === 0) {
      return NextResponse.json(
        { error: 'Dataset and at least one classifier required' },
        { status: 400 }
      );
    }

    // Create study
    const study = await prisma.study.create({
      data: {
        userId: session.user.id,
        name: `Study ${new Date().toISOString()}`,
        datasetId,
        modelProvider,
        modelName,
        temperature: temperature ?? 0.0,
        sampleSize,
        status: 'draft',
      },
    });

    // Link classifiers
    await prisma.studyClassifier.createMany({
      data: classifierIds.map((classifierId: string) => ({
        studyId: study.id,
        classifierId,
      })),
    });

    // Link constraints
    if (constraintIds && constraintIds.length > 0) {
      await prisma.studyConstraint.createMany({
        data: constraintIds.map((constraintId: string) => ({
          studyId: study.id,
          constraintId,
        })),
      });
    }

    // Trigger async processing (in real implementation, use a queue)
    fetch(`${process.env.NEXTAUTH_URL}/api/studies/${study.id}/process`, {
      method: 'POST',
    }).catch(console.error);

    return NextResponse.json(study);
  } catch (error) {
    console.error('Study creation error:', error);
    return NextResponse.json({ error: 'Creation failed' }, { status: 500 });
  }
}