import 'reflect-metadata';
import { registerAs } from '@nestjs/config';
import { AppConfig, NODE_ENV } from './config.type';
import { IsOptional, IsEnum } from 'class-validator';
import validateConfig from '../../utilities/env-validator';

class EnvironmentVariablesValidator {
  @IsEnum(NODE_ENV)
  @IsOptional()
  NODE_ENV: NODE_ENV = 'development';
}

export default registerAs<AppConfig>('app', () => {
  const config = validateConfig(process.env, EnvironmentVariablesValidator);

  return {
    NODE_ENV: config.NODE_ENV,
  };
});
