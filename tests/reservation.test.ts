import { describe, it, expect, beforeEach } from 'vitest'
import type { Seat, Room, Reservation, User, SeatStatus, RoomType } from '../../shared/types'

interface TestCaseResult {
  id: string
  name: string
  category: string
  seatStatus: SeatStatus
  userAuthenticated: boolean
  timeValid: boolean
  expected: 'SUCCESS' | 'FAIL'
  actual: 'SUCCESS' | 'FAIL'
  reason: string
}

const testResults: TestCaseResult[] = []

function recordResult(tc: Omit<TestCaseResult, 'actual'>, actual: 'SUCCESS' | 'FAIL') {
  testResults.push({ ...tc, actual })
}

function createMockUser(overrides?: Partial<User>): User {
  return {
    id: 'user_test',
    username: '测试用户',
    avatar: '',
    points: 100,
    totalStudyMinutes: 60,
    streakDays: 1,
    level: 1,
    badges: [],
    ...overrides,
  }
}

function createMockRoom(overrides?: Partial<Room>): Room {
  const seats: Seat[][] = []
  for (let r = 0; r < 3; r++) {
    const row: Seat[] = []
    for (let c = 0; c < 4; c++) {
      row.push({
        id: `room_test_seat_${r}_${c}`,
        row: r,
        col: c,
        status: 'available' as SeatStatus,
      })
    }
    seats.push(row)
  }
  return {
    id: 'room_test',
    name: '测试自习室',
    description: '测试用',
    type: 'silent' as RoomType,
    capacity: 12,
    occupied: 0,
    themeColor: '#2d5a3d',
    icon: '🌲',
    seats,
    ...overrides,
  }
}

function createMockReservation(overrides?: Partial<Reservation>): Reservation {
  const now = new Date()
  const start = new Date(now.getTime() + 60 * 60 * 1000)
  const end = new Date(now.getTime() + 3 * 60 * 60 * 1000)
  return {
    id: 'res_test_1',
    userId: 'user_test',
    roomId: 'room_test',
    seatId: 'room_test_seat_0_0',
    startTime: start.toISOString(),
    endTime: end.toISOString(),
    status: 'pending',
    roomName: '测试自习室',
    seatLabel: '1排1号',
    ...overrides,
  }
}

interface ValidateResult {
  success: boolean
  error?: string
}

function validateReservation(params: {
  isAuthenticated: boolean
  userId?: string
  room: Room | null
  seat: Seat | null
  startTime: string
  endTime: string
  existingReservations: Reservation[]
  targetSeatId: string
  targetRoomId: string
}): ValidateResult {
  const {
    isAuthenticated,
    userId,
    room,
    seat,
    startTime,
    endTime,
    existingReservations,
    targetSeatId,
    targetRoomId,
  } = params

  if (!isAuthenticated || !userId) {
    return { success: false, error: '请先登录' }
  }

  if (!targetRoomId || !targetSeatId || !startTime || !endTime) {
    return { success: false, error: '缺少必要参数：roomId, seatId, startTime, endTime' }
  }

  if (!room) {
    return { success: false, error: '房间不存在' }
  }

  if (!seat) {
    return { success: false, error: '座位不存在' }
  }

  const newStart = new Date(startTime).getTime()
  const newEnd = new Date(endTime).getTime()

  if (isNaN(newStart) || isNaN(newEnd)) {
    return { success: false, error: '无效的时间格式' }
  }

  if (newEnd <= newStart) {
    return { success: false, error: '结束时间必须晚于开始时间' }
  }

  const seatOverlap = existingReservations.some(
    (r) =>
      r.roomId === targetRoomId &&
      r.seatId === targetSeatId &&
      (r.status === 'pending' || r.status === 'active') &&
      newStart < new Date(r.endTime).getTime() &&
      newEnd > new Date(r.startTime).getTime()
  )
  if (seatOverlap) {
    return { success: false, error: '该座位在该时段已被预约，请选择其他时段或座位' }
  }

  const userTimeOverlap = existingReservations.some(
    (r) =>
      r.userId === userId &&
      (r.status === 'pending' || r.status === 'active') &&
      newStart < new Date(r.endTime).getTime() &&
      newEnd > new Date(r.startTime).getTime()
  )
  if (userTimeOverlap) {
    return { success: false, error: '该时间段与您的其他预约冲突，同一时段只能预约一个座位' }
  }

  return { success: true }
}

function validateCancellation(params: {
  isAuthenticated: boolean
  userId?: string
  reservationId: string
  existingReservations: Reservation[]
}): ValidateResult {
  const { isAuthenticated, userId, reservationId, existingReservations } = params

  if (!isAuthenticated || !userId) {
    return { success: false, error: '请先登录' }
  }

  if (!reservationId) {
    return { success: false, error: '缺少必要参数：reservationId' }
  }

  const reservation = existingReservations.find((r) => r.id === reservationId)
  if (!reservation) {
    return { success: false, error: '预约记录不存在' }
  }

  if (reservation.userId !== userId) {
    return { success: false, error: '无权取消他人的预约' }
  }

  if (reservation.status !== 'pending') {
    return { success: false, error: '该预约无法取消' }
  }

  return { success: true }
}

function hoursFromNow(h: number): string {
  return new Date(Date.now() + h * 60 * 60 * 1000).toISOString()
}

describe('预约系统 - 预约接口测试', () => {
  let room: Room
  let user: User
  let otherUser: User
  let existingReservations: Reservation[]

  beforeEach(() => {
    room = createMockRoom()
    user = createMockUser({ id: 'user_test' })
    otherUser = createMockUser({ id: 'user_other' })
    existingReservations = []
  })

  it('TC-R01: 已登录用户预约可用座位 - 正常流程', () => {
    const seat = room.seats[0][0]
    const start = hoursFromNow(1)
    const end = hoursFromNow(3)

    const result = validateReservation({
      isAuthenticated: true,
      userId: user.id,
      room,
      seat,
      startTime: start,
      endTime: end,
      existingReservations,
      targetSeatId: seat.id,
      targetRoomId: room.id,
    })

    recordResult(
      {
        id: 'TC-R01',
        name: '已登录用户预约可用座位',
        category: '正常预约',
        seatStatus: 'available',
        userAuthenticated: true,
        timeValid: true,
        expected: 'SUCCESS',
        reason: '满足所有预约条件',
      },
      result.success ? 'SUCCESS' : 'FAIL'
    )

    expect(result.success).toBe(true)
  })

  it('TC-R02: 未登录用户预约座位 - 应失败', () => {
    const seat = room.seats[0][0]
    const start = hoursFromNow(1)
    const end = hoursFromNow(3)

    const result = validateReservation({
      isAuthenticated: false,
      userId: undefined,
      room,
      seat,
      startTime: start,
      endTime: end,
      existingReservations,
      targetSeatId: seat.id,
      targetRoomId: room.id,
    })

    recordResult(
      {
        id: 'TC-R02',
        name: '未登录用户预约座位',
        category: '认证校验',
        seatStatus: 'available',
        userAuthenticated: false,
        timeValid: true,
        expected: 'FAIL',
        reason: '用户未登录',
      },
      result.success ? 'SUCCESS' : 'FAIL'
    )

    expect(result.success).toBe(false)
    expect(result.error).toBe('请先登录')
  })

  it('TC-R03: 缺少roomId参数 - 应失败', () => {
    const seat = room.seats[0][0]
    const start = hoursFromNow(1)
    const end = hoursFromNow(3)

    const result = validateReservation({
      isAuthenticated: true,
      userId: user.id,
      room,
      seat,
      startTime: start,
      endTime: end,
      existingReservations,
      targetSeatId: seat.id,
      targetRoomId: '',
    })

    recordResult(
      {
        id: 'TC-R03',
        name: '缺少roomId参数',
        category: '参数校验',
        seatStatus: 'available',
        userAuthenticated: true,
        timeValid: true,
        expected: 'FAIL',
        reason: '缺少必要参数roomId',
      },
      result.success ? 'SUCCESS' : 'FAIL'
    )

    expect(result.success).toBe(false)
    expect(result.error).toContain('缺少必要参数')
  })

  it('TC-R04: 缺少seatId参数 - 应失败', () => {
    const seat = room.seats[0][0]
    const start = hoursFromNow(1)
    const end = hoursFromNow(3)

    const result = validateReservation({
      isAuthenticated: true,
      userId: user.id,
      room,
      seat,
      startTime: start,
      endTime: end,
      existingReservations,
      targetSeatId: '',
      targetRoomId: room.id,
    })

    recordResult(
      {
        id: 'TC-R04',
        name: '缺少seatId参数',
        category: '参数校验',
        seatStatus: 'available',
        userAuthenticated: true,
        timeValid: true,
        expected: 'FAIL',
        reason: '缺少必要参数seatId',
      },
      result.success ? 'SUCCESS' : 'FAIL'
    )

    expect(result.success).toBe(false)
    expect(result.error).toContain('缺少必要参数')
  })

  it('TC-R05: 房间不存在 - 应失败', () => {
    const seat = room.seats[0][0]
    const start = hoursFromNow(1)
    const end = hoursFromNow(3)

    const result = validateReservation({
      isAuthenticated: true,
      userId: user.id,
      room: null,
      seat,
      startTime: start,
      endTime: end,
      existingReservations,
      targetSeatId: seat.id,
      targetRoomId: 'nonexistent_room',
    })

    recordResult(
      {
        id: 'TC-R05',
        name: '房间不存在',
        category: '房间校验',
        seatStatus: 'available',
        userAuthenticated: true,
        timeValid: true,
        expected: 'FAIL',
        reason: 'roomId对应的房间不存在',
      },
      result.success ? 'SUCCESS' : 'FAIL'
    )

    expect(result.success).toBe(false)
    expect(result.error).toBe('房间不存在')
  })

  it('TC-R06: 座位不存在 - 应失败', () => {
    const start = hoursFromNow(1)
    const end = hoursFromNow(3)

    const result = validateReservation({
      isAuthenticated: true,
      userId: user.id,
      room,
      seat: null,
      startTime: start,
      endTime: end,
      existingReservations,
      targetSeatId: 'nonexistent_seat',
      targetRoomId: room.id,
    })

    recordResult(
      {
        id: 'TC-R06',
        name: '座位不存在',
        category: '座位校验',
        seatStatus: 'available' as SeatStatus,
        userAuthenticated: true,
        timeValid: true,
        expected: 'FAIL',
        reason: 'seatId对应的座位不存在',
      },
      result.success ? 'SUCCESS' : 'FAIL'
    )

    expect(result.success).toBe(false)
    expect(result.error).toBe('座位不存在')
  })

  it('TC-R07: 座位状态为occupied但时段不冲突 - 应成功', () => {
    const seat: Seat = { ...room.seats[0][0], status: 'occupied', occupiedBy: 'user_other' }
    const start = hoursFromNow(1)
    const end = hoursFromNow(3)

    const result = validateReservation({
      isAuthenticated: true,
      userId: user.id,
      room,
      seat,
      startTime: start,
      endTime: end,
      existingReservations,
      targetSeatId: seat.id,
      targetRoomId: room.id,
    })

    recordResult(
      {
        id: 'TC-R07',
        name: '座位占用中但时段不冲突',
        category: '时段不冲突',
        seatStatus: 'occupied',
        userAuthenticated: true,
        timeValid: true,
        expected: 'SUCCESS',
        reason: '预约的是未来时段，与当前占用不冲突',
      },
      result.success ? 'SUCCESS' : 'FAIL'
    )

    expect(result.success).toBe(true)
  })

  it('TC-R08: 座位状态为reserved但时段不冲突 - 应成功', () => {
    const seat: Seat = { ...room.seats[0][0], status: 'reserved', reservedBy: 'user_other' }
    const start = hoursFromNow(4)
    const end = hoursFromNow(6)

    existingReservations.push(
      createMockReservation({
        userId: otherUser.id,
        seatId: seat.id,
        roomId: room.id,
        startTime: hoursFromNow(1),
        endTime: hoursFromNow(3),
        status: 'pending',
      })
    )

    const result = validateReservation({
      isAuthenticated: true,
      userId: user.id,
      room,
      seat,
      startTime: start,
      endTime: end,
      existingReservations,
      targetSeatId: seat.id,
      targetRoomId: room.id,
    })

    recordResult(
      {
        id: 'TC-R08',
        name: '座位有预约但时段不冲突',
        category: '时段不冲突',
        seatStatus: 'reserved',
        userAuthenticated: true,
        timeValid: true,
        expected: 'SUCCESS',
        reason: '同一座位可以被预约不同的时段，只要不重叠',
      },
      result.success ? 'SUCCESS' : 'FAIL'
    )

    expect(result.success).toBe(true)
  })

  it('TC-R09: 结束时间早于开始时间 - 应失败', () => {
    const seat = room.seats[0][0]
    const start = hoursFromNow(3)
    const end = hoursFromNow(1)

    const result = validateReservation({
      isAuthenticated: true,
      userId: user.id,
      room,
      seat,
      startTime: start,
      endTime: end,
      existingReservations,
      targetSeatId: seat.id,
      targetRoomId: room.id,
    })

    recordResult(
      {
        id: 'TC-R09',
        name: '结束时间早于开始时间',
        category: '时间校验',
        seatStatus: 'available',
        userAuthenticated: true,
        timeValid: false,
        expected: 'FAIL',
        reason: 'endTime <= startTime，时间范围无效',
      },
      result.success ? 'SUCCESS' : 'FAIL'
    )

    expect(result.success).toBe(false)
    expect(result.error).toBe('结束时间必须晚于开始时间')
  })

  it('TC-R10: 结束时间等于开始时间 - 应失败', () => {
    const seat = room.seats[0][0]
    const start = hoursFromNow(1)
    const end = start

    const result = validateReservation({
      isAuthenticated: true,
      userId: user.id,
      room,
      seat,
      startTime: start,
      endTime: end,
      existingReservations,
      targetSeatId: seat.id,
      targetRoomId: room.id,
    })

    recordResult(
      {
        id: 'TC-R10',
        name: '结束时间等于开始时间',
        category: '时间校验',
        seatStatus: 'available',
        userAuthenticated: true,
        timeValid: false,
        expected: 'FAIL',
        reason: 'endTime === startTime，零时长预约无效',
      },
      result.success ? 'SUCCESS' : 'FAIL'
    )

    expect(result.success).toBe(false)
    expect(result.error).toBe('结束时间必须晚于开始时间')
  })

  it('TC-R11: 座位时段冲突 - 同一座位同一时段已被预约', () => {
    const seat = room.seats[0][0]
    const start = hoursFromNow(1)
    const end = hoursFromNow(3)

    existingReservations.push(
      createMockReservation({
        userId: otherUser.id,
        seatId: seat.id,
        roomId: room.id,
        startTime: start,
        endTime: end,
        status: 'pending',
      })
    )

    const result = validateReservation({
      isAuthenticated: true,
      userId: user.id,
      room,
      seat,
      startTime: start,
      endTime: end,
      existingReservations,
      targetSeatId: seat.id,
      targetRoomId: room.id,
    })

    recordResult(
      {
        id: 'TC-R11',
        name: '座位时段冲突-完全重叠',
        category: '时段冲突',
        seatStatus: 'available',
        userAuthenticated: true,
        timeValid: true,
        expected: 'FAIL',
        reason: '同一座位在同一时段已被他人预约',
      },
      result.success ? 'SUCCESS' : 'FAIL'
    )

    expect(result.success).toBe(false)
    expect(result.error).toContain('已被预约')
  })

  it('TC-R12: 座位时段冲突 - 新预约开始时间落在已有预约时段内', () => {
    const seat = room.seats[0][0]

    existingReservations.push(
      createMockReservation({
        userId: otherUser.id,
        seatId: seat.id,
        roomId: room.id,
        startTime: hoursFromNow(1),
        endTime: hoursFromNow(4),
        status: 'pending',
      })
    )

    const result = validateReservation({
      isAuthenticated: true,
      userId: user.id,
      room,
      seat,
      startTime: hoursFromNow(2),
      endTime: hoursFromNow(5),
      existingReservations,
      targetSeatId: seat.id,
      targetRoomId: room.id,
    })

    recordResult(
      {
        id: 'TC-R12',
        name: '座位时段冲突-开始时间重叠',
        category: '时段冲突',
        seatStatus: 'available',
        userAuthenticated: true,
        timeValid: true,
        expected: 'FAIL',
        reason: '新预约开始时间落在已有预约时段内',
      },
      result.success ? 'SUCCESS' : 'FAIL'
    )

    expect(result.success).toBe(false)
  })

  it('TC-R13: 座位时段冲突 - 新预约结束时间落在已有预约时段内', () => {
    const seat = room.seats[0][0]

    existingReservations.push(
      createMockReservation({
        userId: otherUser.id,
        seatId: seat.id,
        roomId: room.id,
        startTime: hoursFromNow(2),
        endTime: hoursFromNow(5),
        status: 'pending',
      })
    )

    const result = validateReservation({
      isAuthenticated: true,
      userId: user.id,
      room,
      seat,
      startTime: hoursFromNow(1),
      endTime: hoursFromNow(3),
      existingReservations,
      targetSeatId: seat.id,
      targetRoomId: room.id,
    })

    recordResult(
      {
        id: 'TC-R13',
        name: '座位时段冲突-结束时间重叠',
        category: '时段冲突',
        seatStatus: 'available',
        userAuthenticated: true,
        timeValid: true,
        expected: 'FAIL',
        reason: '新预约结束时间落在已有预约时段内',
      },
      result.success ? 'SUCCESS' : 'FAIL'
    )

    expect(result.success).toBe(false)
  })

  it('TC-R14: 座位时段冲突 - 新预约包含已有预约时段', () => {
    const seat = room.seats[0][0]

    existingReservations.push(
      createMockReservation({
        userId: otherUser.id,
        seatId: seat.id,
        roomId: room.id,
        startTime: hoursFromNow(2),
        endTime: hoursFromNow(3),
        status: 'pending',
      })
    )

    const result = validateReservation({
      isAuthenticated: true,
      userId: user.id,
      room,
      seat,
      startTime: hoursFromNow(1),
      endTime: hoursFromNow(4),
      existingReservations,
      targetSeatId: seat.id,
      targetRoomId: room.id,
    })

    recordResult(
      {
        id: 'TC-R14',
        name: '座位时段冲突-新预约包含旧时段',
        category: '时段冲突',
        seatStatus: 'available',
        userAuthenticated: true,
        timeValid: true,
        expected: 'FAIL',
        reason: '新预约的时间范围包含了已有的预约时段',
      },
      result.success ? 'SUCCESS' : 'FAIL'
    )

    expect(result.success).toBe(false)
  })

  it('TC-R15: 用户时段冲突 - 同一用户同一时段预约不同座位', () => {
    const seat1 = room.seats[0][0]
    const seat2 = room.seats[0][1]
    const start = hoursFromNow(1)
    const end = hoursFromNow(3)

    existingReservations.push(
      createMockReservation({
        userId: user.id,
        seatId: seat1.id,
        roomId: room.id,
        startTime: start,
        endTime: end,
        status: 'pending',
      })
    )

    const result = validateReservation({
      isAuthenticated: true,
      userId: user.id,
      room,
      seat: seat2,
      startTime: start,
      endTime: end,
      existingReservations,
      targetSeatId: seat2.id,
      targetRoomId: room.id,
    })

    recordResult(
      {
        id: 'TC-R15',
        name: '用户时段冲突-同时预约不同座位',
        category: '时段冲突',
        seatStatus: 'available',
        userAuthenticated: true,
        timeValid: true,
        expected: 'FAIL',
        reason: '同一用户同一时段不能预约多个座位',
      },
      result.success ? 'SUCCESS' : 'FAIL'
    )

    expect(result.success).toBe(false)
    expect(result.error).toContain('冲突')
  })

  it('TC-R16: 不同时段预约同一座位 - 应成功', () => {
    const seat = room.seats[0][0]

    existingReservations.push(
      createMockReservation({
        userId: otherUser.id,
        seatId: seat.id,
        roomId: room.id,
        startTime: hoursFromNow(1),
        endTime: hoursFromNow(3),
        status: 'pending',
      })
    )

    const result = validateReservation({
      isAuthenticated: true,
      userId: user.id,
      room,
      seat,
      startTime: hoursFromNow(4),
      endTime: hoursFromNow(6),
      existingReservations,
      targetSeatId: seat.id,
      targetRoomId: room.id,
    })

    recordResult(
      {
        id: 'TC-R16',
        name: '不同时段预约同一座位',
        category: '时段不冲突',
        seatStatus: 'available',
        userAuthenticated: true,
        timeValid: true,
        expected: 'SUCCESS',
        reason: '时段不重叠，可以预约同一座位',
      },
      result.success ? 'SUCCESS' : 'FAIL'
    )

    expect(result.success).toBe(true)
  })

  it('TC-R16b: 同一用户预约同一座位的不同时段 - 应成功', () => {
    const seat = room.seats[0][0]

    existingReservations.push(
      createMockReservation({
        userId: user.id,
        seatId: seat.id,
        roomId: room.id,
        startTime: hoursFromNow(1),
        endTime: hoursFromNow(3),
        status: 'pending',
      })
    )

    const result = validateReservation({
      isAuthenticated: true,
      userId: user.id,
      room,
      seat,
      startTime: hoursFromNow(4),
      endTime: hoursFromNow(6),
      existingReservations,
      targetSeatId: seat.id,
      targetRoomId: room.id,
    })

    recordResult(
      {
        id: 'TC-R16b',
        name: '同一用户同一座位不同时段',
        category: '时段不冲突',
        seatStatus: 'available',
        userAuthenticated: true,
        timeValid: true,
        expected: 'SUCCESS',
        reason: '同一用户可以预约同一座位的不同时段',
      },
      result.success ? 'SUCCESS' : 'FAIL'
    )

    expect(result.success).toBe(true)
  })

  it('TC-R17: 同一时段不同用户预约不同座位 - 应成功', () => {
    const seat1 = room.seats[0][0]
    const seat2 = room.seats[0][1]
    const start = hoursFromNow(1)
    const end = hoursFromNow(3)

    existingReservations.push(
      createMockReservation({
        userId: otherUser.id,
        seatId: seat1.id,
        roomId: room.id,
        startTime: start,
        endTime: end,
        status: 'pending',
      })
    )

    const result = validateReservation({
      isAuthenticated: true,
      userId: user.id,
      room,
      seat: seat2,
      startTime: start,
      endTime: end,
      existingReservations,
      targetSeatId: seat2.id,
      targetRoomId: room.id,
    })

    recordResult(
      {
        id: 'TC-R17',
        name: '不同用户同一时段预约不同座位',
        category: '用户不冲突',
        seatStatus: 'available',
        userAuthenticated: true,
        timeValid: true,
        expected: 'SUCCESS',
        reason: '不同用户可以同时预约不同座位',
      },
      result.success ? 'SUCCESS' : 'FAIL'
    )

    expect(result.success).toBe(true)
  })

  it('TC-R18: 已完成的预约不造成时段冲突', () => {
    const seat = room.seats[0][0]
    const start = hoursFromNow(1)
    const end = hoursFromNow(3)

    existingReservations.push(
      createMockReservation({
        userId: otherUser.id,
        seatId: seat.id,
        roomId: room.id,
        startTime: start,
        endTime: end,
        status: 'completed',
      })
    )

    const result = validateReservation({
      isAuthenticated: true,
      userId: user.id,
      room,
      seat,
      startTime: start,
      endTime: end,
      existingReservations,
      targetSeatId: seat.id,
      targetRoomId: room.id,
    })

    recordResult(
      {
        id: 'TC-R18',
        name: '已完成预约不造成冲突',
        category: '预约状态',
        seatStatus: 'available',
        userAuthenticated: true,
        timeValid: true,
        expected: 'SUCCESS',
        reason: '已完成(completed)的预约不占时段',
      },
      result.success ? 'SUCCESS' : 'FAIL'
    )

    expect(result.success).toBe(true)
  })

  it('TC-R19: 已取消的预约不造成时段冲突', () => {
    const seat = room.seats[0][0]
    const start = hoursFromNow(1)
    const end = hoursFromNow(3)

    existingReservations.push(
      createMockReservation({
        userId: otherUser.id,
        seatId: seat.id,
        roomId: room.id,
        startTime: start,
        endTime: end,
        status: 'cancelled',
      })
    )

    const result = validateReservation({
      isAuthenticated: true,
      userId: user.id,
      room,
      seat,
      startTime: start,
      endTime: end,
      existingReservations,
      targetSeatId: seat.id,
      targetRoomId: room.id,
    })

    recordResult(
      {
        id: 'TC-R19',
        name: '已取消预约不造成冲突',
        category: '预约状态',
        seatStatus: 'available',
        userAuthenticated: true,
        timeValid: true,
        expected: 'SUCCESS',
        reason: '已取消(cancelled)的预约不占时段',
      },
      result.success ? 'SUCCESS' : 'FAIL'
    )

    expect(result.success).toBe(true)
  })

  it('TC-R20: 时段紧邻不冲突 - 前一预约结束时间等于新预约开始时间', () => {
    const seat = room.seats[0][0]

    existingReservations.push(
      createMockReservation({
        userId: otherUser.id,
        seatId: seat.id,
        roomId: room.id,
        startTime: hoursFromNow(1),
        endTime: hoursFromNow(3),
        status: 'pending',
      })
    )

    const result = validateReservation({
      isAuthenticated: true,
      userId: user.id,
      room,
      seat,
      startTime: hoursFromNow(3),
      endTime: hoursFromNow(5),
      existingReservations,
      targetSeatId: seat.id,
      targetRoomId: room.id,
    })

    recordResult(
      {
        id: 'TC-R20',
        name: '时段紧邻不冲突',
        category: '时段边界',
        seatStatus: 'available',
        userAuthenticated: true,
        timeValid: true,
        expected: 'SUCCESS',
        reason: '前一预约结束=新预约开始，不重叠',
      },
      result.success ? 'SUCCESS' : 'FAIL'
    )

    expect(result.success).toBe(true)
  })

  it('TC-R21: 预约1小时时长 - 应成功', () => {
    const seat = room.seats[0][0]

    const result = validateReservation({
      isAuthenticated: true,
      userId: user.id,
      room,
      seat,
      startTime: hoursFromNow(1),
      endTime: hoursFromNow(2),
      existingReservations,
      targetSeatId: seat.id,
      targetRoomId: room.id,
    })

    recordResult(
      {
        id: 'TC-R21',
        name: '预约1小时时长',
        category: '预约时长',
        seatStatus: 'available',
        userAuthenticated: true,
        timeValid: true,
        expected: 'SUCCESS',
        reason: '1小时为合法预约时长',
      },
      result.success ? 'SUCCESS' : 'FAIL'
    )

    expect(result.success).toBe(true)
  })

  it('TC-R22: 预约4小时时长 - 应成功', () => {
    const seat = room.seats[0][0]

    const result = validateReservation({
      isAuthenticated: true,
      userId: user.id,
      room,
      seat,
      startTime: hoursFromNow(1),
      endTime: hoursFromNow(5),
      existingReservations,
      targetSeatId: seat.id,
      targetRoomId: room.id,
    })

    recordResult(
      {
        id: 'TC-R22',
        name: '预约4小时时长',
        category: '预约时长',
        seatStatus: 'available',
        userAuthenticated: true,
        timeValid: true,
        expected: 'SUCCESS',
        reason: '4小时为合法预约时长',
      },
      result.success ? 'SUCCESS' : 'FAIL'
    )

    expect(result.success).toBe(true)
  })

  it('TC-R23: 缺少startTime参数 - 应失败', () => {
    const seat = room.seats[0][0]

    const result = validateReservation({
      isAuthenticated: true,
      userId: user.id,
      room,
      seat,
      startTime: '',
      endTime: hoursFromNow(3),
      existingReservations,
      targetSeatId: seat.id,
      targetRoomId: room.id,
    })

    recordResult(
      {
        id: 'TC-R23',
        name: '缺少startTime参数',
        category: '参数校验',
        seatStatus: 'available',
        userAuthenticated: true,
        timeValid: false,
        expected: 'FAIL',
        reason: '缺少必要参数startTime',
      },
      result.success ? 'SUCCESS' : 'FAIL'
    )

    expect(result.success).toBe(false)
  })

  it('TC-R24: 缺少endTime参数 - 应失败', () => {
    const seat = room.seats[0][0]

    const result = validateReservation({
      isAuthenticated: true,
      userId: user.id,
      room,
      seat,
      startTime: hoursFromNow(1),
      endTime: '',
      existingReservations,
      targetSeatId: seat.id,
      targetRoomId: room.id,
    })

    recordResult(
      {
        id: 'TC-R24',
        name: '缺少endTime参数',
        category: '参数校验',
        seatStatus: 'available',
        userAuthenticated: true,
        timeValid: false,
        expected: 'FAIL',
        reason: '缺少必要参数endTime',
      },
      result.success ? 'SUCCESS' : 'FAIL'
    )

    expect(result.success).toBe(false)
  })

  it('TC-R25: active状态的预约也会造成座位时段冲突', () => {
    const seat = room.seats[0][0]
    const start = hoursFromNow(1)
    const end = hoursFromNow(3)

    existingReservations.push(
      createMockReservation({
        userId: otherUser.id,
        seatId: seat.id,
        roomId: room.id,
        startTime: start,
        endTime: end,
        status: 'active',
      })
    )

    const result = validateReservation({
      isAuthenticated: true,
      userId: user.id,
      room,
      seat,
      startTime: start,
      endTime: end,
      existingReservations,
      targetSeatId: seat.id,
      targetRoomId: room.id,
    })

    recordResult(
      {
        id: 'TC-R25',
        name: 'active状态预约造成座位冲突',
        category: '预约状态',
        seatStatus: 'available',
        userAuthenticated: true,
        timeValid: true,
        expected: 'FAIL',
        reason: 'active状态(使用中)的预约也占时段',
      },
      result.success ? 'SUCCESS' : 'FAIL'
    )

    expect(result.success).toBe(false)
  })

  it('TC-R26: active状态的预约也会造成用户时段冲突', () => {
    const seat1 = room.seats[0][0]
    const seat2 = room.seats[0][1]
    const start = hoursFromNow(1)
    const end = hoursFromNow(3)

    existingReservations.push(
      createMockReservation({
        userId: user.id,
        seatId: seat1.id,
        roomId: room.id,
        startTime: start,
        endTime: end,
        status: 'active',
      })
    )

    const result = validateReservation({
      isAuthenticated: true,
      userId: user.id,
      room,
      seat: seat2,
      startTime: start,
      endTime: end,
      existingReservations,
      targetSeatId: seat2.id,
      targetRoomId: room.id,
    })

    recordResult(
      {
        id: 'TC-R26',
        name: 'active状态预约造成用户冲突',
        category: '预约状态',
        seatStatus: 'available',
        userAuthenticated: true,
        timeValid: true,
        expected: 'FAIL',
        reason: '用户已有active预约，同一时段不能预约其他座位',
      },
      result.success ? 'SUCCESS' : 'FAIL'
    )

    expect(result.success).toBe(false)
  })

  it('TC-R27: 不同房间的座位不造成座位时段冲突', () => {
    const seat = room.seats[0][0]
    const start = hoursFromNow(1)
    const end = hoursFromNow(3)

    existingReservations.push(
      createMockReservation({
        userId: otherUser.id,
        seatId: 'other_room_seat_0_0',
        roomId: 'other_room',
        startTime: start,
        endTime: end,
        status: 'pending',
      })
    )

    const result = validateReservation({
      isAuthenticated: true,
      userId: user.id,
      room,
      seat,
      startTime: start,
      endTime: end,
      existingReservations,
      targetSeatId: seat.id,
      targetRoomId: room.id,
    })

    recordResult(
      {
        id: 'TC-R27',
        name: '不同房间座位不造成冲突',
        category: '房间隔离',
        seatStatus: 'available',
        userAuthenticated: true,
        timeValid: true,
        expected: 'SUCCESS',
        reason: '不同房间的座位时段互不影响',
      },
      result.success ? 'SUCCESS' : 'FAIL'
    )

    expect(result.success).toBe(true)
  })

  it('TC-R28: 用户时段冲突 - 部分重叠(前半段)', () => {
    const seat1 = room.seats[0][0]
    const seat2 = room.seats[0][1]

    existingReservations.push(
      createMockReservation({
        userId: user.id,
        seatId: seat1.id,
        roomId: room.id,
        startTime: hoursFromNow(2),
        endTime: hoursFromNow(5),
        status: 'pending',
      })
    )

    const result = validateReservation({
      isAuthenticated: true,
      userId: user.id,
      room,
      seat: seat2,
      startTime: hoursFromNow(1),
      endTime: hoursFromNow(3),
      existingReservations,
      targetSeatId: seat2.id,
      targetRoomId: room.id,
    })

    recordResult(
      {
        id: 'TC-R28',
        name: '用户时段冲突-前半段重叠',
        category: '时段冲突',
        seatStatus: 'available',
        userAuthenticated: true,
        timeValid: true,
        expected: 'FAIL',
        reason: '用户的前半段预约与已有预约重叠',
      },
      result.success ? 'SUCCESS' : 'FAIL'
    )

    expect(result.success).toBe(false)
  })
})

describe('预约系统 - 取消预约接口测试', () => {
  let user: User
  let otherUser: User
  let existingReservations: Reservation[]

  beforeEach(() => {
    user = createMockUser({ id: 'user_test' })
    otherUser = createMockUser({ id: 'user_other' })
    existingReservations = []
  })

  it('TC-C01: 正常取消pending状态的预约 - 应成功', () => {
    existingReservations.push(
      createMockReservation({
        id: 'res_cancel_1',
        userId: user.id,
        status: 'pending',
      })
    )

    const result = validateCancellation({
      isAuthenticated: true,
      userId: user.id,
      reservationId: 'res_cancel_1',
      existingReservations,
    })

    recordResult(
      {
        id: 'TC-C01',
        name: '正常取消pending预约',
        category: '取消预约',
        seatStatus: 'available' as SeatStatus,
        userAuthenticated: true,
        timeValid: true,
        expected: 'SUCCESS',
        reason: '自己的pending预约可以正常取消',
      },
      result.success ? 'SUCCESS' : 'FAIL'
    )

    expect(result.success).toBe(true)
  })

  it('TC-C02: 未登录用户取消预约 - 应失败', () => {
    existingReservations.push(
      createMockReservation({
        id: 'res_cancel_2',
        userId: user.id,
        status: 'pending',
      })
    )

    const result = validateCancellation({
      isAuthenticated: false,
      userId: undefined,
      reservationId: 'res_cancel_2',
      existingReservations,
    })

    recordResult(
      {
        id: 'TC-C02',
        name: '未登录用户取消预约',
        category: '取消预约-认证',
        seatStatus: 'available' as SeatStatus,
        userAuthenticated: false,
        timeValid: true,
        expected: 'FAIL',
        reason: '未登录用户无法取消预约',
      },
      result.success ? 'SUCCESS' : 'FAIL'
    )

    expect(result.success).toBe(false)
    expect(result.error).toBe('请先登录')
  })

  it('TC-C03: 缺少reservationId - 应失败', () => {
    const result = validateCancellation({
      isAuthenticated: true,
      userId: user.id,
      reservationId: '',
      existingReservations,
    })

    recordResult(
      {
        id: 'TC-C03',
        name: '缺少reservationId参数',
        category: '取消预约-参数',
        seatStatus: 'available' as SeatStatus,
        userAuthenticated: true,
        timeValid: true,
        expected: 'FAIL',
        reason: '缺少必要参数reservationId',
      },
      result.success ? 'SUCCESS' : 'FAIL'
    )

    expect(result.success).toBe(false)
    expect(result.error).toContain('缺少必要参数')
  })

  it('TC-C04: 预约记录不存在 - 应失败', () => {
    const result = validateCancellation({
      isAuthenticated: true,
      userId: user.id,
      reservationId: 'nonexistent_id',
      existingReservations,
    })

    recordResult(
      {
        id: 'TC-C04',
        name: '预约记录不存在',
        category: '取消预约-存在性',
        seatStatus: 'available' as SeatStatus,
        userAuthenticated: true,
        timeValid: true,
        expected: 'FAIL',
        reason: '预约ID不存在',
      },
      result.success ? 'SUCCESS' : 'FAIL'
    )

    expect(result.success).toBe(false)
    expect(result.error).toBe('预约记录不存在')
  })

  it('TC-C05: 取消他人的预约 - 应失败', () => {
    existingReservations.push(
      createMockReservation({
        id: 'res_cancel_5',
        userId: otherUser.id,
        status: 'pending',
      })
    )

    const result = validateCancellation({
      isAuthenticated: true,
      userId: user.id,
      reservationId: 'res_cancel_5',
      existingReservations,
    })

    recordResult(
      {
        id: 'TC-C05',
        name: '取消他人的预约',
        category: '取消预约-权限',
        seatStatus: 'available' as SeatStatus,
        userAuthenticated: true,
        timeValid: true,
        expected: 'FAIL',
        reason: '不能取消他人的预约(403 Forbidden)',
      },
      result.success ? 'SUCCESS' : 'FAIL'
    )

    expect(result.success).toBe(false)
    expect(result.error).toContain('无权')
  })

  it('TC-C06: 取消active状态的预约 - 应失败', () => {
    existingReservations.push(
      createMockReservation({
        id: 'res_cancel_6',
        userId: user.id,
        status: 'active',
      })
    )

    const result = validateCancellation({
      isAuthenticated: true,
      userId: user.id,
      reservationId: 'res_cancel_6',
      existingReservations,
    })

    recordResult(
      {
        id: 'TC-C06',
        name: '取消active状态预约',
        category: '取消预约-状态',
        seatStatus: 'available' as SeatStatus,
        userAuthenticated: true,
        timeValid: true,
        expected: 'FAIL',
        reason: 'active(使用中)状态不可取消',
      },
      result.success ? 'SUCCESS' : 'FAIL'
    )

    expect(result.success).toBe(false)
    expect(result.error).toBe('该预约无法取消')
  })

  it('TC-C07: 取消completed状态的预约 - 应失败', () => {
    existingReservations.push(
      createMockReservation({
        id: 'res_cancel_7',
        userId: user.id,
        status: 'completed',
      })
    )

    const result = validateCancellation({
      isAuthenticated: true,
      userId: user.id,
      reservationId: 'res_cancel_7',
      existingReservations,
    })

    recordResult(
      {
        id: 'TC-C07',
        name: '取消completed状态预约',
        category: '取消预约-状态',
        seatStatus: 'available' as SeatStatus,
        userAuthenticated: true,
        timeValid: true,
        expected: 'FAIL',
        reason: 'completed(已完成)状态不可取消',
      },
      result.success ? 'SUCCESS' : 'FAIL'
    )

    expect(result.success).toBe(false)
    expect(result.error).toBe('该预约无法取消')
  })

  it('TC-C08: 取消cancelled状态的预约 - 应失败', () => {
    existingReservations.push(
      createMockReservation({
        id: 'res_cancel_8',
        userId: user.id,
        status: 'cancelled',
      })
    )

    const result = validateCancellation({
      isAuthenticated: true,
      userId: user.id,
      reservationId: 'res_cancel_8',
      existingReservations,
    })

    recordResult(
      {
        id: 'TC-C08',
        name: '取消cancelled状态预约',
        category: '取消预约-状态',
        seatStatus: 'available' as SeatStatus,
        userAuthenticated: true,
        timeValid: true,
        expected: 'FAIL',
        reason: 'cancelled(已取消)状态不可再取消',
      },
      result.success ? 'SUCCESS' : 'FAIL'
    )

    expect(result.success).toBe(false)
    expect(result.error).toBe('该预约无法取消')
  })
})

describe('预约系统 - 测试结果汇总表', () => {
  it('生成所有测试用例结果汇总', () => {
    console.log('\n')
    console.log('='.repeat(120))
    console.log('  📋 预约系统测试用例结果汇总表')
    console.log('='.repeat(120))
    console.log(
      '| 编号    | 用例名称                                   | 分类           | 座位状态   | 已登录 | 时间合法 | 预期   | 实际   | 结果 |'
    )
    console.log(
      '|---------|-------------------------------------------|---------------|-----------|--------|---------|--------|--------|------|'
    )

    for (const r of testResults) {
      const statusStr = r.seatStatus.padEnd(9)
      const authStr = r.userAuthenticated ? '✅     ' : '❌     '
      const timeStr = r.timeValid ? '✅     ' : '❌     '
      const expectedStr = r.expected === 'SUCCESS' ? '✅ 成功 ' : '❌ 失败 '
      const actualStr = r.actual === 'SUCCESS' ? '✅ 成功 ' : '❌ 失败 '
      const passStr = r.expected === r.actual ? '✅' : '❌'
      const nameStr = r.name.padEnd(41)
      const catStr = r.category.padEnd(13)

      console.log(
        `| ${r.id}  | ${nameStr} | ${catStr} | ${statusStr} | ${authStr} | ${timeStr} | ${expectedStr} | ${actualStr} | ${passStr}   |`
      )
    }

    console.log('='.repeat(120))

    const totalSuccess = testResults.filter((r) => r.expected === 'SUCCESS').length
    const totalFail = testResults.filter((r) => r.expected === 'FAIL').length
    const actualMatch = testResults.filter((r) => r.expected === r.actual).length

    console.log(`\n  📊 统计:`)
    console.log(`     总用例数: ${testResults.length}`)
    console.log(`     预期成功: ${totalSuccess}  |  预期失败: ${totalFail}`)
    console.log(`     实际匹配: ${actualMatch} / ${testResults.length} (${((actualMatch / testResults.length) * 100).toFixed(1)}%)`)
    console.log()

    expect(actualMatch).toBe(testResults.length)
  })
})
