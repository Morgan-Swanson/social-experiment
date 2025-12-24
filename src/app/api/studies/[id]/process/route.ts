import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createStorageAdapter } from '@/lib/adapters/storage';
import { createAIProvider } from '@/lib/adapters/ai-provider';
import { decryptApiKey } from '@/lib/encryption';
import Papa from 'papaparse';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const study = await prisma.study.findUnique({
      where: { id: params.id },
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
        user: {
          include: {
            apiKeys: {
              where: {
                provider: 'openai',
              },
            },
          },
        },
      },
    });

    if (!study) {
      return NextResponse.json({ error: 'Study not found' }, { status: 404 });
    }

    // Update status to running and increment run number if re-running
    const isRerun = study.status === 'completed' || study.status === 'failed';
    await prisma.study.update({
      where: { id: params.id },
      data: { 
        status: 'running', 
        startedAt: new Date(),
        runNumber: isRerun ? (study.runNumber || 1) + 1 : (study.runNumber || 1),
        currentRow: 0,
        totalRows: 0,
        progressPercent: 0,
      },
    });

    // Get API key
    const apiKey = study.user.apiKeys[0];
    if (!apiKey) {
      await prisma.study.update({
        where: { id: params.id },
        data: { 
          status: 'failed',
          errorMessage: 'No API key configured. Please add an OpenAI API key in your account settings.',
        },
      });
      return NextResponse.json({ error: 'No API key configured' }, { status: 400 });
    }

    // Fetch dataset from storage
    const storage = createStorageAdapter();
    const csvBuffer = await storage.getFile(study.dataset.storageKey);
    const csvText = csvBuffer.toString('utf-8');
    const parseResult = Papa.parse(csvText, { header: true, skipEmptyLines: true });

    // Get sample of data
    const sampleData = study.sampleSize
      ? parseResult.data.slice(0, study.sampleSize)
      : parseResult.data;

    // Initialize AI provider with decrypted key
    const decryptedKey = decryptApiKey(apiKey.keyHash);
    const aiProvider = createAIProvider({
      apiKey: decryptedKey,
      model: study.modelName,
    });

    // Prepare classifiers for batch processing
    const classifierPrompts = study.classifiers.map(sc => ({
      id: sc.classifier.id,
      prompt: sc.classifier.prompt,
    }));

    // Merge multiple constraint rules
    const constraints = study.constraints
      .map(sc => sc.constraint.rules)
      .filter(Boolean)
      .join('\n\n');

    // Process rows with parallel batching
    const totalRows = sampleData.length;
    const CONCURRENCY_LIMIT = 5; // Process 5 rows at a time
    
    // Update total rows
    await prisma.study.update({
      where: { id: params.id },
      data: { totalRows },
    });
    
    let completedRows = 0;
    
    // Process rows in batches with controlled concurrency
    const processBatch = async (batchRows: any[], startIndex: number) => {
      const promises = batchRows.map(async (row, batchIdx) => {
        const globalIdx = startIndex + batchIdx;
        const textColumn = Object.values(row).find(v => typeof v === 'string' && v.length > 10);
        const text = textColumn?.toString() || '';

        // Batch classify with all classifiers
        const classifications = await aiProvider.batchClassify(
          text,
          classifierPrompts,
          constraints,
          study.temperature
        );

        const result = {
          studyId: study.id,
          rowId: row.id || JSON.stringify(row),
          rowData: row,
          classifications,
        };
        
        // Save result immediately to database
        await prisma.studyResult.create({
          data: result,
        });
        
        return result;
      });
      
      const batchResults = await Promise.all(promises);
      
      // Update progress after batch completes
      completedRows += batchRows.length;
      const progressPercent = (completedRows / totalRows) * 100;
      await prisma.study.update({
        where: { id: params.id },
        data: {
          currentRow: completedRows,
          progressPercent,
        },
      });
      
      return batchResults;
    };
    
    // Process all rows in batches
    const results = [];
    for (let i = 0; i < sampleData.length; i += CONCURRENCY_LIMIT) {
      const batch = sampleData.slice(i, Math.min(i + CONCURRENCY_LIMIT, sampleData.length));
      const batchResults = await processBatch(batch, i);
      results.push(...batchResults);
    }

    // Update study status
    await prisma.study.update({
      where: { id: params.id },
      data: {
        status: 'completed',
        completedAt: new Date(),
        progressPercent: 100,
      },
    });

    return NextResponse.json({ success: true, resultsCount: results.length });
  } catch (error) {
    console.error('Study processing error:', error);
    
    // Capture detailed error message
    const errorMessage = error instanceof Error 
      ? `${error.name}: ${error.message}${error.stack ? '\n\nStack trace:\n' + error.stack : ''}`
      : 'An unknown error occurred during processing';
    
    // Update study status to failed with error details
    await prisma.study.update({
      where: { id: params.id },
      data: { 
        status: 'failed',
        errorMessage,
      },
    });

    return NextResponse.json({ error: 'Processing failed', details: errorMessage }, { status: 500 });
  }
}