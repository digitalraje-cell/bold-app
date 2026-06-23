import { SignJWT } from 'jose';

function resolveJwtSecret(): Uint8Array | null {
  const secret =
    process.env.JWT_SECRET ||
    process.env.AUTH_SECRET ||
    process.env.NEXTAUTH_SECRET;

  if (!secret) {
    return null;
  }

  return new TextEncoder().encode(secret);
}

export async function createServerApiJwt(input: {
  userId: string;
  email: string;
}): Promise<string | null> {
  const secret = resolveJwtSecret();
  if (!secret) return null;

  return new SignJWT({
    sub: input.userId,
    email: input.email,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('1h')
    .sign(secret);
}
