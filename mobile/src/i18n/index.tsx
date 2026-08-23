import { Directory, File, Paths } from 'expo-file-system';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api, setApiLocale } from '@/api/client';

/**
 * Translations come from GET /api/v1/translations (the same lang/ groups the
 * web uses). They are cached on disk per locale and refreshed in the
 * background on boot, so the app works offline after first launch.
 */
type TranslationTree = Record<string, unknown>;

interface I18nContextValue {
  locale: string;
  setLocale: (locale: string) => void;
  t: (key: string, replace?: Record<string, string | number>) => string;
  ready: boolean;
}

const I18nContext = createContext<I18nContextValue>({
  locale: 'sq',
  setLocale: () => {},
  t: (key) => key,
  ready: false,
});

function getByPath(tree: TranslationTree | null, path: string): unknown {
  if (!tree) return undefined;
  return path.split('.').reduce<unknown>((acc, part) => {
    if (acc && typeof acc === 'object') return (acc as Record<string, unknown>)[part];
    return undefined;
  }, tree);
}

const cacheDir = new Directory(Paths.cache, 'i18n');
const cacheFile = (locale: string) => new File(cacheDir, `${locale}.json`);

async function readCache(locale: string): Promise<string | null> {
  try {
    const file = cacheFile(locale);
    if (!file.exists) return null;
    return await file.text();
  } catch {
    return null;
  }
}

async function writeCache(locale: string, content: string): Promise<void> {
  try {
    if (!cacheDir.exists) cacheDir.create({ intermediates: true });
    cacheFile(locale).write(content);
  } catch {
    // cache write is best-effort
  }
}

export function I18nProvider({ children, initialLocale = 'sq' }: { children: React.ReactNode; initialLocale?: string }) {
  const [locale, setLocaleState] = useState(initialLocale);
  const [tree, setTree] = useState<TranslationTree | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      // 1. Serve the cached copy immediately.
      const cached = await readCache(locale);
      if (cached && !cancelled) {
        try {
          setTree(JSON.parse(cached) as TranslationTree);
          setReady(true);
        } catch {
          // corrupted cache — ignore
        }
      }

      // 2. Refresh from the API.
      try {
        const response = await api<{ locale: string; translations: TranslationTree }>('/translations', {
          query: { locale },
        });
        if (!cancelled) {
          setTree(response.translations);
          setReady(true);
          await writeCache(locale, JSON.stringify(response.translations));
        }
      } catch {
        if (!cancelled) setReady(true); // offline with no cache — keys render as fallback
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [locale]);

  const setLocale = useCallback((next: string) => {
    setApiLocale(next);
    setLocaleState(next);
  }, []);

  const t = useCallback(
    (key: string, replace?: Record<string, string | number>) => {
      const raw = getByPath(tree, key);
      let text = typeof raw === 'string' ? raw : key;
      if (replace) {
        for (const [name, value] of Object.entries(replace)) {
          text = text.replaceAll(`:${name}`, String(value));
        }
      }
      return text;
    },
    [tree],
  );

  const value = useMemo(() => ({ locale, setLocale, t, ready }), [locale, setLocale, t, ready]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useT() {
  return useContext(I18nContext);
}
