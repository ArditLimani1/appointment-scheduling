import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import { useT } from '@/i18n/useT';
import GuestLayout from '@/Layouts/GuestLayout';
import { Head, useForm } from '@inertiajs/react';

export default function ConfirmPassword() {
    const t = useT();
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
        <GuestLayout>
            <Head title={t('auth_pages.confirm.head_title')} />

            <div className="mb-4 text-sm text-gray-600">
                {t('auth_pages.confirm.intro')}
            </div>

            <form onSubmit={submit}>
                <div className="mt-4">
                    <InputLabel htmlFor="password" value={t('auth_pages.confirm.password')} />

                    <TextInput
                        id="password"
                        type="password"
                        name="password"
                        value={data.password}
                        className="mt-1 block w-full"
                        isFocused={true}
                        onChange={(e) => setData('password', e.target.value)}
                    />

                    <InputError message={errors.password} className="mt-2" />
                </div>

                <div className="mt-4 flex items-center justify-end">
                    <PrimaryButton className="ms-4" disabled={processing}>
                        {t('auth_pages.confirm.submit')}
                    </PrimaryButton>
                </div>
            </form>
        </GuestLayout>
    );
}
