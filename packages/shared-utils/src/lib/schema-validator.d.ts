import { z } from 'zod';
export declare function validateConfig<T>(schema: z.ZodSchema<T>, object: Record<string, unknown>): T;
export default validateConfig;
