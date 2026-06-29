import { useT } from '@/i18n/useT';
import AuthLayout from '@/Layouts/AuthLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import Icon from '@/Components/Icon';

export default function VerifyEmail({ status }) {
    const t = useT();
    const { post, processing } = useForm({});

    const submit = (e) => {
        e.preventDefault();

        post(route('verification.send'));
    };

    return (
        <AuthLayout
            headTitle={t('auth_pages.verify.head_title')}
            eyebrow={t('auth_pages.login.brand')}
            heroTitle={t('auth_pages.verify.hero_title')}
            heroAccent={t('auth_pages.verify.hero_accent')}
            heroSubtitle={t('auth_pages.verify.hero_subtitle')}
            features={[
                { icon: 'mark_email_read', text: t('auth_pages.verify.feature_1') },
                { icon: 'verified', text: t('auth_pages.verify.feature_2') },
                { icon: 'login', text: t('auth_pages.verify.feature_3') },
            ]}
            stats={[]}
        >
            <Head title={t('auth_pages.verify.head_title')} />

            <div className="rounded-3xl border border-outline-variant/40 bg-surface-container-lowest p-6 shadow-sm sm:p-8">
                <div className="mb-5 flex items-start gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary-container text-on-primary">
                        <Icon name="mail" size="text-xl" />
                    </div>
                    <div>
                        <h1 className="font-headline text-2xl font-extrabold text-on-surface">
                            {t('auth_pages.verify.head_title')}
                        </h1>
                        <p className="mt-2 text-sm leading-relaxed text-on-surface-variant">
                            {t('auth_pages.verify.intro')}
                        </p>
                    </div>
                </div>

                {status === 'verification-link-sent' && (
                    <div className="mb-5 rounded-2xl border border-tertiary-fixed/30 bg-tertiary-fixed/20 px-4 py-3 text-sm font-medium text-on-tertiary-fixed-variant">
                        {t('auth_pages.verify.resent')}
                    </div>
                )}

                <form onSubmit={submit} className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <button
                        type="submit"
                        disabled={processing}
                        className="inline-flex items-center justify-center gap-2 rounded-2xl bg-on-surface px-5 py-3 text-sm font-bold text-surface transition-opacity hover:opacity-90 disabled:opacity-50"
                    >
                        <Icon name={processing ? 'sync' : 'mail'} size="text-base" className={processing ? 'animate-spin' : ''} />
                        {t('auth_pages.verify.resend')}
                    </button>

                    <Link
                        href={route('logout')}
                        method="post"
                        as="button"
                        className="text-sm font-semibold text-on-surface-variant underline-offset-4 transition-colors hover:text-on-surface hover:underline"
                    >
                        {t('auth_pages.verify.logout')}
                    </Link>
                </form>
            </div>
        </AuthLayout>
    );
}
