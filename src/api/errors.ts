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
