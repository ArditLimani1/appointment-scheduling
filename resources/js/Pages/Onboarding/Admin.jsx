import { Head, router, usePage } from '@inertiajs/react';
import { useId, useMemo, useState } from 'react';
import Icon from '@/Components/Icon';
import NoticeModal from '@/Components/NoticeModal';
import OnboardingShell from './OnboardingShell';
import { useT } from '@/i18n/useT';
import { resolveClientIdentifierType } from '@/utils/clientIdentification';

const numericInputCls =
    'w-28 border-0 rounded-xl py-3 px-4 text-base font-extrabold text-on-surface text-center bg-surface-container-lowest ring-1 ring-outline-variant focus:outline-none focus:ring-2 focus:ring-on-surface/20 transition-shadow';

function NumberCard({ title, help, value, onChange, min, max, unit, errorMessage }) {
    return (
        <div className="rounded-2xl border border-outline-variant/40 bg-surface p-6 sm:p-7 flex flex-col gap-5 h-full">
            <div>
                <p className="text-sm font-bold text-on-surface">{title}</p>
                <p className="mt-1 text-xs text-on-surface-variant leading-relaxed">{help}</p>
            </div>
            <div className="flex items-center gap-3">
                <input
                    type="number"
                    min={min}
                    max={max}
                    value={Number.isFinite(value) ? value : ''}
                    onChange={(e) => onChange(parseInt(e.target.value, 10))}
                    className={numericInputCls}
                />
                <span className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">{unit}</span>
            </div>
            {errorMessage && (
                <p className="text-xs font-medium text-error">{errorMessage}</p>
            )}
        </div>
    );
}

function SegmentedChoice({ options, value, onChange }) {
    return (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {options.map((opt) => {
                const active = value === opt.value;
                return (
                    <button
                        type="button"
                        key={opt.value}
                        onClick={() => onChange(opt.value)}
                        className={`text-left rounded-2xl border-2 p-5 transition-all ${
                            active
                                ? 'border-on-surface bg-on-surface text-surface'
                                : 'border-outline-variant/60 bg-surface text-on-surface hover:border-on-surface/40'
                        }`}
                    >
                        <div className="flex items-center gap-3">
                            <div
                                className={`flex h-10 w-10 items-center justify-center rounded-2xl ${
                                    active ? 'bg-surface/15' : 'bg-primary-container/40'
                                }`}
                            >
                                <Icon name={opt.icon} size="text-lg" className={active ? 'text-surface' : 'text-on-surface'} />
                            </div>
                            <div className="min-w-0">
                                <p className={`text-sm font-extrabold ${active ? 'text-surface' : 'text-on-surface'}`}>
                                    {opt.label}
                                </p>
                                {opt.description && (
                                    <p
                                        className={`text-xs mt-0.5 leading-relaxed ${
                                            active ? 'text-surface/80' : 'text-on-surface-variant'
                                        }`}
                                    >
                                        {opt.description}
                                    </p>
                                )}
                            </div>
                        </div>
                    </button>
                );
            })}
        </div>
    );
}

function ToggleCard({ icon, title, help, label, value, onChange, disabled = false, lockedNote, errorMessage, children }) {
    const toggleId = useId();
    return (
        <div className="rounded-2xl border border-outline-variant/40 bg-surface p-6 sm:p-7">
            <div className="flex items-start gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary-container text-on-primary">
                    <Icon name={icon} size="text-xl" />
                </div>
                <div className="min-w-0 flex-1">
                    <p className="text-sm font-extrabold text-on-surface">{title}</p>
                    <p className="mt-1 text-xs text-on-surface-variant leading-relaxed">{help}</p>
                </div>
            </div>

            <div className={`mt-5 flex items-center justify-between gap-4 rounded-2xl border border-outline-variant/60 bg-surface-container-lowest px-5 py-4 ${disabled ? 'opacity-70' : ''}`}>
                <label
                    htmlFor={toggleId}
                    className={`text-sm font-bold text-on-surface select-none ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                >
                    {label}
                </label>
                <button
                    id={toggleId}
                    type="button"
                    role="switch"
                    aria-checked={value}
                    aria-disabled={disabled}
                    disabled={disabled}
                    onClick={() => {
                        if (!disabled) onChange(!value);
                    }}
                    className={`relative h-6 w-11 shrink-0 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-on-surface/30 ${
                        value ? 'bg-on-surface' : 'bg-surface-container-highest'
                    } ${disabled ? 'cursor-not-allowed' : ''}`}
                >
                    <span
                        className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow transition-all ${
                            value ? 'right-1' : 'left-1'
                        }`}
                    />
                </button>
            </div>

            {lockedNote && (
                <p className="mt-3 text-xs font-medium text-on-surface-variant leading-relaxed">{lockedNote}</p>
            )}
            {errorMessage && (
                <p className="mt-3 text-xs font-medium text-error leading-relaxed">{errorMessage}</p>
            )}

            {children}
        </div>
    );
}

export default function Admin({ settings }) {
    const t = useT();
    const { errors, features } = usePage().props;
    const whatsappEnabled = features?.whatsapp ?? false;
    const [stepIndex, setStepIndex] = useState(0);
    const [processing, setProcessing] = useState(false);
    const [staffLockedNotice, setStaffLockedNotice] = useState(false);

    const [data, setData] = useState({
        slot_duration: settings.slot_duration ?? 30,
        min_booking_notice: settings.min_booking_notice ?? 120,
        max_booking_window: settings.max_booking_window ?? 30,
        client_identifier_type: resolveClientIdentifierType(
            settings.client_identifier_type,
            whatsappEnabled,
        ),
        owner_also_works_as_staff: !!settings.owner_also_works_as_staff,
        single_employee_mode: !!settings.single_employee_mode,
        allow_employee_service_edit: settings.allow_employee_service_edit ?? true,
        uses_shared_resources: !!settings.uses_shared_resources,
        auto_confirm_appointments: !!settings.auto_confirm_appointments,
        reminders_enabled: !!settings.reminders_enabled,
        reminder_time: settings.reminder_time || '08:00',
    });

    const updateField = (key, value) => setData((prev) => ({ ...prev, [key]: value }));

    const steps = useMemo(() => {
        const defs = [
            {
                id: 'rules',
                label: t('onboarding.admin.step_rules_title'),
                description: t('onboarding.admin.step_rules_sub'),
                icon: 'rule',
            },
            ...(whatsappEnabled
                ? [
                      {
                          id: 'client',
                          label: t('onboarding.admin.step_client_title'),
                          description: t('onboarding.admin.step_client_sub'),
                          icon: 'badge',
                      },
                  ]
                : []),
            {
                id: 'automation',
                label: t('onboarding.admin.step_automation_title'),
                description: t('onboarding.admin.step_automation_sub'),
                icon: 'notifications_active',
            },
            {
                id: 'operations',
                label: t('onboarding.admin.step_operations_title'),
                description: t('onboarding.admin.step_operations_sub'),
                icon: 'tune',
            },
        ];

        return defs.map((step, idx) => ({
            ...step,
            eyebrow: t('onboarding.shared.step_label', { current: idx + 1, total: defs.length }),
        }));
    }, [t, whatsappEnabled]);

    const currentStepId = steps[stepIndex]?.id;

    const isLastStep = stepIndex === steps.length - 1;

    const persist = (onSuccess) => {
        setProcessing(true);
        router.patch(route('onboarding.business_settings'), data, {
            preserveScroll: true,
            preserveState: true,
            onSuccess: () => onSuccess?.(),
            onFinish: () => setProcessing(false),
        });
    };

    const handleContinue = () => {
        if (processing) return;
        if (isLastStep) {
            persist(() => {
                setProcessing(true);
                router.post(
                    route('onboarding.complete'),
                    {},
                    {
                        onFinish: () => setProcessing(false),
                    },
                );
            });
            return;
        }

        persist(() => setStepIndex((idx) => Math.min(idx + 1, steps.length - 1)));
    };

    const handleBack = () => setStepIndex((idx) => Math.max(idx - 1, 0));
    const handleStepJump = (idx) => setStepIndex(idx);

    return (
        <>
        <OnboardingShell
            eyebrow={t('onboarding.shared.eyebrow')}
            heroTitle={t('onboarding.admin.hero_title')}
            heroSubtitle={t('onboarding.admin.hero_subtitle')}
            steps={steps}
            currentStep={stepIndex}
            onStepClick={handleStepJump}
            onBack={handleBack}
            onContinue={handleContinue}
            isLastStep={isLastStep}
            isProcessing={processing}
        >
            <Head title={t('onboarding.shared.head_title')} />

            {currentStepId === 'rules' && (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                    <NumberCard
                        title={t('onboarding.admin.slot_duration_title')}
                        help={t('onboarding.admin.slot_duration_help')}
                        value={data.slot_duration}
                        onChange={(v) => updateField('slot_duration', Number.isFinite(v) ? v : 30)}
                        min={5}
                        max={240}
                        unit={t('onboarding.admin.unit_min')}
                        errorMessage={errors?.slot_duration}
                    />
                    <NumberCard
                        title={t('onboarding.admin.min_notice_title')}
                        help={t('onboarding.admin.min_notice_help')}
                        value={data.min_booking_notice}
                        onChange={(v) => updateField('min_booking_notice', Number.isFinite(v) ? v : 0)}
                        min={0}
                        max={43200}
                        unit={t('onboarding.admin.unit_min')}
                        errorMessage={errors?.min_booking_notice}
                    />
                    <NumberCard
                        title={t('onboarding.admin.booking_window_title')}
                        help={t('onboarding.admin.booking_window_help')}
                        value={data.max_booking_window}
                        onChange={(v) => updateField('max_booking_window', Number.isFinite(v) ? v : 1)}
                        min={1}
                        max={365}
                        unit={t('onboarding.admin.unit_days')}
                        errorMessage={errors?.max_booking_window}
                    />
                </div>
            )}

            {currentStepId === 'client' && (
                <SegmentedChoice
                    value={data.client_identifier_type}
                    onChange={(value) => updateField('client_identifier_type', value)}
                    options={[
                        {
                            value: 'phone',
                            icon: 'phone',
                            label: t('onboarding.admin.client_phone'),
                            description: t('onboarding.admin.client_phone_desc'),
                        },
                        {
                            value: 'email',
                            icon: 'mail',
                            label: t('onboarding.admin.client_email'),
                            description: t('onboarding.admin.client_email_desc'),
                        },
                    ]}
                />
            )}

            {currentStepId === 'automation' && (
                <div className="space-y-4">
                    <ToggleCard
                        icon="task_alt"
                        title={t('onboarding.admin.auto_confirm_title')}
                        help={t('onboarding.admin.auto_confirm_help')}
                        label={t('onboarding.admin.auto_confirm_label')}
                        value={data.auto_confirm_appointments}
                        onChange={(v) => updateField('auto_confirm_appointments', v)}
                    />
                    <ToggleCard
                        icon="alarm"
                        title={t(
                            data.client_identifier_type === 'phone'
                                ? 'onboarding.admin.reminders_title_phone'
                                : 'onboarding.admin.reminders_title_email',
                        )}
                        help={t(
                            data.client_identifier_type === 'phone'
                                ? 'onboarding.admin.reminders_help_phone'
                                : 'onboarding.admin.reminders_help_email',
                        )}
                        label={t(
                            data.client_identifier_type === 'phone'
                                ? 'onboarding.admin.reminders_label_phone'
                                : 'onboarding.admin.reminders_label_email',
                        )}
                        value={data.reminders_enabled}
                        onChange={(v) => updateField('reminders_enabled', v)}
                    >
                        {data.reminders_enabled && (
                            <div className="mt-4 flex flex-wrap items-center gap-3">
                                <label
                                    htmlFor="onboarding_reminder_time"
                                    className="text-xs font-bold uppercase tracking-widest text-on-surface-variant"
                                >
                                    {t('onboarding.admin.reminder_time_label')}
                                </label>
                                <input
                                    id="onboarding_reminder_time"
                                    type="time"
                                    value={data.reminder_time}
                                    onChange={(e) => updateField('reminder_time', e.target.value)}
                                    className="border-0 rounded-xl py-3 px-4 text-base font-extrabold text-on-surface bg-surface-container-lowest ring-1 ring-outline-variant focus:outline-none focus:ring-2 focus:ring-on-surface/20 transition-shadow"
                                />
                            </div>
                        )}
                        {errors?.reminder_time && (
                            <p className="mt-2 text-xs font-medium text-error">{errors.reminder_time}</p>
                        )}
                    </ToggleCard>
                </div>
            )}

            {currentStepId === 'operations' && (
                <div className="space-y-4">
                    <ToggleCard
                        icon="person"
                        title={t('onboarding.admin.step_solo_title')}
                        help={t('onboarding.admin.step_solo_sub')}
                        label={t('onboarding.admin.solo_toggle_label')}
                        value={data.single_employee_mode}
                        onChange={(v) => {
                            setData((prev) => ({
                                ...prev,
                                single_employee_mode: v,
                                owner_also_works_as_staff: v ? true : prev.owner_also_works_as_staff,
                            }));
                        }}
                        errorMessage={errors?.single_employee_mode}
                    />
                    <ToggleCard
                        icon="workspaces"
                        title={t('onboarding.admin.step_staff_title')}
                        help={t('onboarding.admin.step_staff_sub')}
                        label={t('onboarding.admin.staff_toggle_label')}
                        value={data.owner_also_works_as_staff}
                        onChange={(v) => {
                            if (data.single_employee_mode && !v) {
                                setStaffLockedNotice(true);
                                return;
                            }
                            updateField('owner_also_works_as_staff', v);
                        }}
                    />
                    <ToggleCard
                        icon="edit"
                        title={t('onboarding.admin.step_service_title')}
                        help={t('onboarding.admin.service_edit_help')}
                        label={t('onboarding.admin.service_edit_label')}
                        value={data.allow_employee_service_edit}
                        onChange={(v) => updateField('allow_employee_service_edit', v)}
                    />
                    <ToggleCard
                        icon="meeting_room"
                        title={t('onboarding.admin.step_resources_title')}
                        help={t('onboarding.admin.resources_help')}
                        label={t('onboarding.admin.resources_label')}
                        value={data.uses_shared_resources}
                        onChange={(v) => updateField('uses_shared_resources', v)}
                    />
                </div>
            )}
        </OnboardingShell>
            <NoticeModal
                show={staffLockedNotice}
                title={t('onboarding.admin.staff_locked_title')}
                body={t('onboarding.admin.staff_locked_body')}
                onClose={() => setStaffLockedNotice(false)}
            />
        </>
    );
}
