import type { Request, Response, NextFunction } from 'express'
import { findToken } from '../data.js'

declare global {
  namespace Express {
    interface Request {
      userId?: string
    }
  }
}

export function authMiddleware(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({
      error: 'Unauthorized',
      message: '请先登录',
    })
    return
  }

  const token = authHeader.slice(7)
  const tokenRecord = findToken(token)

  if (!tokenRecord) {
    res.status(401).json({
      error: 'Unauthorized',
      message: '登录已过期，请重新登录',
    })
    return
  }

  req.userId = tokenRecord.userId
  next()
}

export function optionalAuthMiddleware(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization

  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.slice(7)
    const tokenRecord = findToken(token)
    if (tokenRecord) {
      req.userId = tokenRecord.userId
    }
  }

  next()
}
