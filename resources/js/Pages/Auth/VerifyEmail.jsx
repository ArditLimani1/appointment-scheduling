import { Link, useForm } from '@inertiajs/react';
import AuthLayout from '@/Layouts/AuthLayout';
import Icon from '@/Components/Icon';

export default function VerifyEmail({ status }) {
    const { post, processing } = useForm({});

    const submit = (e) => {
        e.preventDefault();
        post(route('verification.send'));
    };

    return (
        <AuthLayout
            headTitle="Verifikimi i email-it"
            eyebrow="Hapi i fundit"
            heroTitle="Verifikoni"
            heroAccent="email-in tuaj."
            heroSubtitle="Kontrolloni kutinë tuaj të email-it për të përfunduar regjistrimin dhe për të filluar të përdorni llogarinë tuaj."
            stats={[]}
        >
            <div className="mb-8">
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-container mb-4">
                    <Icon name="mark_email_read" size="text-2xl" className="text-on-primary-container" />
                </div>
                <h2 className="text-3xl font-black font-headline text-on-surface tracking-tight mb-2">Verifikoni email-in tuaj</h2>
                <p className="text-sm text-on-surface-variant">
                    Faleminderit që u regjistruat! Para se të filloni, ju lutemi verifikoni adresën tuaj të email-it duke klikuar lidhjen që ju dërguam. Nëse nuk e keni marrë email-in, do t'ju dërgojmë një tjetër.
                </p>
            </div>

            {status === 'verification-link-sent' && (
                <div className="mb-6 flex items-start gap-2 rounded-xl bg-tertiary-fixed/20 px-4 py-3 text-sm font-medium text-on-tertiary-container">
                    <Icon name="check_circle" size="text-base" filled className="mt-0.5 shrink-0" />
                    <span>Një lidhje e re verifikimi është dërguar në adresën tuaj të email-it.</span>
                </div>
            )}

            <form onSubmit={submit} className="space-y-4">
                <button
                    type="submit"
                    disabled={processing}
                    className="primary-gradient w-full flex items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-semibold text-white shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                >
                    {processing ? 'Duke dërguar…' : 'Ridërgo email-in e verifikimit'}
                    {!processing && <Icon name="send" size="text-lg" />}
                </button>

                <Link
                    href={route('logout')}
                    method="post"
                    as="button"
                    className="w-full flex items-center justify-center gap-2 rounded-xl border border-outline-variant px-5 py-3.5 text-sm font-medium text-on-surface hover:bg-surface-container-low transition-all"
                >
                    <Icon name="logout" size="text-base" /> Dilni
                </Link>
            </form>
        </AuthLayout>
    );
}
