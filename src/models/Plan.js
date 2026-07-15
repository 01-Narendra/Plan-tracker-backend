import mongoose from 'mongoose'

const pointSchema = new mongoose.Schema(
  {
    _id: {
      type: String,
      default: () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36),
    },
    text: {
      type: String,
      required: [true, 'Point text is required'],
      trim: true,
      maxlength: [200, 'Point cannot exceed 200 characters'],
    },
    done: {
      type: Boolean,
      default: false,
    },
  },
  { _id: false },
)

const historySchema = new mongoose.Schema(
  {
    date: {
      type: String,
      required: true,
    },
    percentage: {
      type: Number,
      min: 0,
      max: 100,
      required: true,
    },
  },
  { _id: false },
)

const planSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Plan must belong to a user'],
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Please provide a plan name'],
      trim: true,
      maxlength: [100, 'Plan name cannot exceed 100 characters'],
    },
    recurring: {
      type: Boolean,
      default: true,
    },
    points: [pointSchema],
    history: [historySchema],
    lastActiveDate: {
      type: String,
      default: () => new Date().toISOString().slice(0, 10),
    },
  },
  {
    timestamps: true,
  },
)

// Index for efficient user plan queries
planSchema.index({ user: 1, createdAt: -1 })

export default mongoose.model('Plan', planSchema)
