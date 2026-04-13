import Icon from '@/Components/Icon';

export default function MetricCard({ icon, iconBg, iconClass, label, value, badge, variant = 'default' }) {
    if (variant === 'primary') {
        return (
            <div className="relative flex min-h-[7.25rem] flex-col justify-between overflow-hidden rounded-xl bg-primary-container p-3 shadow-xl transition-transform duration-300 hover:-translate-y-1 sm:min-h-0 sm:h-48 sm:p-8">
                <div className="absolute top-0 right-0 h-24 w-24 rounded-full bg-white/5 blur-3xl sm:h-32 sm:w-32 -mr-12 -mt-12 sm:-mr-16 sm:-mt-16" />
                <div className="z-10 flex items-start justify-between gap-1">
                    <span className="rounded-lg bg-on-primary-container/20 p-2 sm:p-3">
                        <Icon name={icon} size="text-lg" className={`text-on-primary-container sm:text-xl`} />
                    </span>
                    <Icon name="trending_up" size="text-lg" className="shrink-0 text-on-primary-container sm:text-xl" />
                </div>
                <div className="z-10 min-w-0">
                    <p className="mb-0.5 text-[10px] font-bold uppercase tracking-wider text-on-primary-container/80 sm:mb-1 sm:text-xs sm:tracking-widest">
                        {label}
                    </p>
                    <h3 className="break-words text-xl font-extrabold leading-tight tracking-tight text-white font-headline sm:text-4xl">
                        {value}
                    </h3>
                    {badge && <p className="mt-0.5 text-[10px] text-on-primary-container/70 sm:mt-1 sm:text-xs">{badge}</p>}
                </div>
            </div>
        );
    }

    return (
        <div className="flex min-h-[7.25rem] flex-col justify-between rounded-xl bg-surface-container-lowest p-3 transition-transform duration-300 hover:-translate-y-1 sm:min-h-0 sm:h-48 sm:p-8">
            <div className="flex items-start justify-between gap-1">
                <span className={`rounded-lg p-2 sm:p-3 ${iconBg}`}>
                    <Icon name={icon} size="text-lg" className={`${iconClass ?? ''} sm:text-xl`.trim()} />
                </span>
                {badge ? (
                    <span className="max-w-[4.5rem] shrink-0 truncate text-[10px] font-bold text-on-surface-variant bg-surface-container-highest px-1.5 py-0.5 text-center rounded-full sm:max-w-none sm:px-2 sm:py-1 sm:text-xs">
                        {badge}
                    </span>
                ) : null}
            </div>
            <div className="min-w-0">
                <p className="mb-0.5 text-[10px] font-bold uppercase tracking-wider text-on-surface-variant sm:mb-1 sm:text-xs sm:tracking-widest">
                    {label}
                </p>
                <h3 className="text-2xl font-extrabold leading-none tracking-tight text-on-surface font-headline sm:text-4xl">{value}</h3>
            </div>
        </div>
    );
}
