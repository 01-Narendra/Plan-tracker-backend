import jwt from 'jsonwebtoken'
import User from '../models/User.js'
import { getEnv } from '../config/env.js'
import { validateEmail, validatePassword } from '../utils/validation.js'
import { AppError, asyncHandler } from '../middleware/errorHandler.js'

function generateToken(userId) {
  return jwt.sign({ id: userId }, getEnv('JWT_SECRET'), {
    expiresIn: getEnv('JWT_EXPIRE'),
  })
}

export const signup = asyncHandler(async (req, res, next) => {
  const { name, email, password, passwordConfirm } = req.body

  // Validation
  if (!name || !email || !password || !passwordConfirm) {
    throw new AppError('All fields are required', 400)
  }

  if (!validateEmail(email)) {
    throw new AppError('Please provide a valid email', 400)
  }

  if (!validatePassword(password)) {
    throw new AppError('Password must be at least 6 characters', 400)
  }

  if (password !== passwordConfirm) {
    throw new AppError('Passwords do not match', 400)
  }

  // Check if user already exists
  const userExists = await User.findOne({ email })
  if (userExists) {
    throw new AppError('Email already registered', 400)
  }

  // Create user
  const user = await User.create({
    name,
    email,
    password,
  })

  const token = generateToken(user._id)

  res.status(201).json({
    success: true,
    token,
    user: user.toJSON(),
  })
})

export const login = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body

  // Validation
  if (!email || !password) {
    throw new AppError('Please provide email and password', 400)
  }

  if (!validateEmail(email)) {
    throw new AppError('Please provide a valid email', 400)
  }

  // Get user with password field (normally hidden)
  const user = await User.findOne({ email }).select('+password')
  if (!user) {
    throw new AppError('Invalid email or password', 401)
  }

  // Check password
  const isPasswordCorrect = await user.matchPassword(password)
  if (!isPasswordCorrect) {
    throw new AppError('Invalid email or password', 401)
  }

  const token = generateToken(user._id)

  res.status(200).json({
    success: true,
    token,
    user: user.toJSON(),
  })
})

export const getMe = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user.id)

  if (!user) {
    throw new AppError('User not found', 404)
  }

  res.status(200).json({
    success: true,
    user,
  })
})
