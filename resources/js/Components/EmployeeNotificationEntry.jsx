import Icon from '@/Components/Icon';
import { useT } from '@/i18n/useT';
import { formatNotificationDateLine, formatServiceLine, sourceTranslationKey } from '@/utils/employeeNotifications';
import { Link, usePage } from '@inertiajs/react';

/**
 * @param {object} props
 * @param {{ id: string, readAt?: string|null, isBooking: boolean, data: object }} props.item
 * @param {(dateYmd: string|null) => string} props.appointmentHrefFor
 * @param {(id: string, readAt?: string|null) => void} [props.onBeforeBookingNavigate]
 */
export default function EmployeeNotificationEntry({ item, appointmentHrefFor, onBeforeBookingNavigate }) {
    const t = useT();
    const { localeBcp47 } = usePage().props;

    if (!item.isBooking) {
        const genericUnread = !item.readAt;
        return (
            <li className="rounded-lg border border-outline-variant/40 bg-surface-container-lowest p-2.5 shadow-sm">
                <div className="flex gap-2">
                    <div
                        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-md ${
                            genericUnread
                                ? 'bg-on-surface text-surface shadow-sm'
                                : 'bg-surface-container-high text-on-surface-variant'
                        }`}
                    >
                        <Icon name="notifications" size="text-lg" filled={genericUnread} />
                    </div>
                    <p className="min-w-0 flex-1 self-center text-xs leading-snug text-on-surface-variant">
                        {t('employee.notifications.generic')}
                    </p>
                </div>
            </li>
        );
    }

    const { data } = item;
    const href = appointmentHrefFor(data.date ?? null);
    const servicesText = formatServiceLine(data.services);
    const isUnread = !item.readAt;
    const startT = data.start_time ?? '';
    const endT = data.end_time ?? '';
    const timeOnly = startT && endT ? `${startT} – ${endT}` : [startT, endT].filter(Boolean).join(' – ');
    const dateLabel = data.date ? formatNotificationDateLine(data.date, localeBcp47) : '';
    const whenLine = [dateLabel, timeOnly].filter(Boolean).join(' · ');
    const clientAndService = [data.client_name, servicesText].filter(Boolean).join(' - ');

    return (
        <li>
            <Link
                href={href}
                onClick={() => onBeforeBookingNavigate?.(item.id, item.readAt)}
                className="block rounded-lg border border-outline-variant/40 bg-surface-container-lowest p-2.5 shadow-sm transition hover:border-outline-variant/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-on-primary-container/25"
            >
                <div className="flex gap-2">
                    <div
                        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-md ${
                            isUnread
                                ? 'bg-on-surface text-surface shadow-sm'
                                : 'bg-surface-container-high text-on-surface-variant'
                        }`}
                    >
                        <Icon name="calendar_month" size="text-lg" filled={isUnread} />
                    </div>
                    <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold leading-tight text-on-surface">{t('employee.notifications.new_booking_title')}</p>
                        {clientAndService ? (
                            <p className="mt-0.5 line-clamp-2 text-xs font-semibold leading-snug text-on-surface">{clientAndService}</p>
                        ) : null}
                        {whenLine ? (
                            <p className="mt-0.5 text-[11px] leading-snug text-on-surface-variant">{whenLine}</p>
                        ) : null}

                        <div className="mt-1.5 flex flex-wrap items-center justify-between gap-1.5 border-t border-outline-variant/15 pt-1.5">
                            <span className="inline-flex max-w-[min(100%,12rem)] truncate rounded-full bg-primary-fixed px-2 py-0.5 text-[9px] font-bold uppercase leading-none tracking-wide text-on-primary-fixed-variant">
                                {t(sourceTranslationKey(data.source))}
                            </span>
                            <span className="inline-flex shrink-0 items-center gap-0.5 text-[11px] font-semibold text-on-primary-container">
                                {t('employee.notifications.view_cta')}
                                <Icon name="chevron_right" size="text-[14px]" className="opacity-90" />
                            </span>
                        </div>
                    </div>
                </div>
            </Link>
        </li>
    );
}
