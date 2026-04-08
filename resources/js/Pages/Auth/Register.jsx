import { Head, Link, useForm } from '@inertiajs/react';
import { useState } from 'react';
import Icon from '@/Components/Icon';
import InputError from '@/Components/InputError';

function slugify(value) {
    return value
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-');
}

export default function Register() {
    const [step, setStep] = useState(0);
    const { data, setData, post, processing, errors, reset } = useForm({
        name: '',
        email: '',
        password: '',
        password_confirmation: '',
        business_name: '',
        slug: '',
        location: '',
        phone: '',
        logo: null,
        also_works_as_staff: false,
    });

    const handleBusinessName = (value) => {
        setData(prev => ({
            ...prev,
            business_name: value,
            slug: prev.slug === slugify(prev.business_name) ? slugify(value) : prev.slug,
        }));
    };

    const canContinue = () => {
        return data.name && data.email && data.password && data.password_confirmation;
    };

    const submit = (e) => {
        e.preventDefault();
        post(route('register'), {
            forceFormData: true,
            onFinish: () => reset('password', 'password_confirmation'),
        });
    };

    const inputClass = "w-full rounded-2xl border-0 bg-surface-container-low px-4 py-3 text-sm text-on-surface placeholder-on-surface-variant/50 focus:ring-2 focus:ring-primary/40 transition-all";

    return (
        <div className="min-h-screen bg-surface font-body flex">
            <Head title="Create your business" />

            <div className="hidden lg:flex lg:w-2/5 xl:w-1/2 flex-col justify-between bg-primary-container p-12 relative overflow-hidden">
                <div className="absolute inset-0 opacity-10"
                    style={{ backgroundImage: 'radial-gradient(circle at 30% 20%, white 1px, transparent 1px), radial-gradient(circle at 70% 80%, white 1px, transparent 1px)', backgroundSize: '40px 40px' }}
                />
                <div className="relative">
                    <Link href="/" className="flex items-center gap-2">
                        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/20">
                            <Icon name="calendar_month" size="text-xl" className="text-white" />
                        </div>
                        <span className="text-xl font-black font-headline text-white tracking-tight">BookSlot</span>
                    </Link>
                </div>
                <div className="relative space-y-6">
                    <h1 className="text-4xl xl:text-5xl font-black font-headline text-white leading-tight">
                        Your business,<br />online in minutes.
                    </h1>
                    <p className="text-white/80 text-lg leading-relaxed">
                        Create your booking page, manage your team, and let clients schedule appointments 24/7.
                    </p>
                    <div className="space-y-3">
                        {[
                            { icon: 'link', text: 'Your own booking URL: bookslot.app/your-business' },
                            { icon: 'group', text: 'Manage employees & their schedules' },
                            { icon: 'payments', text: 'Track revenue and appointments' },
                        ].map((item) => (
                            <div key={item.icon} className="flex items-center gap-3">
                                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/20">
                                    <Icon name={item.icon} size="text-base" className="text-white" />
                                </div>
                                <p className="text-sm text-white/90">{item.text}</p>
                            </div>
                        ))}
                    </div>
                </div>
                <p className="relative text-xs text-white/50">© 2026 BookSlot. All rights reserved.</p>
            </div>

            <div className="flex flex-1 flex-col items-center justify-center px-6 py-12 lg:px-12">
                <div className="w-full max-w-md">
                    <Link href="/" className="flex items-center gap-2 mb-8 lg:hidden">
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-container">
                            <Icon name="calendar_month" size="text-lg" className="text-white" />
                        </div>
                        <span className="text-lg font-black font-headline text-on-surface tracking-tight">BookSlot</span>
                    </Link>

                    <div className="flex items-center gap-2 mb-8">
                        {['Your account', 'Your business'].map((label, i) => (
                            <div key={i} className="flex items-center gap-2">
                                <div className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold transition-all ${
                                    i < step ? 'bg-on-surface text-surface' : i === step ? 'bg-primary text-on-primary' : 'bg-surface-container-high text-on-surface-variant'
                                }`}>
                                    {i < step ? <Icon name="check" size="text-xs" /> : i + 1}
                                </div>
                                <span className={`text-xs font-medium ${i === step ? 'text-on-surface' : 'text-on-surface-variant'}`}>{label}</span>
                                {i < 1 && <div className={`mx-1 h-px w-8 ${i < step ? 'bg-on-surface' : 'bg-outline-variant'}`} />}
                            </div>
                        ))}
                    </div>

                    <form onSubmit={submit}>
                        {step === 0 && (
                            <div className="space-y-1">
                                <h2 className="text-2xl font-black font-headline text-on-surface mb-1">Create your account</h2>
                                <p className="text-sm text-on-surface-variant mb-6">Start with your personal details.</p>

                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-xs font-semibold uppercase tracking-widest text-on-surface-variant mb-1.5">Full Name</label>
                                        <input
                                            value={data.name}
                                            onChange={e => setData('name', e.target.value)}
                                            className={inputClass}
                                            placeholder="Jane Smith"
                                            autoFocus
                                            required
                                        />
                                        <InputError message={errors.name} className="mt-1" />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-semibold uppercase tracking-widest text-on-surface-variant mb-1.5">Email Address</label>
                                        <input
                                            type="email"
                                            value={data.email}
                                            onChange={e => setData('email', e.target.value)}
                                            className={inputClass}
                                            placeholder="jane@example.com"
                                            required
                                        />
                                        <InputError message={errors.email} className="mt-1" />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-semibold uppercase tracking-widest text-on-surface-variant mb-1.5">Password</label>
                                        <input
                                            type="password"
                                            value={data.password}
                                            onChange={e => setData('password', e.target.value)}
                                            className={inputClass}
                                            placeholder="Min. 8 characters"
                                            required
                                        />
                                        <InputError message={errors.password} className="mt-1" />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-semibold uppercase tracking-widest text-on-surface-variant mb-1.5">Confirm Password</label>
                                        <input
                                            type="password"
                                            value={data.password_confirmation}
                                            onChange={e => setData('password_confirmation', e.target.value)}
                                            className={inputClass}
                                            placeholder="Repeat your password"
                                            required
                                        />
                                        <InputError message={errors.password_confirmation} className="mt-1" />
                                    </div>
                                </div>

                                <div className="pt-6">
                                    <button
                                        type="button"
                                        onClick={() => setStep(1)}
                                        disabled={!canContinue()}
                                        className="primary-gradient w-full flex items-center justify-center gap-2 rounded-2xl py-3.5 text-sm font-semibold text-white shadow-lg disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                                    >
                                        Continue <Icon name="arrow_forward" size="text-lg" />
                                    </button>
                                </div>
                            </div>
                        )}

                        {step === 1 && (
                            <div className="space-y-1">
                                <h2 className="text-2xl font-black font-headline text-on-surface mb-1">Set up your business</h2>
                                <p className="text-sm text-on-surface-variant mb-6">This is how clients will find and book with you.</p>

                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-xs font-semibold uppercase tracking-widest text-on-surface-variant mb-1.5">Business Name</label>
                                        <input
                                            value={data.business_name}
                                            onChange={e => handleBusinessName(e.target.value)}
                                            className={inputClass}
                                            placeholder="Bella's Hair Studio"
                                            autoFocus
                                            required
                                        />
                                        <InputError message={errors.business_name} className="mt-1" />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-semibold uppercase tracking-widest text-on-surface-variant mb-1.5">Booking URL</label>
                                        <div className="flex items-center rounded-2xl bg-surface-container-low overflow-hidden focus-within:ring-2 focus-within:ring-primary/40">
                                            <span className="shrink-0 px-3 py-3 text-xs font-medium text-on-surface-variant border-r border-outline-variant bg-surface-container">
                                                bookslot.app/
                                            </span>
                                            <input
                                                value={data.slug}
                                                onChange={e => setData('slug', slugify(e.target.value))}
                                                className="flex-1 border-0 bg-transparent px-3 py-3 text-sm text-on-surface focus:ring-0"
                                                placeholder="bellas-hair-studio"
                                                required
                                            />
                                        </div>
                                        <p className="mt-1 text-xs text-on-surface-variant">Only lowercase letters, numbers, and hyphens.</p>
                                        <InputError message={errors.slug} className="mt-1" />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-semibold uppercase tracking-widest text-on-surface-variant mb-1.5">Location <span className="normal-case font-normal">(optional)</span></label>
                                        <input
                                            value={data.location}
                                            onChange={e => setData('location', e.target.value)}
                                            className={inputClass}
                                            placeholder="123 Main St, New York, NY"
                                        />
                                        <InputError message={errors.location} className="mt-1" />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-semibold uppercase tracking-widest text-on-surface-variant mb-1.5">Business Phone <span className="normal-case font-normal">(optional)</span></label>
                                        <input
                                            type="tel"
                                            value={data.phone}
                                            onChange={e => setData('phone', e.target.value)}
                                            className={inputClass}
                                            placeholder="+1 555 000 0000"
                                        />
                                        <InputError message={errors.phone} className="mt-1" />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-semibold uppercase tracking-widest text-on-surface-variant mb-1.5">
                                            Business Logo <span className="normal-case font-normal">(optional)</span>
                                        </label>
                                        <div className="rounded-2xl border border-dashed border-outline-variant/70 bg-surface-container-low px-4 py-4">
                                            <label className="flex cursor-pointer items-center justify-between gap-3 rounded-xl bg-surface px-4 py-3 transition-colors hover:bg-surface-container-low">
                                                <div className="min-w-0">
                                                    <p className="text-sm font-medium text-on-surface">
                                                        {data.logo ? data.logo.name : 'Upload your business logo'}
                                                    </p>
                                                    <p className="mt-1 text-xs text-on-surface-variant">
                                                        PNG, JPG, WEBP up to 2 MB.
                                                    </p>
                                                </div>
                                                <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-container text-on-primary-container">
                                                    <Icon name="upload" size="text-lg" />
                                                </span>
                                                <input
                                                    type="file"
                                                    accept="image/png,image/jpeg,image/webp,image/jpg"
                                                    className="hidden"
                                                    onChange={(e) => setData('logo', e.target.files?.[0] ?? null)}
                                                />
                                            </label>
                                        </div>
                                        <InputError message={errors.logo} className="mt-1" />
                                    </div>

                                    <label className="flex items-start gap-3 rounded-2xl border border-outline-variant/60 bg-surface-container-low/50 px-4 py-3 cursor-pointer hover:bg-surface-container-low transition-colors">
                                        <input
                                            type="checkbox"
                                            className="mt-0.5 rounded border-outline-variant text-on-surface focus:ring-primary/40"
                                            checked={data.also_works_as_staff}
                                            onChange={(e) => setData('also_works_as_staff', e.target.checked)}
                                        />
                                        <span className="text-sm text-on-surface leading-snug">
                                            <span className="font-semibold">I also provide services</span>
                                            <span className="block text-xs text-on-surface-variant mt-0.5">
                                                Show me on the booking page and team list so clients can book with me.
                                                You can change this later in Configuration.
                                            </span>
                                        </span>
                                    </label>
                                </div>

                                <div className="pt-6 flex items-center gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setStep(0)}
                                        className="flex items-center gap-1.5 rounded-2xl border border-outline-variant px-5 py-3.5 text-sm font-medium text-on-surface hover:bg-surface-container-low transition-all"
                                    >
                                        <Icon name="arrow_back" size="text-lg" /> Back
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={processing || !data.business_name || !data.slug}
                                        className="primary-gradient flex-1 flex items-center justify-center gap-2 rounded-2xl py-3.5 text-sm font-semibold text-white shadow-lg disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                                    >
                                        {processing ? 'Creating...' : 'Create Business'}
                                        {!processing && <Icon name="check_circle" size="text-lg" />}
                                    </button>
                                </div>
                            </div>
                        )}
                    </form>

                    <p className="mt-6 text-center text-sm text-on-surface-variant">
                        Already have an account?{' '}
                        <Link href={route('login')} className="font-semibold text-primary hover:underline">
                            Sign in
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
