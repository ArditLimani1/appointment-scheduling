import { Head, Link } from '@inertiajs/react';
import Icon from '@/Components/Icon';
import NiterminLogo from '@/Components/NiterminLogo';
import LanguageSwitcher from '@/i18n/LanguageSwitcher';
import { useT } from '@/i18n/useT';

const analyticsBarsHeights = ['h-20', 'h-28', 'h-24', 'h-36', 'h-32', 'h-16'];

export default function Welcome({ auth, canLogin, canRegister }) {
    const t = useT();

    const highlights = [
        { icon: 'public',              title: t('welcome.highlight_1_title'), description: t('welcome.highlight_1_desc') },
        { icon: 'group',               title: t('welcome.highlight_2_title'), description: t('welcome.highlight_2_desc') },
        { icon: 'dashboard',           title: t('welcome.highlight_3_title'), description: t('welcome.highlight_3_desc') },
        { icon: 'event_available',     title: t('welcome.highlight_4_title'), description: t('welcome.highlight_4_desc') },
        { icon: 'monitoring',          title: t('welcome.highlight_5_title'), description: t('welcome.highlight_5_desc') },
        { icon: 'admin_panel_settings',title: t('welcome.highlight_6_title'), description: t('welcome.highlight_6_desc') },
    ];

    const steps = [
        { number: '1', title: t('welcome.step_1_title'), description: t('welcome.step_1_desc') },
        { number: '2', title: t('welcome.step_2_title'), description: t('welcome.step_2_desc') },
        { number: '3', title: t('welcome.step_3_title'), description: t('welcome.step_3_desc') },
    ];

    const dashboardMetrics = [
        { label: t('welcome.metric_workers'),  value: '4' },
        { label: t('welcome.metric_services'), value: '5' },
        { label: t('welcome.metric_window'),   value: t('welcome.metric_window_value') },
        { label: t('welcome.metric_notice'),   value: t('welcome.metric_notice_value') },
    ];

    const bookingMoments = [
        t('welcome.booking_step_1'),
        t('welcome.booking_step_2'),
        t('welcome.booking_step_3'),
        t('welcome.booking_step_4'),
    ];

    const analyticsBars = [
        { label: t('welcome.day_mon'), height: analyticsBarsHeights[0] },
        { label: t('welcome.day_tue'), height: analyticsBarsHeights[1] },
        { label: t('welcome.day_wed'), height: analyticsBarsHeights[2] },
        { label: t('welcome.day_thu'), height: analyticsBarsHeights[3] },
        { label: t('welcome.day_fri'), height: analyticsBarsHeights[4] },
        { label: t('welcome.day_sat'), height: analyticsBarsHeights[5] },
    ];

    const adminShowcase = [
        {
            icon: 'dashboard',
            eyebrow: 'Dashboard',
            title: t('welcome.showcase_1_title'),
            description: t('welcome.showcase_1_desc'),
            accent: t('welcome.showcase_1_accent'),
        },
        {
            icon: 'inventory_2',
            eyebrow: 'Services',
            title: t('welcome.showcase_2_title'),
            description: t('welcome.showcase_2_desc'),
            accent: t('welcome.showcase_2_accent'),
        },
        {
            icon: 'badge',
            eyebrow: 'Employees',
            title: t('welcome.showcase_3_title'),
            description: t('welcome.showcase_3_desc'),
            accent: t('welcome.showcase_3_accent'),
        },
        {
            icon: 'key',
            eyebrow: 'Roles',
            title: t('welcome.showcase_4_title'),
            description: t('welcome.showcase_4_desc'),
            accent: t('welcome.showcase_4_accent'),
        },
        {
            icon: 'calendar_month',
            eyebrow: 'Appointments',
            title: t('welcome.showcase_5_title'),
            description: t('welcome.showcase_5_desc'),
            accent: t('welcome.showcase_5_accent'),
        },
        {
            icon: 'monitoring',
            eyebrow: 'Analytics',
            title: t('welcome.showcase_6_title'),
            description: t('welcome.showcase_6_desc'),
            accent: t('welcome.showcase_6_accent'),
        },
    ];

    return (
        <div className="min-h-screen bg-surface font-body">
            <Head title={t('welcome.meta_title')} />

            <header className="glass-header sticky top-0 z-30 border-b border-outline-variant">
                <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
                    <Link href="/" className="flex items-center gap-3">
                        <NiterminLogo
                            markClassName="h-9 w-9 text-on-surface"
                            wordClassName="text-lg font-semibold tracking-tight text-on-surface"
                            dotClassName="text-on-surface-variant"
                        />
                    </Link>

                    <nav className="flex items-center gap-1.5 sm:gap-2">
                        <LanguageSwitcher className="ml-2 sm:ml-0" />
                        {auth?.user ? (
                            <Link
                                href={route('dashboard')}
                                className="primary-gradient flex items-center gap-1.5 whitespace-nowrap rounded-xl px-3 py-1.5 text-xs font-semibold text-white shadow-sm sm:px-4 sm:py-2 sm:text-sm"
                            >
                                <Icon name="dashboard" size="text-base" />
                                {t('welcome.nav_dashboard')}
                            </Link>
                        ) : (
                            <>
                                {canLogin && (
                                    <Link
                                        href={route('login')}
                                        className="rounded-xl px-3 py-1.5 text-xs font-medium text-on-surface-variant transition-colors hover:bg-surface-container-low sm:px-4 sm:py-2 sm:text-sm"
                                    >
                                        {t('welcome.nav_login')}
                                    </Link>
                                )}
                                {canRegister && (
                                    <Link
                                        href={route('register')}
                                        className="primary-gradient -ml-1 whitespace-nowrap rounded-xl px-3 py-1.5 text-xs font-semibold text-white shadow-sm sm:ml-0 sm:px-4 sm:py-2 sm:text-sm"
                                    >
                                        {t('welcome.nav_register')}
                                    </Link>
                                )}
                            </>
                        )}
                    </nav>
                </div>
            </header>

            <section className="relative overflow-hidden">
                <div
                    className="absolute inset-0 -z-10 opacity-[0.05]"
                    style={{ backgroundImage: 'radial-gradient(circle, #001d31 1px, transparent 1px)', backgroundSize: '28px 28px' }}
                />
                <div className="absolute inset-x-0 top-0 -z-10 h-64 bg-gradient-to-b from-primary-container/55 to-transparent" />

                <div className="mx-auto grid max-w-6xl gap-12 px-6 py-16 lg:grid-cols-[1.1fr_0.9fr] lg:items-center lg:py-24">
                    <div>
                        <span className="mb-6 inline-flex items-center gap-2 rounded-full border border-outline-variant bg-surface-container-lowest px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-on-surface-variant">
                            <Icon name="bolt" size="text-sm" className="text-primary" />
                            {t('welcome.hero_badge')}
                        </span>

                        <h1 className="max-w-3xl text-5xl font-black font-headline leading-[1.02] tracking-tight text-on-surface sm:text-6xl lg:text-7xl">
                            {t('welcome.hero_h1_line1')}
                            <span className="block text-primary">{t('welcome.hero_h1_highlight')}</span>
                            {t('welcome.hero_h1_line2')}
                        </h1>

                        <p className="mt-6 max-w-2xl text-lg leading-relaxed text-on-surface-variant sm:text-xl">
                            <span className="font-semibold text-on-surface">Ni</span>{' '}
                            {t('welcome.hero_desc_ni_meaning')}{' '}
                            <span className="font-semibold text-on-surface">Termin</span>{' '}
                            {t('welcome.hero_desc_termin_meaning')}{' '}
                            {t('welcome.hero_desc_rest')}
                        </p>

                        <div className="mt-10 flex flex-col gap-3 sm:flex-row">
                            {canRegister && (
                                <Link
                                    href={route('register')}
                                    className="primary-gradient inline-flex items-center justify-center gap-2 rounded-2xl px-8 py-4 text-base font-semibold text-white shadow-lg transition-transform hover:scale-[1.02]"
                                >
                                    {t('welcome.hero_cta_register')}
                                    <Icon name="arrow_forward" size="text-lg" />
                                </Link>
                            )}

                            {canLogin && (
                                <Link
                                    href={route('login')}
                                    className="inline-flex items-center justify-center gap-2 rounded-2xl border border-outline-variant px-8 py-4 text-base font-medium text-on-surface transition-colors hover:bg-surface-container-low"
                                >
                                    {t('welcome.hero_cta_login')}
                                </Link>
                            )}
                        </div>

                        <div className="mt-4 flex flex-wrap items-center gap-3">
                            <span className="inline-flex items-center gap-2 rounded-full border border-primary/15 bg-primary/10 px-4 py-2 text-sm font-semibold text-primary">
                                <Icon name="redeem" size="text-sm" />
                                {t('welcome.hero_trial_badge')}
                            </span>
                            <span className="text-sm text-on-surface-variant">
                                {t('welcome.hero_trial_text')}
                            </span>
                        </div>

                        <div className="mt-8 flex flex-wrap gap-3 text-sm text-on-surface-variant">
                            <span className="rounded-full bg-surface-container-low px-4 py-2">{t('welcome.hero_tag_1')}</span>
                            <span className="rounded-full bg-surface-container-low px-4 py-2">{t('welcome.hero_tag_2')}</span>
                            <span className="rounded-full bg-surface-container-low px-4 py-2">{t('welcome.hero_tag_3')}</span>
                        </div>
                    </div>

                    <div className="relative">
                        <div className="absolute -left-6 top-10 hidden h-24 w-24 rounded-full bg-primary-container/60 blur-2xl lg:block" />
                        <div className="absolute -right-4 bottom-10 hidden h-28 w-28 rounded-full bg-secondary-container/60 blur-2xl lg:block" />

                        <div className="relative overflow-hidden rounded-[2rem] border border-outline-variant bg-surface-container-lowest shadow-2xl">
                            <div className="border-b border-outline-variant bg-surface-container px-5 py-4">
                                <div className="flex items-center justify-between gap-4">
                                    <div className="flex items-center gap-3">
                                        <NiterminLogo
                                            variant="mark"
                                            className="h-10 w-10 rounded-2xl bg-surface p-2 text-on-surface"
                                        />
                                        <div>
                                            <p className="text-sm font-bold font-headline text-on-surface">{t('welcome.card_admin_title')}</p>
                                            <p className="text-xs text-on-surface-variant">{t('welcome.card_admin_subtitle')}</p>
                                        </div>
                                    </div>
                                    <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                                        <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                                        {t('welcome.card_live_badge')}
                                    </span>
                                </div>
                            </div>

                            <div className="space-y-6 p-6">
                                <div className="grid grid-cols-2 gap-3">
                                    {dashboardMetrics.map((metric) => (
                                        <div key={metric.label} className="rounded-2xl border border-outline-variant bg-surface p-4">
                                            <p className="text-xs uppercase tracking-[0.2em] text-on-surface-variant">{metric.label}</p>
                                            <p className="mt-2 text-2xl font-black font-headline text-on-surface">{metric.value}</p>
                                        </div>
                                    ))}
                                </div>

                                <div className="rounded-3xl border border-outline-variant bg-surface p-5">
                                    <div className="mb-4 flex items-center justify-between">
                                        <div>
                                            <p className="text-sm font-bold font-headline text-on-surface">{t('welcome.card_flow_title')}</p>
                                            <p className="text-xs text-on-surface-variant">{t('welcome.card_flow_subtitle')}</p>
                                        </div>
                                        <Icon name="north_east" size="text-lg" className="text-primary" />
                                    </div>

                                    <div className="space-y-3">
                                        {bookingMoments.map((moment, index) => (
                                            <div key={moment} className="flex items-center gap-3 rounded-2xl bg-surface-container-low px-4 py-3">
                                                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary-container text-sm font-bold text-white shadow-sm ring-1 ring-primary-container/20">
                                                    {index + 1}
                                                </span>
                                                <span className="text-sm font-medium text-on-surface">{moment}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="rounded-3xl bg-primary p-5 text-white">
                                    <p className="text-xs uppercase tracking-[0.22em] text-white/70">{t('welcome.card_why_eyebrow')}</p>
                                    <p className="mt-2 text-base font-semibold leading-relaxed">
                                        {t('welcome.card_why_text')}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <section className="mx-auto max-w-6xl px-6 py-16">
                <div className="mb-12 max-w-3xl">
                    <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">{t('welcome.features_eyebrow')}</p>
                    <h2 className="mt-3 text-3xl font-black font-headline tracking-tight text-on-surface sm:text-4xl">
                        {t('welcome.features_heading')}
                    </h2>
                    <p className="mt-4 text-base leading-relaxed text-on-surface-variant sm:text-lg">
                        {t('welcome.features_desc')}
                    </p>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {highlights.map((item) => (
                        <div
                            key={item.title}
                            className="group rounded-3xl border border-outline-variant bg-surface-container-lowest p-6 transition-all hover:-translate-y-0.5 hover:border-on-primary-container/30 hover:shadow-md"
                        >
                            <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl border border-on-primary-container/15 bg-on-primary-container/10 text-on-primary-container transition-colors group-hover:bg-on-primary-container/15">
                                <Icon name={item.icon} size="text-xl" />
                            </div>
                            <h3 className="font-bold font-headline text-on-surface">{item.title}</h3>
                            <p className="mt-2 text-sm leading-relaxed text-on-surface-variant">{item.description}</p>
                        </div>
                    ))}
                </div>
            </section>

            <section className="mx-auto max-w-6xl px-6 py-16">
                <div className="mb-12 max-w-3xl">
                    <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">{t('welcome.admin_eyebrow')}</p>
                    <h2 className="mt-3 text-3xl font-black font-headline tracking-tight text-on-surface sm:text-4xl">
                        {t('welcome.admin_heading')}
                    </h2>
                    <p className="mt-4 text-base leading-relaxed text-on-surface-variant sm:text-lg">
                        {t('welcome.admin_desc')}
                    </p>
                </div>

                <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
                    {adminShowcase.map((item, index) => (
                        <div key={item.title} className="rounded-[2rem] border border-outline-variant bg-surface-container-lowest p-6 shadow-sm">
                            <div className="flex items-start justify-between gap-4">
                                <div>
                                    <p className="text-sm font-semibold uppercase tracking-[0.2em] text-on-primary-container">{item.eyebrow}</p>
                                    <h3 className="mt-3 text-2xl font-black font-headline text-on-surface">{item.title}</h3>
                                </div>
                                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-on-primary-container/15 bg-on-primary-container/10 text-on-primary-container">
                                    <Icon name={item.icon} size="text-xl" />
                                </div>
                            </div>

                            <p className="mt-4 text-base leading-relaxed text-on-surface-variant">{item.description}</p>

                            <div className="mt-6 rounded-[1.5rem] border border-outline-variant bg-surface p-5">
                                <div className="mb-4 flex items-center justify-between">
                                    <p className="text-sm font-bold font-headline text-on-surface">{item.eyebrow}</p>
                                    <span className="rounded-full bg-surface-container-low px-3 py-1 text-xs font-semibold text-on-surface-variant">
                                        {item.accent}
                                    </span>
                                </div>

                                {index === 0 && (
                                    <div className="space-y-3">
                                        <div className="grid grid-cols-2 gap-3">
                                            {dashboardMetrics.map((metric) => (
                                                <div key={metric.label} className="rounded-2xl bg-surface-container-low px-4 py-3">
                                                    <p className="text-[11px] uppercase tracking-[0.18em] text-on-surface-variant">{metric.label}</p>
                                                    <p className="mt-1 text-xl font-black font-headline text-on-surface">{metric.value}</p>
                                                </div>
                                            ))}
                                        </div>
                                        <div className="rounded-2xl bg-surface-container-low px-4 py-4">
                                            <p className="text-sm font-semibold text-on-surface">{t('welcome.metric_overview_title')}</p>
                                            <p className="mt-1 text-xs text-on-surface-variant">{t('welcome.metric_overview_desc')}</p>
                                        </div>
                                    </div>
                                )}

                                {index === 1 && (
                                    <div className="space-y-2">
                                        {[
                                            ['Signature Haircut', '45 min', '45.00 €'],
                                            ['Beard Sculpt', '30 min', '30.00 €'],
                                            ['Color Treatment', '60 min', '85.00 €'],
                                        ].map(([name, duration, price]) => (
                                            <div key={name} className="flex items-center justify-between rounded-2xl bg-surface-container-low px-4 py-3">
                                                <div>
                                                    <p className="text-sm font-semibold text-on-surface">{name}</p>
                                                    <p className="text-xs text-on-surface-variant">{duration}</p>
                                                </div>
                                                <p className="text-sm font-black text-on-surface">{price}</p>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {index === 2 && (
                                    <div className="space-y-2">
                                        {[
                                            ['John', 'Master Barber'],
                                            ['Sarah', 'Senior Stylist'],
                                            ['Elena', 'Color Artist'],
                                        ].map(([name, role]) => (
                                            <div key={name} className="flex items-center justify-between rounded-2xl bg-surface-container-low px-4 py-3">
                                                <div>
                                                    <p className="text-sm font-semibold text-on-surface">{name}</p>
                                                    <p className="text-xs text-on-surface-variant">{role}</p>
                                                </div>
                                                <span className="inline-flex items-center gap-1.5 rounded-full border border-on-primary-container/20 bg-on-primary-container/10 px-3 py-1 text-xs font-semibold text-on-primary-container">
                                                    <span className="h-1.5 w-1.5 rounded-full bg-on-primary-container" />
                                                    {t('welcome.showcase_3_active')}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {index === 3 && (
                                    <div className="space-y-3">
                                        <div className="rounded-2xl bg-surface-container-low px-4 py-4">
                                            <p className="text-sm font-semibold text-on-surface">{t('welcome.showcase_4_roles_title')}</p>
                                            <p className="mt-1 text-xs leading-relaxed text-on-surface-variant">{t('welcome.showcase_4_roles_desc')}</p>
                                        </div>
                                        <div className="flex flex-wrap gap-2">
                                            {['Dashboard', 'Appointments', 'Services', 'Employees', 'Analytics'].map((pill) => (
                                                <span key={pill} className="rounded-full bg-surface-container-low px-3 py-2 text-xs font-semibold text-on-surface">
                                                    {pill}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {index === 4 && (
                                    <div className="space-y-3">
                                        <div className="grid grid-cols-3 gap-2">
                                            {[
                                                t('welcome.showcase_5_filter_worker'),
                                                t('welcome.showcase_5_filter_date'),
                                                t('welcome.showcase_5_filter_status'),
                                            ].map((filter) => (
                                                <div key={filter} className="rounded-2xl bg-surface-container-low px-3 py-3 text-center text-xs font-semibold text-on-surface">
                                                    {filter}
                                                </div>
                                            ))}
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="rounded-full bg-primary px-3 py-2 text-xs font-semibold text-on-primary">List view</span>
                                            <span className="rounded-full bg-surface-container-low px-3 py-2 text-xs font-semibold text-on-surface">Calendar view</span>
                                            <span className="rounded-full bg-surface-container-low px-3 py-2 text-xs font-semibold text-on-surface">Excel / PDF</span>
                                        </div>
                                    </div>
                                )}

                                {index === 5 && (
                                    <div className="space-y-4">
                                        <div className="grid grid-cols-2 gap-3">
                                            <div className="rounded-2xl bg-surface-container-low px-4 py-3">
                                                <p className="text-[11px] uppercase tracking-[0.18em] text-on-surface-variant">Total appointments</p>
                                                <p className="mt-1 text-xl font-black font-headline text-on-surface">22</p>
                                            </div>
                                            <div className="rounded-2xl bg-primary px-4 py-3 text-on-primary">
                                                <p className="text-[11px] uppercase tracking-[0.18em] text-white/70">Revenue</p>
                                                <p className="mt-1 text-xl font-black font-headline">255.00 €</p>
                                            </div>
                                        </div>
                                        <div className="flex h-32 items-end justify-between gap-2 rounded-2xl bg-surface-container-low px-4 py-4">
                                            {analyticsBars.map((bar) => (
                                                <div key={bar.label} className="flex flex-1 flex-col items-center gap-2">
                                                    <div className={`w-full rounded-t-xl bg-primary ${bar.height}`} />
                                                    <p className="text-[11px] text-on-surface-variant">{bar.label}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            <section className="mx-auto max-w-6xl px-6 py-16">
                <div className="grid gap-8 rounded-[2rem] border border-outline-variant bg-surface-container-lowest p-8 lg:grid-cols-[0.95fr_1.05fr] lg:p-10">
                    <div>
                        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">{t('welcome.howto_eyebrow')}</p>
                        <h2 className="mt-3 text-3xl font-black font-headline tracking-tight text-on-surface sm:text-4xl">
                            {t('welcome.howto_heading')}
                        </h2>
                        <p className="mt-4 max-w-xl text-base leading-relaxed text-on-surface-variant">
                            {t('welcome.howto_desc')}
                        </p>
                    </div>

                    <div className="space-y-4">
                        {steps.map((step) => (
                            <div key={step.number} className="flex items-start gap-4 rounded-3xl border border-outline-variant bg-surface p-5">
                                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary-container text-base font-black text-white shadow-sm">
                                    {step.number}
                                </div>
                                <div>
                                    <h3 className="font-bold font-headline text-on-surface">{step.title}</h3>
                                    <p className="mt-1 text-sm leading-relaxed text-on-surface-variant">{step.description}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            <section className="mx-auto max-w-4xl px-6 py-20 text-center">
                <div className="primary-gradient relative overflow-hidden rounded-[2rem] px-8 py-12 shadow-xl sm:px-12">
                    <div
                        className="absolute inset-0 opacity-10"
                        style={{
                            backgroundImage:
                                'radial-gradient(circle at 20% 30%, white 1px, transparent 1px), radial-gradient(circle at 80% 70%, white 1px, transparent 1px)',
                            backgroundSize: '32px 32px',
                        }}
                    />

                    <div className="relative">
                        <p className="text-sm font-semibold uppercase tracking-[0.22em] text-white/75">{t('welcome.cta_eyebrow')}</p>
                        <h2 className="mt-3 text-3xl font-black font-headline tracking-tight text-white sm:text-4xl">
                            {t('welcome.cta_heading')}
                        </h2>
                        <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-white/80 sm:text-lg">
                            {t('welcome.cta_desc')}
                        </p>
                        <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row sm:gap-5">
                            <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm font-semibold text-white">
                                <Icon name="redeem" size="text-sm" />
                                {t('welcome.cta_trial')}
                            </span>

                            {canRegister && (
                                <Link
                                    href={route('register')}
                                    className="inline-flex items-center gap-2 rounded-2xl border border-white/20 bg-white px-8 py-4 text-base font-semibold text-slate-900 shadow-lg transition-transform hover:scale-[1.02]"
                                >
                                    {t('welcome.cta_register')}
                                    <Icon name="arrow_forward" size="text-lg" />
                                </Link>
                            )}
                        </div>
                    </div>
                </div>
            </section>

            <footer className="border-t border-outline-variant">
                <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 py-8 sm:flex-row">
                    <div className="flex flex-col items-center gap-1 sm:items-start">
                        <NiterminLogo
                            markClassName="h-7 w-7 text-on-surface"
                            wordClassName="text-sm font-semibold tracking-tight text-on-surface"
                            dotClassName="text-on-surface-variant"
                        />
                        <p className="text-xs text-on-surface-variant">{t('welcome.footer_tagline')}</p>
                    </div>

                    <p className="text-xs text-on-surface-variant">{t('welcome.footer_copy')}</p>
                </div>
            </footer>
        </div>
    );
}
