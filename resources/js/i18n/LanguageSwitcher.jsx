import { router, usePage } from '@inertiajs/react';
import { useT } from '@/i18n/useT';

export default function LanguageSwitcher({ className = '', compact = false }) {
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
            className={`inline-flex items-center rounded-full border border-outline-variant bg-surface-container-lowest shadow-sm ${
                compact
                    ? 'gap-0.5 px-1.5 py-0.5'
                    : 'gap-1 px-2 py-1 sm:px-2 sm:py-1'
            } ${className}`}
        >
            {options.map((opt, idx) => {
                const isActive = locale === opt.code;
                return (
                    <div key={opt.code} className="flex items-center">
                        {idx > 0 && (
                            <span
                                aria-hidden="true"
                                className={
                                    compact
                                        ? 'mx-0.5 h-2.5 w-px bg-outline-variant'
                                        : 'mx-1 h-3 w-px bg-outline-variant sm:h-3.5'
                                }
                            />
                        )}
                        <button
                            type="button"
                            role="tab"
                            aria-selected={isActive}
                            onClick={() => switchTo(opt.code)}
                            className={`relative rounded font-bold tracking-wide transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-surface-tint/40 ${
                                compact
                                    ? 'px-1.5 py-0 text-[9px] sm:text-[10px]'
                                    : 'px-2 py-0.5 text-[10px] sm:text-xs'
                            } ${
                                isActive
                                    ? 'text-surface-tint'
                                    : 'text-on-surface-variant hover:text-on-surface'
                            }`}
                        >
                            {opt.label}
                            <span
                                aria-hidden="true"
                                className={`pointer-events-none absolute -bottom-0.5 rounded-full bg-surface-tint transition-opacity duration-200 ${
                                    compact ? 'left-1 right-1 h-px' : 'left-1.5 right-1.5 h-0.5'
                                } ${isActive ? 'opacity-100' : 'opacity-0'}`}
                            />
                        </button>
                    </div>
                );
            })}
        </div>
    );
}
