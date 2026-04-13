import Icon from '@/Components/Icon';
import { usePage } from '@inertiajs/react';
import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';

const SuccessToastContext = createContext(null);

const AUTO_DISMISS_MS = 4500;

/** Flush under sticky top bar: same 73px as `main` offset in employee/admin layouts (+2px so it clears the border). */
const TOAST_TOP_BELOW_HEADER = 'calc(73px + 2px + env(safe-area-inset-top, 0px))';

function SuccessToastSurface({ message, onDismiss }) {
    useEffect(() => {
        const t = setTimeout(onDismiss, AUTO_DISMISS_MS);
        return () => clearTimeout(t);
    }, [message, onDismiss]);

    return (
        <div
            role="status"
            aria-live="polite"
            style={{ top: TOAST_TOP_BELOW_HEADER }}
            className="fixed right-3 z-[100] flex w-max max-w-[calc(100vw-1.5rem)] flex-row items-center gap-2 rounded-xl border border-white/10 bg-on-surface px-3 py-2 shadow-lg sm:right-6 sm:max-w-md sm:gap-3 sm:rounded-2xl sm:px-4 sm:py-3 sm:shadow-2xl"
        >
            <span className="inline-flex shrink-0 items-center justify-center text-surface" aria-hidden>
                <Icon name="check_circle" size="text-lg sm:text-xl" filled />
            </span>
            <p className="m-0 min-w-0 max-w-[calc(100vw-5.5rem)] flex-1 text-xs font-semibold leading-snug text-surface sm:max-w-none sm:text-sm sm:leading-normal">
                {message}
            </p>
            <button
                type="button"
                onClick={onDismiss}
                className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-surface/70 transition-colors hover:bg-white/10 hover:text-surface sm:h-9 sm:w-9 sm:rounded-lg"
                aria-label="Dismiss notification"
            >
                <Icon name="close" size="text-base sm:text-lg" />
            </button>
        </div>
    );
}

export function SuccessToastProvider({ children }) {
    const { flash } = usePage().props;
    const [message, setMessage] = useState(null);
    const lastFlashNonceRef = useRef(null);

    const dismiss = useCallback(() => setMessage(null), []);

    const showSuccess = useCallback((text) => {
        if (text == null || text === '') return;
        setMessage(String(text));
    }, []);

    useEffect(() => {
        const success = flash?.success;
        const nonce = flash?.nonce;
        if (!success || !nonce) return;
        if (nonce === lastFlashNonceRef.current) return;
        lastFlashNonceRef.current = nonce;
        showSuccess(success);
    }, [flash?.success, flash?.nonce, showSuccess]);

    return (
        <SuccessToastContext.Provider value={{ showSuccess }}>
            {children}
            {message ? <SuccessToastSurface message={message} onDismiss={dismiss} /> : null}
        </SuccessToastContext.Provider>
    );
}

export function useSuccessToast() {
    const ctx = useContext(SuccessToastContext);
    if (!ctx) {
        throw new Error('useSuccessToast must be used within SuccessToastProvider');
    }
    return ctx;
}
