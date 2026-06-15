import nodemailer from 'nodemailer';
import { APP_CONFIG } from '@boldmeet/shared';

const OTP_EXPIRY_MINUTES = Number(process.env.OTP_EXPIRY_MINUTES || 10);

export function getOtpExpiryDate(): Date {
  return new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);
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

  if (process.env.NODE_ENV !== 'production' && !process.env.SMTP_HOST) {
    console.log(`[OTP] ${email}: ${code}`);
    return;
  }

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === 'true',
    auth: process.env.SMTP_USER
      ? {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        }
      : undefined,
  });

  await transporter.sendMail({
    from: process.env.SMTP_FROM || `${APP_CONFIG.name} <noreply@${APP_CONFIG.domain}>`,
    to: email,
    subject,
    text,
  });
}
