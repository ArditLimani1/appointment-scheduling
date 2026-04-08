import { Head, useForm, usePage } from '@inertiajs/react';
import EmployeeLayout from '@/Layouts/EmployeeLayout';
import Icon from '@/Components/Icon';

const DAYS = [
    { index: 0, label: 'Monday',    short: 'Mon' },
    { index: 1, label: 'Tuesday',   short: 'Tue' },
    { index: 2, label: 'Wednesday', short: 'Wed' },
    { index: 3, label: 'Thursday',  short: 'Thu' },
    { index: 4, label: 'Friday',    short: 'Fri' },
    { index: 5, label: 'Saturday',  short: 'Sat' },
    { index: 6, label: 'Sunday',    short: 'Sun' },
];

function buildInitialSchedules(existing) {
    return DAYS.map(day => {
        const found = existing.find(s => s.day_of_week === day.index);
        return {
            day_of_week: day.index,
            is_active:   found ? found.is_active  : false,
            start_time:  found ? (found.start_time?.substring(0, 5) ?? '09:00') : '09:00',
            end_time:    found ? (found.end_time?.substring(0, 5)   ?? '17:00') : '17:00',
            breaks:      found ? (found.breaks ?? []).map(b => ({
                start_time: b.start_time?.substring(0, 5) ?? '12:00',
                end_time:   b.end_time?.substring(0, 5)   ?? '13:00',
            })) : [],
        };
    });
}

export default function Configuration({ schedules: existingSchedules }) {
    const { flash } = usePage().props;
    const { data, setData, put, processing } = useForm({
        schedules: buildInitialSchedules(existingSchedules),
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        put(route('employee.schedule.update'));
    };

    const updateDay = (index, field, value) => {
        setData('schedules', data.schedules.map((s, i) =>
            i === index ? { ...s, [field]: value } : s
        ));
    };

    const addBreak = (index) => {
        const updated = data.schedules.map((s, i) =>
            i === index ? { ...s, breaks: [...s.breaks, { start_time: '12:00', end_time: '13:00' }] } : s
        );
        setData('schedules', updated);
    };

    const removeBreak = (dayIndex, breakIndex) => {
        const updated = data.schedules.map((s, i) =>
            i === dayIndex ? { ...s, breaks: s.breaks.filter((_, bi) => bi !== breakIndex) } : s
        );
        setData('schedules', updated);
    };

    const updateBreak = (dayIndex, breakIndex, field, value) => {
        const updated = data.schedules.map((s, i) => {
            if (i !== dayIndex) return s;
            return {
                ...s,
                breaks: s.breaks.map((b, bi) =>
                    bi === breakIndex ? { ...b, [field]: value } : b
                ),
            };
        });
        setData('schedules', updated);
    };

    const inputClass = "rounded-xl border-0 bg-surface-container-low px-3 py-2 text-sm text-on-surface focus:ring-2 focus:ring-surface-tint";
    const activeCount = data.schedules.filter(s => s.is_active).length;

    return (
        <EmployeeLayout>
            <Head title="Schedule Configuration" />

            <div className="mb-8">
                <h1 className="text-3xl font-black font-headline tracking-tight text-on-surface">Default Schedule</h1>
                <p className="mt-1 text-sm text-on-surface-variant">
                    Set your recurring weekly template. This default applies to any week where you haven't set specific overrides.
                </p>
            </div>

            {flash?.success && (
                <div className="mb-5 flex items-center gap-2 rounded-2xl bg-tertiary-fixed/20 px-4 py-3 text-sm font-medium text-on-tertiary-container">
                    <Icon name="check_circle" size="text-lg" filled />
                    {flash.success}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
                {data.schedules.map((day, index) => {
                    const dayInfo = DAYS[index];
                    return (
                        <div
                            key={day.day_of_week}
                            className={`rounded-3xl border p-5 transition-all ${
                                day.is_active
                                    ? 'bg-surface-container-lowest border-outline-variant'
                                    : 'bg-surface-container-low border-outline-variant/50 opacity-60'
                            }`}
                        >
                            <div className="flex items-center gap-4 flex-wrap">
                                <div className="flex items-center gap-3 w-[140px]">
                                    <label className="relative inline-flex cursor-pointer items-center">
                                        <input
                                            type="checkbox"
                                            checked={day.is_active}
                                            onChange={e => updateDay(index, 'is_active', e.target.checked)}
                                            className="peer sr-only"
                                        />
                                        <div className="peer h-6 w-11 rounded-full bg-surface-container-high after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-all after:content-[''] peer-checked:bg-primary peer-checked:after:translate-x-full" />
                                    </label>
                                    <span className={`font-bold font-headline text-sm ${day.is_active ? 'text-on-surface' : 'text-on-surface-variant'}`}>
                                        {dayInfo.label}
                                    </span>
                                </div>

                                {day.is_active && (
                                    <div className="flex items-center gap-2 flex-wrap flex-1">
                                        <div className="flex items-center gap-2">
                                            <label className="text-xs text-on-surface-variant">From</label>
                                            <input type="time" value={day.start_time} onChange={e => updateDay(index, 'start_time', e.target.value)} className={inputClass} />
                                        </div>
                                        <span className="text-on-surface-variant">–</span>
                                        <div className="flex items-center gap-2">
                                            <label className="text-xs text-on-surface-variant">To</label>
                                            <input type="time" value={day.end_time} onChange={e => updateDay(index, 'end_time', e.target.value)} className={inputClass} />
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => addBreak(index)}
                                            className="ml-auto flex items-center gap-1 rounded-xl border border-outline-variant px-3 py-2 text-xs font-medium text-on-surface-variant hover:bg-surface-container-low transition-colors"
                                        >
                                            <Icon name="add" size="text-sm" /> Add Break
                                        </button>
                                    </div>
                                )}
                            </div>

                            {day.is_active && day.breaks.length > 0 && (
                                <div className="mt-4 space-y-2 pl-[156px]">
                                    {day.breaks.map((brk, bi) => (
                                        <div key={bi} className="flex items-center gap-2 flex-wrap">
                                            <Icon name="free_breakfast" size="text-sm" className="text-on-surface-variant" />
                                            <span className="text-xs text-on-surface-variant">Break</span>
                                            <input type="time" value={brk.start_time} onChange={e => updateBreak(index, bi, 'start_time', e.target.value)} className={inputClass} />
                                            <span className="text-on-surface-variant text-xs">–</span>
                                            <input type="time" value={brk.end_time} onChange={e => updateBreak(index, bi, 'end_time', e.target.value)} className={inputClass} />
                                            <button
                                                type="button"
                                                onClick={() => removeBreak(index, bi)}
                                                className="rounded-xl bg-error-container p-1.5 text-on-error-container hover:opacity-80 transition-opacity"
                                            >
                                                <Icon name="close" size="text-sm" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    );
                })}

                <div className="flex items-center gap-4 pt-2">
                    <button
                        type="submit"
                        disabled={processing}
                        className="primary-gradient rounded-2xl px-8 py-3 text-sm font-semibold text-white shadow-lg disabled:opacity-50"
                    >
                        {processing ? 'Saving...' : 'Save Default Schedule'}
                    </button>
                    <p className="text-sm text-on-surface-variant">
                        {activeCount} day{activeCount !== 1 ? 's' : ''} active by default
                    </p>
                </div>
            </form>
        </EmployeeLayout>
    );
}
