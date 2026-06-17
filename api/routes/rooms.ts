import { Router, type Request, type Response } from 'express'
import { rooms, findRoom, getRoomWithDynamicSeats } from '../data.js'
import type { Room } from '../../shared/types.js'
import { asyncHandler, throwError } from '../middleware/errorHandler.js'
import { ErrorCode } from '../errors.js'

const router = Router()

type RoomWithoutSeats = Omit<Room, 'seats'>

router.get('/', asyncHandler((req: Request, res: Response): void => {
  const roomList: RoomWithoutSeats[] = rooms.map((r) => {
    const { seats, ...rest } = r
    return rest
  })
  res.status(200).json({
    data: roomList,
    message: '获取房间列表成功',
  })
}))

router.get('/:id', asyncHandler((req: Request, res: Response): void => {
  const { id } = req.params
  const room = findRoom(id)

  if (!room) {
    throwError(ErrorCode.NotFound, '房间不存在')
  }

  const dynamicRoom = getRoomWithDynamicSeats(room)

  res.status(200).json({
    data: dynamicRoom,
    message: '获取房间详情成功',
  })
}))

export default router
