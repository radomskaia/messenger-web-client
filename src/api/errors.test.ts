import { describe, expect, it } from 'vitest';

import { classifyApiFailure, GreenApiError, NetworkError } from './errors';

describe('classifyApiFailure', () => {
  it('treats a rate limit as recoverable', () => {
    expect(classifyApiFailure(new GreenApiError(429, 'slow down'))).toBe('rateLimited');
  });

  it('treats 401 and 403 as rejected credentials', () => {
    expect(classifyApiFailure(new GreenApiError(401, 'Unauthorized'))).toBe('rejected');
    expect(classifyApiFailure(new GreenApiError(403, 'Forbidden'))).toBe('rejected');
  });

  it('reads terminal instance states from the 400 body', () => {
    const expired = new GreenApiError(
      400,
      'Instance account is expired. Renew your instance from personal area',
    );
    const deleted = new GreenApiError(400, 'Instance is deleted');
    const notAuthorized = new GreenApiError(
      400,
      'instance is starting or not authorized',
    );

    expect(classifyApiFailure(expired)).toBe('expired');
    expect(classifyApiFailure(deleted)).toBe('deleted');
    expect(classifyApiFailure(notAuthorized)).toBe('notAuthorized');
  });

  it('treats a starting instance as transient, not terminal', () => {
    expect(
      classifyApiFailure(
        new GreenApiError(400, 'instance in starting process try later'),
      ),
    ).toBe('transient');
  });

  it('treats a network error and unrecognised statuses as transient', () => {
    const network = new NetworkError(new Error('offline'));
    const badGateway = new GreenApiError(502, 'Bad Gateway');
    const badData = new GreenApiError(400, 'bad request data');

    expect(classifyApiFailure(network)).toBe('transient');
    expect(classifyApiFailure(badGateway)).toBe('transient');
    expect(classifyApiFailure(badData)).toBe('transient');
  });
});
