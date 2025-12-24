import { describe, it, expect, beforeEach } from 'vitest';
import { encryptApiKey, decryptApiKey } from '../encryption';

describe('Encryption utilities', () => {
  const testApiKey = 'sk-test-1234567890abcdefghijklmnopqrstuvwxyz';

  it('should encrypt and decrypt API keys correctly', () => {
    const encrypted = encryptApiKey(testApiKey);
    const decrypted = decryptApiKey(encrypted);
    
    expect(decrypted).toBe(testApiKey);
    expect(encrypted).not.toBe(testApiKey);
  });

  it('should produce different encrypted values for the same key', () => {
    const encrypted1 = encryptApiKey(testApiKey);
    const encrypted2 = encryptApiKey(testApiKey);
    
    // Different IVs mean different encrypted values
    expect(encrypted1).not.toBe(encrypted2);
    
    // But both decrypt to the same value
    expect(decryptApiKey(encrypted1)).toBe(testApiKey);
    expect(decryptApiKey(encrypted2)).toBe(testApiKey);
  });

  it('should handle empty strings', () => {
    const encrypted = encryptApiKey('');
    const decrypted = decryptApiKey(encrypted);
    
    expect(decrypted).toBe('');
  });

  it('should handle special characters', () => {
    const specialKey = 'sk-test!@#$%^&*()_+-=[]{}|;:,.<>?';
    const encrypted = encryptApiKey(specialKey);
    const decrypted = decryptApiKey(encrypted);
    
    expect(decrypted).toBe(specialKey);
  });

  it('should throw error for invalid encrypted data', () => {
    expect(() => decryptApiKey('invalid-data')).toThrow();
  });
});