import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import Icon from '@/Components/Icon';

const MONTHS = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
];

const WEEKDAY_LABELS_SUNDAY_FIRST = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
const WEEKDAY_LABELS_MONDAY_FIRST = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];

function buildDateString(year, month, day) {
    return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function parseYmd(ymd) {
    if (!ymd) return null;
    const clean = String(ymd).slice(0, 10);
    const [y, m, d] = clean.split('-').map(Number);
    if (!y || !m || !d) return null;
    return { y, m0: m - 1, d };
}

function formatDisplayDate(dateString) {
    if (!dateString) return null;
    const clean = String(dateString).slice(0, 10);
    const [year, month, day] = clean.split('-').map(Number);
    if (!year || !month || !day || isNaN(day)) return null;
    return `${MONTHS[month - 1].slice(0, 3)} ${day}, ${year}`;
}

function getTodayStringLocal() {
    const t = new Date();
    return buildDateString(t.getFullYear(), t.getMonth(), t.getDate());
}

/** Normalize any date value to a plain YYYY-MM-DD string */
function normalizeDate(val) {
    if (!val) return '';
    return String(val).slice(0, 10);
}

function isYmdDisabled(ds, minDate, maxDate) {
    if (!ds) return true;
    if (minDate && ds < minDate) return true;
    if (maxDate && ds > maxDate) return true;
    return false;
}

export default function DatePicker({
    value,
    onChange,
    placeholder = 'Select date',
    label,
    portal = false,
    className = '',
    buttonClassName = '',
    minDate = '',
    maxDate = '',
    /** 'monday' | 'sunday' — calendar column order and header labels */
    weekStartsOn = 'sunday',
    /** When set, "Today" highlight and Today button use this Y-m-d (e.g. business timezone day from server). */
    todayDateString = '',
}) {
    const todayLocal = new Date();
    const todayStringResolved = normalizeDate(todayDateString) || getTodayStringLocal();

    const normalizedValue = normalizeDate(value);

    const [isOpen, setIsOpen] = useState(false);
    const [dropLeft, setDropLeft] = useState(true);
    const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0 });
    const minParts = parseYmd(minDate);
    const valParts = normalizedValue ? parseYmd(normalizedValue) : null;
    const anchorForView = valParts || minParts;
    const [viewYear, setViewYear] = useState(
        anchorForView ? anchorForView.y : todayLocal.getFullYear()
    );
    const [viewMonth, setViewMonth] = useState(
        anchorForView ? anchorForView.m0 : todayLocal.getMonth()
    );

    const containerRef = useRef(null);
    const dropdownRef = useRef(null);

    const weekdayLabels = weekStartsOn === 'monday' ? WEEKDAY_LABELS_MONDAY_FIRST : WEEKDAY_LABELS_SUNDAY_FIRST;

    useEffect(() => {
        if (normalizedValue) {
            const p = parseYmd(normalizedValue);
            if (p) {
                setViewYear(p.y);
                setViewMonth(p.m0);
            }
        }
    }, [normalizedValue]);

    useEffect(() => {
        if (!isOpen) return;

        if (containerRef.current) {
            const rect = containerRef.current.getBoundingClientRect();
            const calendarWidth = 256;

            if (portal) {
                const left = (rect.left + calendarWidth > window.innerWidth - 8)
                    ? Math.max(8, rect.right - calendarWidth)
                    : rect.left;
                setDropdownPos({ top: rect.bottom + 6, left });
            } else {
                setDropLeft(rect.left + calendarWidth <= window.innerWidth - 8);
            }
        }

        const handleOutsideClick = (e) => {
            const inContainer = containerRef.current && containerRef.current.contains(e.target);
            const inDropdown = dropdownRef.current && dropdownRef.current.contains(e.target);
            if (!inContainer && !inDropdown) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleOutsideClick);
        return () => document.removeEventListener('mousedown', handleOutsideClick);
    }, [isOpen, portal]);

    const atOrBeforeMinMonth = () => {
        if (!minParts) return false;
        return viewYear < minParts.y || (viewYear === minParts.y && viewMonth <= minParts.m0);
    };

    const atOrAfterMaxMonth = () => {
        if (!maxDate) return false;
        const p = parseYmd(maxDate);
        if (!p) return false;
        return viewYear > p.y || (viewYear === p.y && viewMonth >= p.m0);
    };

    const goToPrevMonth = () => {
        if (atOrBeforeMinMonth()) return;
        if (viewMonth === 0) {
            setViewMonth(11);
            setViewYear((y) => y - 1);
        } else {
            setViewMonth((m) => m - 1);
        }
    };

    const goToNextMonth = () => {
        if (atOrAfterMaxMonth()) return;
        if (viewMonth === 11) {
            setViewMonth(0);
            setViewYear((y) => y + 1);
        } else {
            setViewMonth((m) => m + 1);
        }
    };

    const selectDay = (day) => {
        const ds = buildDateString(viewYear, viewMonth, day);
        if (isYmdDisabled(ds, normalizeDate(minDate), normalizeDate(maxDate))) {
            return;
        }
        onChange(ds);
        setIsOpen(false);
    };

    const selectToday = () => {
        const ds = todayStringResolved;
        if (isYmdDisabled(ds, normalizeDate(minDate), normalizeDate(maxDate))) {
            return;
        }
        const p = parseYmd(ds);
        if (p) {
            setViewYear(p.y);
            setViewMonth(p.m0);
        }
        onChange(ds);
        setIsOpen(false);
    };

    const clearValue = (e) => {
        e.stopPropagation();
        onChange('');
    };

    const daysInCurrentMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    const firstWeekdayOfMonth = new Date(viewYear, viewMonth, 1).getDay();
    const leadingBlankDays =
        weekStartsOn === 'monday' ? (firstWeekdayOfMonth + 6) % 7 : firstWeekdayOfMonth;

    const minNorm = normalizeDate(minDate);
    const maxNorm = normalizeDate(maxDate);

    const calendarContent = (
        <div
            ref={dropdownRef}
            className={`${
                portal
                    ? 'fixed'
                    : `absolute top-full mt-1.5 ${dropLeft ? 'left-0' : 'right-0'}`
            } z-[9999] w-64 bg-white rounded-2xl shadow-xl ring-1 ring-slate-100 p-3`}
            style={portal ? { top: dropdownPos.top, left: dropdownPos.left } : {}}
        >
            <div className="flex items-center justify-between mb-3">
                <button
                    type="button"
                    onClick={goToPrevMonth}
                    disabled={atOrBeforeMinMonth()}
                    className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-surface-container transition-colors disabled:opacity-30 disabled:pointer-events-none"
                >
                    <Icon name="chevron_left" size="text-base" className="text-on-surface-variant" />
                </button>
                <span className="text-xs font-bold text-on-surface select-none">
                    {MONTHS[viewMonth]} {viewYear}
                </span>
                <button
                    type="button"
                    onClick={goToNextMonth}
                    disabled={atOrAfterMaxMonth()}
                    className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-surface-container transition-colors disabled:opacity-30 disabled:pointer-events-none"
                >
                    <Icon name="chevron_right" size="text-base" className="text-on-surface-variant" />
                </button>
            </div>

            <div className="grid grid-cols-7 mb-1">
                {weekdayLabels.map((dayLabel) => (
                    <div
                        key={dayLabel}
                        className="text-center text-[9px] font-bold text-outline uppercase py-0.5 select-none"
                    >
                        {dayLabel}
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-7 gap-y-0.5">
                {Array.from({ length: leadingBlankDays }, (_, i) => (
                    <div key={`pad-${i}`} />
                ))}
                {Array.from({ length: daysInCurrentMonth }, (_, i) => {
                    const day = i + 1;
                    const dateString = buildDateString(viewYear, viewMonth, day);
                    const isSelected = normalizedValue === dateString;
                    const isToday = todayStringResolved === dateString;
                    const disabled = isYmdDisabled(dateString, minNorm, maxNorm);

                    return (
                        <button
                            key={day}
                            type="button"
                            disabled={disabled}
                            onClick={() => selectDay(day)}
                            className={`w-8 h-8 mx-auto flex items-center justify-center rounded-lg text-xs transition-all ${
                                disabled
                                    ? 'text-outline/35 cursor-not-allowed font-medium'
                                    : isSelected
                                      ? 'bg-on-surface text-surface font-bold'
                                      : isToday
                                        ? 'bg-surface-container text-on-surface font-bold ring-1 ring-on-surface/20'
                                        : 'text-on-surface hover:bg-surface-container-low font-medium'
                            }`}
                        >
                            {day}
                        </button>
                    );
                })}
            </div>

            <div className="mt-2 pt-2 border-t border-outline-variant/30 flex items-center justify-between">
                <button
                    type="button"
                    onClick={() => {
                        onChange('');
                        setIsOpen(false);
                    }}
                    className="text-xs font-bold text-outline hover:text-on-surface transition-colors px-1 py-1"
                >
                    Clear
                </button>
                <button
                    type="button"
                    onClick={selectToday}
                    disabled={isYmdDisabled(todayStringResolved, minNorm, maxNorm)}
                    className="text-xs font-bold text-on-surface hover:opacity-60 transition-opacity px-1 py-1 disabled:opacity-30 disabled:pointer-events-none"
                >
                    Today
                </button>
            </div>
        </div>
    );

    return (
        <div className={`flex flex-col gap-1.5 ${className}`.trim()} ref={containerRef}>
            {label && (
                <label className="text-[10px] font-bold uppercase tracking-widest text-outline ml-1">
                    {label}
                </label>
            )}

            <div className="relative">
                <button
                    type="button"
                    onClick={() => setIsOpen((o) => !o)}
                    className={`flex w-full min-w-[190px] items-center gap-2 rounded-xl border bg-white px-4 py-2.5 text-left text-sm transition-all focus:outline-none ${
                        isOpen
                            ? 'border-on-surface/20 ring-2 ring-on-surface/10'
                            : 'border-slate-200 hover:border-slate-300'
                    } ${buttonClassName}`.trim()}
                >
                    <Icon name="calendar_month" size="text-base" className="text-outline shrink-0" />
                    <span className={`flex-1 truncate ${normalizedValue ? 'text-on-surface font-medium' : 'text-outline'}`}>
                        {normalizedValue ? formatDisplayDate(normalizedValue) : placeholder}
                    </span>
                    {normalizedValue ? (
                        <span
                            role="button"
                            tabIndex={0}
                            onClick={clearValue}
                            onKeyDown={(e) => e.key === 'Enter' && clearValue(e)}
                            className="shrink-0 rounded p-0.5 text-outline hover:text-on-surface hover:bg-surface-container transition-colors"
                        >
                            <Icon name="close" size="text-sm" />
                        </span>
                    ) : (
                        <Icon
                            name="expand_more"
                            size="text-base"
                            className={`shrink-0 text-outline transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
                        />
                    )}
                </button>

                {isOpen && !portal && calendarContent}
            </div>

            {isOpen && portal && createPortal(calendarContent, document.body)}
        </div>
    );
}
