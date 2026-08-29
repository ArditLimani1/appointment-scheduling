import Constants from 'expo-constants';
import { NativeModules, Platform } from 'react-native';
import type { ApiErrorBody } from './types';

/**
 * Where is the dev machine? Expo Go exposes `expoConfig.hostUri`, but a
 * development build often does not, so fall back to the Metro script URL —
 * that is present in every dev context because it is how the JS got here.
 */
function resolveDevHost(): string | null {
  const hostUri = Constants.expoConfig?.hostUri;
  if (hostUri) return hostUri.split(':')[0];

  const scriptURL = (NativeModules as { SourceCode?: { scriptURL?: string } }).SourceCode?.scriptURL;
  const match = scriptURL?.match(/^https?:\/\/([^/:]+)/);
  if (match) return match[1];

  return null;
}

/**
 * Base URL resolution:
 * - EXPO_PUBLIC_API_URL env (set per build profile in eas.json / .env)
 * - falls back to the dev machine's LAN address when running in Expo Go/dev builds
 */
function resolveBaseUrl(): string {
  const fromEnv = process.env.EXPO_PUBLIC_API_URL;
  if (fromEnv) return fromEnv.replace(/\/$/, '');

  // Dev: reuse the Metro host (so the LAN IP follows the dev server) with the
  // API port, which can move when something else already owns 8000.
  const port = process.env.EXPO_PUBLIC_API_PORT ?? '8000';

  const host = resolveDevHost();
  if (host) return `http://${host}:${port}`;

  // Last resort: on an Android emulator the host machine is 10.0.2.2, not localhost.
  return `http://${Platform.OS === 'android' ? '10.0.2.2' : 'localhost'}:${port}`;
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
  /**
   * JSON-encoded, unless it is `FormData` — then it is sent as multipart and
   * the Content-Type (with its boundary) is left to the runtime. PHP only
   * populates `$_FILES` on POST, so multipart bodies must use `method: 'POST'`.
   */
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

  const isMultipart = typeof FormData !== 'undefined' && body instanceof FormData;

  const response = await fetch(url, {
    method,
    headers: {
      Accept: 'application/json',
      'Accept-Language': currentLocale,
      ...(body !== undefined && !isMultipart ? { 'Content-Type': 'application/json' } : {}),
      ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
      ...headers,
    },
    body: body === undefined ? undefined : isMultipart ? (body as FormData) : JSON.stringify(body),
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
