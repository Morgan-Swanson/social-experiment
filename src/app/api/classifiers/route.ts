import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const classifiers = await prisma.classifier.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json(classifiers);
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { name, description, prompt } = body;

    if (!name || !prompt) {
      return NextResponse.json({ error: 'Name and prompt are required' }, { status: 400 });
    }

    const classifier = await prisma.classifier.create({
      data: {
        userId: session.user.id,
        name,
        description,
        prompt,
      },
    });

    return NextResponse.json(classifier);
  } catch (error) {
    console.error('Classifier creation error:', error);
    return NextResponse.json({ error: 'Creation failed' }, { status: 500 });
  }
}