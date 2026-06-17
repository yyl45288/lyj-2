import { Router, type Request, type Response } from 'express'
import { findRoom, findSeat, reservations, findUser } from '../data.js'
import type { Reservation } from '../../shared/types.js'
import { authMiddleware, optionalAuthMiddleware } from '../middleware/auth.js'

const router = Router()

let reservationCounter = 100

router.post('/reserve', authMiddleware, (req: Request, res: Response): void => {
  try {
    const userId = req.userId
    if (!userId) {
      res.status(401).json({
        error: 'Unauthorized',
        message: '请先登录',
      })
      return
    }

    const { roomId, seatId, startTime, endTime } = req.body

    if (!roomId || !seatId || !startTime || !endTime) {
      res.status(400).json({
        error: 'BadRequest',
        message: '缺少必要参数：roomId, seatId, startTime, endTime',
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

    if (seat.status !== 'available') {
      res.status(400).json({
        error: 'SeatUnavailable',
        message: '该座位不可预约',
      })
      return
    }

    const newStart = new Date(startTime).getTime()
    const newEnd = new Date(endTime).getTime()

    if (newEnd <= newStart) {
      res.status(400).json({
        error: 'InvalidTimeRange',
        message: '结束时间必须晚于开始时间',
      })
      return
    }

    const seatOverlap = reservations.some(r =>
      r.roomId === roomId
      && r.seatId === seatId
      && (r.status === 'pending' || r.status === 'active')
      && newStart < new Date(r.endTime).getTime()
      && newEnd > new Date(r.startTime).getTime()
    )
    if (seatOverlap) {
      res.status(400).json({
        error: 'SeatOccupied',
        message: '该座位在该时段已被预约，请选择其他时段或座位',
      })
      return
    }

    const userTimeOverlap = reservations.some(r =>
      r.userId === userId
      && (r.status === 'pending' || r.status === 'active')
      && newStart < new Date(r.endTime).getTime()
      && newEnd > new Date(r.startTime).getTime()
    )
    if (userTimeOverlap) {
      res.status(400).json({
        error: 'TimeConflict',
        message: '该时间段与您的其他预约冲突，同一时段只能预约一个座位',
      })
      return
    }

    seat.status = 'reserved'
    seat.reservedBy = userId

    const user = findUser(userId)

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
  } catch (error) {
    res.status(500).json({
      error: 'InternalServerError',
      message: '预约失败',
    })
  }
})

router.post('/cancel', authMiddleware, (req: Request, res: Response): void => {
  try {
    const userId = req.userId
    if (!userId) {
      res.status(401).json({
        error: 'Unauthorized',
        message: '请先登录',
      })
      return
    }

    const { reservationId } = req.body

    if (!reservationId) {
      res.status(400).json({
        error: 'BadRequest',
        message: '缺少必要参数：reservationId',
      })
      return
    }

    const reservationIdx = reservations.findIndex(r => r.id === reservationId)
    if (reservationIdx === -1) {
      res.status(404).json({
        error: 'NotFound',
        message: '预约记录不存在',
      })
      return
    }

    const reservation = reservations[reservationIdx]

    if (reservation.userId !== userId) {
      res.status(403).json({
        error: 'Forbidden',
        message: '无权取消他人的预约',
      })
      return
    }

    if (reservation.status !== 'pending') {
      res.status(400).json({
        error: 'InvalidStatus',
        message: '该预约无法取消',
      })
      return
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
  } catch (error) {
    res.status(500).json({
      error: 'InternalServerError',
      message: '取消预约失败',
    })
  }
})

export default router
