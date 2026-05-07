export const NODE_ENV = {
  development: 'development',
  production: 'production',
  test: 'test',
} as const;

// Create a type that represents the enum values
export type NODE_ENV = (typeof NODE_ENV)[keyof typeof NODE_ENV];

export type AppConfig = {
  NODE_ENV: NODE_ENV;
};
