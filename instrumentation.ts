// This file runs once when the Next.js server starts
// It fetches secrets from AWS Secrets Manager and sets them in process.env
// This allows all libraries (Prisma, NextAuth, etc.) to work normally

export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    // Only run on the server, not in edge runtime
    const { getDatabaseUrl, getNextAuthSecret } = await import('./src/lib/secrets');
    
    try {
      // Fetch secrets and populate process.env
      console.log('Fetching secrets from AWS Secrets Manager...');
      
      const [databaseUrl, nextAuthSecret] = await Promise.all([
        getDatabaseUrl(),
        getNextAuthSecret(),
      ]);
      
      process.env.DATABASE_URL = databaseUrl;
      process.env.NEXTAUTH_SECRET = nextAuthSecret;
      
      console.log('Secrets loaded successfully');
    } catch (error) {
      console.error('Failed to load secrets:', error);
      // In production, secrets are required
      if (process.env.NODE_ENV === 'production') {
        throw error;
      }
    }
  }
}