import { Router, type Request, type Response } from 'express'
import { findUser, pointLogs, reservations } from '../data.js'
import { authMiddleware, optionalAuthMiddleware } from '../middleware/auth.js'
import { asyncHandler, throwError } from '../middleware/errorHandler.js'
import { ErrorCode } from '../errors.js'

const router = Router()

router.get('/info', optionalAuthMiddleware, asyncHandler((req: Request, res: Response): void => {
  const targetUserId = req.userId || 'user_self'
  const user = findUser(targetUserId)

  if (!user) {
    throwError(ErrorCode.NotFound, '用户不存在')
  }

  res.status(200).json({
    data: user,
    message: '获取用户信息成功',
  })
}))

router.get('/points', optionalAuthMiddleware, asyncHandler((req: Request, res: Response): void => {
  const { userId } = req.query
  const targetUserId = (userId as string) || req.userId || 'user_self'

  const logs = pointLogs
    .filter(l => l.userId === targetUserId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

  res.status(200).json({
    data: logs,
    message: '获取积分日志成功',
  })
}))

router.get('/reservations', authMiddleware, asyncHandler((req: Request, res: Response): void => {
  const userId = req.userId
  if (!userId) {
    throwError(ErrorCode.Unauthorized, '请先登录')
  }

  const userReservations = reservations
    .filter(r => r.userId === userId && r.status === 'pending')
    .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime())

  res.status(200).json({
    data: userReservations,
    message: '获取预约记录成功',
  })
}))

export default router
