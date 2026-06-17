import type { Request, Response, NextFunction } from 'express'
import { findToken } from '../data.js'
import { asyncHandler, throwError } from '../middleware/errorHandler.js'
import { ErrorCode } from '../errors.js'

declare global {
  namespace Express {
    interface Request {
      userId?: string
    }
  }
}

export const authMiddleware = asyncHandler((req: Request, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throwError(ErrorCode.Unauthorized, '请先登录')
  }

  const token = authHeader.slice(7)
  const tokenRecord = findToken(token)

  if (!tokenRecord) {
    throwError(ErrorCode.TokenExpired, '登录已过期，请重新登录')
  }

  req.userId = tokenRecord.userId
  next()
})

export const optionalAuthMiddleware = asyncHandler((req: Request, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization

  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.slice(7)
    const tokenRecord = findToken(token)
    if (tokenRecord) {
      req.userId = tokenRecord.userId
    }
  }

  next()
})
