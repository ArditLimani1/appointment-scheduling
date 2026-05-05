import InputError from '@/Components/InputError';
import Icon from '@/Components/Icon';
import { useT } from '@/i18n/useT';
import { Link, useForm, usePage } from '@inertiajs/react';

const inputClass =
    'w-full rounded-2xl border-0 bg-surface-container-low px-4 py-3 text-sm text-on-surface placeholder-on-surface-variant/50 transition-all focus:ring-2 focus:ring-primary/40';

export default function UpdateProfileInformation({
    mustVerifyEmail,
    status,
    className = '',
}) {
    const { auth, availableLocales, locale: appLocale } = usePage().props;
    const user = auth.user;
    const t = useT();

    const {
        data,
        setData,
        patch,
        errors,
        processing,
        recentlySuccessful,
        clearErrors,
        reset,
    } = useForm({
        name: user.name,
        email: user.email,
        locale: user.locale ?? appLocale ?? 'sq',
        current_password: '',
    });

    const emailChanged = data.email !== user.email;

    const submit = (e) => {
        e.preventDefault();
        patch(route('profile.update'), {
            onSuccess: () => reset('current_password'),
        });
    };

    return (
        <section className={className}>
            <header className="border-b border-outline-variant pb-5">
                <div className="flex items-start gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-container text-on-primary-container">
                        <Icon name="person" size="text-xl" />
                    </div>
                    <div>
                        <h3 className="text-2xl font-black font-headline tracking-tight text-on-surface">
                            {t('profile.info.card_title')}
                        </h3>
                        <p className="mt-2 max-w-xl text-sm leading-relaxed text-on-surface-variant">
                            {t('profile.info.card_subtitle')}
                        </p>
                    </div>
                </div>
            </header>

            <form onSubmit={submit} className="mt-8 space-y-6">
                <div className="grid gap-6 sm:grid-cols-2">
                    <div className="sm:col-span-1">
                        <label
                            htmlFor="name"
                            className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.18em] text-on-surface-variant"
                        >
                            {t('profile.info.full_name')}
                        </label>
                        <input
                            id="name"
                            className={inputClass}
                            value={data.name}
                            onChange={(e) => {
                                setData('name', e.target.value);
                                clearErrors('name');
                            }}
                            required
                            autoComplete="name"
                        />
                        <InputError className="mt-2" message={errors.name} />
                    </div>

                    <div className="sm:col-span-1">
                        <label
                            htmlFor="email"
                            className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.18em] text-on-surface-variant"
                        >
                            {t('profile.info.email_label')}
                        </label>
                        <input
                            id="email"
                            type="email"
                            className={inputClass}
                            value={data.email}
                            onChange={(e) => {
                                setData('email', e.target.value);
                                clearErrors('email');
                            }}
                            required
                            autoComplete="username"
                        />
                        <InputError className="mt-2" message={errors.email} />
                    </div>

                    {emailChanged && (
                        <div className="sm:col-span-2">
                            <label
                                htmlFor="current_password"
                                className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.18em] text-on-surface-variant"
                            >
                                {t('profile.info.current_password_for_email')}
                            </label>
                            <p className="mb-2 text-xs text-on-surface-variant">{t('profile.info.current_password_for_email_hint')}</p>
                            <input
                                id="current_password"
                                type="password"
                                className={inputClass}
                                value={data.current_password}
                                onChange={(e) => {
                                    setData('current_password', e.target.value);
                                    clearErrors('current_password');
                                }}
                                autoComplete="current-password"
                            />
                            <InputError className="mt-2" message={errors.current_password} />
                        </div>
                    )}

                    <div className="sm:col-span-2">
                        <label className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.18em] text-on-surface-variant">
                            {t('profile.edit.language')}
                        </label>
                        <p className="mb-2 text-xs text-on-surface-variant">{t('profile.edit.language_hint')}</p>
                        <select
                            id="locale"
                            value={data.locale || (availableLocales?.[0]?.code ?? 'sq')}
                            onChange={(e) => {
                                setData('locale', e.target.value);
                                clearErrors('locale');
                            }}
                            className={`${inputClass} cursor-pointer`}
                        >
                            {(availableLocales ?? []).map((item) => (
                                <option key={item.code} value={item.code}>
                                    {item.native}
                                </option>
                            ))}
                        </select>
                        <InputError className="mt-2" message={errors.locale} />
                    </div>
                </div>

                {mustVerifyEmail && user.email_verified_at === null && (
                    <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-4 text-sm text-amber-900">
                        <p className="font-medium">
                            {t('profile.info.unverified_title')}
                        </p>
                        <p className="mt-1 leading-relaxed text-amber-800/90">
                            {t('profile.info.unverified_body')}
                            <Link
                                href={route('verification.send')}
                                method="post"
                                as="button"
                                className="ml-1 font-semibold text-amber-900 underline decoration-amber-400 underline-offset-4"
                            >
                                {t('profile.info.resend_link')}
                            </Link>
                        </p>

                        {status === 'verification-link-sent' && (
                            <p className="mt-3 font-medium text-emerald-700">
                                {t('profile.info.verification_sent_banner')}
                            </p>
                        )}
                    </div>
                )}

                <div className="flex flex-wrap items-center gap-3 pt-2">
                    <button
                        type="submit"
                        disabled={processing}
                        className="primary-gradient inline-flex items-center justify-center gap-2 rounded-2xl px-6 py-3 text-sm font-semibold text-white shadow-lg transition-transform hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        <Icon name="save" size="text-base" />
                        {t('profile.info.save_changes')}
                    </button>

                    {recentlySuccessful && (
                        <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700">
                            <Icon name="check_circle" size="text-base" />
                            {t('profile.info.saved_success')}
                        </span>
                    )}
                </div>
            </form>
        </section>
    );
}
