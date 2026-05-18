import { router, usePage } from '@inertiajs/react';
import { useCallback, useEffect, useRef } from 'react';

const STORAGE_PREFIX = 'nitermin:filters:';

const IGNORED_QUERY_KEYS = new Set(['list', 'page', 'edit']);

export const FILTER_STORAGE_KEYS = {
    adminAppointments: 'admin:appointments',
    adminAnalytics: 'admin:analytics',
    employeeAppointments: 'employee:appointments',
    employeeAnalytics: 'employee:analytics',
};

export const FILTER_PARAM_KEYS = {
    adminAppointments: ['employee_id', 'service_id', 'date_from', 'date_to', 'status', 'search', 'view', 'date'],
    adminAnalytics: ['date_from', 'date_to', 'employee'],
    employeeAppointments: ['service_id', 'date_from', 'date_to', 'status', 'search', 'view', 'date'],
    employeeAnalytics: ['date_from', 'date_to', 'service_id'],
};

/**
 * @param {string} url Full path + search (e.g. from Inertia page.url)
 * @param {string[]} filterKeys Query keys that count as an explicit filter
 */
export function urlHasFilterQuery(url, filterKeys) {
    if (typeof window === 'undefined') {
        return false;
    }

    let search = '';
    if (typeof url === 'string' && url.includes('?')) {
        search = url.slice(url.indexOf('?') + 1);
    } else {
        search = window.location.search.replace(/^\?/, '');
    }

    const params = new URLSearchParams(search);
    for (const key of params.keys()) {
        if (IGNORED_QUERY_KEYS.has(key)) {
            continue;
        }
        if (filterKeys.includes(key)) {
            return true;
        }
    }

    return false;
}

export function saveStoredFilters(storageKey, data) {
    if (typeof window === 'undefined' || !storageKey) {
        return;
    }
    try {
        sessionStorage.setItem(STORAGE_PREFIX + storageKey, JSON.stringify(data));
    } catch {
        // Private mode / quota — ignore
    }
}

export function loadStoredFilters(storageKey) {
    if (typeof window === 'undefined' || !storageKey) {
        return null;
    }
    try {
        const raw = sessionStorage.getItem(STORAGE_PREFIX + storageKey);
        if (!raw) {
            return null;
        }
        const parsed = JSON.parse(raw);
        return parsed && typeof parsed === 'object' ? parsed : null;
    } catch {
        return null;
    }
}

export function clearStoredFilters(storageKey) {
    if (typeof window === 'undefined' || !storageKey) {
        return;
    }
    try {
        sessionStorage.removeItem(STORAGE_PREFIX + storageKey);
    } catch {
        // ignore
    }
}

/**
 * Restore filters from sessionStorage when the user opens a section without query params (e.g. sidebar).
 */
export function usePersistedFilters({ storageKey, filterParamKeys, buildUrl, visitOpts = {} }) {
    const page = usePage();
    const pageUrl = typeof page.url === 'string' ? page.url : '';
    const restoredRef = useRef(false);

    const persist = useCallback(
        (data) => {
            const previous = loadStoredFilters(storageKey);
            saveStoredFilters(storageKey, { ...(previous || {}), ...data });
        },
        [storageKey],
    );

    const persistReplace = useCallback(
        (data) => {
            saveStoredFilters(storageKey, data);
        },
        [storageKey],
    );

    useEffect(() => {
        if (restoredRef.current || typeof window === 'undefined') {
            return;
        }
        restoredRef.current = true;

        const url = pageUrl || `${window.location.pathname}${window.location.search}`;
        if (urlHasFilterQuery(url, filterParamKeys)) {
            return;
        }

        const stored = loadStoredFilters(storageKey);
        if (!stored) {
            return;
        }

        const target = buildUrl(stored);
        if (!target) {
            return;
        }

        const current = `${window.location.pathname}${window.location.search}`;
        if (target === current || target === url) {
            return;
        }

        router.get(target, {}, { preserveState: true, replace: true, preserveScroll: true, ...visitOpts });
    }, [storageKey, filterParamKeys, buildUrl, visitOpts, pageUrl]);

    return { persist, persistReplace };
}

export function appendQueryFlag(url, key, value) {
    try {
        const resolved = new URL(url, window.location.origin);
        resolved.searchParams.set(key, value);
        return resolved.pathname + resolved.search;
    } catch {
        const join = url.includes('?') ? '&' : '?';
        return `${url}${join}${encodeURIComponent(key)}=${encodeURIComponent(value)}`;
    }
}
