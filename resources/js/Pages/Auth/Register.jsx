import { Head, Link, useForm } from '@inertiajs/react';
import { useEffect, useMemo, useRef, useState } from 'react';
import FilterListbox from '@/Components/FilterListbox';
import Icon from '@/Components/Icon';
import InputError from '@/Components/InputError';
import LanguageSwitcher from '@/i18n/LanguageSwitcher';
import { useT } from '@/i18n/useT';
import NiterminLogo from '@/Components/NiterminLogo';
import './Register.css';

const ArrowRight = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M5 12h14M13 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
);

const ArrowLeft = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M19 12H5M11 5l-7 7 7 7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
);

const CheckGlyph = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4">
        <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
);

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

    const heroTitle = t('auth_pages.register.hero_title');
    const [heroLine1, heroLine2] = heroTitle.split('\n');

    const steps = [t('auth_pages.register.step_account'), t('auth_pages.register.step_business')];

    return (
        <div className="ntr-reg-shell">
            <Head title={t('auth_pages.register.head_title')} />

            <div className="ntr-reg-lang">
                <LanguageSwitcher compact />
            </div>

            <div className="ntr-reg-grid">
                <section className="ntr-reg-showcase">
                    <div className="ntr-reg-noise" />

                    <Link href="/" className="ntr-reg-brand">
                        <NiterminLogo
                            markClassName="ntr-reg-brand-mark"
                            wordClassName="ntr-reg-brand-word"
                            dotClassName="ntr-reg-brand-dot"
                        />
                    </Link>

                    <div className="ntr-reg-copy">
                        <h1>
                            {heroLine1}
                            {heroLine2 && <em>{heroLine2}</em>}
                            <span>{t('auth_pages.register.hero_sub')}</span>
                        </h1>
                    </div>

                    <div className="ntr-reg-text-list">
                        {[
                            t('auth_pages.register.feature_1'),
                            t('auth_pages.register.feature_2'),
                            t('auth_pages.register.feature_3'),
                        ].map((text) => (
                            <div key={text} className="ntr-reg-text-row">
                                <span className="ntr-reg-point-icon">
                                    <CheckGlyph />
                                </span>
                                <p>{text}</p>
                            </div>
                        ))}
                    </div>
                </section>

                <section className="ntr-reg-panel">
                    <div className="ntr-reg-panel-inner">
                        <Link href="/" className="ntr-reg-brand-mobile">
                            <NiterminLogo
                                markClassName="ntr-reg-brand-mark-mobile"
                                wordClassName="ntr-reg-brand-word-mobile"
                                dotClassName="ntr-reg-brand-dot-mobile"
                            />
                        </Link>

                        <div className="ntr-reg-steps">
                            {steps.map((label, i) => (
                                <div
                                    key={i}
                                    className={`ntr-reg-step ${i === step ? 'is-active' : ''} ${i < step ? 'is-done' : ''}`}
                                >
                                    <span className="ntr-reg-step-dot">
                                        {i < step ? <CheckGlyph /> : i + 1}
                                    </span>
                                    <span className="ntr-reg-step-label">{label}</span>
                                    {i < steps.length - 1 && <span className="ntr-reg-step-bar" />}
                                </div>
                            ))}
                        </div>

                        <form onSubmit={submit}>
                            {step === 0 && (
                                <div>
                                    <div className="ntr-reg-form-head">
                                        <h2>{t('auth_pages.register.account_title')}</h2>
                                        <p>{t('auth_pages.register.account_sub')}</p>
                                    </div>

                                    <div className="ntr-reg-form">
                                        <div className="ntr-reg-field">
                                            <label htmlFor="name">{t('auth_pages.register.full_name')}</label>
                                            <input
                                                id="name"
                                                ref={nameRef}
                                                value={data.name}
                                                onChange={e => updateField('name', e.target.value)}
                                                placeholder={t('auth_pages.register.full_name_ph')}
                                                autoFocus
                                                required
                                            />
                                            <InputError message={errors.name} className="mt-2" />
                                        </div>

                                        <div className="ntr-reg-field">
                                            <label htmlFor="email">{t('auth_pages.register.email')}</label>
                                            <input
                                                id="email"
                                                ref={emailRef}
                                                type="email"
                                                value={data.email}
                                                onChange={e => updateField('email', e.target.value)}
                                                placeholder={t('auth_pages.register.email_ph')}
                                                autoComplete="username"
                                                required
                                            />
                                            <InputError message={errors.email} className="mt-2" />
                                        </div>

                                        <div className="ntr-reg-field">
                                            <label htmlFor="password">{t('auth_pages.register.password')}</label>
                                            <input
                                                id="password"
                                                ref={passwordRef}
                                                type="password"
                                                value={data.password}
                                                onChange={e => updateField('password', e.target.value)}
                                                placeholder={t('auth_pages.register.password_ph')}
                                                autoComplete="new-password"
                                                required
                                            />
                                            <InputError message={errors.password} className="mt-2" />
                                        </div>

                                        <div className="ntr-reg-field">
                                            <label htmlFor="password_confirmation">{t('auth_pages.register.password_confirm')}</label>
                                            <input
                                                id="password_confirmation"
                                                ref={passwordConfirmationRef}
                                                type="password"
                                                value={data.password_confirmation}
                                                onChange={e => updateField('password_confirmation', e.target.value)}
                                                placeholder={t('auth_pages.register.password_confirm_ph')}
                                                autoComplete="new-password"
                                                required
                                            />
                                            <InputError message={errors.password_confirmation} className="mt-2" />
                                        </div>

                                        <div className="ntr-reg-actions">
                                            <button
                                                type="button"
                                                onClick={() => setStep(1)}
                                                disabled={!canContinue()}
                                                className="ntr-reg-submit"
                                            >
                                                <span>{t('auth_pages.register.continue')}</span>
                                                <ArrowRight />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {step === 1 && (
                                <div>
                                    <div className="ntr-reg-form-head">
                                        <h2>{t('auth_pages.register.business_title')}</h2>
                                        <p>{t('auth_pages.register.business_sub')}</p>
                                    </div>

                                    <div className="ntr-reg-form">
                                        <div className="ntr-reg-field">
                                            <label htmlFor="business_name">{t('auth_pages.register.business_name')}</label>
                                            <input
                                                id="business_name"
                                                ref={businessNameRef}
                                                value={data.business_name}
                                                onChange={e => handleBusinessName(e.target.value)}
                                                placeholder={t('auth_pages.register.business_name_ph')}
                                                autoFocus
                                                required
                                            />
                                            <InputError message={errors.business_name} className="mt-2" />
                                        </div>

                                        <div className="ntr-reg-field">
                                            <label>{t('auth_pages.register.business_type')}</label>
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
                                                buttonClassName="ntr-reg-select"
                                                panelClassName="ntr-reg-select-panel"
                                                optionClassName="ntr-reg-select-option"
                                                groupHeadingClassName="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400"
                                            />
                                            <InputError message={errors.business_type_id} className="mt-2" />
                                        </div>

                                        <div className="ntr-reg-field">
                                            <label htmlFor="slug">{t('auth_pages.register.booking_url')}</label>
                                            <div className="ntr-reg-slug">
                                                <span className="ntr-reg-slug-prefix">nitermin.com/</span>
                                                <input
                                                    id="slug"
                                                    ref={slugRef}
                                                    value={data.slug}
                                                    onChange={e => updateField('slug', slugify(e.target.value))}
                                                    placeholder={t('auth_pages.register.booking_slug_ph')}
                                                    required
                                                />
                                            </div>
                                            <p className="ntr-reg-help">{t('auth_pages.register.slug_help')}</p>
                                            <InputError message={errors.slug} className="mt-2" />
                                        </div>

                                        <div className="ntr-reg-field">
                                            <label htmlFor="location">
                                                {t('auth_pages.register.location')} <span className="optional">{t('auth_pages.register.optional')}</span>
                                            </label>
                                            <input
                                                id="location"
                                                ref={locationRef}
                                                value={data.location}
                                                onChange={e => updateField('location', e.target.value)}
                                                placeholder={t('auth_pages.register.location_ph')}
                                            />
                                            <InputError message={errors.location} className="mt-2" />
                                        </div>

                                        <div className="ntr-reg-field">
                                            <label htmlFor="phone">
                                                {t('auth_pages.register.business_phone')} <span className="optional">{t('auth_pages.register.optional')}</span>
                                            </label>
                                            <input
                                                id="phone"
                                                ref={phoneRef}
                                                type="tel"
                                                value={data.phone}
                                                onChange={e => updateField('phone', e.target.value)}
                                                placeholder={t('auth_pages.register.phone_ph')}
                                            />
                                            <InputError message={errors.phone} className="mt-2" />
                                        </div>

                                        <div className="ntr-reg-field">
                                            <label>
                                                {t('auth_pages.register.business_logo')} <span className="optional">{t('auth_pages.register.optional')}</span>
                                            </label>
                                            <div className="ntr-reg-upload">
                                                <label className="ntr-reg-upload-inner">
                                                    <div className="ntr-reg-upload-text">
                                                        <p>
                                                            <span>{data.logo ? data.logo.name : t('auth_pages.register.upload_logo')}</span>
                                                            <Icon name="upload" size="text-lg" className="ntr-reg-upload-inline-icon" />
                                                        </p>
                                                    </div>
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
                                            <InputError message={errors.logo} className="mt-2" />
                                        </div>

                                        <div className="ntr-reg-actions">
                                            <button
                                                type="button"
                                                onClick={() => setStep(0)}
                                                className="ntr-reg-back"
                                            >
                                                <ArrowLeft />
                                                <span>{t('auth_pages.register.back')}</span>
                                            </button>
                                            <button
                                                type="submit"
                                                disabled={processing || !data.business_name || !data.slug || !data.business_type_id}
                                                className="ntr-reg-submit"
                                            >
                                                <span>{processing ? t('auth_pages.register.creating') : t('auth_pages.register.create_business')}</span>
                                                {!processing && <CheckGlyph />}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </form>

                        <p className="ntr-reg-login">
                            {t('auth_pages.register.already_account')}{' '}
                            <Link href={route('login')}>{t('auth_pages.register.sign_in')}</Link>
                        </p>
                    </div>
                </section>
            </div>
        </div>
    );
}
