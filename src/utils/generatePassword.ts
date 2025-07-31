import { randomBytes } from 'crypto';

/**
 * Generates a secure random password
 * @returns A secure random password string
 */
export function generateSecurePassword(): string {
  const length = 16;
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
  let password = '';
  
  // Ensure at least one of each character type
  password += 'A'; // uppercase
  password += 'a'; // lowercase
  password += '0'; // number
  password += '!'; // special char
  
  // Fill the rest with random characters
  const randomBytesBuffer = randomBytes(length - 4);
  for (let i = 0; i < length - 4; i++) {
    const randomIndex = randomBytesBuffer[i] % charset.length;
    password += charset[randomIndex];
  }
  
  // Shuffle the password
  return password.split('').sort(() => Math.random() - 0.5).join('');
} 