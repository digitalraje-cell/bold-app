import { Resend } from 'resend';
import { APP_CONFIG } from '@boldmeet/shared';

const OTP_EMAIL_FROM = 'onboarding@resend.dev';
const OTP_EMAIL_SUBJECT = 'Your BoldMeet Verification Code';

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

function formatError(error: unknown): { message: string; stack?: string } {
  if (error instanceof Error) {
    return { message: error.message, stack: error.stack };
  }
  return { message: String(error) };
}

function buildOtpEmailHtml(code: string, expiryMinutes: number): string {
  const appName = 'BoldMeet';
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
            <td style="background:linear-gradient(135deg,#1e1b4b 0%,#4338ca 100%);padding:32px 24px;text-align:center;">
              <h1 style="margin:0;color:#ffffff;font-size:26px;font-weight:700;letter-spacing:-0.5px;">${appName}</h1>
              <p style="margin:8px 0 0;color:#c7d2fe;font-size:14px;">Verify your account</p>
            </td>
          </tr>
          <tr>
            <td style="padding:32px 24px;">
              <p style="margin:0 0 16px;color:#374151;font-size:16px;line-height:1.5;">
                Use the verification code below to complete your ${appName} account setup.
              </p>
              <div style="margin:24px 0;padding:20px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;text-align:center;">
                <p style="margin:0 0 8px;color:#64748b;font-size:12px;font-weight:600;letter-spacing:0.08em;text-transform:uppercase;">Verification code</p>
                <p style="margin:0;color:#1e1b4b;font-size:36px;font-weight:700;letter-spacing:0.25em;font-family:ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,monospace;">${code}</p>
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
    'BoldMeet — Verify your account',
    '',
    `Your verification code is: ${code}`,
    '',
    `This code expires in ${expiryMinutes} minutes.`,
    '',
    'If you did not request this, you can ignore this email.',
  ].join('\n');
}

export async function sendOtpEmail(email: string, code: string): Promise<void> {
  const apiKey = runtimeEnv('RESEND_API_KEY');
  const otpExpiryMinutes = getOtpExpiryMinutes();

  if (!apiKey) {
    if (process.env.NODE_ENV === 'production') {
      console.error('[otp-email] resend failed', {
        to: email,
        error: 'RESEND_API_KEY missing at runtime — check Railway env on web service',
      });
      throw new Error('Email service is not configured on the web service');
    }
    console.log(`[otp-email] RESEND_API_KEY not set — dev code for ${email}: ${code}`);
    return;
  }

  const resend = new Resend(apiKey);

  try {
    const { data, error } = await resend.emails.send({
      from: OTP_EMAIL_FROM,
      to: email,
      subject: OTP_EMAIL_SUBJECT,
      html: buildOtpEmailHtml(code, otpExpiryMinutes),
      text: buildOtpEmailText(code, otpExpiryMinutes),
    });

    if (error) {
      console.error('[otp-email] resend failed', {
        to: email,
        from: OTP_EMAIL_FROM,
        error: error.message,
        name: error.name,
      });
      throw new Error(error.message);
    }

    console.log('[otp-email] resend success', {
      to: email,
      from: OTP_EMAIL_FROM,
      id: data?.id,
    });
  } catch (error) {
    const details = formatError(error);
    console.error('[otp-email] resend failed', {
      to: email,
      from: OTP_EMAIL_FROM,
      error: details.message,
      stack: details.stack,
    });
    throw error;
  }
}
