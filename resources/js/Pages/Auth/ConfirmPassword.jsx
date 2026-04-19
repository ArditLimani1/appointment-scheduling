import { useForm } from '@inertiajs/react';
import { useState } from 'react';
import AuthLayout, { authInputClass } from '@/Layouts/AuthLayout';
import Icon from '@/Components/Icon';
import InputError from '@/Components/InputError';

export default function ConfirmPassword() {
    const [showPassword, setShowPassword] = useState(false);
    const { data, setData, post, processing, errors, reset } = useForm({
        password: '',
    });

    const submit = (e) => {
        e.preventDefault();
        post(route('password.confirm'), {
            onFinish: () => reset('password'),
        });
    };

    return (
        <AuthLayout
            headTitle="Konfirmoni fjalëkalimin"
            eyebrow="Zonë e sigurt"
            heroTitle="Verifikim"
            heroAccent="i shpejtë."
            heroSubtitle="Po ju kërkojmë të konfirmoni fjalëkalimin për të mbrojtur llogarinë tuaj."
            stats={[]}
        >
            <div className="mb-8">
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-container mb-4">
                    <Icon name="shield_lock" size="text-2xl" className="text-on-primary-container" />
                </div>
                <h2 className="text-3xl font-black font-headline text-on-surface tracking-tight mb-2">Konfirmoni fjalëkalimin</h2>
                <p className="text-sm text-on-surface-variant">Kjo është një zonë e sigurt e aplikacionit. Ju lutemi konfirmoni fjalëkalimin tuaj para se të vazhdoni.</p>
            </div>

            <form onSubmit={submit} className="space-y-5">
                <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-on-surface-variant mb-2">
                        Fjalëkalimi
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
                            placeholder="••••••••"
                            autoComplete="current-password"
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

                <div className="pt-2">
                    <button
                        type="submit"
                        disabled={processing}
                        className="primary-gradient w-full flex items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-semibold text-white shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                    >
                        {processing ? 'Duke konfirmuar…' : 'Konfirmo'}
                        {!processing && <Icon name="check" size="text-lg" />}
                    </button>
                </div>
            </form>
        </AuthLayout>
    );
}
