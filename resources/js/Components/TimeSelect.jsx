import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Popover, PopoverButton, PopoverPanel } from '@headlessui/react';
import Icon from '@/Components/Icon';
import { useT } from '@/i18n/useT';

const HOURS = Array.from({ length: 24 }, (_, h) => String(h).padStart(2, '0'));
const MINUTES = Array.from({ length: 60 }, (_, m) => String(m).padStart(2, '0'));

const ITEM_H = 36;
const VISIBLE = 5;
const WHEEL_H = ITEM_H * VISIBLE;

function normalizeHm(value) {
    if (!value) return { hour: '09', minute: '00' };
    const raw = String(value).trim();
    const match = raw.match(/^(\d{1,2}):(\d{2})/);
    if (!match) return { hour: '09', minute: '00' };
    const h = Math.max(0, Math.min(23, parseInt(match[1], 10)));
    const m = Math.max(0, Math.min(59, parseInt(match[2], 10)));
    return {
        hour: String(h).padStart(2, '0'),
        minute: String(m).padStart(2, '0'),
    };
}

function WheelColumn({ items, value, onChange, ariaLabel }) {
    const scrollerRef = useRef(null);
    const skipScrollSync = useRef(false);
    const settleTimer = useRef(null);
    const index = Math.max(0, items.indexOf(value));

    useLayoutEffect(() => {
        const el = scrollerRef.current;
        if (!el) return;
        skipScrollSync.current = true;
        el.scrollTop = index * ITEM_H;
        requestAnimationFrame(() => {
            skipScrollSync.current = false;
        });
    }, [index]);

    const settle = useCallback(() => {
        const el = scrollerRef.current;
        if (!el || skipScrollSync.current) return;
        const nextIndex = Math.max(0, Math.min(items.length - 1, Math.round(el.scrollTop / ITEM_H)));
        const next = items[nextIndex];
        if (next && next !== value) {
            onChange(next);
        }
        skipScrollSync.current = true;
        el.scrollTo({ top: nextIndex * ITEM_H, behavior: 'smooth' });
        requestAnimationFrame(() => {
            skipScrollSync.current = false;
        });
    }, [items, onChange, value]);

    const onScroll = () => {
        if (settleTimer.current) {
            clearTimeout(settleTimer.current);
        }
        settleTimer.current = setTimeout(settle, 80);
    };

    useEffect(() => () => {
        if (settleTimer.current) {
            clearTimeout(settleTimer.current);
        }
    }, []);

    return (
        <div className="relative w-[4.25rem] shrink-0" style={{ height: WHEEL_H }}>
            <div
                className="pointer-events-none absolute inset-x-0 top-1/2 z-10 h-9 -translate-y-1/2 rounded-lg bg-on-surface/[0.06] ring-1 ring-on-surface/10"
                aria-hidden="true"
            />
            <div
                className="pointer-events-none absolute inset-x-0 top-0 z-20 h-10 bg-gradient-to-b from-white to-transparent"
                aria-hidden="true"
            />
            <div
                className="pointer-events-none absolute inset-x-0 bottom-0 z-20 h-10 bg-gradient-to-t from-white to-transparent"
                aria-hidden="true"
            />
            <div
                ref={scrollerRef}
                role="listbox"
                aria-label={ariaLabel}
                tabIndex={0}
                onScroll={onScroll}
                onTouchEnd={settle}
                onMouseUp={settle}
                className="hide-scrollbar h-full snap-y snap-mandatory overflow-y-auto overscroll-contain"
                style={{
                    paddingTop: ITEM_H * 2,
                    paddingBottom: ITEM_H * 2,
                }}
            >
                {items.map((item) => {
                    const selected = item === value;
                    return (
                        <button
                            key={item}
                            type="button"
                            role="option"
                            aria-selected={selected}
                            onClick={() => onChange(item)}
                            className={`flex w-full snap-center items-center justify-center text-sm tabular-nums transition-colors ${
                                selected
                                    ? 'font-bold text-on-surface'
                                    : 'font-medium text-on-surface-variant/70'
                            }`}
                            style={{ height: ITEM_H }}
                        >
                            {item}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}

/**
 * Time field that opens a compact dropdown with scrollable hour / minute wheels.
 */
export default function TimeSelect({
    value,
    onChange,
    className = '',
    ariaLabel,
    disabled = false,
}) {
    const t = useT();
    const { hour: valueHour, minute: valueMinute } = normalizeHm(value);
    const [draftHour, setDraftHour] = useState(valueHour);
    const [draftMinute, setDraftMinute] = useState(valueMinute);

    useEffect(() => {
        setDraftHour(valueHour);
        setDraftMinute(valueMinute);
    }, [valueHour, valueMinute]);

    return (
        <Popover className="relative w-full min-w-0">
            {({ close }) => (
                <>
                    <PopoverButton
                        disabled={disabled}
                        aria-label={ariaLabel}
                        className={`relative flex w-full cursor-pointer items-center justify-between gap-2 text-left tabular-nums transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-surface-tint disabled:cursor-not-allowed disabled:opacity-50 ${className} !pr-9`.trim()}
                    >
                        <span className="block truncate font-medium">
                            {valueHour}:{valueMinute}
                        </span>
                        <Icon
                            name="expand_more"
                            size="text-base"
                            className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 shrink-0 text-on-surface-variant"
                        />
                    </PopoverButton>

                    <PopoverPanel
                        portal
                        anchor="bottom start"
                        transition
                        className="z-[120] mt-1 rounded-2xl border border-slate-100 bg-white p-3 shadow-xl ring-1 ring-black/5 outline-none transition duration-100 ease-out data-[closed]:scale-95 data-[closed]:opacity-0"
                    >
                        <div className="mb-2 flex items-center justify-center gap-6 px-1">
                            <span className="w-[4.25rem] text-center text-[10px] font-bold uppercase tracking-widest text-outline">
                                {t('common.time.hour')}
                            </span>
                            <span className="w-[4.25rem] text-center text-[10px] font-bold uppercase tracking-widest text-outline">
                                {t('common.time.minute')}
                            </span>
                        </div>

                        <div className="flex items-center justify-center gap-2">
                            <WheelColumn
                                items={HOURS}
                                value={draftHour}
                                onChange={setDraftHour}
                                ariaLabel={t('common.time.hour')}
                            />
                            <span className="pb-0.5 text-lg font-bold text-on-surface-variant" aria-hidden="true">
                                :
                            </span>
                            <WheelColumn
                                items={MINUTES}
                                value={draftMinute}
                                onChange={setDraftMinute}
                                ariaLabel={t('common.time.minute')}
                            />
                        </div>

                        <div className="mt-3 flex items-center justify-end gap-2 border-t border-slate-100 pt-3">
                            <button
                                type="button"
                                onClick={() => {
                                    setDraftHour(valueHour);
                                    setDraftMinute(valueMinute);
                                    close();
                                }}
                                className="rounded-xl px-3 py-1.5 text-sm font-medium text-on-surface-variant hover:bg-slate-50"
                            >
                                {t('common.actions.cancel')}
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    onChange(`${draftHour}:${draftMinute}`);
                                    close();
                                }}
                                className="rounded-xl bg-on-surface px-3 py-1.5 text-sm font-bold text-surface hover:opacity-90"
                            >
                                {t('common.actions.save')}
                            </button>
                        </div>
                    </PopoverPanel>
                </>
            )}
        </Popover>
    );
}
