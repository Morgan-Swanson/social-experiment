import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Track if secrets have been loaded
let secretsLoaded = false;

export async function middleware(request: NextRequest) {
  // Only fetch secrets once per Lambda container
  if (!secretsLoaded && process.env.NODE_ENV === 'production') {
    try {
      // Dynamically import secrets module to avoid edge runtime issues
      const { getDatabaseUrl, getNextAuthSecret } = await import('./src/lib/secrets');
      
      console.log('Fetching secrets from AWS Secrets Manager...');
      
      const [databaseUrl, nextAuthSecret] = await Promise.all([
        getDatabaseUrl(),
        getNextAuthSecret(),
      ]);
      
      process.env.DATABASE_URL = databaseUrl;
      process.env.NEXTAUTH_SECRET = nextAuthSecret;
      
      secretsLoaded = true;
      console.log('Secrets loaded successfully');
    } catch (error) {
      console.error('Failed to load secrets:', error);
      // Don't block requests, but log the error
    }
  }
  
  return NextResponse.next();
}

// Run middleware on all routes
export const config = {
  matcher: '/((?!_next/static|_next/image|favicon.ico).*)',
};