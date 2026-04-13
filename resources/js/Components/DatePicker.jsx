import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import Icon from '@/Components/Icon';

const MONTHS = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
];
const WEEKDAY_LABELS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

function buildDateString(year, month, day) {
    return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function formatDisplayDate(dateString) {
    if (!dateString) return null;
    // Normalize: strip any time portion (e.g. "2026-04-07T00:00:00Z" → "2026-04-07")
    const clean = String(dateString).slice(0, 10);
    const [year, month, day] = clean.split('-').map(Number);
    if (!year || !month || !day || isNaN(day)) return null;
    return `${MONTHS[month - 1].slice(0, 3)} ${day}, ${year}`;
}

function getTodayString() {
    const t = new Date();
    return buildDateString(t.getFullYear(), t.getMonth(), t.getDate());
}

/** Normalize any date value to a plain YYYY-MM-DD string */
function normalizeDate(val) {
    if (!val) return '';
    return String(val).slice(0, 10);
}

export default function DatePicker({
    value,
    onChange,
    placeholder = 'Select date',
    label,
    portal = false,
    className = '',
    buttonClassName = '',
}) {
    const today = new Date();
    const todayString = getTodayString();

    const normalizedValue = normalizeDate(value);

    const [isOpen, setIsOpen] = useState(false);
    const [dropLeft, setDropLeft] = useState(true);
    const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0 });
    const [viewYear, setViewYear] = useState(
        normalizedValue ? parseInt(normalizedValue.split('-')[0]) : today.getFullYear()
    );
    const [viewMonth, setViewMonth] = useState(
        normalizedValue ? parseInt(normalizedValue.split('-')[1]) - 1 : today.getMonth()
    );

    const containerRef = useRef(null);
    const dropdownRef  = useRef(null);

    useEffect(() => {
        if (normalizedValue) {
            setViewYear(parseInt(normalizedValue.split('-')[0]));
            setViewMonth(parseInt(normalizedValue.split('-')[1]) - 1);
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
            const inDropdown  = dropdownRef.current  && dropdownRef.current.contains(e.target);
            if (!inContainer && !inDropdown) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleOutsideClick);
        return () => document.removeEventListener('mousedown', handleOutsideClick);
    }, [isOpen, portal]);

    const goToPrevMonth = () => {
        if (viewMonth === 0) { setViewMonth(11); setViewYear((y) => y - 1); }
        else setViewMonth((m) => m - 1);
    };

    const goToNextMonth = () => {
        if (viewMonth === 11) { setViewMonth(0); setViewYear((y) => y + 1); }
        else setViewMonth((m) => m + 1);
    };

    const selectDay = (day) => {
        onChange(buildDateString(viewYear, viewMonth, day));
        setIsOpen(false);
    };

    const selectToday = () => {
        setViewYear(today.getFullYear());
        setViewMonth(today.getMonth());
        onChange(todayString);
        setIsOpen(false);
    };

    const clearValue = (e) => {
        e.stopPropagation();
        onChange('');
    };

    const daysInCurrentMonth  = new Date(viewYear, viewMonth + 1, 0).getDate();
    const firstWeekdayOfMonth = new Date(viewYear, viewMonth, 1).getDay();

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
            {/* Month navigation */}
            <div className="flex items-center justify-between mb-3">
                <button
                    type="button"
                    onClick={goToPrevMonth}
                    className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-surface-container transition-colors"
                >
                    <Icon name="chevron_left" size="text-base" className="text-on-surface-variant" />
                </button>
                <span className="text-xs font-bold text-on-surface select-none">
                    {MONTHS[viewMonth]} {viewYear}
                </span>
                <button
                    type="button"
                    onClick={goToNextMonth}
                    className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-surface-container transition-colors"
                >
                    <Icon name="chevron_right" size="text-base" className="text-on-surface-variant" />
                </button>
            </div>

            {/* Weekday labels */}
            <div className="grid grid-cols-7 mb-1">
                {WEEKDAY_LABELS.map((dayLabel) => (
                    <div
                        key={dayLabel}
                        className="text-center text-[9px] font-bold text-outline uppercase py-0.5 select-none"
                    >
                        {dayLabel}
                    </div>
                ))}
            </div>

            {/* Day grid */}
            <div className="grid grid-cols-7 gap-y-0.5">
                {Array.from({ length: firstWeekdayOfMonth }, (_, i) => (
                    <div key={`pad-${i}`} />
                ))}
                {Array.from({ length: daysInCurrentMonth }, (_, i) => {
                    const day        = i + 1;
                    const dateString = buildDateString(viewYear, viewMonth, day);
                    const isSelected = normalizedValue === dateString;
                    const isToday    = todayString === dateString;

                    return (
                        <button
                            key={day}
                            type="button"
                            onClick={() => selectDay(day)}
                            className={`w-8 h-8 mx-auto flex items-center justify-center rounded-lg text-xs transition-all ${
                                isSelected
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

            {/* Footer */}
            <div className="mt-2 pt-2 border-t border-outline-variant/30 flex items-center justify-between">
                <button
                    type="button"
                    onClick={() => { onChange(''); setIsOpen(false); }}
                    className="text-xs font-bold text-outline hover:text-on-surface transition-colors px-1 py-1"
                >
                    Clear
                </button>
                <button
                    type="button"
                    onClick={selectToday}
                    className="text-xs font-bold text-on-surface hover:opacity-60 transition-opacity px-1 py-1"
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

                {/* Non-portal: render inline below trigger */}
                {isOpen && !portal && calendarContent}
            </div>

            {/* Portal: render at document.body to escape overflow containers */}
            {isOpen && portal && createPortal(calendarContent, document.body)}
        </div>
    );
}
