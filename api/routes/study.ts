import { Router, type Request, type Response } from 'express'
import {
  findRoom,
  findSeat,
  findUser,
  studyRecords,
  pointLogs,
  activeSessions,
  reservations,
  updateRoomOccupied,
} from '../data.js'
import type { StudyRecord, StudySession } from '../../shared/types.js'
import { authMiddleware, optionalAuthMiddleware } from '../middleware/auth.js'

const router = Router()

let recordCounter = 1000
let pointLogCounter = 1000

router.post('/checkin', authMiddleware, (req: Request, res: Response): void => {
  try {
    const userId = req.userId
    if (!userId) {
      res.status(401).json({
        error: 'Unauthorized',
        message: '请先登录',
      })
      return
    }

    const { roomId, seatId } = req.body

    if (!roomId || !seatId) {
      res.status(400).json({
        error: 'BadRequest',
        message: '缺少必要参数：roomId, seatId',
      })
      return
    }

    const room = findRoom(roomId)
    if (!room) {
      res.status(404).json({
        error: 'NotFound',
        message: '房间不存在',
      })
      return
    }

    const seat = findSeat(roomId, seatId)
    if (!seat) {
      res.status(404).json({
        error: 'NotFound',
        message: '座位不存在',
      })
      return
    }

    if (seat.status === 'occupied') {
      res.status(400).json({
        error: 'SeatOccupied',
        message: '该座位已被占用',
      })
      return
    }

    if (seat.status === 'reserved' && seat.reservedBy !== userId) {
      res.status(400).json({
        error: 'SeatReserved',
        message: '该座位已被他人预约',
      })
      return
    }

    seat.status = 'occupied'
    seat.occupiedBy = userId
    seat.reservedBy = undefined
    updateRoomOccupied(roomId)

    const matchingReservation = reservations.find(
      r => r.userId === userId && r.roomId === roomId && r.seatId === seatId && r.status === 'pending'
    )
    if (matchingReservation) {
      matchingReservation.status = 'active'
    }

    const now = new Date()
    const recordId = `record_live_${Date.now()}_${recordCounter++}`

    const record: StudyRecord = {
      id: recordId,
      userId,
      roomId,
      seatId,
      checkInTime: now.toISOString(),
      durationMinutes: 0,
      pointsEarned: 0,
      roomName: room.name,
      seatLabel: `${seat.row + 1}排${seat.col + 1}号`,
    }

    studyRecords.push(record)

    const session: StudySession = {
      recordId,
      roomId,
      seatId,
      checkInTime: now.toISOString(),
      isPaused: false,
      accumulatedSeconds: 0,
    }
    activeSessions.set(userId, session)

    res.status(200).json({
      data: {
        recordId,
        checkInTime: now.toISOString(),
      },
      message: '签到成功',
    })
  } catch (error) {
    res.status(500).json({
      error: 'InternalServerError',
      message: '签到失败',
    })
  }
})

router.post('/checkout', authMiddleware, (req: Request, res: Response): void => {
  try {
    const userId = req.userId
    if (!userId) {
      res.status(401).json({
        error: 'Unauthorized',
        message: '请先登录',
      })
      return
    }

    const { recordId } = req.body

    if (!recordId) {
      res.status(400).json({
        error: 'BadRequest',
        message: '缺少必要参数：recordId',
      })
      return
    }

    const recordIdx = studyRecords.findIndex(r => r.id === recordId)
    if (recordIdx === -1) {
      res.status(404).json({
        error: 'NotFound',
        message: '学习记录不存在',
      })
      return
    }

    const record = studyRecords[recordIdx]

    if (record.userId !== userId) {
      res.status(403).json({
        error: 'Forbidden',
        message: '无权操作他人的学习记录',
      })
      return
    }

    if (record.checkOutTime) {
      res.status(400).json({
        error: 'AlreadyCheckedOut',
        message: '该记录已签退',
      })
      return
    }

    const now = new Date()
    const checkIn = new Date(record.checkInTime)
    const diffMs = now.getTime() - checkIn.getTime()
    const durationMinutes = Math.floor(diffMs / (1000 * 60))
    const pointsEarned = Math.floor(durationMinutes / 10)

    record.checkOutTime = now.toISOString()
    record.durationMinutes = durationMinutes
    record.pointsEarned = pointsEarned

    if (pointsEarned > 0) {
      const user = findUser(userId)
      if (user) {
        user.points += pointsEarned
        user.totalStudyMinutes += durationMinutes
      }

      const pointLog = {
        id: `point_earn_${Date.now()}_${pointLogCounter++}`,
        userId,
        amount: pointsEarned,
        reason: `学习奖励（${durationMinutes}分钟）`,
        createdAt: now.toISOString(),
      }
      pointLogs.push(pointLog)
    }

    const seat = findSeat(record.roomId, record.seatId)
    if (seat && seat.occupiedBy === userId) {
      seat.status = 'available'
      seat.occupiedBy = undefined
      updateRoomOccupied(record.roomId)
    }

    const completedReservation = reservations.find(
      r => r.userId === userId && r.roomId === record.roomId && r.seatId === record.seatId && r.status === 'active'
    )
    if (completedReservation) {
      completedReservation.status = 'completed'
    }

    activeSessions.delete(userId)

    res.status(200).json({
      data: {
        points: pointsEarned,
        durationMinutes,
      },
      message: '签退成功',
    })
  } catch (error) {
    res.status(500).json({
      error: 'InternalServerError',
      message: '签退失败',
    })
  }
})

router.post('/pause', authMiddleware, (req: Request, res: Response): void => {
  try {
    const userId = req.userId
    if (!userId) {
      res.status(401).json({
        error: 'Unauthorized',
        message: '请先登录',
      })
      return
    }

    const { recordId } = req.body

    if (!recordId) {
      res.status(400).json({
        error: 'BadRequest',
        message: '缺少必要参数：recordId',
      })
      return
    }

    const session = activeSessions.get(userId)
    if (!session || session.recordId !== recordId) {
      res.status(404).json({
        error: 'NotFound',
        message: '未找到活跃的学习会话',
      })
      return
    }

    if (session.isPaused) {
      res.status(400).json({
        error: 'AlreadyPaused',
        message: '学习已处于暂停状态',
      })
      return
    }

    const now = new Date()
    const checkIn = new Date(session.checkInTime)
    session.accumulatedSeconds += Math.floor((now.getTime() - checkIn.getTime()) / 1000)
    session.isPaused = true
    session.checkInTime = now.toISOString()

    res.status(200).json({
      data: { success: true, recordId },
      message: '暂停成功',
    })
  } catch (error) {
    res.status(500).json({
      error: 'InternalServerError',
      message: '暂停失败',
    })
  }
})

router.post('/resume', authMiddleware, (req: Request, res: Response): void => {
  try {
    const userId = req.userId
    if (!userId) {
      res.status(401).json({
        error: 'Unauthorized',
        message: '请先登录',
      })
      return
    }

    const { recordId } = req.body

    if (!recordId) {
      res.status(400).json({
        error: 'BadRequest',
        message: '缺少必要参数：recordId',
      })
      return
    }

    const session = activeSessions.get(userId)
    if (!session || session.recordId !== recordId) {
      res.status(404).json({
        error: 'NotFound',
        message: '未找到活跃的学习会话',
      })
      return
    }

    if (!session.isPaused) {
      res.status(400).json({
        error: 'NotPaused',
        message: '学习未处于暂停状态',
      })
      return
    }

    session.isPaused = false
    session.checkInTime = new Date().toISOString()

    res.status(200).json({
      data: { success: true, recordId },
      message: '恢复成功',
    })
  } catch (error) {
    res.status(500).json({
      error: 'InternalServerError',
      message: '恢复失败',
    })
  }
})

router.get('/records', optionalAuthMiddleware, (req: Request, res: Response): void => {
  try {
    const { userId } = req.query
    const targetUserId = (userId as string) || req.userId || 'user_self'

    const userRecords = studyRecords
      .filter(r => r.userId === targetUserId)
      .sort((a, b) => new Date(b.checkInTime).getTime() - new Date(a.checkInTime).getTime())

    res.status(200).json({
      data: userRecords,
      message: '获取学习记录成功',
    })
  } catch (error) {
    res.status(500).json({
      error: 'InternalServerError',
      message: '获取学习记录失败',
    })
  }
})

export default router
