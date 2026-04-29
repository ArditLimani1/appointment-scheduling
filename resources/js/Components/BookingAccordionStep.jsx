import Icon from '@/Components/Icon';

/**
 * Accordion step used on the public booking page and the internal create-appointment flow
 * so both share the same visual language.
 */
export default function BookingAccordionStep({
    id,
    number,
    title,
    summary,
    expanded,
    onHeaderClick,
    headerDisabled,
    children,
    containerRef,
}) {
    return (
        <div
            ref={containerRef}
            className={`rounded-2xl border transition-shadow ${
                expanded
                    ? 'border-outline-variant shadow-sm bg-surface-container-lowest overflow-visible'
                    : 'border-outline-variant/50 bg-surface-container-lowest/70 overflow-hidden'
            }`}
        >
            <button
                type="button"
                aria-expanded={expanded}
                disabled={headerDisabled}
                onClick={() => {
                    if (!headerDisabled) {
                        onHeaderClick(id);
                    }
                }}
                className={`flex min-h-[4.5rem] w-full items-center gap-4 px-5 py-4 text-left sm:px-6 sm:py-5 ${
                    headerDisabled ? 'cursor-not-allowed opacity-45' : 'hover:bg-surface-container-low/50'
                }`}
            >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-on-surface text-sm font-bold text-surface">
                    {number}
                </span>
                <div className="min-w-0 flex-1">
                    <h2 className="font-headline text-lg font-bold tracking-tight text-on-surface sm:text-xl">{title}</h2>
                    {!expanded && summary ? (
                        <p className="mt-1 truncate text-sm text-on-surface-variant">{summary}</p>
                    ) : null}
                </div>
                <Icon
                    name={expanded ? 'expand_less' : 'expand_more'}
                    className={headerDisabled ? 'shrink-0 text-outline' : 'shrink-0 text-on-surface-variant'}
                    size="text-2xl"
                />
            </button>
            {expanded ? (
                <div className="border-t border-outline-variant/25 px-5 pb-5 pt-1 sm:px-6 sm:pb-6">
                    {children}
                </div>
            ) : null}
        </div>
    );
}
