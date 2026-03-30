import { Head, Link } from '@inertiajs/react';
import Icon from '@/Components/Icon';

const features = [
    {
        icon: 'link',
        title: 'Your own booking URL',
        description: 'Share bookslot.app/your-business with clients — no friction, no downloads.',
    },
    {
        icon: 'group',
        title: 'Manage your team',
        description: 'Add employees, assign services, and set individual schedules with breaks.',
    },
    {
        icon: 'event_available',
        title: 'Smart scheduling',
        description: 'Real-time availability, slot durations, minimum notice, and booking windows.',
    },
    {
        icon: 'payments',
        title: 'Revenue tracking',
        description: 'See daily earnings, appointment history, and export reports to Excel.',
    },
    {
        icon: 'tune',
        title: 'Fully customisable',
        description: 'Set your timezone, currency, services, and booking rules from the dashboard.',
    },
    {
        icon: 'smartphone',
        title: 'Mobile-ready',
        description: 'Clients can book from any device. Your dashboard works on phone too.',
    },
];

export default function Welcome({ auth, canLogin, canRegister }) {
    return (
        <div className="min-h-screen bg-surface font-body">
            <Head title="BookSlot - Online Appointment Scheduling" />

            <header className="glass-header sticky top-0 z-30 border-b border-outline-variant">
                <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
                    <Link href="/" className="flex items-center gap-2.5">
                        <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-primary">
                            <Icon name="calendar_month" size="text-lg" className="text-on-primary" />
                        </div>
                        <span className="text-lg font-black font-headline text-on-surface tracking-tight">BookSlot</span>
                    </Link>
                    <nav className="flex items-center gap-2">
                        {auth?.user ? (
                            <Link
                                href={route('dashboard')}
                                className="primary-gradient flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-semibold text-white shadow-sm"
                            >
                                <Icon name="dashboard" size="text-base" /> Dashboard
                            </Link>
                        ) : (
                            <>
                                {canLogin && (
                                    <Link
                                        href={route('login')}
                                        className="rounded-xl px-4 py-2 text-sm font-medium text-on-surface-variant hover:bg-surface-container-low transition-colors"
                                    >
                                        Sign in
                                    </Link>
                                )}
                                {canRegister && (
                                    <Link
                                        href={route('register')}
                                        className="primary-gradient rounded-xl px-4 py-2 text-sm font-semibold text-white shadow-sm"
                                    >
                                        Get started free
                                    </Link>
                                )}
                            </>
                        )}
                    </nav>
                </div>
            </header>

            <section className="relative overflow-hidden">
                <div className="absolute inset-0 -z-10 opacity-[0.03]"
                    style={{ backgroundImage: 'radial-gradient(circle, #6750A4 1px, transparent 1px)', backgroundSize: '32px 32px' }}
                />
                <div className="mx-auto max-w-4xl px-6 py-24 text-center">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-primary-container px-3 py-1 text-xs font-semibold text-on-primary-container mb-6">
                        <Icon name="auto_awesome" size="text-sm" /> Free for small businesses
                    </span>
                    <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black font-headline text-on-surface leading-[1.05] tracking-tight mb-6">
                        Appointment<br />
                        <span className="text-primary">scheduling</span><br />
                        made simple.
                    </h1>
                    <p className="mx-auto max-w-xl text-lg text-on-surface-variant leading-relaxed mb-10">
                        Register your business, add your team, and let clients book 24/7 on your custom page. No technical knowledge required.
                    </p>
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                        {canRegister && (
                            <Link
                                href={route('register')}
                                className="primary-gradient flex items-center gap-2 rounded-2xl px-8 py-4 text-base font-semibold text-white shadow-lg hover:scale-[1.02] transition-transform"
                            >
                                Create your booking page <Icon name="arrow_forward" size="text-lg" />
                            </Link>
                        )}
                        {canLogin && (
                            <Link
                                href={route('login')}
                                className="flex items-center gap-2 rounded-2xl border border-outline-variant px-8 py-4 text-base font-medium text-on-surface hover:bg-surface-container-low transition-colors"
                            >
                                Sign in to your dashboard
                            </Link>
                        )}
                    </div>
                    <p className="mt-4 text-xs text-on-surface-variant">
                        No credit card required · Set up in under 5 minutes
                    </p>
                </div>
            </section>

            <section className="mx-auto max-w-2xl px-6 pb-16">
                <div className="rounded-3xl bg-surface-container-lowest border border-outline-variant overflow-hidden shadow-xl">
                    <div className="flex items-center gap-2 bg-surface-container px-4 py-3 border-b border-outline-variant">
                        <div className="flex gap-1.5">
                            <div className="h-3 w-3 rounded-full bg-error/50" />
                            <div className="h-3 w-3 rounded-full bg-tertiary-fixed/50" />
                            <div className="h-3 w-3 rounded-full bg-secondary-container" />
                        </div>
                        <div className="flex-1 flex items-center justify-center">
                            <div className="flex items-center gap-1.5 rounded-lg bg-surface px-3 py-1 text-xs text-on-surface-variant border border-outline-variant">
                                <Icon name="lock" size="text-xs" className="text-on-surface-variant" />
                                bookslot.app/<span className="text-primary font-semibold">your-business</span>
                            </div>
                        </div>
                    </div>
                    <div className="p-6 space-y-4">
                        <div className="flex items-center gap-3 mb-5">
                            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary-container text-on-primary-container font-bold font-headline text-lg">B</div>
                            <div>
                                <p className="font-bold font-headline text-on-surface text-sm">Bella's Hair Studio</p>
                                <p className="text-xs text-on-surface-variant flex items-center gap-1"><Icon name="location_on" size="text-xs" /> 123 Main St, New York</p>
                            </div>
                        </div>
                        <p className="text-xs font-semibold uppercase tracking-widest text-on-surface-variant">Choose a Provider</p>
                        <div className="grid grid-cols-2 gap-3">
                            {['Sarah J.', 'Mike R.'].map((name, i) => (
                                <div key={name} className={`rounded-2xl border p-3 ${i === 0 ? 'border-primary bg-primary-container/20' : 'border-outline-variant'}`}>
                                    <div className="flex items-center gap-2">
                                        <div className="h-8 w-8 rounded-full bg-secondary-container flex items-center justify-center text-xs font-bold text-on-secondary-container">{name[0]}</div>
                                        <div>
                                            <p className="text-xs font-semibold text-on-surface">{name}</p>
                                            <p className="text-[10px] text-on-surface-variant">Stylist</p>
                                        </div>
                                        {i === 0 && <Icon name="check_circle" size="text-base" filled className="ml-auto text-primary" />}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            <section className="mx-auto max-w-6xl px-6 py-16">
                <div className="text-center mb-12">
                    <h2 className="text-3xl sm:text-4xl font-black font-headline text-on-surface tracking-tight mb-3">
                        Everything you need to run bookings
                    </h2>
                    <p className="text-on-surface-variant max-w-xl mx-auto">
                        From registration to your first booking in minutes — built for service businesses of all sizes.
                    </p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {features.map((f) => (
                        <div key={f.icon} className="rounded-3xl bg-surface-container-lowest border border-outline-variant p-6 hover:border-primary/30 transition-colors">
                            <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-primary-container">
                                <Icon name={f.icon} size="text-xl" className="text-on-primary-container" />
                            </div>
                            <h3 className="font-bold font-headline text-on-surface mb-1">{f.title}</h3>
                            <p className="text-sm text-on-surface-variant leading-relaxed">{f.description}</p>
                        </div>
                    ))}
                </div>
            </section>

            <section className="mx-auto max-w-3xl px-6 py-20 text-center">
                <div className="rounded-3xl bg-primary p-10 relative overflow-hidden">
                    <div className="absolute inset-0 opacity-10"
                        style={{ backgroundImage: 'radial-gradient(circle at 20% 50%, white 1px, transparent 1px), radial-gradient(circle at 80% 50%, white 1px, transparent 1px)', backgroundSize: '30px 30px' }}
                    />
                    <div className="relative">
                        <h2 className="text-3xl sm:text-4xl font-black font-headline text-white tracking-tight mb-3">
                            Ready to get started?
                        </h2>
                        <p className="text-white/80 mb-8 max-w-md mx-auto">
                            Register your business for free and start accepting bookings today.
                        </p>
                        {canRegister && (
                            <Link
                                href={route('register')}
                                className="inline-flex items-center gap-2 rounded-2xl bg-white px-8 py-4 text-base font-semibold text-primary shadow-lg hover:scale-[1.02] transition-transform"
                            >
                                Create your business <Icon name="arrow_forward" size="text-lg" />
                            </Link>
                        )}
                    </div>
                </div>
            </section>

            <footer className="border-t border-outline-variant">
                <div className="mx-auto max-w-6xl px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                        <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-primary">
                            <Icon name="calendar_month" size="text-sm" className="text-on-primary" />
                        </div>
                        <span className="text-sm font-bold font-headline text-on-surface">BookSlot</span>
                    </div>
                    <p className="text-xs text-on-surface-variant">© 2026 BookSlot. Built with Laravel & React.</p>
                </div>
            </footer>
        </div>
    );
}
