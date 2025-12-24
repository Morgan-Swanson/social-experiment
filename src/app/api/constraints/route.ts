import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const constraints = await prisma.modelConstraint.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json(constraints);
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { name, description, rules } = body;

    if (!name || !rules) {
      return NextResponse.json({ error: 'Name and rules are required' }, { status: 400 });
    }

    const constraint = await prisma.modelConstraint.create({
      data: {
        userId: session.user.id,
        name,
        description,
        rules,
      },
    });

    return NextResponse.json(constraint);
  } catch (error) {
    console.error('Constraint creation error:', error);
    return NextResponse.json({ error: 'Creation failed' }, { status: 500 });
  }
}