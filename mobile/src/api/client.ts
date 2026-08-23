import Constants from 'expo-constants';
import type { ApiErrorBody } from './types';

/**
 * Base URL resolution:
 * - EXPO_PUBLIC_API_URL env (set per build profile in eas.json / .env)
 * - falls back to the dev machine's LAN address when running in Expo Go/dev builds
 */
function resolveBaseUrl(): string {
  const fromEnv = process.env.EXPO_PUBLIC_API_URL;
  if (fromEnv) return fromEnv.replace(/\/$/, '');

  const hostUri = Constants.expoConfig?.hostUri;
  if (hostUri) {
    const host = hostUri.split(':')[0];
    return `http://${host}:8000`;
  }

  return 'http://localhost:8000';
}

export const BASE_URL = resolveBaseUrl();

export class ApiError extends Error {
  status: number;
  code?: string;
  errors?: Record<string, string[]>;

  constructor(status: number, body: ApiErrorBody | null) {
    super(body?.message ?? `HTTP ${status}`);
    this.status = status;
    this.code = body?.code;
    this.errors = body?.errors;
  }

  /** First field-level validation message, if any. */
  firstFieldError(): string | null {
    if (!this.errors) return null;
    const first = Object.values(this.errors)[0];
    return first?.[0] ?? null;
  }
}

let authToken: string | null = null;
let currentLocale = 'sq';
let onUnauthorized: (() => void) | null = null;

export function setAuthToken(token: string | null) {
  authToken = token;
}

export function setApiLocale(locale: string) {
  currentLocale = locale;
}

export function setOnUnauthorized(handler: (() => void) | null) {
  onUnauthorized = handler;
}

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
  query?: Record<string, string | number | boolean | (string | number)[] | undefined | null>;
  headers?: Record<string, string>;
}

export async function api<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, query, headers = {} } = options;

  let url = `${BASE_URL}/api/v1${path}`;
  if (query) {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(query)) {
      if (value === undefined || value === null || value === '') continue;
      if (Array.isArray(value)) {
        for (const v of value) params.append(`${key}[]`, String(v));
      } else {
        params.append(key, String(value));
      }
    }
    const qs = params.toString();
    if (qs) url += `?${qs}`;
  }

  const response = await fetch(url, {
    method,
    headers: {
      Accept: 'application/json',
      'Accept-Language': currentLocale,
      ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
      ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
      ...headers,
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (response.status === 401 && authToken) {
    onUnauthorized?.();
  }

  if (!response.ok) {
    let parsed: ApiErrorBody | null = null;
    try {
      parsed = (await response.json()) as ApiErrorBody;
    } catch {
      // non-JSON error body
    }
    throw new ApiError(response.status, parsed);
  }

  if (response.status === 204) return undefined as T;

  return (await response.json()) as T;
}
