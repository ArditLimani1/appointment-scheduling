import { Head, router, usePage } from '@inertiajs/react';
import { useEffect, useMemo, useState } from 'react';
import Icon from '@/Components/Icon';
import OnboardingShell from './OnboardingShell';
import { useT } from '@/i18n/useT';
import { buildEmployeeScheduleDays } from '@/utils/defaultEmployeeSchedule';

function formatTimeShort(hm) {
    if (!hm || typeof hm !== 'string') return '';
    const [hs, ms] = hm.split(':');
    const h = parseInt(hs, 10);
    const m = (ms ?? '00').slice(0, 2).padStart(2, '0');
    if (Number.isNaN(h)) return hm;
    return `${h}:${m}`;
}

function ReadOnlyField({ label, value, icon }) {
    return (
        <div>
            <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2">{label}</label>
            <div className="flex items-center gap-2 w-full bg-surface-container-highest border-0 rounded-xl py-3 px-4 text-sm text-on-surface-variant font-medium opacity-80 select-none">
                {icon && <Icon name={icon} size="text-base" className="shrink-0 text-on-surface-variant" />}
                <span className="truncate">{value || '—'}</span>
            </div>
        </div>
    );
}

function PersonalBookingUrlField({ label, businessSlug, value, onChange, error, copyTitle }) {
    const prefix = `/book/${businessSlug ?? ''}/`;
    const [copied, setCopied] = useState(false);
    const handleCopy = () => {
        navigator.clipboard.writeText(prefix + value).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        });
    };
    return (
        <div>
            <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2">{label}</label>
            <div className="flex items-center rounded-xl overflow-hidden ring-1 ring-outline-variant bg-white focus-within:ring-2 focus-within:ring-on-surface/30 transition-shadow">
                <span className="shrink-0 px-3 py-3 text-xs text-on-surface-variant border-r border-outline-variant/40 bg-surface whitespace-nowrap">
                    {prefix}
                </span>
                <input
                    type="text"
                    value={value}
                    onChange={(e) => onChange(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '').replace(/--+/g, '-'))}
                    className="flex-1 px-3 py-3 text-sm text-on-surface font-semibold bg-white border-0 focus:outline-none focus:ring-0 min-w-0 placeholder-on-surface-variant/40"
                    spellCheck={false}
                />
                <button
                    type="button"
                    onClick={handleCopy}
                    className="shrink-0 p-2 mr-1 hover:bg-surface rounded-md transition-colors"
                    title={copyTitle}
                >
                    <Icon name={copied ? 'check' : 'content_copy'} size="text-base" className="text-on-surface-variant" />
                </button>
            </div>
            {error && <p className="mt-1.5 text-sm font-medium text-error">{error}</p>}
        </div>
    );
}

function BreakModal({ dayLabel, onSave, onClose, initialBreak = null, t }) {
    const [form, setForm] = useState(initialBreak ?? { start_time: '12:00', end_time: '13:00' });
    const [error, setError] = useState('');

    useEffect(() => {
        setForm(initialBreak ?? { start_time: '12:00', end_time: '13:00' });
        setError('');
    }, [initialBreak]);

    const inputClass = 'rounded-xl border-0 bg-surface-container-low px-3 py-2 text-sm text-on-surface focus:ring-2 focus:ring-surface-tint';

    const handleSave = () => {
        if (form.start_time >= form.end_time) {
            setError(t('onboarding.employee.end_after_start'));
            return;
        }
        onSave(form);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 px-4 pb-4 pt-10 sm:items-center sm:pb-0">
            <div className="w-full max-w-sm rounded-3xl bg-surface p-5 shadow-2xl sm:p-6">
                <div className="mb-5 flex items-center justify-between">
                    <div>
                        <h3 className="font-headline text-lg font-bold text-on-surface">
                            {initialBreak ? t('onboarding.employee.edit_break_title') : t('onboarding.employee.add_break_title')}
                        </h3>
                        <p className="text-xs text-on-surface-variant mt-0.5">{dayLabel}</p>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-full p-1.5 text-on-surface-variant hover:bg-surface-container transition-colors"
                    >
                        <Icon name="close" size="text-xl" />
                    </button>
                </div>

                <div className="space-y-4">
                    <div className="grid grid-cols-[1fr_auto_1fr] items-end gap-3">
                        <div className="flex-1">
                            <label className="mb-1 block text-xs font-medium text-on-surface-variant">
                                {t('onboarding.employee.start_time')}
                            </label>
                            <input
                                type="time"
                                value={form.start_time}
                                onChange={(e) => { setForm((f) => ({ ...f, start_time: e.target.value })); setError(''); }}
                                className={`w-full ${inputClass}`}
                            />
                        </div>
                        <span className="mb-2 text-center text-on-surface-variant">–</span>
                        <div className="flex-1">
                            <label className="mb-1 block text-xs font-medium text-on-surface-variant">
                                {t('onboarding.employee.end_time')}
                            </label>
                            <input
                                type="time"
                                value={form.end_time}
                                onChange={(e) => { setForm((f) => ({ ...f, end_time: e.target.value })); setError(''); }}
                                className={`w-full ${inputClass}`}
                            />
                        </div>
                    </div>

                    {error && <p className="text-xs text-error font-medium">{error}</p>}
                </div>

                <div className="mt-6 flex items-center gap-3 justify-end">
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-xl border border-outline-variant px-4 py-2 text-sm font-medium text-on-surface-variant hover:bg-surface-container transition-colors"
                    >
                        {t('onboarding.employee.cancel')}
                    </button>
                    <button
                        type="button"
                        onClick={handleSave}
                        className="primary-gradient rounded-xl px-5 py-2 text-sm font-semibold text-white shadow"
                    >
                        {t('onboarding.employee.save_break')}
                    </button>
                </div>
            </div>
        </div>
    );
}

function ScheduleDayCard({ day, label, onChange, onAddBreak, onEditBreak, onRemoveBreak, t }) {
    const inputClass =
        'rounded-xl border-0 bg-surface-container-low px-3 py-2.5 text-sm text-on-surface focus:ring-2 focus:ring-surface-tint w-full md:w-auto md:py-2';

    const shellClass = day.is_active
        ? 'border-outline-variant bg-surface-container-lowest'
        : 'border-outline-variant/50 bg-surface-container-low opacity-70';

    return (
        <div className={`rounded-2xl border p-4 shadow-sm transition-all md:px-5 md:py-4 ${shellClass}`}>
            <div className="flex flex-col gap-4 md:flex-row md:items-center">
                <div className="flex min-w-0 items-center gap-3 md:w-[180px] md:shrink-0">
                    <label className="relative inline-flex shrink-0 cursor-pointer items-center">
                        <input
                            type="checkbox"
                            checked={day.is_active}
                            onChange={(e) => onChange({ ...day, is_active: e.target.checked })}
                            className="peer sr-only"
                        />
                        <div className="peer relative h-6 w-11 shrink-0 rounded-full bg-surface-container-high after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:bg-white after:shadow-sm after:transition-all after:content-[''] peer-checked:bg-on-surface peer-checked:after:translate-x-full" />
                    </label>
                    <div className="min-w-0 flex-1">
                        <p className={`font-headline text-sm font-bold leading-tight ${day.is_active ? 'text-on-surface' : 'text-on-surface-variant'}`}>
                            {label}
                        </p>
                        {!day.is_active && (
                            <p className="mt-0.5 text-xs text-on-surface-variant">{t('onboarding.employee.day_off')}</p>
                        )}
                    </div>
                </div>

                <div className="flex min-w-0 flex-1 flex-col gap-3 border-t border-outline-variant/25 pt-4 md:border-t-0 md:pt-0 md:items-center">
                    {day.is_active && (
                        <div className="grid w-full grid-cols-2 gap-3 md:flex md:flex-wrap md:justify-center md:gap-2">
                            <div className="min-w-0">
                                <label className="mb-1 block text-xs text-on-surface-variant">
                                    {t('onboarding.employee.from')}
                                </label>
                                <input
                                    type="time"
                                    value={day.start_time}
                                    onChange={(e) => onChange({ ...day, start_time: e.target.value })}
                                    className={inputClass}
                                />
                            </div>
                            <div className="min-w-0">
                                <label className="mb-1 block text-xs text-on-surface-variant">
                                    {t('onboarding.employee.to')}
                                </label>
                                <input
                                    type="time"
                                    value={day.end_time}
                                    onChange={(e) => onChange({ ...day, end_time: e.target.value })}
                                    className={inputClass}
                                />
                            </div>
                        </div>
                    )}

                    {day.is_active && (day.breaks ?? []).length > 0 && (
                        <div className="flex w-full flex-col gap-2 md:items-center">
                            {(day.breaks ?? []).map((brk, bi) => (
                                <div
                                    key={bi}
                                    className="flex w-full items-center gap-2 rounded-xl border border-outline-variant/40 bg-surface-container-low/90 px-3 py-2.5 md:w-auto md:border-0 md:bg-transparent md:px-0 md:py-0"
                                >
                                    <div className="flex shrink-0 items-center gap-1.5 text-on-surface-variant">
                                        <Icon name="free_breakfast" size="text-sm" />
                                        <span className="whitespace-nowrap text-xs font-semibold">
                                            {t('onboarding.employee.break')}
                                        </span>
                                    </div>
                                    <span className="flex-1 px-1 text-center text-sm font-semibold tabular-nums text-on-surface md:rounded-xl md:bg-surface-container-low md:px-3 md:py-2 md:text-left">
                                        {formatTimeShort(brk.start_time)}
                                        <span className="mx-0.5 font-normal text-on-surface-variant">–</span>
                                        {formatTimeShort(brk.end_time)}
                                    </span>
                                    <button
                                        type="button"
                                        onClick={() => onEditBreak(bi)}
                                        className="shrink-0 rounded-xl bg-surface-container p-2 text-on-surface transition-colors hover:bg-surface-container-high"
                                        aria-label={t('onboarding.employee.edit_break')}
                                    >
                                        <Icon name="edit" size="text-sm" />
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => onRemoveBreak(bi)}
                                        className="shrink-0 rounded-xl bg-surface-container p-2 text-on-surface transition-colors hover:bg-surface-container-high"
                                        aria-label={t('onboarding.employee.remove_break')}
                                    >
                                        <Icon name="delete" size="text-sm" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="border-t border-outline-variant/25 pt-3 md:w-[140px] md:shrink-0 md:border-t-0 md:pt-0 md:flex md:justify-end">
                    {day.is_active && (
                        <button
                            type="button"
                            onClick={onAddBreak}
                            className="flex w-full items-center justify-center gap-2 rounded-xl border border-outline-variant px-4 py-2.5 text-xs font-bold text-on-surface-variant transition-colors hover:bg-surface-container md:w-auto md:py-2"
                        >
                            <Icon name="add" size="text-sm" />
                            {t('onboarding.employee.add_break')}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}

export default function Employee({
    business_name,
    business_slug,
    employee_email,
    booking_slug,
    business_booking_url,
    schedules: initialSchedules,
}) {
    const t = useT();
    const { errors } = usePage().props;
    const [stepIndex, setStepIndex] = useState(0);
    const [processing, setProcessing] = useState(false);
    const [bookingSlug, setBookingSlug] = useState(booking_slug || '');
    const [days, setDays] = useState(() => buildEmployeeScheduleDays(initialSchedules));
    const [breakModal, setBreakModal] = useState({ open: false, dayIndex: null, breakIndex: null });

    const slugError = errors?.booking_slug
        ? Array.isArray(errors.booking_slug) ? errors.booking_slug[0] : errors.booking_slug
        : undefined;

    const steps = useMemo(
        () => [
            {
                id: 'url',
                eyebrow: t('onboarding.shared.step_label', { current: 1, total: 2 }),
                label: t('onboarding.employee.step_url_title'),
                description: t('onboarding.employee.step_url_sub'),
                icon: 'link',
            },
            {
                id: 'schedule',
                eyebrow: t('onboarding.shared.step_label', { current: 2, total: 2 }),
                label: t('onboarding.employee.step_schedule_title'),
                description: t('onboarding.employee.step_schedule_sub'),
                icon: 'calendar_view_week',
            },
        ],
        [t],
    );

    const isLastStep = stepIndex === steps.length - 1;
    const canContinue = stepIndex !== 0 || bookingSlug.trim().length > 0;

    const updateDay = (index, updated) => {
        setDays((prev) => prev.map((d, i) => (i === index ? updated : d)));
    };

    const handleSaveBreak = (brk) => {
        const { dayIndex, breakIndex } = breakModal;
        if (dayIndex === null) return;
        setDays((prev) => prev.map((d, i) => (
            i === dayIndex
                ? {
                    ...d,
                    breaks: breakIndex === null
                        ? [...(d.breaks ?? []), brk]
                        : (d.breaks ?? []).map((existing, j) => (j === breakIndex ? brk : existing)),
                }
                : d
        )));
        setBreakModal({ open: false, dayIndex: null, breakIndex: null });
    };

    const handleRemoveBreak = (dayIndex, breakIndex) => {
        setDays((prev) => prev.map((d, i) => (
            i === dayIndex
                ? { ...d, breaks: (d.breaks ?? []).filter((_, j) => j !== breakIndex) }
                : d
        )));
    };

    const persistSlug = (onSuccess) => {
        setProcessing(true);
        router.patch(
            route('onboarding.booking_slug'),
            { booking_slug: bookingSlug.trim() },
            {
                preserveScroll: true,
                preserveState: true,
                onSuccess: () => onSuccess?.(),
                onFinish: () => setProcessing(false),
            },
        );
    };

    const persistSchedule = (onSuccess) => {
        setProcessing(true);
        router.put(
            route('onboarding.schedule'),
            { schedules: days },
            {
                preserveScroll: true,
                preserveState: true,
                onSuccess: () => onSuccess?.(),
                onFinish: () => setProcessing(false),
            },
        );
    };

    const handleContinue = () => {
        if (processing) return;

        if (stepIndex === 0) {
            persistSlug(() => setStepIndex(1));
            return;
        }

        if (isLastStep) {
            persistSchedule(() => {
                setProcessing(true);
                router.post(
                    route('onboarding.complete'),
                    {},
                    { onFinish: () => setProcessing(false) },
                );
            });
        }
    };

    const handleBack = () => setStepIndex((idx) => Math.max(idx - 1, 0));
    const handleStepJump = (idx) => setStepIndex(idx);

    const breakModalDay = breakModal.dayIndex !== null ? days[breakModal.dayIndex] : null;
    const breakInitial = breakModal.breakIndex !== null && breakModalDay
        ? (breakModalDay.breaks?.[breakModal.breakIndex] ?? null)
        : null;

    return (
        <OnboardingShell
            eyebrow={t('onboarding.shared.eyebrow')}
            heroTitle={t('onboarding.employee.hero_title')}
            heroSubtitle={t('onboarding.employee.hero_subtitle')}
            steps={steps}
            currentStep={stepIndex}
            onStepClick={handleStepJump}
            onBack={handleBack}
            onContinue={handleContinue}
            isLastStep={isLastStep}
            isProcessing={processing}
            canContinue={canContinue}
        >
            <Head title={t('onboarding.shared.head_title')} />

            {stepIndex === 0 && (
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                    <ReadOnlyField
                        label={t('onboarding.employee.business_name_label')}
                        value={business_name}
                        icon="storefront"
                    />
                    <ReadOnlyField
                        label={t('onboarding.employee.email_label')}
                        value={employee_email}
                        icon="mail"
                    />
                    <div className="sm:col-span-2">
                        <ReadOnlyField
                            label={t('onboarding.employee.business_url_label')}
                            value={business_booking_url}
                            icon="link"
                        />
                    </div>
                    <div className="sm:col-span-2">
                        <PersonalBookingUrlField
                            label={t('onboarding.employee.personal_url_label')}
                            businessSlug={business_slug}
                            value={bookingSlug}
                            onChange={setBookingSlug}
                            error={slugError}
                            copyTitle={t('onboarding.employee.copy_url')}
                        />
                    </div>
                </div>
            )}

            {stepIndex === 1 && (
                <div className="space-y-3">
                    {days.map((day, i) => (
                        <ScheduleDayCard
                            key={day.day_of_week}
                            day={day}
                            label={t(`onboarding.employee.weekday_${day.day_of_week}`)}
                            onChange={(updated) => updateDay(i, updated)}
                            onAddBreak={() => setBreakModal({ open: true, dayIndex: i, breakIndex: null })}
                            onEditBreak={(bi) => setBreakModal({ open: true, dayIndex: i, breakIndex: bi })}
                            onRemoveBreak={(bi) => handleRemoveBreak(i, bi)}
                            t={t}
                        />
                    ))}
                </div>
            )}

            {breakModal.open && breakModalDay && (
                <BreakModal
                    dayLabel={t(`onboarding.employee.weekday_${breakModalDay.day_of_week}`)}
                    onSave={handleSaveBreak}
                    onClose={() => setBreakModal({ open: false, dayIndex: null, breakIndex: null })}
                    initialBreak={breakInitial}
                    t={t}
                />
            )}
        </OnboardingShell>
    );
}
