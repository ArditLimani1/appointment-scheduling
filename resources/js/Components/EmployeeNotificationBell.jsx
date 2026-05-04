import EmployeeNotificationEntry from '@/Components/EmployeeNotificationEntry';
import Icon from '@/Components/Icon';
import { useT } from '@/i18n/useT';
import {
    buildEmployeeNotificationAppointmentsFallback,
    buildEmployeeNotificationAppointmentsUrl,
    normalizeEmployeeNotification,
} from '@/utils/employeeNotifications';
import { router, usePage } from '@inertiajs/react';
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';

const NOTIFICATION_POLL_MS = 30_000;

export default function EmployeeNotificationBell() {
    const t = useT();
    const { employeeNotifications, employeeAppointmentUi } = usePage().props;
    const [open, setOpen] = useState(false);
    const rootRef = useRef(null);
    const bellRef = useRef(null);
    const panelLayoutRef = useRef(null);
    const [caretCenterX, setCaretCenterX] = useState(null);
    const [showReadAlso, setShowReadAlso] = useState(false);
    const [allFeedItems, setAllFeedItems] = useState(null);
    const [loadingAllFeed, setLoadingAllFeed] = useState(false);

    const unread = employeeNotifications?.unread_count ?? 0;
    const recent = employeeNotifications?.recent ?? [];

    const fetchAllNotifications = useCallback(async () => {
        try {
            const url = `${route('employee.notifications.feed')}?page=1&scope=all&per_page=12`;
            const res = await fetch(url, {
                headers: {
                    Accept: 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                },
                credentials: 'same-origin',
            });
            if (!res.ok) {
                return null;
            }
            const json = await res.json();
            return (json.data ?? []).map((n) => normalizeEmployeeNotification(n));
        } catch {
            return null;
        }
    }, []);

    useEffect(() => {
        if (!showReadAlso) {
            setAllFeedItems(null);
            setLoadingAllFeed(false);
            return;
        }
        if (!open) {
            return;
        }
        let cancelled = false;
        (async () => {
            setLoadingAllFeed(true);
            const next = await fetchAllNotifications();
            if (!cancelled && next !== null) {
                setAllFeedItems(next);
            }
            if (!cancelled) {
                setLoadingAllFeed(false);
            }
        })();
        return () => {
            cancelled = true;
        };
    }, [showReadAlso, open, fetchAllNotifications]);

    const markOneRead = useCallback((id, readAt) => {
        if (readAt) {
            return;
        }
        router.post(
            route('employee.notifications.read', { id }),
            {},
            {
                preserveScroll: true,
                onSuccess: () => {
                    if (showReadAlso && open) {
                        fetchAllNotifications().then((next) => {
                            if (next !== null) {
                                setAllFeedItems(next);
                            }
                        });
                    }
                },
            },
        );
    }, [showReadAlso, open, fetchAllNotifications]);

    const markAll = useCallback(() => {
        router.post(route('employee.notifications.read-all'), {}, {
            preserveScroll: true,
            onSuccess: () => {
                if (showReadAlso && open) {
                    fetchAllNotifications().then((next) => {
                        if (next !== null) {
                            setAllFeedItems(next);
                        }
                    });
                }
            },
        });
    }, [showReadAlso, open, fetchAllNotifications]);

    const preferCalendar = Boolean(employeeAppointmentUi?.default_calendar);

    const appointmentHrefFor = useCallback(
        (dateYmd) => {
            if (dateYmd) {
                return buildEmployeeNotificationAppointmentsUrl(dateYmd, preferCalendar);
            }
            return buildEmployeeNotificationAppointmentsFallback(preferCalendar);
        },
        [preferCalendar],
    );

    const unreadItems = useMemo(() => recent.map((n) => normalizeEmployeeNotification(n)), [recent]);
    const displayItems = showReadAlso ? (allFeedItems ?? []) : unreadItems;

    useLayoutEffect(() => {
        if (!open) {
            setCaretCenterX(null);
            return;
        }
        const updateCaret = () => {
            const bell = bellRef.current;
            const panel = panelLayoutRef.current;
            if (!bell || !panel) {
                return;
            }
            const br = bell.getBoundingClientRect();
            const pr = panel.getBoundingClientRect();
            const bellCenter = br.left + br.width / 2;
            let x = bellCenter - pr.left;
            const pad = 14;
            x = Math.max(pad, Math.min(x, pr.width - pad));
            setCaretCenterX(x);
        };
        updateCaret();
        let innerRaf;
        const outerRaf = requestAnimationFrame(() => {
            innerRaf = requestAnimationFrame(updateCaret);
        });
        window.addEventListener('resize', updateCaret);
        window.addEventListener('scroll', updateCaret, true);
        let ro;
        if (typeof ResizeObserver !== 'undefined') {
            ro = new ResizeObserver(updateCaret);
            queueMicrotask(() => {
                const panel = panelLayoutRef.current;
                if (panel) {
                    ro.observe(panel);
                }
            });
        }
        return () => {
            cancelAnimationFrame(outerRaf);
            if (innerRaf !== undefined) {
                cancelAnimationFrame(innerRaf);
            }
            ro?.disconnect();
            window.removeEventListener('resize', updateCaret);
            window.removeEventListener('scroll', updateCaret, true);
        };
    }, [open]);

    useEffect(() => {
        if (!open) {
            return undefined;
        }
        const onPointerDown = (e) => {
            if (rootRef.current && !rootRef.current.contains(e.target)) {
                setOpen(false);
            }
        };
        const onKeyDown = (e) => {
            if (e.key === 'Escape') {
                setOpen(false);
            }
        };
        document.addEventListener('pointerdown', onPointerDown);
        document.addEventListener('keydown', onKeyDown);
        return () => {
            document.removeEventListener('pointerdown', onPointerDown);
            document.removeEventListener('keydown', onKeyDown);
        };
    }, [open]);

    useEffect(() => {
        if (!employeeNotifications) {
            return undefined;
        }
        const id = setInterval(() => {
            if (document.visibilityState !== 'visible') {
                return;
            }
            router.reload({
                only: ['employeeNotifications', 'employeeAppointmentUi'],
                preserveScroll: true,
                preserveState: true,
            });
        }, NOTIFICATION_POLL_MS);
        return () => clearInterval(id);
    }, [employeeNotifications]);

    if (!employeeNotifications) {
        return null;
    }

    return (
        <div ref={rootRef} className="relative">
            <button
                ref={bellRef}
                type="button"
                onClick={() => setOpen((o) => !o)}
                className={`relative flex h-10 w-10 items-center justify-center rounded-full text-on-surface-variant transition-all duration-200 hover:bg-surface-container hover:text-on-surface ${
                    open ? 'bg-surface-container shadow-inner ring-2 ring-on-primary-container/20' : ''
                }`}
                aria-expanded={open}
                aria-label={t('employee.notifications.title')}
            >
                <Icon name="notifications" size="text-[22px]" filled={open} />
                {unread > 0 && (
                    <span className="absolute -right-0.5 -top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-error px-1 text-[10px] font-bold leading-none text-on-error shadow-sm">
                        {unread > 9 ? '9+' : unread}
                    </span>
                )}
            </button>

            {open && (
                <div
                    className="
                        fixed z-[60] flex w-auto flex-col
                        left-3 right-3 top-[max(5rem,calc(env(safe-area-inset-top,0px)+4rem))]
                        max-h-[min(88dvh,calc(100dvh-7rem-env(safe-area-inset-bottom,0px)))]
                        lg:absolute lg:inset-x-auto lg:left-auto lg:right-0 lg:top-full lg:mt-3 lg:max-h-[min(24rem,70vh)]
                        lg:w-[min(100vw-2rem,24rem)]
                    "
                >
                    <div ref={panelLayoutRef} className="relative flex max-h-full min-h-0 flex-1 flex-col">
                        {/* Caret aligned to bell center (fixed end-* breaks on flex headers) */}
                        <div
                            className={`pointer-events-none absolute -top-2 z-[62] h-0 w-0 -translate-x-1/2 border-x-[9px] border-x-transparent border-b-[10px] border-b-on-surface ${
                                caretCenterX == null ? 'left-1/2' : ''
                            }`}
                            style={caretCenterX != null ? { left: caretCenterX } : undefined}
                            aria-hidden
                        />
                        <div className="flex max-h-full min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-outline-variant/35 bg-surface-container-lowest shadow-2xl ring-1 ring-black/5">
                            <header className="flex shrink-0 items-center justify-between gap-3 border-b border-outline-variant/25 bg-surface-container-lowest px-4 py-3">
                                <div className="flex min-w-0 items-center gap-2.5">
                                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-on-surface text-surface-container-lowest">
                                        <Icon name="mail" size="text-[20px]" />
                                    </div>
                                    <h2 className="font-headline truncate text-base font-bold tracking-tight text-on-surface">
                                        {t('employee.notifications.title')}
                                    </h2>
                                </div>
                                {unread > 0 ? (
                                    <button
                                        type="button"
                                        onClick={markAll}
                                        className="shrink-0 rounded-full p-2 text-on-surface-variant transition hover:bg-surface-container-high"
                                        title={t('employee.notifications.mark_all')}
                                        aria-label={t('employee.notifications.mark_all')}
                                    >
                                        <Icon name="done_all" size="text-[20px]" />
                                    </button>
                                ) : null}
                            </header>

                            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain bg-surface-container-low p-2">
                                {showReadAlso && loadingAllFeed ? (
                                    <div className="flex justify-center py-10 text-xs text-on-surface-variant">{t('employee.notifications.loading_more')}</div>
                                ) : displayItems.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-outline-variant/40 bg-surface-container-lowest px-4 py-12 text-center">
                                        <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-surface-container-high text-on-surface-variant/80">
                                            <Icon name="notifications_off" size="text-[26px]" />
                                        </div>
                                        <p className="font-headline text-sm font-bold text-on-surface">
                                            {showReadAlso ? t('employee.notifications.empty') : t('employee.notifications.empty_unread')}
                                        </p>
                                        <p className="mt-1 max-w-[16rem] text-xs leading-relaxed text-on-surface-variant">
                                            {t('employee.notifications.empty_hint')}
                                        </p>
                                    </div>
                                ) : (
                                    <ul className="space-y-2">
                                        {displayItems.map((item) => (
                                            <EmployeeNotificationEntry
                                                key={item.id}
                                                item={item}
                                                appointmentHrefFor={appointmentHrefFor}
                                                onBeforeBookingNavigate={(id, readAt) => {
                                                    markOneRead(id, readAt);
                                                    setOpen(false);
                                                }}
                                            />
                                        ))}
                                    </ul>
                                )}
                            </div>

                            <div className="shrink-0 border-t border-outline-variant/25 bg-surface-container-lowest px-3 py-3 text-center">
                                <button
                                    type="button"
                                    onClick={() => setShowReadAlso((v) => !v)}
                                    className="text-sm font-semibold text-on-primary-container underline-offset-2 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-on-primary-container/30 rounded-sm px-1"
                                >
                                    {showReadAlso
                                        ? t('employee.notifications.link_show_unread_only')
                                        : t('employee.notifications.link_show_all_notifications')}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
