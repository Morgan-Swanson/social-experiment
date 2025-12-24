import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { encryptApiKey } from '@/lib/encryption';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const apiKeys = await prisma.apiKey.findMany({
    where: { userId: session.user.id },
    select: {
      id: true,
      provider: true,
      keyPreview: true,
      createdAt: true,
      lastUsedAt: true,
    },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json(apiKeys);
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { provider, apiKey } = body;

    if (!provider || !apiKey) {
      return NextResponse.json({ error: 'Provider and API key required' }, { status: 400 });
    }

    // Encrypt the API key for secure storage
    const encryptedKey = encryptApiKey(apiKey);
    const keyPreview = apiKey.slice(-4);

    const newApiKey = await prisma.apiKey.create({
      data: {
        userId: session.user.id,
        provider,
        keyHash: encryptedKey, // Using keyHash field to store encrypted key
        keyPreview,
      },
    });

    return NextResponse.json({
      id: newApiKey.id,
      provider: newApiKey.provider,
      keyPreview: newApiKey.keyPreview,
    });
  } catch (error) {
    console.error('API key creation error:', error);
    return NextResponse.json({ error: 'Creation failed' }, { status: 500 });
  }
}