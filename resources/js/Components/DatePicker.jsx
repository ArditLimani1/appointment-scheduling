import { useEffect, useRef, useState } from 'react';
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
    const [year, month, day] = dateString.split('-').map(Number);
    return `${MONTHS[month - 1].slice(0, 3)} ${day}, ${year}`;
}

function getTodayString() {
    const t = new Date();
    return buildDateString(t.getFullYear(), t.getMonth(), t.getDate());
}

export default function DatePicker({ value, onChange, placeholder = 'Select date', label }) {
    const today = new Date();
    const todayString = getTodayString();

    const [isOpen, setIsOpen] = useState(false);
    const [viewYear, setViewYear] = useState(
        value ? parseInt(value.split('-')[0]) : today.getFullYear()
    );
    const [viewMonth, setViewMonth] = useState(
        value ? parseInt(value.split('-')[1]) - 1 : today.getMonth()
    );

    const containerRef = useRef(null);

    useEffect(() => {
        if (value) {
            setViewYear(parseInt(value.split('-')[0]));
            setViewMonth(parseInt(value.split('-')[1]) - 1);
        }
    }, [value]);

    useEffect(() => {
        if (!isOpen) return;
        const handleOutsideClick = (e) => {
            if (containerRef.current && !containerRef.current.contains(e.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleOutsideClick);
        return () => document.removeEventListener('mousedown', handleOutsideClick);
    }, [isOpen]);

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

    const daysInCurrentMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    const firstWeekdayOfMonth = new Date(viewYear, viewMonth, 1).getDay();

    return (
        <div className="flex flex-col gap-1.5" ref={containerRef}>
            {label && (
                <label className="text-[10px] font-bold uppercase tracking-widest text-outline ml-1">
                    {label}
                </label>
            )}

            <div className="relative">
                <button
                    type="button"
                    onClick={() => setIsOpen((o) => !o)}
                    className={`flex items-center gap-2 w-full min-w-[190px] rounded-xl border bg-white px-4 py-2.5 text-sm text-left transition-all focus:outline-none ${
                        isOpen
                            ? 'border-on-surface/20 ring-2 ring-on-surface/10'
                            : 'border-slate-200 hover:border-slate-300'
                    }`}
                >
                    <Icon name="calendar_month" size="text-base" className="text-outline shrink-0" />
                    <span className={`flex-1 truncate ${value ? 'text-on-surface font-medium' : 'text-outline'}`}>
                        {value ? formatDisplayDate(value) : placeholder}
                    </span>
                    {value ? (
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

                {isOpen && (
                    <div className="absolute top-full left-0 z-50 mt-1.5 w-72 bg-white rounded-2xl shadow-xl ring-1 ring-slate-100 p-4">

                        <div className="flex items-center justify-between mb-4">
                            <button
                                type="button"
                                onClick={goToPrevMonth}
                                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-surface-container transition-colors"
                            >
                                <Icon name="chevron_left" size="text-lg" className="text-on-surface-variant" />
                            </button>
                            <span className="text-sm font-bold text-on-surface select-none">
                                {MONTHS[viewMonth]} {viewYear}
                            </span>
                            <button
                                type="button"
                                onClick={goToNextMonth}
                                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-surface-container transition-colors"
                            >
                                <Icon name="chevron_right" size="text-lg" className="text-on-surface-variant" />
                            </button>
                        </div>

                        <div className="grid grid-cols-7 mb-1">
                            {WEEKDAY_LABELS.map((dayLabel) => (
                                <div
                                    key={dayLabel}
                                    className="text-center text-[10px] font-bold text-outline uppercase py-1 select-none"
                                >
                                    {dayLabel}
                                </div>
                            ))}
                        </div>

                        <div className="grid grid-cols-7 gap-y-0.5">
                            {Array.from({ length: firstWeekdayOfMonth }, (_, i) => (
                                <div key={`pad-${i}`} />
                            ))}
                            {Array.from({ length: daysInCurrentMonth }, (_, i) => {
                                const day = i + 1;
                                const dateString = buildDateString(viewYear, viewMonth, day);
                                const isSelected = value === dateString;
                                const isToday = todayString === dateString;

                                return (
                                    <button
                                        key={day}
                                        type="button"
                                        onClick={() => selectDay(day)}
                                        className={`w-9 h-9 mx-auto flex items-center justify-center rounded-xl text-sm transition-all ${
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

                        <div className="mt-3 pt-3 border-t border-outline-variant/30 flex items-center justify-between">
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
                )}
            </div>
        </div>
    );
}
