import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';
import UpdatePasswordForm from './Partials/UpdatePasswordForm';
import UpdateProfileInformationForm from './Partials/UpdateProfileInformationForm';

export default function Edit({ mustVerifyEmail, status }) {
    return (
        <AuthenticatedLayout
            header={
                <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-on-surface-variant">
                        Account
                    </p>
                    <h2 className="mt-2 text-3xl font-black font-headline tracking-tight text-on-surface">
                        Profile Settings
                    </h2>
                    <p className="mt-2 max-w-2xl text-sm leading-relaxed text-on-surface-variant">
                        Manage your personal details and keep your account secure with the same clean workspace used across the rest of the app.
                    </p>
                </div>
            }
        >
            <Head title="Profile" />

            <div className="bg-surface py-10">
                <div className="mx-auto max-w-5xl space-y-6 px-6 lg:px-8">
                    <div className="overflow-hidden rounded-[2rem] border border-outline-variant bg-surface-container-lowest p-6 shadow-sm sm:p-8">
                        <UpdateProfileInformationForm
                            mustVerifyEmail={mustVerifyEmail}
                            status={status}
                            className="max-w-2xl"
                        />
                    </div>

                    <div className="overflow-hidden rounded-[2rem] border border-outline-variant bg-surface-container-lowest p-6 shadow-sm sm:p-8">
                        <UpdatePasswordForm className="max-w-2xl" />
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
