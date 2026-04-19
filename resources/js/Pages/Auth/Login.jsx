import { Link, useForm } from '@inertiajs/react';
import { useState } from 'react';
import AuthLayout, { authInputClass } from '@/Layouts/AuthLayout';
import Icon from '@/Components/Icon';
import InputError from '@/Components/InputError';

export default function Login({ status, canResetPassword }) {
    const [showPassword, setShowPassword] = useState(false);
    const { data, setData, post, processing, errors, reset } = useForm({
        email: '',
        password: '',
        remember: false,
    });

    const submit = (e) => {
        e.preventDefault();
        post(route('login'), { onFinish: () => reset('password') });
    };

    return (
        <AuthLayout
            headTitle="Hyr"
            heroTitle="Mirë se erdhët"
            heroAccent="përsëri."
            heroSubtitle="Kyçuni për të menaxhuar ekipin, ndjekur rezervimet dhe për të mbajtur biznesin tuaj në ecje të rrjedhshme."
        >
            <div className="mb-8">
                <h2 className="text-3xl font-black font-headline text-on-surface tracking-tight mb-2">Kyçuni në llogarinë tuaj</h2>
                <p className="text-sm text-on-surface-variant">Jepni kredencialet tuaja për të vazhduar.</p>
            </div>

            {status && (
                <div className="mb-6 flex items-center gap-2 rounded-xl bg-tertiary-fixed/20 px-4 py-3 text-sm font-medium text-on-tertiary-container">
                    <Icon name="check_circle" size="text-base" filled />
                    {status}
                </div>
            )}

            <form onSubmit={submit} className="space-y-5">
                <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-on-surface-variant mb-2">
                        Adresa e email-it
                    </label>
                    <div className="relative">
                        <Icon
                            name="mail"
                            size="text-lg"
                            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant/60 pointer-events-none"
                        />
                        <input
                            id="email"
                            type="email"
                            value={data.email}
                            onChange={(e) => setData('email', e.target.value)}
                            className={authInputClass}
                            placeholder="jane@example.com"
                            autoComplete="username"
                            autoFocus
                            required
                        />
                    </div>
                    <InputError message={errors.email} className="mt-1.5" />
                </div>

                <div>
                    <div className="flex items-center justify-between mb-2">
                        <label className="block text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
                            Fjalëkalimi
                        </label>
                        {canResetPassword && (
                            <Link
                                href={route('password.request')}
                                className="text-xs font-semibold text-primary hover:underline transition-colors"
                            >
                                Keni harruar fjalëkalimin?
                            </Link>
                        )}
                    </div>
                    <div className="relative">
                        <Icon
                            name="lock"
                            size="text-lg"
                            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant/60 pointer-events-none"
                        />
                        <input
                            id="password"
                            type={showPassword ? 'text' : 'password'}
                            value={data.password}
                            onChange={(e) => setData('password', e.target.value)}
                            className={`${authInputClass} pr-11`}
                            placeholder="••••••••"
                            autoComplete="current-password"
                            required
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword((s) => !s)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-lg text-on-surface-variant/60 hover:text-on-surface hover:bg-surface-container-low transition-colors"
                            aria-label={showPassword ? 'Fshih fjalëkalimin' : 'Shfaq fjalëkalimin'}
                        >
                            <Icon name={showPassword ? 'visibility_off' : 'visibility'} size="text-lg" />
                        </button>
                    </div>
                    <InputError message={errors.password} className="mt-1.5" />
                </div>

                <label className="flex items-center gap-2.5 cursor-pointer select-none pt-1">
                    <div className="relative">
                        <input
                            type="checkbox"
                            checked={data.remember}
                            onChange={(e) => setData('remember', e.target.checked)}
                            className="peer sr-only"
                        />
                        <div className="w-9 h-5 rounded-full bg-surface-container-high peer-checked:bg-primary transition-colors duration-200" />
                        <div className="absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform duration-200 peer-checked:translate-x-4" />
                    </div>
                    <span className="text-sm text-on-surface-variant">Më mbaj të kyçur</span>
                </label>

                <div className="pt-2">
                    <button
                        type="submit"
                        disabled={processing}
                        className="primary-gradient w-full flex items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-semibold text-white shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                    >
                        {processing ? 'Duke u kyçur…' : 'Kyçu'}
                        {!processing && <Icon name="arrow_forward" size="text-lg" />}
                    </button>
                </div>
            </form>

            <div className="mt-8 relative">
                <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-outline-variant/30" />
                </div>
                <div className="relative flex justify-center">
                    <span className="bg-surface px-3 text-xs text-on-surface-variant">ose</span>
                </div>
            </div>

            <p className="mt-6 text-center text-sm text-on-surface-variant">
                Nuk keni llogari?{' '}
                <Link href={route('register')} className="font-semibold text-primary hover:underline">
                    Krijoni një tani
                </Link>
            </p>
        </AuthLayout>
    );
}
