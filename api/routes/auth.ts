import { Router, type Request, type Response } from 'express'
import {
  findCredentialByUsername,
  createUser,
  createToken,
  findUser,
  revokeToken,
} from '../data.js'
import { authMiddleware } from '../middleware/auth.js'
import { asyncHandler, throwError } from '../middleware/errorHandler.js'
import { ErrorCode } from '../errors.js'

const router = Router()

router.post('/register', asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { username, password } = req.body

  if (!username || !password) {
    throwError(ErrorCode.BadRequest, '用户名和密码不能为空')
  }

  if (username.length < 2 || username.length > 20) {
    throwError(ErrorCode.BadRequest, '用户名长度需在 2-20 个字符')
  }

  if (password.length < 6) {
    throwError(ErrorCode.BadRequest, '密码长度不能少于 6 位')
  }

  const existing = findCredentialByUsername(username)
  if (existing) {
    throwError(ErrorCode.UsernameExists)
  }

  const user = createUser(username, password)
  const tokenRecord = createToken(user.id)

  res.status(200).json({
    data: {
      user,
      token: tokenRecord.token,
    },
    message: '注册成功',
  })
}))

router.post('/login', asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { username, password } = req.body

  if (!username || !password) {
    throwError(ErrorCode.BadRequest, '用户名和密码不能为空')
  }

  const credential = findCredentialByUsername(username)
  if (!credential) {
    throwError(ErrorCode.InvalidCredentials)
  }

  if (credential.password !== password) {
    throwError(ErrorCode.InvalidCredentials)
  }

  const user = findUser(credential.userId)
  if (!user) {
    throwError(ErrorCode.NotFound, '用户不存在')
  }

  const tokenRecord = createToken(user.id)

  res.status(200).json({
    data: {
      user,
      token: tokenRecord.token,
    },
    message: '登录成功',
  })
}))

router.post('/logout', authMiddleware, asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const authHeader = req.headers.authorization
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.slice(7)
    revokeToken(token)
  }

  res.status(200).json({
    data: { success: true },
    message: '登出成功',
  })
}))

router.get('/me', authMiddleware, asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const userId = req.userId
  if (!userId) {
    throwError(ErrorCode.Unauthorized, '请先登录')
  }

  const user = findUser(userId)
  if (!user) {
    throwError(ErrorCode.NotFound, '用户不存在')
  }

  res.status(200).json({
    data: user,
    message: '获取用户信息成功',
  })
}))

export default router
