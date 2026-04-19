import { useForm } from '@inertiajs/react';
import { useState } from 'react';
import AuthLayout, { authInputClass } from '@/Layouts/AuthLayout';
import Icon from '@/Components/Icon';
import InputError from '@/Components/InputError';

export default function ResetPassword({ token, email }) {
    const [showPassword, setShowPassword] = useState(false);
    const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);
    const { data, setData, post, processing, errors, reset } = useForm({
        token: token,
        email: email,
        password: '',
        password_confirmation: '',
    });

    const submit = (e) => {
        e.preventDefault();
        post(route('password.store'), {
            onFinish: () => reset('password', 'password_confirmation'),
        });
    };

    return (
        <AuthLayout
            headTitle="Rivendosni fjalëkalimin"
            eyebrow="Siguria juaj, përparësia jonë"
            heroTitle="Krijoni një"
            heroAccent="fjalëkalim të ri."
            heroSubtitle="Zgjidhni një fjalëkalim të fortë që nuk e përdorni në faqe të tjera."
        >
            <div className="mb-8">
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-container mb-4">
                    <Icon name="key" size="text-2xl" className="text-on-primary-container" />
                </div>
                <h2 className="text-3xl font-black font-headline text-on-surface tracking-tight mb-2">Rivendosni fjalëkalimin</h2>
                <p className="text-sm text-on-surface-variant">Jepni adresën tuaj të email-it dhe fjalëkalimin e ri për të vazhduar.</p>
            </div>

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
                            autoComplete="username"
                            required
                        />
                    </div>
                    <InputError message={errors.email} className="mt-1.5" />
                </div>

                <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-on-surface-variant mb-2">
                        Fjalëkalimi i ri
                    </label>
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
                            placeholder="Minimumi 8 karaktere"
                            autoComplete="new-password"
                            autoFocus
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

                <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-on-surface-variant mb-2">
                        Konfirmoni fjalëkalimin
                    </label>
                    <div className="relative">
                        <Icon
                            name="lock"
                            size="text-lg"
                            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant/60 pointer-events-none"
                        />
                        <input
                            id="password_confirmation"
                            type={showPasswordConfirm ? 'text' : 'password'}
                            value={data.password_confirmation}
                            onChange={(e) => setData('password_confirmation', e.target.value)}
                            className={`${authInputClass} pr-11`}
                            placeholder="Përsërisni fjalëkalimin e ri"
                            autoComplete="new-password"
                            required
                        />
                        <button
                            type="button"
                            onClick={() => setShowPasswordConfirm((s) => !s)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-lg text-on-surface-variant/60 hover:text-on-surface hover:bg-surface-container-low transition-colors"
                            aria-label={showPasswordConfirm ? 'Fshih fjalëkalimin' : 'Shfaq fjalëkalimin'}
                        >
                            <Icon name={showPasswordConfirm ? 'visibility_off' : 'visibility'} size="text-lg" />
                        </button>
                    </div>
                    <InputError message={errors.password_confirmation} className="mt-1.5" />
                </div>

                <div className="pt-2">
                    <button
                        type="submit"
                        disabled={processing}
                        className="primary-gradient w-full flex items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-semibold text-white shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                    >
                        {processing ? 'Duke rivendosur…' : 'Rivendos fjalëkalimin'}
                        {!processing && <Icon name="check_circle" size="text-lg" />}
                    </button>
                </div>
            </form>
        </AuthLayout>
    );
}
