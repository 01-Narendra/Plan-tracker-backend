import mongoose from 'mongoose'
import { getEnv } from './env.js'

export async function connectDB() {
  try {
    const mongoURI = getEnv('MONGODB_URI')
    if (!mongoURI) {
      throw new Error('MONGODB_URI is not set in environment variables')
    }

    const connection = await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    })

    console.log(
      `✓ MongoDB connected: ${connection.connection.host}:${connection.connection.port}/${connection.connection.name}`,
    )
    return connection
  } catch (error) {
    console.error('✗ MongoDB connection failed:', error.message)
    process.exit(1)
  }
}

export async function disconnectDB() {
  try {
    await mongoose.disconnect()
    console.log('✓ MongoDB disconnected')
  } catch (error) {
    console.error('✗ MongoDB disconnection failed:', error.message)
    process.exit(1)
  }
}
