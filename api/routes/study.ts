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
import { asyncHandler, throwError } from '../middleware/errorHandler.js'
import { ErrorCode } from '../errors.js'

const router = Router()

let recordCounter = 1000
let pointLogCounter = 1000

router.post('/checkin', authMiddleware, asyncHandler((req: Request, res: Response): void => {
  const userId = req.userId
  if (!userId) {
    throwError(ErrorCode.Unauthorized, '请先登录')
  }

  const { roomId, seatId } = req.body

  if (!roomId || !seatId) {
    throwError(ErrorCode.BadRequest, '缺少必要参数：roomId, seatId')
  }

  const room = findRoom(roomId)
  if (!room) {
    throwError(ErrorCode.NotFound, '房间不存在')
  }

  const seat = findSeat(roomId, seatId)
  if (!seat) {
    throwError(ErrorCode.NotFound, '座位不存在')
  }

  if (seat.status === 'occupied') {
    throwError(ErrorCode.SeatOccupied, '该座位正在使用中')
  }

  const nowMs = Date.now()
  const currentReservation = reservations.find(r =>
    r.roomId === roomId
    && r.seatId === seatId
    && (r.status === 'pending' || r.status === 'active')
    && nowMs >= new Date(r.startTime).getTime()
    && nowMs < new Date(r.endTime).getTime()
  )

  if (currentReservation && currentReservation.userId !== userId) {
    throwError(ErrorCode.SeatReserved, '该座位当前时段已被他人预约')
  }

  seat.status = 'occupied'
  seat.occupiedBy = userId
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
}))

router.post('/checkout', authMiddleware, asyncHandler((req: Request, res: Response): void => {
  const userId = req.userId
  if (!userId) {
    throwError(ErrorCode.Unauthorized, '请先登录')
  }

  const { recordId } = req.body

  if (!recordId) {
    throwError(ErrorCode.BadRequest, '缺少必要参数：recordId')
  }

  const recordIdx = studyRecords.findIndex(r => r.id === recordId)
  if (recordIdx === -1) {
    throwError(ErrorCode.NotFound, '学习记录不存在')
  }

  const record = studyRecords[recordIdx]

  if (record.userId !== userId) {
    throwError(ErrorCode.Forbidden, '无权操作他人的学习记录')
  }

  if (record.checkOutTime) {
    throwError(ErrorCode.AlreadyCheckedOut)
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
}))

router.post('/pause', authMiddleware, asyncHandler((req: Request, res: Response): void => {
  const userId = req.userId
  if (!userId) {
    throwError(ErrorCode.Unauthorized, '请先登录')
  }

  const { recordId } = req.body

  if (!recordId) {
    throwError(ErrorCode.BadRequest, '缺少必要参数：recordId')
  }

  const session = activeSessions.get(userId)
  if (!session || session.recordId !== recordId) {
    throwError(ErrorCode.NotFound, '未找到活跃的学习会话')
  }

  if (session.isPaused) {
    throwError(ErrorCode.AlreadyPaused)
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
}))

router.post('/resume', authMiddleware, asyncHandler((req: Request, res: Response): void => {
  const userId = req.userId
  if (!userId) {
    throwError(ErrorCode.Unauthorized, '请先登录')
  }

  const { recordId } = req.body

  if (!recordId) {
    throwError(ErrorCode.BadRequest, '缺少必要参数：recordId')
  }

  const session = activeSessions.get(userId)
  if (!session || session.recordId !== recordId) {
    throwError(ErrorCode.NotFound, '未找到活跃的学习会话')
  }

  if (!session.isPaused) {
    throwError(ErrorCode.NotPaused)
  }

  session.isPaused = false
  session.checkInTime = new Date().toISOString()

  res.status(200).json({
    data: { success: true, recordId },
    message: '恢复成功',
  })
}))

router.get('/records', optionalAuthMiddleware, asyncHandler((req: Request, res: Response): void => {
  const { userId } = req.query
  const targetUserId = (userId as string) || req.userId || 'user_self'

  const userRecords = studyRecords
    .filter(r => r.userId === targetUserId)
    .sort((a, b) => new Date(b.checkInTime).getTime() - new Date(a.checkInTime).getTime())

  res.status(200).json({
    data: userRecords,
    message: '获取学习记录成功',
  })
}))

export default router
