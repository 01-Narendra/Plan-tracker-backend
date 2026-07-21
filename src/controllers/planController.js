import Plan from '../models/Plan.js'
import { AppError, asyncHandler } from '../middleware/errorHandler.js'
import {
  validatePlanName,
  validatePointText,
  calcPercentage,
  toDateStr,
} from '../utils/validation.js'
import { getEnv } from '../config/env.js'

async function rolloverPlanIfNeeded(plan) {
  const today = toDateStr()
  if (!plan.recurring || plan.lastActiveDate === today) {
    return plan
  }

  const percentage = calcPercentage(plan.points)

  // Archive with points snapshot
  const existingIdx = plan.history.findIndex((h) => h.date === plan.lastActiveDate)
  const historyEntry = {
    date: plan.lastActiveDate,
    percentage: percentage,
    points: plan.points.map((p) => ({
      _id: p._id,
      text: p.text,
      done: p.done,
    })),
  }

  if (existingIdx >= 0) {
    plan.history[existingIdx] = historyEntry
  } else {
    plan.history.push(historyEntry)
  }

  plan.points = plan.points.map((p) => ({ ...p, done: false }))
  plan.lastActiveDate = today

  await plan.save()
  return plan
}

export const getPlans = asyncHandler(async (req, res, next) => {
  const plans = await Plan.find({ user: req.user.id }).sort({ createdAt: -1 })

  // Rollover each plan if needed
  const rolledPlans = await Promise.all(plans.map(rolloverPlanIfNeeded))

  res.status(200).json({
    success: true,
    count: rolledPlans.length,
    plans: rolledPlans,
  })
})

export const getPlan = asyncHandler(async (req, res, next) => {
  const { id } = req.params
  const plan = await Plan.findById(id)

  if (!plan) {
    throw new AppError('Plan not found', 404)
  }

  // Check authorization
  if (plan.user.toString() !== req.user.id) {
    throw new AppError('Not authorized to access this plan', 403)
  }

  const rolledPlan = await rolloverPlanIfNeeded(plan)

  res.status(200).json({
    success: true,
    plan: rolledPlan,
  })
})

export const createPlan = asyncHandler(async (req, res, next) => {
  const { name, points, recurring } = req.body

  // Validation
  if (!validatePlanName(name)) {
    throw new AppError('Please provide a valid plan name', 400)
  }

  if (!Array.isArray(points) || points.length === 0) {
    throw new AppError('Please provide at least one plan point', 400)
  }

  points.forEach((point) => {
    if (!validatePointText(point)) {
      throw new AppError('Invalid point text', 400)
    }
  })

  // Create plan
  const plan = await Plan.create({
    user: req.user.id,
    name,
    recurring: recurring !== false,
    points: points.map((text) => ({
      text,
      done: false,
    })),
    history: [],
  })

  res.status(201).json({
    success: true,
    plan,
  })
})

export const updatePlan = asyncHandler(async (req, res, next) => {
  const { id } = req.params
  const { name, recurring } = req.body

  const plan = await Plan.findById(id)

  if (!plan) {
    throw new AppError('Plan not found', 404)
  }

  if (plan.user.toString() !== req.user.id) {
    throw new AppError('Not authorized to update this plan', 403)
  }

  if (name && !validatePlanName(name)) {
    throw new AppError('Please provide a valid plan name', 400)
  }

  if (name) plan.name = name
  if (recurring !== undefined) plan.recurring = recurring

  await plan.save()

  res.status(200).json({
    success: true,
    plan,
  })
})

export const deletePlan = asyncHandler(async (req, res, next) => {
  const { id } = req.params

  const plan = await Plan.findById(id)

  if (!plan) {
    throw new AppError('Plan not found', 404)
  }

  if (plan.user.toString() !== req.user.id) {
    throw new AppError('Not authorized to delete this plan', 403)
  }

  await Plan.findByIdAndDelete(id)

  res.status(200).json({
    success: true,
    message: 'Plan deleted successfully',
  })
})

export const togglePoint = asyncHandler(async (req, res, next) => {
  const { id, pointId } = req.params

  const plan = await Plan.findById(id)

  if (!plan) {
    throw new AppError('Plan not found', 404)
  }

  if (plan.user.toString() !== req.user.id) {
    throw new AppError('Not authorized to access this plan', 403)
  }

  const point = plan.points.id(pointId)
  if (!point) {
    throw new AppError('Point not found', 404)
  }

  point.done = !point.done
  await plan.save()

  res.status(200).json({
    success: true,
    plan,
  })
})

export const addPoint = asyncHandler(async (req, res, next) => {
  const { id } = req.params
  const { text } = req.body

  if (!validatePointText(text)) {
    throw new AppError('Please provide valid point text', 400)
  }

  const plan = await Plan.findById(id)

  if (!plan) {
    throw new AppError('Plan not found', 404)
  }

  if (plan.user.toString() !== req.user.id) {
    throw new AppError('Not authorized to access this plan', 403)
  }

  plan.points.push({
    text,
    done: false,
  })

  await plan.save()

  res.status(201).json({
    success: true,
    plan,
  })
})

export const removePoint = asyncHandler(async (req, res, next) => {
  const { id, pointId } = req.params

  const plan = await Plan.findById(id)

  if (!plan) {
    throw new AppError('Plan not found', 404)
  }

  if (plan.user.toString() !== req.user.id) {
    throw new AppError('Not authorized to access this plan', 403)
  }

  const point = plan.points.id(pointId)
  if (!point) {
    throw new AppError('Point not found', 404)
  }

  point.deleteOne()
  await plan.save()

  res.status(200).json({
    success: true,
    plan,
  })
})

export const getDailyStats = asyncHandler(async (req, res, next) => {
  const plans = await Plan.find({ user: req.user.id })

  // Rollover all plans if needed
  const rolledPlans = await Promise.all(plans.map(rolloverPlanIfNeeded))

  const today = toDateStr()
  const STREAK_THRESHOLD = getEnv('STREAK_THRESHOLD')

  // Aggregate daily completion across all recurring plans
  const dailyMap = {}
  const counts = {}

  rolledPlans.forEach((plan) => {
    if (!plan.recurring) return

    ;(plan.history || []).forEach(({ date, percentage }) => {
      dailyMap[date] = (dailyMap[date] || 0) + percentage
      counts[date] = (counts[date] || 0) + 1
    })

    // Include today's live progress
    if (plan.lastActiveDate === today) {
      const livePct = calcPercentage(plan.points)
      dailyMap[today] = (dailyMap[today] || 0) + livePct
      counts[today] = (counts[today] || 0) + 1
    }
  })

  // Compute averages
  Object.keys(dailyMap).forEach((date) => {
    dailyMap[date] = Math.round(dailyMap[date] / counts[date])
  })

  // Calculate current streak
  let streak = 0
  const cursor = new Date()
  while (true) {
    const dateStr = toDateStr(cursor)
    const pct = dailyMap[dateStr]

    if (pct === undefined) {
      if (dateStr === toDateStr(new Date())) {
        cursor.setDate(cursor.getDate() - 1)
        continue
      }
      break
    }

    if (pct >= STREAK_THRESHOLD) {
      streak += 1
      cursor.setDate(cursor.getDate() - 1)
    } else {
      break
    }
  }

  res.status(200).json({
    success: true,
    stats: {
      streak,
      dailyCompletion: dailyMap,
      threshold: STREAK_THRESHOLD,
    },
  })
})
