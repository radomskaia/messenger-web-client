import type { Credentials } from '@/domain/types';

import { GreenApiError, NetworkError } from './errors';

interface RequestOptions {
  credentials: Credentials;
  method: 'GET' | 'POST' | 'DELETE';
  endpoint: string;
  extraSegments?: readonly string[];
  search?: Record<string, string>;
  body?: unknown;
  signal?: AbortSignal;
}

export function buildUrl(
  credentials: Credentials,
  endpoint: string,
  extraSegments: readonly string[] = [],
  search: Record<string, string> = {},
): string {
  const segments = [
    `waInstance${credentials.idInstance}`,
    endpoint,
    credentials.apiTokenInstance,
    ...extraSegments,
  ];
  const url = new URL(`/${segments.join('/')}`, credentials.apiUrl);

  for (const [key, value] of Object.entries(search)) {
    url.searchParams.set(key, value);
  }

  return url.href;
}

export async function request<T>(options: RequestOptions): Promise<T | null> {
  const url = buildUrl(
    options.credentials,
    options.endpoint,
    options.extraSegments ?? [],
    options.search ?? {},
  );

  let response: Response;

  try {
    response = await fetch(url, {
      method: options.method,
      ...(options.body !== undefined && {
        body: JSON.stringify(options.body),
        headers: { 'Content-Type': 'application/json' },
      }),
      ...(options.signal !== undefined && { signal: options.signal }),
    });
  } catch (error) {
    throw new NetworkError(error);
  }

  const text = await response.text();

  if (!response.ok) {
    throw new GreenApiError(response.status, text);
  }

  return text.trim() === '' ? null : (JSON.parse(text) as T);
}
