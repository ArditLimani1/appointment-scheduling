import { Head, Link } from '@inertiajs/react';
import Icon from '@/Components/Icon';
import NiterminLogo from '@/Components/NiterminLogo';

const highlights = [
    {
        icon: 'public',
        title: 'Faqe Publike Për Termine',
        description: 'Jepi biznesit tënd një link të thjeshtë rezervimi që klientët mund ta hapin nga telefoni ose shfletuesi.',
    },
    {
        icon: 'group',
        title: 'Orari I Ekipit',
        description: 'Konfiguro punëtorët, shërbimet, orarin e punës, pushimet dhe disponueshmërinë individuale.',
    },
    {
        icon: 'dashboard',
        title: 'Panel Operativ',
        description: 'Përcill terminet, aktivitetin dhe performancën ditore të biznesit nga një vend i vetëm.',
    },
    {
        icon: 'event_available',
        title: 'Disponueshmëri Inteligjente',
        description: 'Orët e lira llogariten sipas orarit të punës, ndryshimeve, pushimeve, njoftimit minimal dhe kohëzgjatjes së shërbimit.',
    },
    {
        icon: 'monitoring',
        title: 'Analitika Dhe Eksporte',
        description: 'Shiko trendet, të ardhurat dhe historikun e termineve, pastaj eksporto raportet kur të duhen.',
    },
    {
        icon: 'admin_panel_settings',
        title: 'Role Dhe Leje',
        description: 'Ndaje qartë çfarë shohin administratorët dhe çfarë shohin punëtorët, që puna të mbetet e organizuar dhe e sigurt.',
    },
];

const steps = [
    {
        number: '1',
        title: 'Krijo biznesin tënd',
        description: 'Vendos emrin, identitetin, zonën kohore, valutën dhe rregullat e rezervimit për pak minuta.',
    },
    {
        number: '2',
        title: 'Shto ekipin dhe shërbimet',
        description: 'Përcakto çfarë ofron secili punëtor dhe vendos kohëzgjatjen, çmimin dhe disponueshmërinë.',
    },
    {
        number: '3',
        title: 'Fillo të pranosh termine',
        description: 'Ndaje faqen tënde të NiTermin dhe lejo klientët të rezervojnë pa telefonata dhe pa pritje.',
    },
];

const dashboardMetrics = [
    { label: 'Punëtorë', value: '4' },
    { label: 'Shërbime', value: '5' },
    { label: 'Hapje rezervimi', value: '30 ditë' },
    { label: 'Njoftim minimal', value: '60 min' },
];

const bookingMoments = [
    'Zgjedh shërbimin',
    'Zgjedh punëtorin',
    'Përzgjedh orën e lirë',
    'Konfirmon për sekonda',
];

const analyticsBars = [
    { label: 'Hën', height: 'h-20' },
    { label: 'Mar', height: 'h-28' },
    { label: 'Mër', height: 'h-24' },
    { label: 'Enj', height: 'h-36' },
    { label: 'Pre', height: 'h-32' },
    { label: 'Sht', height: 'h-16' },
];

const adminShowcase = [
    {
        icon: 'dashboard',
        eyebrow: 'Dashboard',
        title: 'Pamje e plotë e biznesit në një ekran.',
        description: 'Dashboard-i i adminit përmbledh performancën e ekipit, shërbimet aktive, terminet e ditës dhe të ardhurat e momentit, që menaxhimi të jetë i shpejtë dhe i qartë.',
        accent: 'Nga ekipi te të ardhurat',
    },
    {
        icon: 'inventory_2',
        eyebrow: 'Services',
        title: 'Kontroll i plotë mbi shërbimet e kompanisë.',
        description: 'Shto, përditëso, fshi ose çaktivizo shërbimet. Admini kontrollon emrin, përshkrimin, kohëzgjatjen, çmimin dhe disponueshmërinë e çdo oferte.',
        accent: 'CRUD + status aktiv',
    },
    {
        icon: 'badge',
        eyebrow: 'Employees',
        title: 'Menaxho punëtorët, rolet dhe shërbimet e tyre.',
        description: 'Faqja e punëtorëve e bën të lehtë administrimin e stafit, caktimin e shërbimeve, kontrollin e qasjes dhe aktivizimin ose çaktivizimin e anëtarëve të ekipit.',
        accent: 'Staf i organizuar',
    },
    {
        icon: 'key',
        eyebrow: 'Roles',
        title: 'Role dhe leje të personalizuara për çdo biznes.',
        description: 'Çdo kompani mund të krijojë role të ndryshme sipas nevojës së vet dhe të përcaktojë çfarë mund të shohë apo bëjë secili punëtor brenda sistemit.',
        accent: 'Fleksibil për çdo kompani',
    },
    {
        icon: 'calendar_month',
        eyebrow: 'Appointments',
        title: 'Menaxhim i termineve në listë ose kalendar.',
        description: 'Admini mund të filtrojë terminet sipas punëtorit, datës dhe statusit, të editojë ose fshijë rezervime, si dhe të eksportojë të dhënat në Excel ose PDF.',
        accent: 'Listë + Calendar view',
    },
    {
        icon: 'monitoring',
        eyebrow: 'Analytics',
        title: 'Analitikë e detajuar për performancën dhe të ardhurat.',
        description: 'NiTermin shfaq statistika për terminet, të ardhurat, performancën e secilit punëtor dhe pasqyrën mujore, me filtra për analizë më të saktë.',
        accent: 'Revenue + performance',
    },
];

export default function Welcome({ auth, canLogin, canRegister }) {
    return (
        <div className="min-h-screen bg-surface font-body">
            <Head title="NiTermin - Platformë Për Menaxhimin E Termineve" />

            <header className="glass-header sticky top-0 z-30 border-b border-outline-variant">
                <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
                    <Link href="/" className="flex items-center gap-3">
                        <NiterminLogo
                            markClassName="h-9 w-9 text-on-surface"
                            wordClassName="text-lg font-semibold tracking-tight text-on-surface"
                            dotClassName="text-on-surface-variant"
                        />
                    </Link>

                    <nav className="flex items-center gap-2">
                        {auth?.user ? (
                            <Link
                                href={route('dashboard')}
                                className="primary-gradient flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-semibold text-white shadow-sm"
                            >
                                <Icon name="dashboard" size="text-base" />
                                Paneli
                            </Link>
                        ) : (
                            <>
                                {canLogin && (
                                    <Link
                                        href={route('login')}
                                        className="rounded-xl px-4 py-2 text-sm font-medium text-on-surface-variant transition-colors hover:bg-surface-container-low"
                                    >
                                        Kyçu
                                    </Link>
                                )}
                                {canRegister && (
                                    <Link
                                        href={route('register')}
                                        className="primary-gradient rounded-xl px-4 py-2 text-sm font-semibold text-white shadow-sm"
                                    >
                                        Fillo me NiTermin
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
                            Ndërtuar Për Rezervime Reale
                        </span>

                        <h1 className="max-w-3xl text-5xl font-black font-headline leading-[1.02] tracking-tight text-on-surface sm:text-6xl lg:text-7xl">
                            NiTermin mban
                            <span className="block text-primary">çdo termin</span>
                            në lëvizje.
                        </h1>

                        <p className="mt-6 max-w-2xl text-lg leading-relaxed text-on-surface-variant sm:text-xl">
                            <span className="font-semibold text-on-surface">Ni</span> do të thotë një.{' '}
                            <span className="font-semibold text-on-surface">Termin</span> do të thotë takim apo rezervim.
                            Së bashku, NiTermin u jep bizneseve shërbyese një vend të qartë për të menaxhuar rezervimet,
                            oraret, stafin dhe rrjedhën e klientëve nga klikimi i parë deri te vizita e fundit.
                        </p>

                        <div className="mt-10 flex flex-col gap-3 sm:flex-row">
                            {canRegister && (
                                <Link
                                    href={route('register')}
                                    className="primary-gradient inline-flex items-center justify-center gap-2 rounded-2xl px-8 py-4 text-base font-semibold text-white shadow-lg transition-transform hover:scale-[1.02]"
                                >
                                    Krijo biznesin tënd
                                    <Icon name="arrow_forward" size="text-lg" />
                                </Link>
                            )}

                            {canLogin && (
                                <Link
                                    href={route('login')}
                                    className="inline-flex items-center justify-center gap-2 rounded-2xl border border-outline-variant px-8 py-4 text-base font-medium text-on-surface transition-colors hover:bg-surface-container-low"
                                >
                                    Hape panelin
                                </Link>
                            )}
                        </div>

                        <div className="mt-4 flex flex-wrap items-center gap-3">
                            <span className="inline-flex items-center gap-2 rounded-full border border-primary/15 bg-primary/10 px-4 py-2 text-sm font-semibold text-primary">
                                <Icon name="redeem" size="text-sm" />
                                1 muaj falas për testim
                            </span>
                            <span className="text-sm text-on-surface-variant">
                                Provoje NiTermin pa obligim dhe shih si përshtatet me ritmin e biznesit tënd.
                            </span>
                        </div>

                        <div className="mt-8 flex flex-wrap gap-3 text-sm text-on-surface-variant">
                            <span className="rounded-full bg-surface-container-low px-4 py-2">Faqe publike për rezervime</span>
                            <span className="rounded-full bg-surface-container-low px-4 py-2">Role për admin dhe punëtorë</span>
                            <span className="rounded-full bg-surface-container-low px-4 py-2">Analitika dhe eksporte</span>
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
                                            <p className="text-sm font-bold font-headline text-on-surface">NiTermin Admin</p>
                                            <p className="text-xs text-on-surface-variant">Pamje e shpejtë për sot</p>
                                        </div>
                                    </div>
                                    <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                                        <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                                        Rezervime live
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
                                            <p className="text-sm font-bold font-headline text-on-surface">Rrjedha e rezervimit</p>
                                            <p className="text-xs text-on-surface-variant">E menduar për veprim të shpejtë nga klienti</p>
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
                                    <p className="text-xs uppercase tracking-[0.22em] text-white/70">Pse funksionon</p>
                                    <p className="mt-2 text-base font-semibold leading-relaxed">
                                        NiTermin i ul telefonatat, i mban oraret e ekipit të organizuara dhe e kthen disponueshmërinë në një përvojë të pastër rezervimi.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <section className="mx-auto max-w-6xl px-6 py-16">
                <div className="mb-12 max-w-3xl">
                    <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">Çfarë Bën NiTermin</p>
                    <h2 className="mt-3 text-3xl font-black font-headline tracking-tight text-on-surface sm:text-4xl">
                        Një platformë për operacione, rezervime dhe koordinim të ekipit.
                    </h2>
                    <p className="mt-4 text-base leading-relaxed text-on-surface-variant sm:text-lg">
                        Aplikacioni është ndërtuar për biznese që punojnë me termine dhe që kanë nevojë për më shumë se një formë të bukur.
                        Ai mbështet rrjedhën reale të punës: konfigurimin e shërbimeve, oraret e punëtorëve, rezervimet publike,
                        menaxhimin e termineve, analitikën dhe cilësimet e biznesit.
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
                    <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">Nga Perspektiva E Adminit</p>
                    <h2 className="mt-3 text-3xl font-black font-headline tracking-tight text-on-surface sm:text-4xl">
                        Çdo faqe e panelit është ndërtuar për kontroll të qartë dhe punë të shpejtë.
                    </h2>
                    <p className="mt-4 text-base leading-relaxed text-on-surface-variant sm:text-lg">
                        Bazuar në ekranet reale që ndave nga admin paneli, NiTermin ofron një përvojë të pastër menaxhimi për dashboard-in,
                        shërbimet, punëtorët, rolet, terminet dhe analitikën.
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
                                            <p className="text-sm font-semibold text-on-surface">Pasqyrë për sot</p>
                                            <p className="mt-1 text-xs text-on-surface-variant">Punëtorë aktivë, shërbime aktive, terminet e ditës dhe të ardhurat në një vend.</p>
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
                                                    Aktiv
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {index === 3 && (
                                    <div className="space-y-3">
                                        <div className="rounded-2xl bg-surface-container-low px-4 py-4">
                                            <p className="text-sm font-semibold text-on-surface">Role të personalizuara</p>
                                            <p className="mt-1 text-xs leading-relaxed text-on-surface-variant">Krijo role si menaxher, recepsionist ose staf operativ dhe cakto qasje të ndryshme sipas nevojës së kompanisë.</p>
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
                                            {['Punëtori', 'Data', 'Statusi'].map((filter) => (
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
                        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">Si Funksionon</p>
                        <h2 className="mt-3 text-3xl font-black font-headline tracking-tight text-on-surface sm:text-4xl">
                            Nga konfigurimi deri te termini i konfirmuar.
                        </h2>
                        <p className="mt-4 max-w-xl text-base leading-relaxed text-on-surface-variant">
                            NiTermin i ndihmon bizneset të kalojnë nga koordinimi manual në një sistem të qartë dhe të përsëritshëm rezervimi, pa shtuar kompleksitet.
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
                        <p className="text-sm font-semibold uppercase tracking-[0.22em] text-white/75">Gati Për Nisje</p>
                        <h2 className="mt-3 text-3xl font-black font-headline tracking-tight text-white sm:text-4xl">
                            Le të bëhet NiTermin dera kryesore e termineve të tua.
                        </h2>
                        <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-white/80 sm:text-lg">
                            Jepu klientëve një mënyrë të thjeshtë për rezervim. Jepi ekipit një orar të strukturuar. Jepi biznesit një ritëm më të mirë të përditshëm.
                        </p>
                        <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row sm:gap-5">
                            <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm font-semibold text-white">
                                <Icon name="redeem" size="text-sm" />
                                1 muaj falas për testim
                            </span>

                            {canRegister && (
                                <Link
                                    href={route('register')}
                                    className="inline-flex items-center gap-2 rounded-2xl border border-white/20 bg-white px-8 py-4 text-base font-semibold text-slate-900 shadow-lg transition-transform hover:scale-[1.02]"
                                >
                                    Fillo me NiTermin
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
                        <p className="text-xs text-on-surface-variant">Një termin, i menaxhuar më mirë.</p>
                    </div>

                    <p className="text-xs text-on-surface-variant">© 2026 nitermin. Ndërtuar për biznese që punojnë me termine.</p>
                </div>
            </footer>
        </div>
    );
}
