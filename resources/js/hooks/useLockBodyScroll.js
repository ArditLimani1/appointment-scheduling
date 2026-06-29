import { useEffect } from 'react';

/**
 * Prevent background page scroll while one or more overlay modals are open.
 * Uses a shared counter so stacked modals do not unlock scroll too early.
 */
export default function useLockBodyScroll(active = true) {
    useEffect(() => {
        if (!active || typeof document === 'undefined') {
            return undefined;
        }

        const body = document.body;
        const html = document.documentElement;
        const currentCount = Number(body.dataset.scrollLockCount || '0');

        if (currentCount === 0) {
            body.dataset.scrollLockPrevOverflow = body.style.overflow || '';
            body.dataset.scrollLockPrevTouchAction = body.style.touchAction || '';
            html.dataset.scrollLockPrevOverflow = html.style.overflow || '';

            body.style.overflow = 'hidden';
            body.style.touchAction = 'none';
            html.style.overflow = 'hidden';
        }

        body.dataset.scrollLockCount = String(currentCount + 1);

        return () => {
            const nextCount = Math.max(0, Number(body.dataset.scrollLockCount || '1') - 1);

            if (nextCount === 0) {
                body.style.overflow = body.dataset.scrollLockPrevOverflow || '';
                body.style.touchAction = body.dataset.scrollLockPrevTouchAction || '';
                html.style.overflow = html.dataset.scrollLockPrevOverflow || '';

                delete body.dataset.scrollLockCount;
                delete body.dataset.scrollLockPrevOverflow;
                delete body.dataset.scrollLockPrevTouchAction;
                delete html.dataset.scrollLockPrevOverflow;

                return;
            }

            body.dataset.scrollLockCount = String(nextCount);
        };
    }, [active]);
}
