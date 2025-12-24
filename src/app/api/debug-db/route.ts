import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    // Test database connection
    await prisma.$connect();
    const userCount = await prisma.user.count();
    
    return NextResponse.json({
      status: 'success',
      database: {
        connected: true,
        userCount,
        url: process.env.DATABASE_URL?.replace(/:[^:@]+@/, ':***@') // Mask password
      },
      env: {
        hasDatabaseUrl: !!process.env.DATABASE_URL,
        hasNextAuthSecret: !!process.env.NEXTAUTH_SECRET,
        hasNextAuthUrl: !!process.env.NEXTAUTH_URL,
      }
    });
  } catch (error: any) {
    return NextResponse.json({
      status: 'error',
      error: {
        message: error.message,
        code: error.code,
        stack: error.stack?.split('\n').slice(0, 5)
      },
      database: {
        connected: false,
        url: process.env.DATABASE_URL?.replace(/:[^:@]+@/, ':***@')
      },
      env: {
        hasDatabaseUrl: !!process.env.DATABASE_URL,
        databaseUrlLength: process.env.DATABASE_URL?.length,
        hasNextAuthSecret: !!process.env.NEXTAUTH_SECRET,
        hasNextAuthUrl: !!process.env.NEXTAUTH_URL,
      }
    }, { status: 500 });
  }
}