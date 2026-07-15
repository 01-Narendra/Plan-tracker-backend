import express from 'express'
import {
  getPlans,
  getPlan,
  createPlan,
  updatePlan,
  deletePlan,
  togglePoint,
  addPoint,
  removePoint,
  getDailyStats,
} from '../controllers/planController.js'
import { protect } from '../middleware/auth.js'

const router = express.Router()

// All plan routes require authentication
router.use(protect)

// Plan CRUD
router.get('/', getPlans)
router.get('/stats/daily', getDailyStats)
router.post('/', createPlan)
router.get('/:id', getPlan)
router.patch('/:id', updatePlan)
router.delete('/:id', deletePlan)

// Point operations
router.patch('/:id/points/:pointId/toggle', togglePoint)
router.post('/:id/points', addPoint)
router.delete('/:id/points/:pointId', removePoint)

export default router
