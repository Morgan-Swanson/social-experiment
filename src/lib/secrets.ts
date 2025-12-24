import { SecretsManagerClient, GetSecretValueCommand } from '@aws-sdk/client-secrets-manager';

const client = new SecretsManagerClient({ region: process.env.AWS_REGION || 'us-east-1' });

// Cache secrets to avoid repeated API calls
const secretCache = new Map<string, string>();

export async function getSecret(secretName: string): Promise<string> {
  // Return cached value if available
  if (secretCache.has(secretName)) {
    return secretCache.get(secretName)!;
  }

  try {
    const command = new GetSecretValueCommand({ SecretId: secretName });
    const response = await client.send(command);
    const secretValue = response.SecretString || '';
    
    // Cache the secret
    secretCache.set(secretName, secretValue);
    
    return secretValue;
  } catch (error) {
    console.error(`Failed to fetch secret ${secretName}:`, error);
    throw new Error(`Failed to fetch secret: ${secretName}`);
  }
}

export async function getDatabaseUrl(): Promise<string> {
  // Check environment variable first (for local development)
  if (process.env.DATABASE_URL) {
    return process.env.DATABASE_URL;
  }
  
  // Fetch from Secrets Manager (for production)
  return getSecret('social-experiment/database-url');
}

export async function getNextAuthSecret(): Promise<string> {
  // Check environment variable first (for local development)
  if (process.env.NEXTAUTH_SECRET) {
    return process.env.NEXTAUTH_SECRET;
  }
  
  // Fetch from Secrets Manager (for production)
  return getSecret('social-experiment/nextauth-secret');
}