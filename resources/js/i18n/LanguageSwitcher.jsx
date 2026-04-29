import { router, usePage } from '@inertiajs/react';
import { useT } from '@/i18n/useT';

export default function LanguageSwitcher({ className = '' }) {
    const { locale } = usePage().props;
    const t = useT();

    const switchTo = (next) => {
        if (next === locale) return;
        router.post(
            route('locale.update'),
            { locale: next },
            { preserveScroll: true, preserveState: false },
        );
    };

    const options = [
        { code: 'en', label: 'EN' },
        { code: 'sq', label: 'AL' },
    ];

    return (
        <div
            role="tablist"
            aria-label={t('common.language')}
            className={`inline-flex items-center gap-1 rounded-full border border-outline-variant bg-surface-container-lowest px-2 py-1 shadow-sm sm:px-2 sm:py-1 ${className}`}
        >
            {options.map((opt, idx) => {
                const isActive = locale === opt.code;
                return (
                    <div key={opt.code} className="flex items-center">
                        {idx > 0 && (
                            <span
                                aria-hidden="true"
                                className="mx-1 h-3 w-px bg-outline-variant sm:h-3.5"
                            />
                        )}
                        <button
                            type="button"
                            role="tab"
                            aria-selected={isActive}
                            onClick={() => switchTo(opt.code)}
                            className={`relative rounded px-2 py-0.5 text-[10px] font-bold tracking-wide transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-surface-tint/40 sm:text-xs ${
                                isActive
                                    ? 'text-surface-tint'
                                    : 'text-on-surface-variant hover:text-on-surface'
                            }`}
                        >
                            {opt.label}
                            <span
                                aria-hidden="true"
                                className={`pointer-events-none absolute -bottom-0.5 left-1.5 right-1.5 h-0.5 rounded-full bg-surface-tint transition-opacity duration-200 ${
                                    isActive ? 'opacity-100' : 'opacity-0'
                                }`}
                            />
                        </button>
                    </div>
                );
            })}
        </div>
    );
}
