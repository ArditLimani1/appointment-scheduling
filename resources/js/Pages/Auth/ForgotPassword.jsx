import { Link, useForm } from '@inertiajs/react';
import AuthLayout, { authInputClass } from '@/Layouts/AuthLayout';
import Icon from '@/Components/Icon';
import InputError from '@/Components/InputError';

export default function ForgotPassword({ status }) {
    const { data, setData, post, processing, errors } = useForm({
        email: '',
    });

    const submit = (e) => {
        e.preventDefault();
        post(route('password.email'));
    };

    return (
        <AuthLayout
            headTitle="Keni harruar fjalëkalimin"
            eyebrow="Rivendosje e sigurt"
            heroTitle="Rivendosni"
            heroAccent="fjalëkalimin tuaj."
            heroSubtitle="Ne do t'ju dërgojmë një lidhje të sigurt në email që të mund të krijoni një fjalëkalim të ri."
        >
            <div className="mb-8">
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-container mb-4">
                    <Icon name="lock_reset" size="text-2xl" className="text-on-primary-container" />
                </div>
                <h2 className="text-3xl font-black font-headline text-on-surface tracking-tight mb-2">Keni harruar fjalëkalimin?</h2>
                <p className="text-sm text-on-surface-variant">Pa problem. Jepni adresën tuaj të email-it dhe do t'ju dërgojmë një lidhje për të rivendosur fjalëkalimin.</p>
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
                            autoFocus
                            required
                        />
                    </div>
                    <InputError message={errors.email} className="mt-1.5" />
                </div>

                <div className="pt-2">
                    <button
                        type="submit"
                        disabled={processing}
                        className="primary-gradient w-full flex items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-semibold text-white shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                    >
                        {processing ? 'Duke dërguar…' : 'Dërgo lidhjen për rivendosje'}
                        {!processing && <Icon name="send" size="text-lg" />}
                    </button>
                </div>
            </form>

            <p className="mt-6 text-center text-sm text-on-surface-variant">
                <Link href={route('login')} className="inline-flex items-center gap-1 font-semibold text-primary hover:underline">
                    <Icon name="arrow_back" size="text-base" /> Kthehu tek kyçja
                </Link>
            </p>
        </AuthLayout>
    );
}
