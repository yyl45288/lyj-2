import { Router, type Request, type Response } from 'express'
import {
  findCredentialByUsername,
  createUser,
  createToken,
  findUser,
  revokeToken,
  findToken,
} from '../data.js'
import { authMiddleware } from '../middleware/auth.js'

const router = Router()

router.post('/register', async (req: Request, res: Response): Promise<void> => {
  try {
    const { username, password } = req.body

    if (!username || !password) {
      res.status(400).json({
        error: 'BadRequest',
        message: '用户名和密码不能为空',
      })
      return
    }

    if (username.length < 2 || username.length > 20) {
      res.status(400).json({
        error: 'BadRequest',
        message: '用户名长度需在 2-20 个字符',
      })
      return
    }

    if (password.length < 6) {
      res.status(400).json({
        error: 'BadRequest',
        message: '密码长度不能少于 6 位',
      })
      return
    }

    const existing = findCredentialByUsername(username)
    if (existing) {
      res.status(400).json({
        error: 'UsernameExists',
        message: '该用户名已被注册',
      })
      return
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
  } catch (error) {
    res.status(500).json({
      error: 'InternalServerError',
      message: '注册失败',
    })
  }
})

router.post('/login', async (req: Request, res: Response): Promise<void> => {
  try {
    const { username, password } = req.body

    if (!username || !password) {
      res.status(400).json({
        error: 'BadRequest',
        message: '用户名和密码不能为空',
      })
      return
    }

    const credential = findCredentialByUsername(username)
    if (!credential) {
      res.status(401).json({
        error: 'InvalidCredentials',
        message: '用户名或密码错误',
      })
      return
    }

    if (credential.password !== password) {
      res.status(401).json({
        error: 'InvalidCredentials',
        message: '用户名或密码错误',
      })
      return
    }

    const user = findUser(credential.userId)
    if (!user) {
      res.status(404).json({
        error: 'NotFound',
        message: '用户不存在',
      })
      return
    }

    const tokenRecord = createToken(user.id)

    res.status(200).json({
      data: {
        user,
        token: tokenRecord.token,
      },
      message: '登录成功',
    })
  } catch (error) {
    res.status(500).json({
      error: 'InternalServerError',
      message: '登录失败',
    })
  }
})

router.post('/logout', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const authHeader = req.headers.authorization
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.slice(7)
      revokeToken(token)
    }

    res.status(200).json({
      data: { success: true },
      message: '登出成功',
    })
  } catch (error) {
    res.status(500).json({
      error: 'InternalServerError',
      message: '登出失败',
    })
  }
})

router.get('/me', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.userId
    if (!userId) {
      res.status(401).json({
        error: 'Unauthorized',
        message: '请先登录',
      })
      return
    }

    const user = findUser(userId)
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

export default router
