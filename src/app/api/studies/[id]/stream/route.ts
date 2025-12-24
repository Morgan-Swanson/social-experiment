import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

// In-memory store for study streams
const streamListeners = new Map<string, Set<(data: any) => void>>();

export function registerStreamListener(studyId: string, callback: (data: any) => void) {
  if (!streamListeners.has(studyId)) {
    streamListeners.set(studyId, new Set());
  }
  streamListeners.get(studyId)!.add(callback);
  
  return () => {
    const listeners = streamListeners.get(studyId);
    if (listeners) {
      listeners.delete(callback);
      if (listeners.size === 0) {
        streamListeners.delete(studyId);
      }
    }
  };
}

export function emitStreamEvent(studyId: string, data: any) {
  const listeners = streamListeners.get(studyId);
  if (listeners) {
    listeners.forEach(callback => callback(data));
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  // Verify study exists (auth will be handled by middleware)
  const study = await prisma.study.findUnique({
    where: { id: params.id },
  });

  if (!study) {
    return new Response('Not found', { status: 404 });
  }

  // Create SSE response
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    start(controller) {
      // Send initial connection message
      const initData = `data: ${JSON.stringify({ type: 'connected', studyId: params.id })}\n\n`;
      controller.enqueue(encoder.encode(initData));

      // Register listener for this study
      const unregister = registerStreamListener(params.id, (data) => {
        const message = `data: ${JSON.stringify(data)}\n\n`;
        try {
          controller.enqueue(encoder.encode(message));
        } catch (error) {
          // Client disconnected
          unregister();
        }
      });

      // Cleanup on close
      request.signal.addEventListener('abort', () => {
        unregister();
        controller.close();
      });
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}