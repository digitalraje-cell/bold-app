function collectAllowedOrigins(): string[] {
  const origins = new Set<string>();

  const add = (value?: string) => {
    if (!value) return;
    value
      .split(',')
      .map((part) => part.trim().replace(/\/$/, ''))
      .filter(Boolean)
      .forEach((origin) => origins.add(origin));
  };

  add(process.env.CORS_ORIGIN || 'http://localhost:3000');
  add(process.env.AUTH_URL);
  add(process.env.NEXTAUTH_URL);

  return [...origins];
}

export function getAllowedOrigins(): string[] {
  return collectAllowedOrigins();
}

export function isOriginAllowed(origin: string | undefined): boolean {
  if (!origin) return true;
  const normalized = origin.replace(/\/$/, '');
  return collectAllowedOrigins().includes(normalized);
}
