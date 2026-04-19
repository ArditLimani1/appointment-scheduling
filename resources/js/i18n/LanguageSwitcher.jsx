import { router, usePage } from '@inertiajs/react';
import { useT } from '@/i18n/useT';

export default function LanguageSwitcher({ className = '' }) {
    const { locale, availableLocales } = usePage().props;
    const t = useT();

    return (
        <label className={`inline-flex items-center gap-2 ${className}`}>
            <span className="sr-only">{t('common.language')}</span>
            <select
                value={locale}
                onChange={(e) => {
                    const next = e.target.value;
                    router.post(
                        route('locale.update'),
                        { locale: next },
                        { preserveScroll: true, preserveState: false },
                    );
                }}
                className="rounded-lg border border-outline-variant bg-surface px-2 py-1 text-xs font-semibold text-on-surface"
            >
                {(availableLocales ?? []).map((item) => (
                    <option key={item.code} value={item.code}>
                        {item.native}
                    </option>
                ))}
            </select>
        </label>
    );
}
