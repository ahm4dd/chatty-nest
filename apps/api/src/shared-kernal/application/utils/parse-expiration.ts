const multipliers: Record<string, number> = {
  s: 1000,
  m: 60 * 1000,
  h: 60 * 60 * 1000,
  d: 24 * 60 * 60 * 1000,
};

const DEFAULT_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

export function parseMaxAge(expiresIn: string): number {
  const match = /^(\d+)([smhd])$/.exec(expiresIn);
  if (!match) return DEFAULT_MAX_AGE_MS;

  const value = Number.parseInt(match[1] as string, 10);
  const unit = match[2] as string;
  const multiplier = multipliers[unit];

  return multiplier ? value * multiplier : DEFAULT_MAX_AGE_MS;
}

export function parseExpiration(expiresIn: string): Date {
  return new Date(Date.now() + parseMaxAge(expiresIn));
}
