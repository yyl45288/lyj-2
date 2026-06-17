import { Router, type Request, type Response } from 'express'
import { findUser, pointLogs, reservations } from '../data.js'
import { authMiddleware, optionalAuthMiddleware } from '../middleware/auth.js'

const router = Router()

router.get('/info', optionalAuthMiddleware, (req: Request, res: Response): void => {
  try {
    const targetUserId = req.userId || 'user_self'
    const user = findUser(targetUserId)

    if (!user) {
      res.status(404).json({
        error: 'NotFound',
        message: '用户不存在',
      })
      return
    }

    res.status(200).json({
      data: user,
      message: '获取用户信息成功',
    })
  } catch (error) {
    res.status(500).json({
      error: 'InternalServerError',
      message: '获取用户信息失败',
    })
  }
})

router.get('/points', optionalAuthMiddleware, (req: Request, res: Response): void => {
  try {
    const { userId } = req.query
    const targetUserId = (userId as string) || req.userId || 'user_self'

    const logs = pointLogs
      .filter(l => l.userId === targetUserId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

    res.status(200).json({
      data: logs,
      message: '获取积分日志成功',
    })
  } catch (error) {
    res.status(500).json({
      error: 'InternalServerError',
      message: '获取积分日志失败',
    })
  }
})

router.get('/reservations', authMiddleware, (req: Request, res: Response): void => {
  try {
    const userId = req.userId
    if (!userId) {
      res.status(401).json({
        error: 'Unauthorized',
        message: '请先登录',
      })
      return
    }

    const userReservations = reservations
      .filter(r => r.userId === userId && r.status === 'pending')
      .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime())

    res.status(200).json({
      data: userReservations,
      message: '获取预约记录成功',
    })
  } catch (error) {
    res.status(500).json({
      error: 'InternalServerError',
      message: '获取预约记录失败',
    })
  }
})

export default router
