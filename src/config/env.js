import dotenv from 'dotenv'

dotenv.config()

const DEFAULT_ENV = {
  NODE_ENV: 'development',
  PORT: 5000,
  JWT_EXPIRE: '7d',
  STREAK_THRESHOLD: 50,
  FRONTEND_URL: 'http://localhost:5173',
}

export function getEnv(key) {
  return process.env[key] || DEFAULT_ENV[key]
}

export function isProduction() {
  return getEnv('NODE_ENV') === 'production'
}

export function isDevelopment() {
  return getEnv('NODE_ENV') === 'development'
}
