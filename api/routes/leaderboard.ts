import { Router, type Request, type Response } from 'express'
import { users, studyRecords } from '../data.js'
import type { LeaderboardItem, LeaderboardPeriod } from '../../shared/types.js'

const router = Router()

function getStartDate(period: LeaderboardPeriod): Date {
  const now = new Date()
  const start = new Date(now)

  switch (period) {
    case 'daily':
      start.setHours(0, 0, 0, 0)
      break
    case 'weekly':
      start.setHours(0, 0, 0, 0)
      const day = start.getDay()
      const diff = day === 0 ? 6 : day - 1
      start.setDate(start.getDate() - diff)
      break
    case 'monthly':
      start.setDate(1)
      start.setHours(0, 0, 0, 0)
      break
    default:
      start.setHours(0, 0, 0, 0)
  }

  return start
}

router.get('/', (req: Request, res: Response): void => {
  try {
    const { period = 'daily' } = req.query
    const validPeriod = period === 'weekly' || period === 'monthly' ? (period as LeaderboardPeriod) : 'daily'

    const startDate = getStartDate(validPeriod)
    const startTs = startDate.getTime()

    const userStats: Map<string, { points: number; minutes: number }> = new Map()

    for (const record of studyRecords) {
      const checkInTs = new Date(record.checkInTime).getTime()
      if (checkInTs >= startTs) {
        const current = userStats.get(record.userId) || { points: 0, minutes: 0 }
        current.points += record.pointsEarned
        current.minutes += record.durationMinutes
        userStats.set(record.userId, current)
      }
    }

    const leaderboard: LeaderboardItem[] = []

    for (const user of users) {
      const stats = userStats.get(user.id)
      const points = stats?.points || 0
      const minutes = stats?.minutes || 0

      if (points > 0 || minutes > 0 || user.id === 'user_self') {
        leaderboard.push({
          rank: 0,
          userId: user.id,
          username: user.username,
          avatar: user.avatar,
          points,
          studyMinutes: minutes,
        })
      }
    }

    leaderboard.sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points
      return b.studyMinutes - a.studyMinutes
    })

    leaderboard.forEach((item, idx) => {
      item.rank = idx + 1
    })

    const top20 = leaderboard.slice(0, 20)

    res.status(200).json({
      data: top20,
      message: '获取排行榜成功',
    })
  } catch (error) {
    res.status(500).json({
      error: 'InternalServerError',
      message: '获取排行榜失败',
    })
  }
})

export default router
