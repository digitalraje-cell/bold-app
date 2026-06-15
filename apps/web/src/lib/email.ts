import nodemailer from 'nodemailer';
import type SMTPTransport from 'nodemailer/lib/smtp-transport';
import { APP_CONFIG } from '@boldmeet/shared';

/** Read env at request time — bracket access avoids Next.js build-time inlining. */
function runtimeEnv(key: string): string | undefined {
  const value = process.env[key];
  return value?.trim() ? value.trim() : undefined;
}

function getOtpExpiryMinutes(): number {
  return Number(runtimeEnv('OTP_EXPIRY_MINUTES') ?? 10);
}

export function getOtpExpiryDate(): Date {
  return new Date(Date.now() + getOtpExpiryMinutes() * 60 * 1000);
}

function getSmtpPassword(): { pass: string | undefined; passSource: 'SMTP_PASS' | 'SMTP_PASSWORD' | 'none' } {
  const fromPass = runtimeEnv('SMTP_PASS');
  if (fromPass) {
    return { pass: fromPass, passSource: 'SMTP_PASS' };
  }
  const fromPassword = runtimeEnv('SMTP_PASSWORD');
  if (fromPassword) {
    return { pass: fromPassword, passSource: 'SMTP_PASSWORD' };
  }
  return { pass: undefined, passSource: 'none' };
}

export type SmtpConfigSnapshot = {
  host: string | undefined;
  port: number;
  secure: boolean;
  hasUser: boolean;
  hasPass: boolean;
  passSource: 'SMTP_PASS' | 'SMTP_PASSWORD' | 'none';
  from: string;
  nodeEnv: string | undefined;
  railwayService: string | undefined;
};

export function getSmtpConfigSnapshot(): SmtpConfigSnapshot {
  const host = runtimeEnv('SMTP_HOST');
  const port = Number(runtimeEnv('SMTP_PORT') ?? 587);
  const secure =
    runtimeEnv('SMTP_SECURE') === 'true' || String(port) === '465';
  const user = runtimeEnv('SMTP_USER');
  const { pass, passSource } = getSmtpPassword();
  const from =
    runtimeEnv('SMTP_FROM') ||
    `${APP_CONFIG.name} <noreply@${APP_CONFIG.domain}>`;

  return {
    host,
    port,
    secure,
    hasUser: Boolean(user),
    hasPass: Boolean(pass),
    passSource,
    from,
    nodeEnv: process.env.NODE_ENV,
    railwayService: runtimeEnv('RAILWAY_SERVICE_NAME'),
  };
}

function logSmtpConfig(snapshot: SmtpConfigSnapshot): void {
  console.log('[otp-email] effective SMTP config', snapshot);
}

function formatError(error: unknown): { message: string; stack?: string; code?: string } {
  if (error instanceof Error) {
    const smtpError = error as Error & { code?: string; response?: string; responseCode?: number };
    return {
      message: smtpError.message,
      stack: smtpError.stack,
      code: smtpError.code,
    };
  }
  return { message: String(error) };
}

function createTransporter(snapshot: SmtpConfigSnapshot) {
  const user = runtimeEnv('SMTP_USER');
  const { pass } = getSmtpPassword();

  const options = {
    host: snapshot.host,
    port: snapshot.port,
    secure: snapshot.secure,
    // Railway has no IPv6 route to Gmail; force IPv4 DNS + socket.
    family: 4,
    auth: user
      ? {
          user,
          pass,
        }
      : undefined,
  } as SMTPTransport.Options;

  return nodemailer.createTransport(options);
}

export async function sendOtpEmail(email: string, code: string): Promise<void> {
  const snapshot = getSmtpConfigSnapshot();
  logSmtpConfig(snapshot);

  const otpExpiryMinutes = getOtpExpiryMinutes();
  const subject = `${APP_CONFIG.name} verification code: ${code}`;
  const text = [
    `Your ${APP_CONFIG.name} verification code is: ${code}`,
    '',
    `This code expires in ${otpExpiryMinutes} minutes.`,
    '',
    'If you did not request this, you can ignore this email.',
  ].join('\n');

  if (!snapshot.host) {
    if (process.env.NODE_ENV === 'production') {
      console.error('[otp-email] SMTP_HOST missing at runtime — check Railway env on web service');
      throw new Error('SMTP is not configured on the web service');
    }
    console.log(`[otp-email] SMTP not configured — dev code for ${email}: ${code}`);
    return;
  }

  if (!snapshot.hasPass && snapshot.hasUser) {
    console.error('[otp-email] SMTP_USER set but neither SMTP_PASS nor SMTP_PASSWORD is set');
  }

  const transporter = createTransporter(snapshot);

  try {
    await transporter.verify();
    console.log('[otp-email] SMTP transporter.verify() succeeded', {
      host: snapshot.host,
      port: snapshot.port,
      secure: snapshot.secure,
      family: 4,
    });
  } catch (error) {
    const details = formatError(error);
    console.error('[otp-email] SMTP transporter.verify() failed', {
      ...snapshot,
      error: details.message,
      code: details.code,
      stack: details.stack,
    });
    throw new Error(`SMTP connection failed: ${details.message}`);
  }

  try {
    const info = await transporter.sendMail({
      from: snapshot.from,
      to: email,
      subject,
      text,
    });

    console.log('[otp-email] sendMail() succeeded', {
      to: email,
      from: snapshot.from,
      messageId: info.messageId,
      accepted: info.accepted,
      rejected: info.rejected,
      response: info.response,
    });
  } catch (error) {
    const details = formatError(error);
    console.error('[otp-email] sendMail() failed', {
      ...snapshot,
      to: email,
      error: details.message,
      code: details.code,
      stack: details.stack,
    });
    throw error;
  }
}
