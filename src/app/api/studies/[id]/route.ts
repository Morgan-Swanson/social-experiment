import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const study = await prisma.study.findUnique({
      where: { id: params.id },
      include: {
        dataset: true,
        modelConstraint: true,
        classifiers: {
          include: {
            classifier: true,
          },
        },
      },
    });

    if (!study) {
      return NextResponse.json({ error: 'Study not found' }, { status: 404 });
    }

    if (study.userId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    return NextResponse.json(study);
  } catch (error) {
    console.error('Study fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch study' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify the study belongs to the user
    const study = await prisma.study.findUnique({
      where: { id: params.id },
      select: { userId: true },
    });

    if (!study) {
      return NextResponse.json({ error: 'Study not found' }, { status: 404 });
    }

    if (study.userId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Delete the study (cascade will handle related records)
    await prisma.study.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Study deletion error:', error);
    return NextResponse.json({ error: 'Failed to delete study' }, { status: 500 });
  }
}