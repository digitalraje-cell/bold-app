import { Resend } from 'resend';
import { APP_CONFIG } from '@boldmeet/shared';

const DEV_OTP_EMAIL_FROM = 'onboarding@resend.dev';
const OTP_EMAIL_SUBJECT = `Your ${APP_CONFIG.name} login code`;

/** Read env at request time — bracket access avoids Next.js build-time inlining. */
function runtimeEnv(key: string): string | undefined {
  const value = process.env[key];
  return value?.trim() ? value.trim() : undefined;
}

function getOtpEmailFrom(): string {
  const from = runtimeEnv('EMAIL_FROM');
  if (from) {
    return from;
  }
  if (process.env.NODE_ENV !== 'production') {
    return DEV_OTP_EMAIL_FROM;
  }
  throw new Error('EMAIL_FROM missing at runtime — check Railway env on web service');
}

function getOtpExpiryMinutes(): number {
  return Number(runtimeEnv('OTP_EXPIRY_MINUTES') ?? 10);
}

export function getOtpExpiryDate(): Date {
  return new Date(Date.now() + getOtpExpiryMinutes() * 60 * 1000);
}

function buildOtpEmailHtml(code: string, expiryMinutes: number): string {
  const appName = APP_CONFIG.name;
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${OTP_EMAIL_SUBJECT}</title>
</head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f4f4f5;">
    <tr>
      <td align="center" style="padding:40px 16px;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:480px;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
          <tr>
            <td style="background:#111111;padding:32px 24px;text-align:center;">
              <h1 style="margin:0;color:#ffffff;font-size:26px;font-weight:700;letter-spacing:-0.5px;">${appName}</h1>
              <p style="margin:8px 0 0;color:#9ca3af;font-size:14px;">Verify your account</p>
            </td>
          </tr>
          <tr>
            <td style="padding:32px 24px;">
              <p style="margin:0 0 16px;color:#374151;font-size:16px;line-height:1.5;">
                Use the verification code below to complete your ${appName} account setup.
              </p>
              <div style="margin:24px 0;padding:20px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;text-align:center;">
                <p style="margin:0 0 8px;color:#64748b;font-size:12px;font-weight:600;letter-spacing:0.08em;text-transform:uppercase;">Verification code</p>
                <p style="margin:0;color:#111111;font-size:36px;font-weight:700;letter-spacing:0.25em;font-family:ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,monospace;">${code}</p>
              </div>
              <p style="margin:0 0 24px;color:#64748b;font-size:14px;line-height:1.5;text-align:center;">
                This code expires in <strong style="color:#374151;">${expiryMinutes} minutes</strong>.
              </p>
              <p style="margin:0;color:#94a3b8;font-size:13px;line-height:1.5;">
                If you did not request this code, you can safely ignore this email.
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:20px 24px;background:#f8fafc;border-top:1px solid #e2e8f0;text-align:center;">
              <p style="margin:0;color:#94a3b8;font-size:12px;">
                &copy; ${new Date().getFullYear()} ${appName} &middot; ${APP_CONFIG.supportEmail}
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function buildOtpEmailText(code: string, expiryMinutes: number): string {
  return [
    `${APP_CONFIG.name} — Verify your account`,
    '',
    `Your verification code is: ${code}`,
    '',
    `This code expires in ${expiryMinutes} minutes.`,
    '',
    'If you did not request this, you can ignore this email.',
  ].join('\n');
}

export async function sendOtpEmail(email: string, code: string): Promise<void> {
  console.log('[otp-email] attempting resend send', { email });

  const apiKey = runtimeEnv('RESEND_API_KEY');
  const otpExpiryMinutes = getOtpExpiryMinutes();
  const hasApiKey = Boolean(apiKey);
  const from = getOtpEmailFrom();

  console.log('[otp-email] resend config', {
    email,
    hasApiKey,
    from,
    nodeEnv: process.env.NODE_ENV,
  });

  if (!apiKey) {
    if (process.env.NODE_ENV === 'production') {
      const error = new Error('RESEND_API_KEY missing at runtime — check Railway env on web service');
      console.error('[otp-email] resend failed', error);
      throw error;
    }
    console.log(`[otp-email] RESEND_API_KEY not set — dev code for ${email}: ${code}`);
    return;
  }

  const resend = new Resend(apiKey);

  try {
    const result = await resend.emails.send({
      from,
      to: email,
      subject: OTP_EMAIL_SUBJECT,
      html: buildOtpEmailHtml(code, otpExpiryMinutes),
      text: buildOtpEmailText(code, otpExpiryMinutes),
    });

    if (result.error) {
      console.error('[otp-email] resend failed', result.error);
      throw new Error(result.error.message);
    }

    console.log('[otp-email] resend success', result);
  } catch (error) {
    console.error('[otp-email] resend failed', error);
    throw error;
  }
}

export async function sendContactEmail(input: {
  name: string;
  email: string;
  subject: string;
  message: string;
}): Promise<void> {
  const apiKey = runtimeEnv('RESEND_API_KEY');
  const supportTo = runtimeEnv('CONTACT_INBOX_EMAIL') || runtimeEnv('NEXT_PUBLIC_SUPPORT_EMAIL') || 'support@boldmeet.com';

  const bodyText = [
    `New contact form submission for ${APP_CONFIG.name}`,
    '',
    `Name: ${input.name}`,
    `Email: ${input.email}`,
    `Subject: ${input.subject}`,
    '',
    input.message,
  ].join('\n');

  if (!apiKey) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('RESEND_API_KEY missing — cannot deliver contact form in production');
    }
    console.log('[contact-email] dev mode — message logged', { to: supportTo, ...input });
    return;
  }

  const resend = new Resend(apiKey);
  const from = getOtpEmailFrom();

  const result = await resend.emails.send({
    from,
    to: supportTo,
    replyTo: input.email,
    subject: `[${APP_CONFIG.name} Contact] ${input.subject}`,
    text: bodyText,
  });

  if (result.error) {
    throw new Error(result.error.message);
  }
}
