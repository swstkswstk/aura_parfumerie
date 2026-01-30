
import { User } from '../types';

// Mock database simulation
const MOCK_ADMIN_EMAILS = ['admin@aura.com', 'concierge@aura.com'];

export interface AuthResponse {
  success: boolean;
  message?: string;
  user?: User;
  demoCode?: string; // For demonstration purposes only
  demoToken?: string; // For magic link simulation
}

// Simulate sending a code via a provider (Phone/OTP)
export const sendOtp = async (
  channel: 'whatsapp' | 'telegram', 
  identifier: string
): Promise<{ success: boolean; code?: string; error?: string }> => {
  
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 1500));

  // Basic validation
  if (!identifier) {
    return { success: false, error: 'Identifier is required' };
  }

  // Generate a 6-digit code
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  
  // Log for debugging
  console.log(`[Auth Service] Sent code ${code} to ${identifier} via ${channel}`);

  return { success: true, code };
};

// Simulate sending a Magic Link (Email Confirmation)
export const sendMagicLink = async (
  email: string
): Promise<{ success: boolean; token?: string; error?: string }> => {
  await new Promise(resolve => setTimeout(resolve, 1500));

  if (!email.includes('@')) {
    return { success: false, error: 'Invalid email address' };
  }

  // Generate a mock token
  const token = `auth_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  console.log(`[Auth Service] Sent Magic Link to ${email} with token ${token}`);

  return { success: true, token };
};

// Verify OTP (Phone)
export const verifyOtpAndLogin = async (
  identifier: string, 
  inputCode: string, 
  actualCode: string
): Promise<AuthResponse> => {
  
  await new Promise(resolve => setTimeout(resolve, 1500));

  if (inputCode !== actualCode && inputCode !== '000000') { 
    return { success: false, message: 'Invalid verification code' };
  }

  return generateUserSession(identifier);
};

// Verify Magic Link Token (Email)
export const verifyMagicToken = async (
  email: string,
  token: string
): Promise<AuthResponse> => {
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // In a real app, we would validate the token against the DB
  if (!token || !token.startsWith('auth_')) {
    return { success: false, message: 'Invalid or expired activation link' };
  }

  return generateUserSession(email);
};

// Helper to generate user object
const generateUserSession = (identifier: string): AuthResponse => {
  // Determine user role based on identifier (Mock logic)
  const isAdmin = 
    MOCK_ADMIN_EMAILS.includes(identifier.toLowerCase()) || 
    identifier.includes('admin') ||
    identifier === '+15550000000';

  const user: User = {
    id: `u_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    name: identifier.split('@')[0] || 'Valued Client',
    role: isAdmin ? 'admin' : 'customer',
    email: identifier.includes('@') ? identifier : undefined,
    phone: identifier.includes('@') ? undefined : identifier,
    avatar: `https://ui-avatars.com/api/?name=${identifier.replace(/[^a-zA-Z0-9]/g, '')}&background=53423d&color=f0ede9`
  };

  return { success: true, user };
};
