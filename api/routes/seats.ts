import { Router, type Request, type Response } from 'express'
import { findRoom, findSeat, reservations } from '../data.js'
import type { Reservation } from '../../shared/types.js'
import { authMiddleware } from '../middleware/auth.js'
import { asyncHandler, throwError } from '../middleware/errorHandler.js'
import { ErrorCode } from '../errors.js'

const router = Router()

let reservationCounter = 100

router.post('/reserve', authMiddleware, asyncHandler((req: Request, res: Response): void => {
  const userId = req.userId
  if (!userId) {
    throwError(ErrorCode.Unauthorized, '请先登录')
  }

  const { roomId, seatId, startTime, endTime } = req.body

  if (!roomId || !seatId || !startTime || !endTime) {
    throwError(ErrorCode.BadRequest, '缺少必要参数：roomId, seatId, startTime, endTime')
  }

  const room = findRoom(roomId)
  if (!room) {
    throwError(ErrorCode.NotFound, '房间不存在')
  }

  const seat = findSeat(roomId, seatId)
  if (!seat) {
    throwError(ErrorCode.NotFound, '座位不存在')
  }

  if (seat.status !== 'available') {
    throwError(ErrorCode.SeatUnavailable)
  }

  const newStart = new Date(startTime).getTime()
  const newEnd = new Date(endTime).getTime()

  if (newEnd <= newStart) {
    throwError(ErrorCode.InvalidTimeRange)
  }

  const seatOverlap = reservations.some(r =>
    r.roomId === roomId
    && r.seatId === seatId
    && (r.status === 'pending' || r.status === 'active')
    && newStart < new Date(r.endTime).getTime()
    && newEnd > new Date(r.startTime).getTime()
  )
  if (seatOverlap) {
    throwError(ErrorCode.SeatOccupied, '该座位在该时段已被预约，请选择其他时段或座位')
  }

  const userTimeOverlap = reservations.some(r =>
    r.userId === userId
    && (r.status === 'pending' || r.status === 'active')
    && newStart < new Date(r.endTime).getTime()
    && newEnd > new Date(r.startTime).getTime()
  )
  if (userTimeOverlap) {
    throwError(ErrorCode.TimeConflict)
  }

  seat.status = 'reserved'
  seat.reservedBy = userId

  const reservation: Reservation = {
    id: `reservation_${Date.now()}_${reservationCounter++}`,
    userId,
    roomId,
    seatId,
    startTime: new Date(startTime).toISOString(),
    endTime: new Date(endTime).toISOString(),
    status: 'pending',
    roomName: room.name,
    seatLabel: `${seat.row + 1}排${seat.col + 1}号`,
  }

  reservations.push(reservation)

  res.status(200).json({
    data: reservation,
    message: '预约成功',
  })
}))

router.post('/cancel', authMiddleware, asyncHandler((req: Request, res: Response): void => {
  const userId = req.userId
  if (!userId) {
    throwError(ErrorCode.Unauthorized, '请先登录')
  }

  const { reservationId } = req.body

  if (!reservationId) {
    throwError(ErrorCode.BadRequest, '缺少必要参数：reservationId')
  }

  const reservationIdx = reservations.findIndex(r => r.id === reservationId)
  if (reservationIdx === -1) {
    throwError(ErrorCode.NotFound, '预约记录不存在')
  }

  const reservation = reservations[reservationIdx]

  if (reservation.userId !== userId) {
    throwError(ErrorCode.Forbidden, '无权取消他人的预约')
  }

  if (reservation.status !== 'pending') {
    throwError(ErrorCode.InvalidStatus)
  }

  reservation.status = 'cancelled'

  const seat = findSeat(reservation.roomId, reservation.seatId)
  if (seat && seat.status === 'reserved' && seat.reservedBy === userId) {
    seat.status = 'available'
    seat.reservedBy = undefined
  }

  res.status(200).json({
    data: { success: true, reservationId },
    message: '取消预约成功',
  })
}))

export default router
