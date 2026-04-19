import { Head, Link } from '@inertiajs/react';
import Icon from '@/Components/Icon';
import NiterminLogo from '@/Components/NiterminLogo';

const DEFAULT_FEATURES = [
    { icon: 'calendar_month', text: 'Menaxhoni takimet në të gjithë ekipin tuaj' },
    { icon: 'group', text: 'Jepni çdo punonjësi orarin e vet' },
    { icon: 'link', text: 'Ndani faqen e rezervimeve me klientët tuaj' },
];

const DEFAULT_STATS = [
    { value: '10k+', label: 'Takime të menaxhuara' },
    { value: '99.9%', label: 'Disponueshmëri' },
    { value: '24/7', label: 'Mbështetje' },
];

export default function AuthLayout({
    headTitle,
    eyebrow = 'Platforma për menaxhimin e takimeve',
    heroTitle = 'Mirë se erdhët',
    heroAccent = 'përsëri.',
    heroSubtitle = 'Menaxhoni ekipin, ndjekni rezervimet dhe mbani biznesin tuaj në ecje të rrjedhshme.',
    features = DEFAULT_FEATURES,
    stats = DEFAULT_STATS,
    children,
}) {
    return (
        <div className="min-h-screen bg-surface font-body flex">
            {headTitle && <Head title={headTitle} />}

            <div className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12 relative overflow-hidden bg-gradient-to-br from-[#0b1220] via-[#0f1a33] to-[#1a2550]">
                <div
                    className="absolute inset-0 opacity-[0.07]"
                    style={{
                        backgroundImage:
                            'radial-gradient(circle at 20% 20%, white 1.2px, transparent 1.2px), radial-gradient(circle at 80% 70%, white 1px, transparent 1px)',
                        backgroundSize: '36px 36px, 60px 60px',
                    }}
                />
                <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-primary/20 blur-3xl" />
                <div className="absolute -bottom-32 -left-16 w-96 h-96 rounded-full bg-tertiary/20 blur-3xl" />

                <div className="relative">
                    <Link href="/">
                        <NiterminLogo
                            markClassName="h-10 w-10 rounded-2xl bg-white/10 p-2 text-white ring-1 ring-white/20 backdrop-blur-sm"
                            wordClassName="text-xl font-semibold tracking-tight text-white"
                            dotClassName="text-white/60"
                        />
                    </Link>
                </div>

                <div className="relative space-y-8 max-w-lg">
                    {eyebrow && (
                        <div className="inline-flex items-center gap-2 rounded-full bg-white/10 backdrop-blur-sm px-3 py-1 ring-1 ring-white/15">
                            <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                            <span className="text-xs font-medium text-white/90">{eyebrow}</span>
                        </div>
                    )}

                    <h1 className="text-4xl xl:text-5xl font-black font-headline text-white leading-[1.1] tracking-tight">
                        {heroTitle}
                        {heroAccent && (
                            <>
                                <br />
                                <span className="bg-gradient-to-r from-white via-white to-white/60 bg-clip-text text-transparent">{heroAccent}</span>
                            </>
                        )}
                    </h1>
                    {heroSubtitle && (
                        <p className="text-white/70 text-lg leading-relaxed">{heroSubtitle}</p>
                    )}

                    {features.length > 0 && (
                        <div className="space-y-3 pt-2">
                            {features.map((item) => (
                                <div key={item.icon + item.text} className="flex items-center gap-3">
                                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 ring-1 ring-white/10">
                                        <Icon name={item.icon} size="text-base" className="text-white" />
                                    </div>
                                    <p className="text-sm text-white/85">{item.text}</p>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="relative">
                    {stats.length > 0 && (
                        <div className="grid grid-cols-3 gap-6 pb-6 border-b border-white/10">
                            {stats.map((stat) => (
                                <div key={stat.label}>
                                    <div className="text-2xl font-black font-headline text-white tracking-tight">{stat.value}</div>
                                    <div className="text-xs text-white/50 mt-1">{stat.label}</div>
                                </div>
                            ))}
                        </div>
                    )}
                    <p className="text-xs text-white/40 pt-4">© 2026 nitermin. Të gjitha të drejtat e rezervuara.</p>
                </div>
            </div>

            <div className="flex flex-1 flex-col items-center justify-center px-6 py-12 lg:px-16">
                <div className="w-full max-w-md">
                    <Link href="/" className="mb-10 lg:hidden">
                        <NiterminLogo
                            markClassName="h-9 w-9 text-on-surface"
                            wordClassName="text-lg font-semibold tracking-tight text-on-surface"
                            dotClassName="text-on-surface-variant"
                        />
                    </Link>
                    {children}
                </div>
            </div>
        </div>
    );
}

export const authInputClass = 'w-full rounded-xl border border-outline-variant/40 bg-surface px-4 py-3 pl-11 text-sm text-on-surface placeholder-on-surface-variant/40 focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none transition-all';
export const authInputNoIconClass = 'w-full rounded-xl border border-outline-variant/40 bg-surface px-4 py-3 text-sm text-on-surface placeholder-on-surface-variant/40 focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none transition-all';
