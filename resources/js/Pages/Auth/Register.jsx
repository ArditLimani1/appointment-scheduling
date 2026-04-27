import { Head, Link, useForm } from '@inertiajs/react';
import { useEffect, useMemo, useRef, useState } from 'react';
import FilterListbox from '@/Components/FilterListbox';
import Icon from '@/Components/Icon';
import InputError from '@/Components/InputError';
import LanguageSwitcher from '@/i18n/LanguageSwitcher';
import { useT } from '@/i18n/useT';

function slugify(value) {
    return value
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-');
}

export default function Register({ businessTypeCategories = [] }) {
    const t = useT();
    const [step, setStep] = useState(0);
    const nameRef = useRef(null);
    const emailRef = useRef(null);
    const passwordRef = useRef(null);
    const passwordConfirmationRef = useRef(null);
    const businessNameRef = useRef(null);
    const slugRef = useRef(null);
    const locationRef = useRef(null);
    const phoneRef = useRef(null);
    const pendingFocusFieldRef = useRef(null);
    const { data, setData, post, processing, errors, reset, clearErrors } = useForm({
        name: '',
        email: '',
        password: '',
        password_confirmation: '',
        business_name: '',
        slug: '',
        business_type_id: '',
        location: '',
        phone: '',
        logo: null,
    });

    const handleBusinessName = (value) => {
        setData(prev => ({
            ...prev,
            business_name: value,
            slug: prev.slug === slugify(prev.business_name) ? slugify(value) : prev.slug,
        }));
        clearErrors('business_name', 'slug');
    };

    const canContinue = () => {
        return data.name && data.email && data.password && data.password_confirmation;
    };

    const updateField = (field, value) => {
        setData(field, value);
        clearErrors(field);
    };

    const focusFirstError = (formErrors) => {
        const errorFields = Object.keys(formErrors);

        if (errorFields.length === 0) {
            return;
        }

        const stepFieldMap = {
            0: ['name', 'email', 'password', 'password_confirmation'],
            1: ['business_name', 'business_type_id', 'slug', 'location', 'phone', 'logo'],
        };

        const firstStepWithError = [0, 1].find((stepNumber) =>
            stepFieldMap[stepNumber].some((field) => errorFields.includes(field)),
        );

        const focusMap = {
            name: nameRef,
            email: emailRef,
            password: passwordRef,
            password_confirmation: passwordConfirmationRef,
            business_name: businessNameRef,
            slug: slugRef,
            location: locationRef,
            phone: phoneRef,
        };

        const firstFocusableError = errorFields.find((field) => focusMap[field]?.current);
        const targetField = firstFocusableError ?? errorFields[0];

        if (firstStepWithError != null && firstStepWithError !== step) {
            pendingFocusFieldRef.current = targetField;
            setStep(firstStepWithError);
            return;
        }

        if (targetField && focusMap[targetField]?.current) {
            requestAnimationFrame(() => {
                focusMap[targetField].current?.focus();
            });
        }
    };

    useEffect(() => {
        if (!pendingFocusFieldRef.current) {
            return;
        }

        const focusMap = {
            name: nameRef,
            email: emailRef,
            password: passwordRef,
            password_confirmation: passwordConfirmationRef,
            business_name: businessNameRef,
            slug: slugRef,
            location: locationRef,
            phone: phoneRef,
        };

        const field = pendingFocusFieldRef.current;

        requestAnimationFrame(() => {
            focusMap[field]?.current?.focus();
            pendingFocusFieldRef.current = null;
        });
    }, [step]);

    const submit = (e) => {
        e.preventDefault();
        post(route('register'), {
            forceFormData: true,
            onFinish: () => reset('password', 'password_confirmation'),
            onError: (formErrors) => {
                focusFirstError(formErrors);
            },
        });
    };

    const inputClass = "w-full rounded-2xl border-0 bg-surface-container-low px-4 py-3 text-sm text-on-surface placeholder-on-surface-variant/50 focus:ring-2 focus:ring-primary/40 transition-all";

    const businessTypeGroups = useMemo(
        () =>
            businessTypeCategories.map((category) => ({
                name: category.name,
                options: category.types.map((type) => ({
                    value: type.id,
                    label: type.name,
                })),
            })),
        [businessTypeCategories],
    );

    return (
        <div className="min-h-screen bg-surface font-body flex">
            <Head title={t('auth_pages.register.head_title')} />

            <div className="hidden lg:flex lg:w-2/5 xl:w-1/2 flex-col justify-between bg-primary-container p-12 relative overflow-hidden">
                <div className="absolute inset-0 opacity-10"
                    style={{ backgroundImage: 'radial-gradient(circle at 30% 20%, white 1px, transparent 1px), radial-gradient(circle at 70% 80%, white 1px, transparent 1px)', backgroundSize: '40px 40px' }}
                />
                <div className="relative">
                    <Link href="/" className="flex items-center gap-2">
                        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/20">
                            <Icon name="calendar_month" size="text-xl" className="text-white" />
                        </div>
                        <span className="text-xl font-black font-headline text-white tracking-tight">BookSlot</span>
                    </Link>
                </div>
                <div className="relative space-y-6">
                    <h1 className="text-4xl xl:text-5xl font-black font-headline text-white leading-tight">
                        {t('auth_pages.register.hero_title')}
                    </h1>
                    <p className="text-white/80 text-lg leading-relaxed">
                        {t('auth_pages.register.hero_sub')}
                    </p>
                    <div className="space-y-3">
                        {[
                            { icon: 'link', text: t('auth_pages.register.feature_1') },
                            { icon: 'group', text: t('auth_pages.register.feature_2') },
                            { icon: 'payments', text: t('auth_pages.register.feature_3') },
                        ].map((item) => (
                            <div key={item.icon} className="flex items-center gap-3">
                                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/20">
                                    <Icon name={item.icon} size="text-base" className="text-white" />
                                </div>
                                <p className="text-sm text-white/90">{item.text}</p>
                            </div>
                        ))}
                    </div>
                </div>
                <p className="relative text-xs text-white/50">{t('auth_pages.register.copyright')}</p>
            </div>

            <div className="relative flex flex-1 flex-col items-center justify-center px-6 py-12 lg:px-12">
                <div className="absolute right-4 top-4 sm:right-6 sm:top-6 lg:right-8 lg:top-8">
                    <LanguageSwitcher />
                </div>
                <div className="w-full max-w-md">
                    <Link href="/" className="flex items-center gap-2 mb-8 lg:hidden">
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-container">
                            <Icon name="calendar_month" size="text-lg" className="text-white" />
                        </div>
                        <span className="text-lg font-black font-headline text-on-surface tracking-tight">BookSlot</span>
                    </Link>

                    <div className="flex items-center gap-2 mb-8">
                        {[t('auth_pages.register.step_account'), t('auth_pages.register.step_business')].map((label, i) => (
                            <div key={i} className="flex items-center gap-2">
                                <div className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold transition-all ${
                                    i < step ? 'bg-on-surface text-surface' : i === step ? 'bg-primary text-on-primary' : 'bg-surface-container-high text-on-surface-variant'
                                }`}>
                                    {i < step ? <Icon name="check" size="text-xs" /> : i + 1}
                                </div>
                                <span className={`text-xs font-medium ${i === step ? 'text-on-surface' : 'text-on-surface-variant'}`}>{label}</span>
                                {i < 1 && <div className={`mx-1 h-px w-8 ${i < step ? 'bg-on-surface' : 'bg-outline-variant'}`} />}
                            </div>
                        ))}
                    </div>

                    <form onSubmit={submit}>
                        {step === 0 && (
                            <div className="space-y-1">
                                <h2 className="text-2xl font-black font-headline text-on-surface mb-1">{t('auth_pages.register.account_title')}</h2>
                                <p className="text-sm text-on-surface-variant mb-6">{t('auth_pages.register.account_sub')}</p>

                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-xs font-semibold uppercase tracking-widest text-on-surface-variant mb-1.5">{t('auth_pages.register.full_name')}</label>
                                        <input
                                            ref={nameRef}
                                            value={data.name}
                                            onChange={e => updateField('name', e.target.value)}
                                            className={inputClass}
                                            placeholder={t('auth_pages.register.full_name_ph')}
                                            autoFocus
                                            required
                                        />
                                        <InputError message={errors.name} className="mt-1" />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-semibold uppercase tracking-widest text-on-surface-variant mb-1.5">{t('auth_pages.register.email')}</label>
                                        <input
                                            ref={emailRef}
                                            type="email"
                                            value={data.email}
                                            onChange={e => updateField('email', e.target.value)}
                                            className={inputClass}
                                            placeholder={t('auth_pages.register.email_ph')}
                                            required
                                        />
                                        <InputError message={errors.email} className="mt-1" />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-semibold uppercase tracking-widest text-on-surface-variant mb-1.5">{t('auth_pages.register.password')}</label>
                                        <input
                                            ref={passwordRef}
                                            type="password"
                                            value={data.password}
                                            onChange={e => updateField('password', e.target.value)}
                                            className={inputClass}
                                            placeholder={t('auth_pages.register.password_ph')}
                                            required
                                        />
                                        <InputError message={errors.password} className="mt-1" />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-semibold uppercase tracking-widest text-on-surface-variant mb-1.5">{t('auth_pages.register.password_confirm')}</label>
                                        <input
                                            ref={passwordConfirmationRef}
                                            type="password"
                                            value={data.password_confirmation}
                                            onChange={e => updateField('password_confirmation', e.target.value)}
                                            className={inputClass}
                                            placeholder={t('auth_pages.register.password_confirm_ph')}
                                            required
                                        />
                                        <InputError message={errors.password_confirmation} className="mt-1" />
                                    </div>
                                </div>

                                <div className="pt-6">
                                    <button
                                        type="button"
                                        onClick={() => setStep(1)}
                                        disabled={!canContinue()}
                                        className="primary-gradient w-full flex items-center justify-center gap-2 rounded-2xl py-3.5 text-sm font-semibold text-white shadow-lg disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                                    >
                                        {t('auth_pages.register.continue')} <Icon name="arrow_forward" size="text-lg" />
                                    </button>
                                </div>
                            </div>
                        )}

                        {step === 1 && (
                            <div className="space-y-1">
                                <h2 className="text-2xl font-black font-headline text-on-surface mb-1">{t('auth_pages.register.business_title')}</h2>
                                <p className="text-sm text-on-surface-variant mb-6">{t('auth_pages.register.business_sub')}</p>

                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-xs font-semibold uppercase tracking-widest text-on-surface-variant mb-1.5">{t('auth_pages.register.business_name')}</label>
                                        <input
                                            ref={businessNameRef}
                                            value={data.business_name}
                                            onChange={e => handleBusinessName(e.target.value)}
                                            className={inputClass}
                                            placeholder={t('auth_pages.register.business_name_ph')}
                                            autoFocus
                                            required
                                        />
                                        <InputError message={errors.business_name} className="mt-1" />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-semibold uppercase tracking-widest text-on-surface-variant mb-1.5">{t('auth_pages.register.business_type')}</label>
                                        <FilterListbox
                                            value={data.business_type_id === '' ? null : data.business_type_id}
                                            onChange={(v) => {
                                                setData('business_type_id', v == null ? '' : Number(v));
                                                clearErrors('business_type_id');
                                            }}
                                            groups={businessTypeGroups}
                                            placeholder={t('auth_pages.register.business_type_ph')}
                                            showLabel={false}
                                            wrapperClassName="w-full"
                                            buttonClassName={`${inputClass} flex cursor-pointer items-center justify-between gap-2 text-left`}
                                            panelClassName="z-[100] mt-1 max-h-60 w-[var(--button-width)] overflow-auto rounded-2xl border border-outline-variant/40 bg-surface-container-low py-1 shadow-lg ring-1 ring-black/5 outline-none transition duration-100 ease-out data-[closed]:scale-95 data-[closed]:opacity-0"
                                            optionClassName="group cursor-pointer px-3 py-2 text-sm text-on-surface data-[focus]:bg-surface-container data-[selected]:font-semibold data-[selected]:text-on-surface"
                                        />
                                        <InputError message={errors.business_type_id} className="mt-1" />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-semibold uppercase tracking-widest text-on-surface-variant mb-1.5">{t('auth_pages.register.booking_url')}</label>
                                        <div className="flex items-center rounded-2xl bg-surface-container-low overflow-hidden focus-within:ring-2 focus-within:ring-primary/40">
                                            <span className="shrink-0 px-3 py-3 text-xs font-medium text-on-surface-variant border-r border-outline-variant bg-surface-container">
                                                bookslot.app/
                                            </span>
                                            <input
                                                ref={slugRef}
                                                value={data.slug}
                                                onChange={e => updateField('slug', slugify(e.target.value))}
                                                className="flex-1 border-0 bg-transparent px-3 py-3 text-sm text-on-surface focus:ring-0"
                                                placeholder={t('auth_pages.register.booking_slug_ph')}
                                                required
                                            />
                                        </div>
                                        <p className="mt-1 text-xs text-on-surface-variant">{t('auth_pages.register.slug_help')}</p>
                                        <InputError message={errors.slug} className="mt-1" />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-semibold uppercase tracking-widest text-on-surface-variant mb-1.5">{t('auth_pages.register.location')} <span className="normal-case font-normal">{t('auth_pages.register.optional')}</span></label>
                                        <input
                                            ref={locationRef}
                                            value={data.location}
                                            onChange={e => updateField('location', e.target.value)}
                                            className={inputClass}
                                            placeholder={t('auth_pages.register.location_ph')}
                                        />
                                        <InputError message={errors.location} className="mt-1" />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-semibold uppercase tracking-widest text-on-surface-variant mb-1.5">{t('auth_pages.register.business_phone')} <span className="normal-case font-normal">{t('auth_pages.register.optional')}</span></label>
                                        <input
                                            ref={phoneRef}
                                            type="tel"
                                            value={data.phone}
                                            onChange={e => updateField('phone', e.target.value)}
                                            className={inputClass}
                                            placeholder={t('auth_pages.register.phone_ph')}
                                        />
                                        <InputError message={errors.phone} className="mt-1" />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-semibold uppercase tracking-widest text-on-surface-variant mb-1.5">
                                            {t('auth_pages.register.business_logo')} <span className="normal-case font-normal">{t('auth_pages.register.optional')}</span>
                                        </label>
                                        <div className="rounded-2xl border border-dashed border-outline-variant/70 bg-surface-container-low px-4 py-4">
                                            <label className="flex cursor-pointer items-center justify-between gap-3 rounded-xl bg-surface px-4 py-3 transition-colors hover:bg-surface-container-low">
                                                <div className="min-w-0">
                                                    <p className="text-sm font-medium text-on-surface">
                                                        {data.logo ? data.logo.name : t('auth_pages.register.upload_logo')}
                                                    </p>
                                                    <p className="mt-1 text-xs text-on-surface-variant">
                                                        {t('auth_pages.register.logo_help')}
                                                    </p>
                                                </div>
                                                <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-container text-on-primary-container">
                                                    <Icon name="upload" size="text-lg" />
                                                </span>
                                                <input
                                                    type="file"
                                                    accept="image/png,image/jpeg,image/webp,image/jpg"
                                                    className="hidden"
                                                    onChange={(e) => {
                                                        setData('logo', e.target.files?.[0] ?? null);
                                                        clearErrors('logo');
                                                    }}
                                                />
                                            </label>
                                        </div>
                                        <InputError message={errors.logo} className="mt-1" />
                                    </div>

                                </div>

                                <div className="pt-6 flex items-center gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setStep(0)}
                                        className="flex items-center gap-1.5 rounded-2xl border border-outline-variant px-5 py-3.5 text-sm font-medium text-on-surface hover:bg-surface-container-low transition-all"
                                    >
                                        <Icon name="arrow_back" size="text-lg" /> {t('auth_pages.register.back')}
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={processing || !data.business_name || !data.slug || !data.business_type_id}
                                        className="primary-gradient flex-1 flex items-center justify-center gap-2 rounded-2xl py-3.5 text-sm font-semibold text-white shadow-lg disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                                    >
                                        {processing ? t('auth_pages.register.creating') : t('auth_pages.register.create_business')}
                                        {!processing && <Icon name="check_circle" size="text-lg" />}
                                    </button>
                                </div>
                            </div>
                        )}
                    </form>

                    <p className="mt-6 text-center text-sm text-on-surface-variant">
                        {t('auth_pages.register.already_account')}{' '}
                        <Link href={route('login')} className="font-semibold text-primary hover:underline">
                            {t('auth_pages.register.sign_in')}
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
