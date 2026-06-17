export enum ErrorCode {
  BadRequest = 'BadRequest',
  Unauthorized = 'Unauthorized',
  Forbidden = 'Forbidden',
  NotFound = 'NotFound',
  Conflict = 'Conflict',
  InternalServerError = 'InternalServerError',
  ValidationError = 'ValidationError',

  InvalidCredentials = 'InvalidCredentials',
  UsernameExists = 'UsernameExists',
  TokenExpired = 'TokenExpired',
  InvalidToken = 'InvalidToken',

  SeatUnavailable = 'SeatUnavailable',
  SeatOccupied = 'SeatOccupied',
  SeatReserved = 'SeatReserved',
  InvalidTimeRange = 'InvalidTimeRange',
  TimeConflict = 'TimeConflict',
  InvalidStatus = 'InvalidStatus',

  AlreadyCheckedOut = 'AlreadyCheckedOut',
  AlreadyPaused = 'AlreadyPaused',
  NotPaused = 'NotPaused',
}

export interface ApiError {
  code: ErrorCode
  message: string
  userSolvable: boolean
  solution?: string
}

export interface ToastMessage {
  id: string
  type: 'error' | 'success' | 'warning' | 'info'
  title: string
  message: string
  userSolvable?: boolean
  solution?: string
  duration?: number
}
