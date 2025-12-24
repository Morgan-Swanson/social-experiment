import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { createStorageAdapter } from '@/lib/adapters/storage';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const dataset = await prisma.dataset.findUnique({
      where: { id: params.id },
    });

    if (!dataset || dataset.userId !== session.user.id) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    // Get file from storage
    const storage = createStorageAdapter();
    const fileBuffer = await storage.getFile(dataset.storageKey);

  // Return file as download
  return new NextResponse(fileBuffer.toString(), {
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename="${dataset.filename}"`,
    },
  });
  } catch (error) {
    console.error('Dataset download error:', error);
    return NextResponse.json({ error: 'Download failed' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const dataset = await prisma.dataset.findUnique({
      where: { id: params.id },
    });

    if (!dataset || dataset.userId !== session.user.id) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    // Delete from storage
    const storage = createStorageAdapter();
    await storage.deleteFile(dataset.storageKey);

    // Delete from database
    await prisma.dataset.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Dataset delete error:', error);
    return NextResponse.json({ error: 'Delete failed' }, { status: 500 });
  }
}