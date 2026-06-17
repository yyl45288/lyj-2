import { Router, type Request, type Response } from 'express'
import { rooms, findRoom } from '../data.js'
import type { Room } from '../../shared/types.js'

const router = Router()

type RoomWithoutSeats = Omit<Room, 'seats'>

router.get('/', (req: Request, res: Response): void => {
  try {
    const roomList: RoomWithoutSeats[] = rooms.map(({ seats: _seats, ...rest }) => rest)
    res.status(200).json({
      data: roomList,
      message: '获取房间列表成功',
    })
  } catch (error) {
    res.status(500).json({
      error: 'InternalServerError',
      message: '获取房间列表失败',
    })
  }
})

router.get('/:id', (req: Request, res: Response): void => {
  try {
    const { id } = req.params
    const room = findRoom(id)

    if (!room) {
      res.status(404).json({
        error: 'NotFound',
        message: '房间不存在',
      })
      return
    }

    res.status(200).json({
      data: room,
      message: '获取房间详情成功',
    })
  } catch (error) {
    res.status(500).json({
      error: 'InternalServerError',
      message: '获取房间详情失败',
    })
  }
})

export default router
