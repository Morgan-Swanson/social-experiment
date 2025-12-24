import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { createStorageAdapter } from '@/lib/adapters/storage';
import Papa from 'papaparse';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const datasets = await prisma.dataset.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json(datasets);
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Read and parse CSV
    const text = await file.text();
    const parseResult = Papa.parse(text, { header: true, skipEmptyLines: true });

    if (parseResult.errors.length > 0) {
      return NextResponse.json({ error: 'Invalid CSV file' }, { status: 400 });
    }

    const columns = parseResult.meta.fields || [];
    const rowCount = parseResult.data.length;

    // Upload to storage
    const storage = createStorageAdapter();
    const storageKey = `datasets/${session.user.id}/${Date.now()}-${file.name}`;
    const buffer = Buffer.from(text);
    await storage.uploadFile(storageKey, buffer, 'text/csv');

    // Create database record
    const dataset = await prisma.dataset.create({
      data: {
        userId: session.user.id,
        name: file.name,
        filename: file.name,
        storageKey,
        rowCount,
        columns,
      },
    });

    return NextResponse.json(dataset);
  } catch (error) {
    console.error('Dataset upload error:', error);
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
}