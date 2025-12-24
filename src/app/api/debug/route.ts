import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    runtime: process.env.NEXT_RUNTIME,
    nodeEnv: process.env.NODE_ENV,
    hasNextAuthSecret: !!process.env.NEXTAUTH_SECRET,
    hasNextAuthUrl: !!process.env.NEXTAUTH_URL,
    hasDatabaseUrl: !!process.env.DATABASE_URL,
    allEnvKeys: Object.keys(process.env).filter(key => 
      !key.includes('AWS_') && !key.includes('PATH')
    ),
  });
}

export const runtime = 'nodejs';