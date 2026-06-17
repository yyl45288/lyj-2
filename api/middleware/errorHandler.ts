import { type Request, type Response, type NextFunction } from 'express'
import { AppError, ErrorCode, ERROR_MESSAGES, throwError } from '../errors.js'

export { throwError, ErrorCode }

export function errorHandler(
  error: Error,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction,
): void {
  console.error('[Error]', error.name, error.message)

  if (error instanceof AppError) {
    res.status(error.httpStatus).json({
      success: false,
      error: error.code,
      message: error.message,
      userSolvable: error.userSolvable,
      solution: error.solution,
    })
    return
  }

  if (error.name === 'SyntaxError' && error.message.includes('JSON')) {
    const info = ERROR_MESSAGES[ErrorCode.BadRequest]
    res.status(400).json({
      success: false,
      error: ErrorCode.BadRequest,
      message: '请求体格式错误',
      userSolvable: info.userSolvable,
      solution: '请检查请求数据格式是否正确',
    })
    return
  }

  const info = ERROR_MESSAGES[ErrorCode.InternalServerError]
  res.status(500).json({
    success: false,
    error: ErrorCode.InternalServerError,
    message: info.message,
    userSolvable: info.userSolvable,
    solution: undefined,
  })
}

export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<void> | void,
) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next)
  }
}
