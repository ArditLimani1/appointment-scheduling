import { useT } from '@/i18n/useT';
import Icon from '@/Components/Icon';

export const APPOINTMENT_SCOPE_UPCOMING = 'upcoming';
export const APPOINTMENT_SCOPE_ALL = 'all';

export function normalizeAppointmentScope(raw) {
    return raw === APPOINTMENT_SCOPE_ALL ? APPOINTMENT_SCOPE_ALL : APPOINTMENT_SCOPE_UPCOMING;
}

/**
 * Segmented switch between "only what is still ahead" and the full history.
 * `translationRoot` is the lang group holding `scope`, `scope_upcoming`, `scope_all`
 * (e.g. `admin.appointments` or `employee.appointments`).
 */
export default function AppointmentScopeToggle({ value, onChange, translationRoot, className = '' }) {
    const t = useT();
    const active = normalizeAppointmentScope(value);

    const options = [
        { value: APPOINTMENT_SCOPE_UPCOMING, label: t(`${translationRoot}.scope_upcoming`), icon: 'schedule' },
        { value: APPOINTMENT_SCOPE_ALL, label: t(`${translationRoot}.scope_all`), icon: 'history' },
    ];

    return (
        <div className={`flex w-full min-w-0 flex-col gap-1.5 ${className}`}>
            <span className="text-xs font-semibold text-on-surface-variant">{t(`${translationRoot}.scope`)}</span>
            <div
                role="group"
                className="grid grid-cols-2 gap-1 rounded-xl bg-surface-container-high p-1"
            >
                {options.map((option) => {
                    const isActive = option.value === active;
                    return (
                        <button
                            key={option.value}
                            type="button"
                            aria-pressed={isActive}
                            onClick={() => {
                                if (!isActive) {
                                    onChange(option.value);
                                }
                            }}
                            className={`inline-flex min-h-[2.25rem] min-w-0 items-center justify-center gap-1.5 rounded-lg px-2 text-xs font-bold transition-colors ${
                                isActive
                                    ? 'bg-white text-on-surface shadow-sm ring-1 ring-slate-200'
                                    : 'text-on-surface-variant hover:bg-white/60'
                            }`}
                        >
                            <Icon name={option.icon} size="text-sm" className="shrink-0" />
                            <span className="truncate">{option.label}</span>
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
