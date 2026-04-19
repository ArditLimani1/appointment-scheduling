import { usePage } from '@inertiajs/react';
import { useCallback } from 'react';

function getByPath(obj, path) {
    if (obj == null || path === '') {
        return undefined;
    }
    return path.split('.').reduce((acc, part) => {
        if (acc == null || typeof acc !== 'object') {
            return undefined;
        }
        return acc[part];
    }, obj);
}

/**
 * @param {string} key Dot path: "group.rest.of.path" where group matches a root key in page.props.translations
 * @param {Record<string, string|number>} [replace] Placeholders :name in the string
 */
export function useT() {
    const { translations } = usePage().props;

    return useCallback(
        (key, replace = {}) => {
            const parts = key.split('.');
            const root = parts[0];
            const path = parts.slice(1).join('.');
            let val = getByPath(translations?.[root], path);

            if (typeof val !== 'string') {
                return key;
            }

            // Replace longer keys first so `:to` does not corrupt `:total`, etc.
            Object.entries(replace)
                .sort((a, b) => b[0].length - a[0].length)
                .forEach(([k, v]) => {
                    val = val.replaceAll(`:${k}`, String(v));
                });

            return val;
        },
        [translations],
    );
}
