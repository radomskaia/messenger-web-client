export class GreenApiError extends Error {
  readonly status: number;
  readonly reason: string;

  constructor(status: number, reason: string) {
    super(`GREEN-API responded with ${status}: ${reason}`);
    this.name = 'GreenApiError';
    this.status = status;
    this.reason = reason;
  }
}

export class NetworkError extends Error {
  constructor(cause: unknown) {
    super('Could not reach GREEN-API');
    this.name = 'NetworkError';
    this.cause = cause;
  }
}

const HTTP_STATUS = {
  badRequest: 400,
  unauthorized: 401,
  forbidden: 403,
  tooManyRequests: 429,
} as const;

export function isRejectedCredentials(error: unknown): boolean {
  return (
    error instanceof GreenApiError &&
    (error.status === HTTP_STATUS.unauthorized || error.status === HTTP_STATUS.forbidden)
  );
}

export function isTooManyRequests(error: unknown): boolean {
  return error instanceof GreenApiError && error.status === HTTP_STATUS.tooManyRequests;
}

export type ApiFailure =
  | 'rateLimited' // 429 — refused for now, the app stays usable
  | 'rejected' // 401/403 — wrong credentials
  | 'expired' // instance subscription ran out
  | 'deleted' // instance no longer exists
  | 'notAuthorized' // instance not authorized in the console
  | 'transient'; // network, 5xx, "starting", anything retryable

const FAILURE_BY_STATUS: Partial<Record<number, ApiFailure>> = {
  [HTTP_STATUS.tooManyRequests]: 'rateLimited',
  [HTTP_STATUS.unauthorized]: 'rejected',
  [HTTP_STATUS.forbidden]: 'rejected',
};

const FAILURE_BY_REASON: readonly (readonly [match: string, failure: ApiFailure])[] = [
  ['expired', 'expired'],
  ['deleted', 'deleted'],
  ['not authorized', 'notAuthorized'],
];

export function classifyApiFailure(error: unknown): ApiFailure {
  if (!(error instanceof GreenApiError)) {
    return 'transient';
  }

  if (error.status === HTTP_STATUS.badRequest) {
    const reason = error.reason.toLowerCase();
    const matched = FAILURE_BY_REASON.find(([match]) => reason.includes(match));

    return matched?.[1] ?? 'transient';
  }

  return FAILURE_BY_STATUS[error.status] ?? 'transient';
}
