import Icon from '@/Components/Icon';

export default function MetricCard({ icon, iconBg, iconClass, label, value, badge, variant = 'default' }) {
    if (variant === 'primary') {
        return (
            <div className="bg-primary-container p-8 rounded-xl flex flex-col justify-between h-48 relative overflow-hidden hover:-translate-y-1 transition-transform duration-300 shadow-xl">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 blur-3xl" />
                <div className="flex justify-between items-start z-10">
                    <span className="p-3 bg-on-primary-container/20 rounded-lg">
                        <Icon name={icon} size="text-xl" className="text-on-primary-container" />
                    </span>
                    <Icon name="trending_up" size="text-xl" className="text-on-primary-container" />
                </div>
                <div className="z-10">
                    <p className="text-xs font-bold text-on-primary-container/80 uppercase tracking-widest mb-1">{label}</p>
                    <h3 className="text-4xl font-extrabold font-headline text-white">{value}</h3>
                    {badge && <p className="text-xs text-on-primary-container/70 mt-1">{badge}</p>}
                </div>
            </div>
        );
    }

    return (
        <div className="bg-surface-container-lowest p-8 rounded-xl flex flex-col justify-between h-48 hover:-translate-y-1 transition-transform duration-300">
            <div className="flex justify-between items-start">
                <span className={`p-3 ${iconBg} rounded-lg`}>
                    <Icon name={icon} size="text-xl" className={iconClass} />
                </span>
                <span className="text-xs font-bold text-on-surface-variant bg-surface-container-highest px-2 py-1 rounded-full">
                    {badge}
                </span>
            </div>
            <div>
                <p className="text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-1">{label}</p>
                <h3 className="text-4xl font-extrabold font-headline text-on-surface">{value}</h3>
            </div>
        </div>
    );
}
