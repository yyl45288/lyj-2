import type {
  User,
  Room,
  Seat,
  SeatStatus,
  Reservation,
  StudyRecord,
  Badge,
  PointLog,
  StudySession,
  RoomType,
} from '../shared/types.js'

function generateGradientAvatar(text: string, color1: string, color2: string): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 80 80">
    <defs>
      <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style="stop-color:${color1};stop-opacity:1" />
        <stop offset="100%" style="stop-color:${color2};stop-opacity:1" />
      </linearGradient>
    </defs>
    <rect width="80" height="80" rx="40" fill="url(#grad)"/>
    <text x="40" y="44" font-family="Arial, sans-serif" font-size="28" font-weight="bold" fill="white" text-anchor="middle">${text}</text>
  </svg>`
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`
}

const avatarConfigs = [
  ['#667eea', '#764ba2'],
  ['#f093fb', '#f5576c'],
  ['#4facfe', '#00f2fe'],
  ['#43e97b', '#38f9d7'],
  ['#fa709a', '#fee140'],
  ['#30cfd0', '#330867'],
  ['#a8edea', '#fed6e3'],
  ['#ff9a9e', '#fecfef'],
  ['#ffecd2', '#fcb69f'],
  ['#667eea', '#764ba2'],
]

const badgeTemplates: Omit<Badge, 'unlocked' | 'unlockedAt'>[] = [
  { id: 'badge_newbie', name: '初出茅庐', description: '完成首次学习打卡', icon: '🌱' },
  { id: 'badge_persistent', name: '坚持不懈', description: '连续签到7天', icon: '🔥' },
  { id: 'badge_scholar', name: '学霸初成', description: '累计学习时长超过50小时', icon: '📚' },
  { id: 'badge_nightowl', name: '夜猫子', description: '深夜学习超过10次（22:00后）', icon: '🦉' },
  { id: 'badge_earlybird', name: '早起鸟', description: '清晨学习超过10次（6:00前）', icon: '🐦' },
  { id: 'badge_marathon', name: '马拉松', description: '单次学习超过2小时', icon: '🏃' },
]

function createBadges(): Badge[] {
  const unlockedIds = ['badge_newbie', 'badge_persistent', 'badge_scholar', 'badge_nightowl', 'badge_earlybird']
  const now = new Date()
  return badgeTemplates.map((b, idx) => {
    const date = new Date(now)
    date.setDate(date.getDate() - (idx * 3 + 1))
    return {
      ...b,
      unlocked: unlockedIds.includes(b.id),
      unlockedAt: unlockedIds.includes(b.id) ? date.toISOString() : undefined,
    }
  })
}

function createUsers(): User[] {
  const usernames = [
    '知识探索者', '星辰大海', '追光少年', '墨染青衣', '书卷气',
    '梦想家', '向阳生长', '拾光者', '学海无涯',
  ]
  const pointsList = [2150, 1890, 1720, 1580, 1450, 1320, 1100, 980, 860]
  const minutesList = [1560, 1420, 1280, 1150, 1080, 950, 820, 710, 600]
  const streakList = [25, 20, 18, 15, 13, 10, 8, 6, 4]
  const levelList = [8, 7, 7, 6, 6, 5, 5, 4, 4]

  const otherUsers: User[] = usernames.map((name, i) => {
    const chars = name.slice(0, 1)
    const cfg = avatarConfigs[(i + 1) % avatarConfigs.length]
    return {
      id: `user_${i + 1}`,
      username: name,
      avatar: generateGradientAvatar(chars, cfg[0], cfg[1]),
      points: pointsList[i],
      totalStudyMinutes: minutesList[i],
      streakDays: streakList[i],
      level: levelList[i],
      badges: createBadges().map((b, idx) => ({
        ...b,
        unlocked: idx < Math.floor(Math.random() * 5) + 2,
      })),
    }
  })

  const selfUser: User = {
    id: 'user_self',
    username: '学习小达人',
    avatar: generateGradientAvatar('学', '#667eea', '#764ba2'),
    points: 1280,
    totalStudyMinutes: 986,
    streakDays: 12,
    level: 5,
    badges: createBadges(),
  }

  return [selfUser, ...otherUsers]
}

interface RoomConfig {
  id: string
  name: string
  description: string
  type: RoomType
  rows: number
  cols: number
  themeColor: string
  icon: string
}

const roomConfigs: RoomConfig[] = [
  { id: 'room_1', name: '静谧森林自习室', description: '适合深度沉浸式学习，保持绝对安静', type: 'silent', rows: 6, cols: 8, themeColor: '#2d5a3d', icon: '🌲' },
  { id: 'room_2', name: '阳光阅读室', description: '温暖明亮的阅读空间，适合阅读和轻学习', type: 'reading', rows: 5, cols: 8, themeColor: '#f5e6d3', icon: '☀️' },
  { id: 'room_3', name: '深度专注区', description: '无干扰环境，适合高强度专注学习', type: 'focus', rows: 5, cols: 10, themeColor: '#3a4a5f', icon: '🎯' },
  { id: 'room_4', name: '轻讨论室', description: '可小声讨论，适合小组学习和交流', type: 'discussion', rows: 4, cols: 6, themeColor: '#8b7ec8', icon: '💬' },
  { id: 'room_5', name: '深夜书房', description: '安静的夜读空间，适合熬夜学习党', type: 'silent', rows: 5, cols: 8, themeColor: '#5c4033', icon: '🌙' },
  { id: 'room_6', name: '考研冲刺室', description: '热血战斗区，考研考公党的专属战场', type: 'focus', rows: 6, cols: 10, themeColor: '#c41e3a', icon: '🔥' },
]

function generateSeats(roomId: string, rows: number, cols: number, occupiedRatio: number, otherUserIds: string[]): Seat[][] {
  const seats: Seat[][] = []
  const totalSeats = rows * cols
  const occupiedCount = Math.floor(totalSeats * occupiedRatio)
  const reservedCount = Math.floor(totalSeats * 0.08)

  const allPositions: { row: number; col: number }[] = []
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      allPositions.push({ row: r, col: c })
    }
  }

  for (let i = allPositions.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [allPositions[i], allPositions[j]] = [allPositions[j], allPositions[i]]
  }

  const occupiedSet = new Set(allPositions.slice(0, occupiedCount).map(p => `${p.row}-${p.col}`))
  const reservedSet = new Set(allPositions.slice(occupiedCount, occupiedCount + reservedCount).map(p => `${p.row}-${p.col}`))

  let userIdx = 0

  for (let r = 0; r < rows; r++) {
    const row: Seat[] = []
    for (let c = 0; c < cols; c++) {
      const key = `${r}-${c}`
      let status: SeatStatus = 'available'
      let occupiedBy: string | undefined
      let reservedBy: string | undefined

      if (occupiedSet.has(key)) {
        status = 'occupied'
        occupiedBy = otherUserIds[userIdx % otherUserIds.length]
        userIdx++
      } else if (reservedSet.has(key)) {
        status = 'reserved'
        reservedBy = otherUserIds[userIdx % otherUserIds.length]
        userIdx++
      }

      row.push({
        id: `${roomId}_seat_${r}_${c}`,
        row: r,
        col: c,
        status,
        occupiedBy,
        reservedBy,
      })
    }
    seats.push(row)
  }

  return seats
}

function createRooms(): Room[] {
  const otherUserIds = users.filter(u => u.id !== 'user_self').map(u => u.id)
  return roomConfigs.map((cfg, idx) => {
    const ratio = 0.4 + (idx % 4) * 0.08
    const seats = generateSeats(cfg.id, cfg.rows, cfg.cols, ratio, otherUserIds)
    const occupied = seats.flat().filter(s => s.status === 'occupied').length
    return {
      id: cfg.id,
      name: cfg.name,
      description: cfg.description,
      type: cfg.type,
      capacity: cfg.rows * cfg.cols,
      occupied,
      themeColor: cfg.themeColor,
      icon: cfg.icon,
      seats,
    }
  })
}

function createStudyRecords(): StudyRecord[] {
  const records: StudyRecord[] = []
  const now = new Date()
  const otherUserIds = users.filter(u => u.id !== 'user_self').map(u => u.id)
  const roomNameMap = new Map(rooms.map(r => [r.id, r.name]))

  const selfRecordCount = 18
  for (let i = 0; i < selfRecordCount; i++) {
    const date = new Date(now)
    date.setDate(date.getDate() - i - (Math.random() > 0.5 ? 0 : 1))
    date.setHours(8 + Math.floor(Math.random() * 13), Math.floor(Math.random() * 60), 0, 0)

    const roomIdx = Math.floor(Math.random() * rooms.length)
    const room = rooms[roomIdx]
    const flatSeats = room.seats.flat()
    const availableSeats = flatSeats.filter(s => s.status === 'available')
    const seat = availableSeats[Math.floor(Math.random() * availableSeats.length)] || flatSeats[0]

    const duration = 25 + Math.floor(Math.random() * 120)
    const points = Math.floor(duration / 10)

    const checkOut = new Date(date)
    checkOut.setMinutes(checkOut.getMinutes() + duration)

    records.push({
      id: `record_self_${i}`,
      userId: 'user_self',
      roomId: room.id,
      seatId: seat.id,
      checkInTime: date.toISOString(),
      checkOutTime: checkOut.toISOString(),
      durationMinutes: duration,
      pointsEarned: points,
      roomName: roomNameMap.get(room.id),
      seatLabel: `${seat.row + 1}排${seat.col + 1}号`,
    })
  }

  for (let u = 0; u < otherUserIds.length; u++) {
    const count = 8 + Math.floor(Math.random() * 10)
    for (let i = 0; i < count; i++) {
      const date = new Date(now)
      date.setDate(date.getDate() - Math.floor(Math.random() * 30))
      date.setHours(8 + Math.floor(Math.random() * 13), Math.floor(Math.random() * 60), 0, 0)

      const roomIdx = Math.floor(Math.random() * rooms.length)
      const room = rooms[roomIdx]
      const flatSeats = room.seats.flat()
      const seat = flatSeats[Math.floor(Math.random() * flatSeats.length)]

      const duration = 20 + Math.floor(Math.random() * 100)
      const points = Math.floor(duration / 10)

      const checkOut = new Date(date)
      checkOut.setMinutes(checkOut.getMinutes() + duration)

      records.push({
        id: `record_${u}_${i}`,
        userId: otherUserIds[u],
        roomId: room.id,
        seatId: seat.id,
        checkInTime: date.toISOString(),
        checkOutTime: checkOut.toISOString(),
        durationMinutes: duration,
        pointsEarned: points,
        roomName: roomNameMap.get(room.id),
        seatLabel: `${seat.row + 1}排${seat.col + 1}号`,
      })
    }
  }

  return records
}

function createReservations(): Reservation[] {
  const now = new Date()
  const roomNameMap = new Map(rooms.map(r => [r.id, r.name]))
  const reservations: Reservation[] = []

  const pendingRoom = rooms[1]
  let seat1: Seat | undefined
  for (const row of pendingRoom.seats) {
    for (const s of row) {
      if (s.status === 'available') {
        seat1 = s
        s.status = 'reserved'
        s.reservedBy = 'user_self'
        break
      }
    }
    if (seat1) break
  }

  if (seat1) {
    const start = new Date(now)
    start.setHours(start.getHours() + 1, 0, 0, 0)
    const end = new Date(start)
    end.setHours(end.getHours() + 2)

    reservations.push({
      id: 'reservation_self_1',
      userId: 'user_self',
      roomId: pendingRoom.id,
      seatId: seat1.id,
      startTime: start.toISOString(),
      endTime: end.toISOString(),
      status: 'pending',
      roomName: roomNameMap.get(pendingRoom.id),
      seatLabel: `${seat1.row + 1}排${seat1.col + 1}号`,
    })
  }

  const pendingRoom2 = rooms[3]
  let seat2: Seat | undefined
  for (const row of pendingRoom2.seats) {
    for (const s of row) {
      if (s.status === 'available') {
        seat2 = s
        s.status = 'reserved'
        s.reservedBy = 'user_self'
        break
      }
    }
    if (seat2) break
  }

  if (seat2) {
    const start = new Date(now)
    start.setDate(start.getDate() + 1)
    start.setHours(9, 0, 0, 0)
    const end = new Date(start)
    end.setHours(end.getHours() + 3)

    reservations.push({
      id: 'reservation_self_2',
      userId: 'user_self',
      roomId: pendingRoom2.id,
      seatId: seat2.id,
      startTime: start.toISOString(),
      endTime: end.toISOString(),
      status: 'pending',
      roomName: roomNameMap.get(pendingRoom2.id),
      seatLabel: `${seat2.row + 1}排${seat2.col + 1}号`,
    })
  }

  const pastDate = new Date(now)
  pastDate.setDate(pastDate.getDate() - 3)
  const pastRoom = rooms[0]
  const pastSeat = pastRoom.seats[0][0]
  reservations.push({
    id: 'reservation_self_past',
    userId: 'user_self',
    roomId: pastRoom.id,
    seatId: pastSeat.id,
    startTime: pastDate.toISOString(),
    endTime: new Date(pastDate.getTime() + 2 * 60 * 60 * 1000).toISOString(),
    status: 'completed',
    roomName: roomNameMap.get(pastRoom.id),
    seatLabel: `${pastSeat.row + 1}排${pastSeat.col + 1}号`,
  })

  return reservations
}

function createPointLogs(): PointLog[] {
  const logs: PointLog[] = []
  const now = new Date()

  studyRecords.filter(r => r.userId === 'user_self').forEach((record, idx) => {
    if (record.pointsEarned > 0) {
      logs.push({
        id: `point_study_${idx}`,
        userId: 'user_self',
        amount: record.pointsEarned,
        reason: `学习奖励（${record.durationMinutes}分钟）`,
        createdAt: record.checkOutTime || record.checkInTime,
      })
    }
  })

  for (let i = 0; i < 12; i++) {
    const date = new Date(now)
    date.setDate(date.getDate() - i)
    date.setHours(7, 30, 0, 0)
    logs.push({
      id: `point_checkin_${i}`,
      userId: 'user_self',
      amount: 5,
      reason: '每日签到奖励',
      createdAt: date.toISOString(),
    })
  }

  const bonusReasons = [
    { amount: 20, reason: '连续签到7天奖励' },
    { amount: 50, reason: '首次解锁成就奖励' },
    { amount: 30, reason: '周学习时长达标奖励' },
    { amount: 10, reason: '邀请好友奖励' },
  ]
  bonusReasons.forEach((b, idx) => {
    const date = new Date(now)
    date.setDate(date.getDate() - (idx * 5 + 2))
    logs.push({
      id: `point_bonus_${idx}`,
      userId: 'user_self',
      amount: b.amount,
      reason: b.reason,
      createdAt: date.toISOString(),
    })
  })

  logs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  return logs
}

export const users: User[] = createUsers()
export const rooms: Room[] = createRooms()
export const studyRecords: StudyRecord[] = createStudyRecords()
export const reservations: Reservation[] = createReservations()
export const pointLogs: PointLog[] = createPointLogs()
export const activeSessions: Map<string, StudySession> = new Map()

export interface UserCredential {
  userId: string
  username: string
  password: string
}

export interface AuthToken {
  token: string
  userId: string
  createdAt: number
  expiresAt: number
}

const TOKEN_TTL = 7 * 24 * 60 * 60 * 1000

export const userCredentials: UserCredential[] = [
  { userId: 'user_self', username: '学习小达人', password: '123456' },
  { userId: 'user_1', username: '知识探索者', password: '123456' },
  { userId: 'user_2', username: '星辰大海', password: '123456' },
]

export const authTokens: AuthToken[] = []

function generateToken(): string {
  return 'tok_' + Math.random().toString(36).substring(2, 15) + Date.now().toString(36)
}

export function createToken(userId: string): AuthToken {
  const now = Date.now()
  const token: AuthToken = {
    token: generateToken(),
    userId,
    createdAt: now,
    expiresAt: now + TOKEN_TTL,
  }
  authTokens.push(token)
  return token
}

export function findToken(tokenStr: string): AuthToken | undefined {
  return authTokens.find(t => t.token === tokenStr && t.expiresAt > Date.now())
}

export function revokeToken(tokenStr: string): boolean {
  const idx = authTokens.findIndex(t => t.token === tokenStr)
  if (idx !== -1) {
    authTokens.splice(idx, 1)
    return true
  }
  return false
}

export function findCredentialByUsername(username: string): UserCredential | undefined {
  return userCredentials.find(c => c.username === username)
}

export function findCredentialByUserId(userId: string): UserCredential | undefined {
  return userCredentials.find(c => c.userId === userId)
}

let userCounter = 100

export function createUser(username: string, password: string): User {
  const userId = `user_${userCounter++}`
  const chars = username.slice(0, 1)
  const cfg = avatarConfigs[userCounter % avatarConfigs.length]

  const user: User = {
    id: userId,
    username,
    avatar: generateGradientAvatar(chars, cfg[0], cfg[1]),
    points: 0,
    totalStudyMinutes: 0,
    streakDays: 0,
    level: 1,
    badges: [],
  }

  users.push(user)
  userCredentials.push({ userId, username, password })

  return user
}

export function findRoom(roomId: string): Room | undefined {
  return rooms.find(r => r.id === roomId)
}

export function findSeat(roomId: string, seatId: string): Seat | undefined {
  const room = findRoom(roomId)
  if (!room) return undefined
  for (const row of room.seats) {
    for (const s of row) {
      if (s.id === seatId) return s
    }
  }
  return undefined
}

export function findUser(userId: string): User | undefined {
  return users.find(u => u.id === userId)
}

export function updateRoomOccupied(roomId: string): void {
  const room = findRoom(roomId)
  if (room) {
    room.occupied = room.seats.flat().filter(s => s.status === 'occupied').length
  }
}

export { generateGradientAvatar }
