/**
 * This is a API server
 */

import express, {
  type Request,
  type Response,
} from 'express'
import cors from 'cors'
import { fileURLToPath } from 'url'
import authRoutes from './routes/auth.js'
import roomsRoutes from './routes/rooms.js'
import seatsRoutes from './routes/seats.js'
import studyRoutes from './routes/study.js'
import userRoutes from './routes/user.js'
import leaderboardRoutes from './routes/leaderboard.js'
import { errorHandler } from './middleware/errorHandler.js'
import { ErrorCode } from './errors.js'
import config from '../shared/config.js'

// for esm mode
void fileURLToPath(import.meta.url)

const app: express.Application = express()

app.use(cors())
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

/**
 * API Routes
 */
app.use('/api/auth', authRoutes)
app.use('/api/rooms', roomsRoutes)
app.use('/api/seats', seatsRoutes)
app.use('/api/study', studyRoutes)
app.use('/api/user', userRoutes)
app.use('/api/leaderboard', leaderboardRoutes)

/**
 * health
 */
app.use(
  '/api/health',
  (req: Request, res: Response): void => {
    res.status(200).json({
      success: true,
      message: 'ok',
      env: config.nodeEnv,
    })
  },
)

/**
 * 404 handler
 */
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: ErrorCode.NotFound,
    message: 'API not found',
    userSolvable: true,
    solution: '请确认您访问的接口地址是否正确',
  })
})

/**
 * global error handler middleware
 */
app.use(errorHandler)

export default app
