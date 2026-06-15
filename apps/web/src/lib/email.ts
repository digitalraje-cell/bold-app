import nodemailer from 'nodemailer';
import { APP_CONFIG } from '@boldmeet/shared';

const OTP_EXPIRY_MINUTES = Number(process.env.OTP_EXPIRY_MINUTES || 10);

export function getOtpExpiryDate(): Date {
  return new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);
}

function isSmtpConfigured(): boolean {
  return Boolean(process.env.SMTP_HOST?.trim());
}

function createTransporter() {
  const port = Number(process.env.SMTP_PORT || 587);
  const secure =
    process.env.SMTP_SECURE === 'true' || String(port) === '465';

  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port,
    secure,
    auth: process.env.SMTP_USER
      ? {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        }
      : undefined,
  });
}

export async function sendOtpEmail(email: string, code: string): Promise<void> {
  const subject = `${APP_CONFIG.name} verification code: ${code}`;
  const text = [
    `Your ${APP_CONFIG.name} verification code is: ${code}`,
    '',
    `This code expires in ${OTP_EXPIRY_MINUTES} minutes.`,
    '',
    'If you did not request this, you can ignore this email.',
  ].join('\n');

  if (!isSmtpConfigured()) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('SMTP is not configured on the web service');
    }
    console.log(`[otp-email] SMTP not configured — dev code for ${email}: ${code}`);
    return;
  }

  const transporter = createTransporter();

  try {
    await transporter.verify();
  } catch (error) {
    console.error('[otp-email] SMTP connection verify failed', {
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      error: error instanceof Error ? error.message : error,
    });
    throw new Error('SMTP connection failed');
  }

  const from =
    process.env.SMTP_FROM || `${APP_CONFIG.name} <noreply@${APP_CONFIG.domain}>`;

  await transporter.sendMail({
    from,
    to: email,
    subject,
    text,
  });

  console.log('[otp-email] sent successfully', { to: email, from });
}
