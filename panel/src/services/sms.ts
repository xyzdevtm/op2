import crypto from 'crypto';

// In-memory verification codes
const verificationCodes = new Map<string, { code: string; expiresAt: number; phone: string }>();

const CODE_LENGTH = 5;
const CODE_EXPIRY_MS = 3 * 60 * 1000; // 3 minutes
const SANDBOX_MODE = process.env.SANDBOX_MODE === 'true';
const SANDBOX_TEMPLATE_ID = 123456;

/**
 * Generate a verification code for a phone number
 */
export function generateVerificationCode(phone: string): string {
  const code = Array.from({ length: CODE_LENGTH }, () =>
    Math.floor(Math.random() * 10).toString()
  ).join('');

  verificationCodes.set(phone, {
    code,
    expiresAt: Date.now() + CODE_EXPIRY_MS,
    phone,
  });

  return code;
}

/**
 * Verify a phone code
 */
export function verifyCode(phone: string, code: string): { success: boolean; error?: string } {
  const stored = verificationCodes.get(phone);

  if (!stored) {
    return { success: false, error: 'No verification code found. Please request a new one.' };
  }

  if (Date.now() > stored.expiresAt) {
    verificationCodes.delete(phone);
    return { success: false, error: 'Verification code has expired. Please request a new one.' };
  }

  if (stored.code !== code) {
    return { success: false, error: 'Invalid verification code.' };
  }

  verificationCodes.delete(phone);
  return { success: true };
}

/**
 * Send SMS via sms.ir API
 * Sandbox mode: calls sms.ir with sandbox key + default template (123456)
 * Production mode: calls sms.ir with production key + custom template
 */
export async function sendVerificationSMS(phone: string, code: string): Promise<{ success: boolean; error?: string }> {
  try {
    const apiKey = process.env.SMS_IR_API_KEY;
    const templateId = SANDBOX_MODE ? SANDBOX_TEMPLATE_ID : parseInt(process.env.SMS_IR_TEMPLATE_ID || '0');

    if (!apiKey) {
      console.error('[SMS] Missing SMS_IR_API_KEY');
      return { success: false, error: 'SMS service not configured' };
    }

    if (!SANDBOX_MODE && !process.env.SMS_IR_TEMPLATE_ID) {
      console.error('[SMS] Missing SMS_IR_TEMPLATE_ID for production mode');
      return { success: false, error: 'SMS service not configured' };
    }

    const body = {
      mobile: phone,
      templateId,
      parameters: [
        { name: 'Code', value: code },
      ],
    };

    console.log(`[SMS] Sending to ${phone} | mode: ${SANDBOX_MODE ? 'SANDBOX' : 'PRODUCTION'} | template: ${templateId}`);

    // In sandbox mode, also log the code to console for testing
    if (SANDBOX_MODE) {
      console.log(`\n========================================`);
      console.log(`[SMS SANDBOX] Phone: ${phone}`);
      console.log(`[SMS SANDBOX] Code: ${code}`);
      console.log(`[SMS SANDBOX] Template ID: ${templateId}`);
      console.log(`========================================\n`);
    }

    const response = await fetch('https://api.sms.ir/v1/send/verify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'text/plain',
        'x-api-key': apiKey,
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    if (data.status === 1) {
      console.log(`[SMS] Sent to ${phone}, messageId: ${data.data?.messageId}`);
      return { success: true };
    } else {
      console.error(`[SMS] sms.ir error: status=${data.status}, message=${data.message}`);
      return { success: false, error: data.message || 'Failed to send SMS' };
    }
  } catch (error: any) {
    console.error('[SMS] Send error:', error.message || error);
    return { success: false, error: 'SMS service unavailable' };
  }
}

/**
 * Check if phone is already registered
 */
export async function isPhoneRegistered(phone: string): Promise<boolean> {
  const { User } = await import('../db/models/User.js');
  const existing = await User.findOne({ phone });
  return !!existing;
}

/**
 * Get remaining cooldown for resending code (in seconds)
 */
export function getResendCooldown(phone: string): number {
  const stored = verificationCodes.get(phone);
  if (!stored) return 0;

  const elapsed = Date.now() - (stored.expiresAt - CODE_EXPIRY_MS);
  const cooldownMs = 60 * 1000; // 1 minute cooldown between sends
  const remaining = Math.max(0, cooldownMs - elapsed);
  return Math.ceil(remaining / 1000);
}
