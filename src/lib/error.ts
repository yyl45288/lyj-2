import type { ApiError as IApiError, ErrorCode } from '../types/error'

export class ApiError extends Error implements IApiError {
  public readonly code: ErrorCode
  public readonly userSolvable: boolean
  public readonly solution?: string

  constructor(data: IApiError) {
    super(data.message)
    this.name = 'ApiError'
    this.code = data.code
    this.userSolvable = data.userSolvable
    this.solution = data.solution
    Object.setPrototypeOf(this, ApiError.prototype)
  }
}

export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError
}
