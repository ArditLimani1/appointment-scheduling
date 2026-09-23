import { useT } from '@/i18n/useT';
import { usePage } from '@inertiajs/react';
import { useCallback, useEffect, useState } from 'react';

function urlBase64ToUint8Array(base64) {
    const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4);
    const raw = atob(padded.replace(/-/g, '+').replace(/_/g, '/'));
    return Uint8Array.from(raw, (c) => c.charCodeAt(0));
}

function csrfHeaders() {
    return {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
        'X-XSRF-TOKEN': decodeURIComponent(document.cookie.match(/XSRF-TOKEN=([^;]+)/)?.[1] ?? ''),
    };
}

const isIos = () => /iphone|ipad|ipod/i.test(navigator.userAgent);
const isStandalone = () =>
    window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;

/** 'unsupported' | 'ios-install' | 'denied' | 'off' | 'on' */
export default function PushNotificationToggle() {
    const t = useT();
    const { vapidPublicKey } = usePage().props;
    const [state, setState] = useState(null);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState(false);
    const [showHint, setShowHint] = useState(false);

    const refresh = useCallback(async () => {
        if (!vapidPublicKey) {
            return setState('unsupported');
        }
        if (!('serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window)) {
            return setState(isIos() && !isStandalone() ? 'ios-install' : 'unsupported');
        }
        if (Notification.permission === 'denied') {
            return setState('denied');
        }
        const reg = await navigator.serviceWorker.register('/sw.js');
        const sub = await reg.pushManager.getSubscription();
        if (sub && Notification.permission === 'granted') {
            // Re-sync so a subscription lost server-side (or moved between users) is restored.
            await fetch(route('employee.push-subscriptions.store'), {
                method: 'POST',
                credentials: 'same-origin',
                headers: csrfHeaders(),
                body: JSON.stringify(sub.toJSON()),
            }).catch(() => {});
        }
        setState(sub ? 'on' : 'off');
    }, [vapidPublicKey]);

    useEffect(() => {
        refresh().catch(() => setState('unsupported'));
    }, [refresh]);

    const enable = async () => {
        setBusy(true);
        setError(false);
        setShowHint(true);
        try {
            const permission = await Notification.requestPermission();
            if (permission !== 'granted') {
                return setState(permission === 'denied' ? 'denied' : 'off');
            }
            const reg = await navigator.serviceWorker.register('/sw.js');
            const sub =
                (await reg.pushManager.getSubscription()) ??
                (await reg.pushManager.subscribe({
                    userVisibleOnly: true,
                    applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
                }));
            const res = await fetch(route('employee.push-subscriptions.store'), {
                method: 'POST',
                credentials: 'same-origin',
                headers: csrfHeaders(),
                body: JSON.stringify(sub.toJSON()),
            });
            if (!res.ok) {
                throw new Error('store failed');
            }
            setState('on');
        } catch {
            setError(true);
        } finally {
            setBusy(false);
        }
    };

    const disable = async () => {
        setBusy(true);
        setShowHint(false);
        try {
            const reg = await navigator.serviceWorker.getRegistration('/sw.js');
            const sub = await reg?.pushManager.getSubscription();
            if (sub) {
                await fetch(route('employee.push-subscriptions.destroy'), {
                    method: 'DELETE',
                    credentials: 'same-origin',
                    headers: csrfHeaders(),
                    body: JSON.stringify({ endpoint: sub.endpoint }),
                });
                await sub.unsubscribe();
            }
            setState('off');
        } finally {
            setBusy(false);
        }
    };

    if (state === null || state === 'unsupported') {
        return null;
    }

    const on = state === 'on';
    const clickable = state === 'on' || state === 'off';
    const hint =
        state === 'ios-install'
            ? t('components.push.ios')
            : state === 'denied'
              ? t('components.push.denied')
              : showHint
                ? t('components.push.hint')
                : null;

    return (
        // Stop the click from bubbling to Dropdown.Content, which would close the menu and hide the hint.
        <div className="mt-1 border-t border-outline-variant/40 px-4 py-2.5" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between gap-3">
                <span className="text-xs font-medium text-on-surface-variant">{t('components.push.label')}</span>
                <button
                    type="button"
                    role="switch"
                    aria-checked={on}
                    disabled={!clickable || busy}
                    onClick={on ? disable : enable}
                    className={`relative h-5 w-9 shrink-0 rounded-full transition-colors disabled:opacity-50 ${
                        on ? 'bg-primary-container' : 'bg-outline-variant'
                    }`}
                >
                    <span
                        className={`absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${
                            on ? 'translate-x-4' : ''
                        }`}
                    />
                </button>
            </div>
            {hint && <p className="mt-2 text-[11px] leading-snug text-on-surface-variant">{hint}</p>}
            {error && <p className="mt-2 text-[11px] leading-snug text-error">{t('components.push.error')}</p>}
        </div>
    );
}
