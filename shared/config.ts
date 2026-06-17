import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export type NodeEnv = 'development' | 'test' | 'production';

const VALID_ENVS: NodeEnv[] = ['development', 'test', 'production'];

function resolveNodeEnv(): NodeEnv {
  const raw = (process.env.NODE_ENV || 'development').toLowerCase();
  if (VALID_ENVS.includes(raw as NodeEnv)) {
    return raw as NodeEnv;
  }
  return 'development';
}

export const NODE_ENV: NodeEnv = resolveNodeEnv();

export const IS_DEV = NODE_ENV === 'development';
export const IS_TEST = NODE_ENV === 'test';
export const IS_PROD = NODE_ENV === 'production';

const projectRoot = path.resolve(__dirname, '..');

function loadEnvFiles() {
  const envFiles = [
    `.env.${NODE_ENV}.local`,
    `.env.${NODE_ENV}`,
    '.env.local',
    '.env',
  ];

  const loaded: string[] = [];
  for (const file of envFiles) {
    const filePath = path.resolve(projectRoot, file);
    const result = dotenv.config({ path: filePath, override: false });
    if (!result.error) {
      loaded.push(file);
    }
  }

  return loaded;
}

loadEnvFiles();

export function getEnv(key: string, defaultValue?: string): string | undefined {
  const value = process.env[key];
  if (value !== undefined && value !== null && value !== '') {
    return value;
  }
  return defaultValue;
}

export function getEnvOrThrow(key: string): string {
  const value = getEnv(key);
  if (value === undefined) {
    throw new Error(`Required environment variable "${key}" is not set`);
  }
  return value;
}

export const config = {
  nodeEnv: NODE_ENV,
  isDev: IS_DEV,
  isTest: IS_TEST,
  isProd: IS_PROD,
  port: Number(getEnv('PORT', '3001')),
  jwt: {
    secret: getEnv('JWT_SECRET', IS_DEV ? 'dev-secret-change-me' : ''),
    expiresIn: getEnv('JWT_EXPIRES_IN', '7d'),
  },
} as const;

export default config;
