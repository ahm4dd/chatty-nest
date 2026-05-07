import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import { type ClassConstructor } from 'class-transformer/types/interfaces';

export function validateConfig<T extends object>(
  envFile: Record<string, unknown>,
  envVariableClass: ClassConstructor<T>,
) {
  const validatedConfig = plainToInstance(envVariableClass, envFile, {
    enableImplicitConversion: true,
  });
  const errors = validateSync(validatedConfig, {
    skipMissingProperties: false,
  });

  if (errors.length > 0) {
    throw new Error(errors.toString());
  }
  return validatedConfig;
}

export default validateConfig;
