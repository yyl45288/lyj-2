export interface User {
  id: string;
  username: string;
  avatar: string;
  points: number;
  totalStudyMinutes: number;
  streakDays: number;
  level: number;
  badges: Badge[];
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  unlocked: boolean;
  unlockedAt?: string;
}

export type RoomType = 'silent' | 'discussion' | 'focus' | 'reading';

export interface Room {
  id: string;
  name: string;
  description: string;
  type: RoomType;
  capacity: number;
  occupied: number;
  themeColor: string;
  icon: string;
  seats: Seat[][];
}

export type SeatStatus = 'available' | 'occupied' | 'reserved' | 'mine';

export interface Seat {
  id: string;
  row: number;
  col: number;
  status: SeatStatus;
  reservedBy?: string;
  occupiedBy?: string;
}

export type ReservationStatus = 'pending' | 'active' | 'completed' | 'cancelled';

export interface Reservation {
  id: string;
  userId: string;
  roomId: string;
  seatId: string;
  startTime: string;
  endTime: string;
  status: ReservationStatus;
  roomName?: string;
  seatLabel?: string;
}

export interface StudyRecord {
  id: string;
  userId: string;
  roomId: string;
  seatId: string;
  checkInTime: string;
  checkOutTime?: string;
  durationMinutes: number;
  pointsEarned: number;
  roomName?: string;
  seatLabel?: string;
}

export interface LeaderboardItem {
  rank: number;
  userId: string;
  username: string;
  avatar: string;
  points: number;
  studyMinutes: number;
}

export interface PointLog {
  id: string;
  userId: string;
  amount: number;
  reason: string;
  createdAt: string;
}

export type LeaderboardPeriod = 'daily' | 'weekly' | 'monthly';

export interface StudySession {
  recordId: string;
  roomId: string;
  seatId: string;
  checkInTime: string;
  isPaused: boolean;
  accumulatedSeconds: number;
}
