import InputError from '@/Components/InputError';
import Icon from '@/Components/Icon';
import { useForm } from '@inertiajs/react';
import { useRef } from 'react';

const inputClass =
    'w-full rounded-2xl border-0 bg-surface-container-low px-4 py-3 text-sm text-on-surface placeholder-on-surface-variant/50 transition-all focus:ring-2 focus:ring-primary/40';

export default function UpdatePasswordForm({ className = '' }) {
    const passwordInput = useRef(null);
    const currentPasswordInput = useRef(null);

    const {
        data,
        setData,
        errors,
        put,
        reset,
        processing,
        recentlySuccessful,
        clearErrors,
    } = useForm({
        current_password: '',
        password: '',
        password_confirmation: '',
    });

    const updatePassword = (e) => {
        e.preventDefault();

        put(route('password.update'), {
            preserveScroll: true,
            onSuccess: () => reset(),
            onError: (formErrors) => {
                if (formErrors.password) {
                    reset('password', 'password_confirmation');
                    passwordInput.current?.focus();
                }

                if (formErrors.current_password) {
                    reset('current_password');
                    currentPasswordInput.current?.focus();
                }
            },
        });
    };

    return (
        <section className={className}>
            <header className="border-b border-outline-variant pb-5">
                <div className="flex items-start gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-secondary-container text-on-secondary-container">
                        <Icon name="lock" size="text-xl" />
                    </div>
                    <div>
                        <h3 className="text-2xl font-black font-headline tracking-tight text-on-surface">
                            Update Password
                        </h3>
                        <p className="mt-2 max-w-xl text-sm leading-relaxed text-on-surface-variant">
                            Keep your account secure with a strong password that only you know.
                        </p>
                    </div>
                </div>
            </header>

            <form onSubmit={updatePassword} className="mt-8 space-y-6">
                <div>
                    <label
                        htmlFor="current_password"
                        className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.18em] text-on-surface-variant"
                    >
                        Current Password
                    </label>

                    <input
                        id="current_password"
                        ref={currentPasswordInput}
                        value={data.current_password}
                        onChange={(e) => {
                            setData('current_password', e.target.value);
                            clearErrors('current_password');
                        }}
                        type="password"
                        className={inputClass}
                        autoComplete="current-password"
                    />

                    <InputError
                        message={errors.current_password}
                        className="mt-2"
                    />
                </div>

                <div className="grid gap-6 sm:grid-cols-2">
                    <div>
                        <label
                            htmlFor="password"
                            className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.18em] text-on-surface-variant"
                        >
                            New Password
                        </label>

                        <input
                            id="password"
                            ref={passwordInput}
                            value={data.password}
                            onChange={(e) => {
                                setData('password', e.target.value);
                                clearErrors('password');
                            }}
                            type="password"
                            className={inputClass}
                            autoComplete="new-password"
                        />

                        <InputError message={errors.password} className="mt-2" />
                    </div>

                    <div>
                        <label
                            htmlFor="password_confirmation"
                            className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.18em] text-on-surface-variant"
                        >
                            Confirm Password
                        </label>

                        <input
                            id="password_confirmation"
                            value={data.password_confirmation}
                            onChange={(e) => {
                                setData('password_confirmation', e.target.value);
                                clearErrors('password_confirmation');
                            }}
                            type="password"
                            className={inputClass}
                            autoComplete="new-password"
                        />

                        <InputError
                            message={errors.password_confirmation}
                            className="mt-2"
                        />
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-3 pt-2">
                    <button
                        type="submit"
                        disabled={processing}
                        className="inline-flex items-center justify-center gap-2 rounded-2xl border border-outline-variant bg-surface px-6 py-3 text-sm font-semibold text-on-surface shadow-sm transition-colors hover:bg-surface-container-low disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        <Icon name="shield_lock" size="text-base" />
                        Save Password
                    </button>

                    {recentlySuccessful && (
                        <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700">
                            <Icon name="check_circle" size="text-base" />
                            Password updated
                        </span>
                    )}
                </div>
            </form>
        </section>
    );
}
