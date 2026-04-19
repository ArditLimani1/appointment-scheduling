import { Head, Link, useForm } from '@inertiajs/react';
import Icon from '@/Components/Icon';
import InputError from '@/Components/InputError';
import { useT } from '@/i18n/useT';
import { useMemo } from 'react';

export default function Login({ status, canResetPassword }) {
    const t = useT();
    const featureBullets = useMemo(
        () => [
            { icon: 'calendar_month', text: t('auth_pages.login.feature_1') },
            { icon: 'group', text: t('auth_pages.login.feature_2') },
            { icon: 'link', text: t('auth_pages.login.feature_3') },
        ],
        [t],
    );

    const { data, setData, post, processing, errors, reset } = useForm({
        email: '',
        password: '',
        remember: false,
    });

    const submit = (e) => {
        e.preventDefault();
        post(route('login'), { onFinish: () => reset('password') });
    };

    const inputClass = 'w-full rounded-2xl border-0 bg-surface-container-low px-4 py-3 text-sm text-on-surface placeholder-on-surface-variant/50 focus:ring-2 focus:ring-primary/40 transition-all';

    return (
        <div className="min-h-screen bg-surface font-body flex">
            <Head title={t('auth_pages.login.head_title')} />

            <div className="hidden lg:flex lg:w-2/5 xl:w-1/2 flex-col justify-between bg-primary-container p-12 relative overflow-hidden">
                <div
                    className="absolute inset-0 opacity-10"
                    style={{
                        backgroundImage:
                            'radial-gradient(circle at 30% 20%, white 1px, transparent 1px), radial-gradient(circle at 70% 80%, white 1px, transparent 1px)',
                        backgroundSize: '40px 40px',
                    }}
                />

                <div className="relative">
                    <Link href="/" className="flex items-center gap-2">
                        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/20">
                            <Icon name="calendar_month" size="text-xl" className="text-white" />
                        </div>
                        <span className="text-xl font-black font-headline text-white tracking-tight">{t('auth_pages.login.brand')}</span>
                    </Link>
                </div>

                <div className="relative space-y-6">
                    <h1 className="text-4xl xl:text-5xl font-black font-headline text-white leading-tight whitespace-pre-line">
                        {t('auth_pages.login.hero_title')}
                    </h1>
                    <p className="text-white/80 text-lg leading-relaxed">
                        {t('auth_pages.login.hero_sub')}
                    </p>
                    <div className="space-y-3">
                        {featureBullets.map((item) => (
                            <div key={item.icon} className="flex items-center gap-3">
                                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/20">
                                    <Icon name={item.icon} size="text-base" className="text-white" />
                                </div>
                                <p className="text-sm text-white/90">{item.text}</p>
                            </div>
                        ))}
                    </div>
                </div>

                <p className="relative text-xs text-white/50">{t('auth_pages.login.copyright')}</p>
            </div>

            <div className="flex flex-1 flex-col items-center justify-center px-6 py-12 lg:px-12">
                <div className="w-full max-w-md">

                    <Link href="/" className="flex items-center gap-2 mb-8 lg:hidden">
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-container">
                            <Icon name="calendar_month" size="text-lg" className="text-white" />
                        </div>
                        <span className="text-lg font-black font-headline text-on-surface tracking-tight">{t('auth_pages.login.brand')}</span>
                    </Link>

                    <h2 className="text-2xl font-black font-headline text-on-surface mb-1">{t('auth_pages.login.form_title')}</h2>
                    <p className="text-sm text-on-surface-variant mb-8">{t('auth_pages.login.form_sub')}</p>

                    {status && (
                        <div className="mb-6 flex items-center gap-2 rounded-2xl bg-tertiary-fixed/20 px-4 py-3 text-sm font-medium text-on-tertiary-container">
                            <Icon name="check_circle" size="text-base" filled />
                            {status}
                        </div>
                    )}

                    <form onSubmit={submit} className="space-y-4">
                        <div>
                            <label className="block text-xs font-semibold uppercase tracking-widest text-on-surface-variant mb-1.5">
                                {t('auth_pages.login.email')}
                            </label>
                            <input
                                id="email"
                                type="email"
                                value={data.email}
                                onChange={(e) => setData('email', e.target.value)}
                                className={inputClass}
                                placeholder={t('auth_pages.login.email_ph')}
                                autoComplete="username"
                                autoFocus
                                required
                            />
                            <InputError message={errors.email} className="mt-1" />
                        </div>

                        <div>
                            <div className="flex items-center justify-between mb-1.5">
                                <label className="block text-xs font-semibold uppercase tracking-widest text-on-surface-variant">
                                    {t('auth_pages.login.password')}
                                </label>
                                {canResetPassword && (
                                    <Link
                                        href={route('password.request')}
                                        className="text-xs font-semibold text-on-surface-variant hover:text-on-surface transition-colors"
                                    >
                                        {t('auth_pages.login.forgot')}
                                    </Link>
                                )}
                            </div>
                            <input
                                id="password"
                                type="password"
                                value={data.password}
                                onChange={(e) => setData('password', e.target.value)}
                                className={inputClass}
                                placeholder="••••••••"
                                autoComplete="current-password"
                                required
                            />
                            <InputError message={errors.password} className="mt-1" />
                        </div>

                        <label className="flex items-center gap-2.5 cursor-pointer select-none pt-1">
                            <div className="relative">
                                <input
                                    type="checkbox"
                                    checked={data.remember}
                                    onChange={(e) => setData('remember', e.target.checked)}
                                    className="peer sr-only"
                                />
                                <div className="w-9 h-5 rounded-full bg-surface-container-high peer-checked:bg-on-surface transition-colors duration-200" />
                                <div className="absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform duration-200 peer-checked:translate-x-4" />
                            </div>
                            <span className="text-sm text-on-surface-variant">{t('auth_pages.login.remember')}</span>
                        </label>

                        <div className="pt-2">
                            <button
                                type="submit"
                                disabled={processing}
                                className="primary-gradient w-full flex items-center justify-center gap-2 rounded-2xl py-3.5 text-sm font-semibold text-white shadow-lg disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                            >
                                {processing ? t('auth_pages.login.submitting') : t('auth_pages.login.submit')}
                                {!processing && <Icon name="arrow_forward" size="text-lg" />}
                            </button>
                        </div>
                    </form>

                    <p className="mt-6 text-center text-sm text-on-surface-variant">
                        {t('auth_pages.login.no_account')}{' '}
                        <Link href={route('register')} className="font-semibold text-primary hover:underline">
                            {t('auth_pages.login.create')}
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
