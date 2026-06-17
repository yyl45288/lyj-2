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

export interface ErrorInfo {
  code: ErrorCode
  message: string
  userSolvable: boolean
  solution?: string
  httpStatus: number
}

export const ERROR_MESSAGES: Record<ErrorCode, Omit<ErrorInfo, 'code'>> = {
  [ErrorCode.BadRequest]: {
    message: '请求参数错误',
    userSolvable: true,
    solution: '请检查输入的信息是否正确',
    httpStatus: 400,
  },
  [ErrorCode.Unauthorized]: {
    message: '未授权访问',
    userSolvable: true,
    solution: '请先登录后再操作',
    httpStatus: 401,
  },
  [ErrorCode.Forbidden]: {
    message: '无权执行此操作',
    userSolvable: false,
    httpStatus: 403,
  },
  [ErrorCode.NotFound]: {
    message: '请求的资源不存在',
    userSolvable: true,
    solution: '请确认您访问的链接是否正确',
    httpStatus: 404,
  },
  [ErrorCode.Conflict]: {
    message: '资源冲突',
    userSolvable: true,
    solution: '请刷新页面后重试',
    httpStatus: 409,
  },
  [ErrorCode.InternalServerError]: {
    message: '服务器内部错误',
    userSolvable: false,
    httpStatus: 500,
  },
  [ErrorCode.ValidationError]: {
    message: '数据验证失败',
    userSolvable: true,
    solution: '请检查输入格式是否正确',
    httpStatus: 400,
  },

  [ErrorCode.InvalidCredentials]: {
    message: '用户名或密码错误',
    userSolvable: true,
    solution: '请检查用户名和密码是否正确，注意区分大小写',
    httpStatus: 401,
  },
  [ErrorCode.UsernameExists]: {
    message: '该用户名已被注册',
    userSolvable: true,
    solution: '请使用其他用户名进行注册',
    httpStatus: 400,
  },
  [ErrorCode.TokenExpired]: {
    message: '登录已过期',
    userSolvable: true,
    solution: '请重新登录',
    httpStatus: 401,
  },
  [ErrorCode.InvalidToken]: {
    message: '无效的登录凭证',
    userSolvable: true,
    solution: '请重新登录',
    httpStatus: 401,
  },

  [ErrorCode.SeatUnavailable]: {
    message: '该座位不可预约',
    userSolvable: true,
    solution: '请选择其他座位或稍后再试',
    httpStatus: 400,
  },
  [ErrorCode.SeatOccupied]: {
    message: '该座位已被占用',
    userSolvable: true,
    solution: '请选择其他座位',
    httpStatus: 400,
  },
  [ErrorCode.SeatReserved]: {
    message: '该座位已被他人预约',
    userSolvable: true,
    solution: '请选择其他座位或时段',
    httpStatus: 400,
  },
  [ErrorCode.InvalidTimeRange]: {
    message: '时间范围无效',
    userSolvable: true,
    solution: '请确保结束时间晚于开始时间',
    httpStatus: 400,
  },
  [ErrorCode.TimeConflict]: {
    message: '该时段与您的其他预约冲突',
    userSolvable: true,
    solution: '请选择其他时段，同一时段只能预约一个座位',
    httpStatus: 400,
  },
  [ErrorCode.InvalidStatus]: {
    message: '当前状态不允许此操作',
    userSolvable: true,
    solution: '请检查预约状态，只有待开始的预约可以取消',
    httpStatus: 400,
  },

  [ErrorCode.AlreadyCheckedOut]: {
    message: '该学习记录已签退',
    userSolvable: true,
    solution: '请重新签到开始新的学习',
    httpStatus: 400,
  },
  [ErrorCode.AlreadyPaused]: {
    message: '学习已处于暂停状态',
    userSolvable: true,
    solution: '点击恢复按钮继续学习',
    httpStatus: 400,
  },
  [ErrorCode.NotPaused]: {
    message: '学习未处于暂停状态',
    userSolvable: true,
    solution: '无需恢复，学习正在进行中',
    httpStatus: 400,
  },
}

export class AppError extends Error {
  public readonly code: ErrorCode
  public readonly userSolvable: boolean
  public readonly solution?: string
  public readonly httpStatus: number

  constructor(code: ErrorCode, customMessage?: string, customSolution?: string) {
    const info = ERROR_MESSAGES[code]
    const message = customMessage || info.message
    super(message)

    this.name = 'AppError'
    this.code = code
    this.userSolvable = info.userSolvable
    this.solution = customSolution || info.solution
    this.httpStatus = info.httpStatus

    Object.setPrototypeOf(this, AppError.prototype)
  }
}

export function throwError(code: ErrorCode, customMessage?: string, customSolution?: string): never {
  throw new AppError(code, customMessage, customSolution)
}
