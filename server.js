import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import { connectDB } from './src/config/db.js'
import { getEnv } from './src/config/env.js'
import { errorHandler } from './src/middleware/errorHandler.js'
import authRoutes from './src/routes/auth.js'
import planRoutes from './src/routes/plans.js'

const app = express()

// ==================== Database ====================
connectDB()

// ==================== Middleware ====================
app.use(helmet())
app.use(cors({
  origin: getEnv('FRONTEND_URL'),
  credentials: true,
}))
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ limit: '10mb', extended: true }))

// ==================== Health Check ====================
app.get('/health', (req, res) => {
  res.status(200).json({ success: true, message: 'Server is running' })
})

// ==================== API Routes ====================
app.use('/api/auth', authRoutes)
app.use('/api/plans', planRoutes)

// ==================== 404 Handler ====================
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`,
  })
})

// ==================== Error Handler ====================
app.use(errorHandler)

// ==================== Server Start ====================
const PORT = getEnv('PORT')
app.listen(PORT, () => {
  console.log(`✓ Server running on http://localhost:${PORT}`)
  console.log(`✓ Environment: ${getEnv('NODE_ENV')}`)
  console.log(`✓ Frontend URL: ${getEnv('FRONTEND_URL')}`)
})

// ==================== Graceful Shutdown ====================
process.on('SIGINT', async () => {
  console.log('\nShutting down gracefully...')
  process.exit(0)
})
