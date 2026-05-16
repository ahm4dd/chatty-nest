import { z } from 'zod';

export function validateConfig<T>(
  schema: z.ZodSchema<T>,
  object: Record<string, unknown>,
): T {
  const result = schema.safeParse(object);
  if (!result.success) {
    throw new Error(
      `Invalid environment configuration: ${result.error.message}`,
    );
  }

  return result.data;
}

export default validateConfig;
