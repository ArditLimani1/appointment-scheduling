import { Link, useForm } from '@inertiajs/react';
import { useEffect, useMemo, useRef, useState } from 'react';
import AuthLayout, { authInputClass, authInputNoIconClass } from '@/Layouts/AuthLayout';
import FilterListbox from '@/Components/FilterListbox';
import Icon from '@/Components/Icon';
import InputError from '@/Components/InputError';

const REGISTER_FEATURES = [
    { icon: 'link', text: 'URL-ja juaj: bookslot.app/biznesi-juaj' },
    { icon: 'group', text: 'Menaxhoni punonjësit dhe oraret e tyre' },
    { icon: 'payments', text: 'Ndiqni të ardhurat dhe takimet' },
];

function slugify(value) {
    return value
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-');
}

export default function Register({ businessTypeCategories = [] }) {
    const [step, setStep] = useState(0);
    const [showPassword, setShowPassword] = useState(false);
    const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);
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
        also_works_as_staff: false,
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
            1: ['business_name', 'business_type_id', 'slug', 'location', 'phone', 'logo', 'also_works_as_staff'],
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

    return (
        <AuthLayout
            headTitle="Krijoni biznesin tuaj"
            eyebrow="Konfigurim në pak minuta"
            heroTitle="Biznesi juaj,"
            heroAccent="online në minuta."
            heroSubtitle="Krijoni faqen tuaj të rezervimeve, menaxhoni ekipin dhe lejoni klientët të rezervojnë 24/7."
            features={REGISTER_FEATURES}
            stats={[]}
        >
            <div className="flex items-center gap-2 mb-8">
                {['Llogaria juaj', 'Biznesi juaj'].map((label, i) => (
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
                        <h2 className="text-3xl font-black font-headline text-on-surface tracking-tight mb-2">Krijoni llogarinë tuaj</h2>
                        <p className="text-sm text-on-surface-variant mb-6">Filloni me të dhënat tuaja personale.</p>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-semibold uppercase tracking-wider text-on-surface-variant mb-2">Emri i plotë</label>
                                <div className="relative">
                                    <Icon
                                        name="person"
                                        size="text-lg"
                                        className="absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant/60 pointer-events-none"
                                    />
                                    <input
                                        ref={nameRef}
                                        value={data.name}
                                        onChange={e => updateField('name', e.target.value)}
                                        className={authInputClass}
                                        placeholder="Jane Smith"
                                        autoFocus
                                        required
                                    />
                                </div>
                                <InputError message={errors.name} className="mt-1.5" />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold uppercase tracking-wider text-on-surface-variant mb-2">Adresa e email-it</label>
                                <div className="relative">
                                    <Icon
                                        name="mail"
                                        size="text-lg"
                                        className="absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant/60 pointer-events-none"
                                    />
                                    <input
                                        ref={emailRef}
                                        type="email"
                                        value={data.email}
                                        onChange={e => updateField('email', e.target.value)}
                                        className={authInputClass}
                                        placeholder="jane@example.com"
                                        required
                                    />
                                </div>
                                <InputError message={errors.email} className="mt-1.5" />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold uppercase tracking-wider text-on-surface-variant mb-2">Fjalëkalimi</label>
                                <div className="relative">
                                    <Icon
                                        name="lock"
                                        size="text-lg"
                                        className="absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant/60 pointer-events-none"
                                    />
                                    <input
                                        ref={passwordRef}
                                        type={showPassword ? 'text' : 'password'}
                                        value={data.password}
                                        onChange={e => updateField('password', e.target.value)}
                                        className={`${authInputClass} pr-11`}
                                        placeholder="Minimumi 8 karaktere"
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
                                <label className="block text-xs font-semibold uppercase tracking-wider text-on-surface-variant mb-2">Konfirmoni fjalëkalimin</label>
                                <div className="relative">
                                    <Icon
                                        name="lock"
                                        size="text-lg"
                                        className="absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant/60 pointer-events-none"
                                    />
                                    <input
                                        ref={passwordConfirmationRef}
                                        type={showPasswordConfirm ? 'text' : 'password'}
                                        value={data.password_confirmation}
                                        onChange={e => updateField('password_confirmation', e.target.value)}
                                        className={`${authInputClass} pr-11`}
                                        placeholder="Përsërisni fjalëkalimin"
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
                        </div>

                        <div className="pt-6">
                            <button
                                type="button"
                                onClick={() => setStep(1)}
                                disabled={!canContinue()}
                                className="primary-gradient w-full flex items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-semibold text-white shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                            >
                                Vazhdo <Icon name="arrow_forward" size="text-lg" />
                            </button>
                        </div>
                    </div>
                )}

                {step === 1 && (
                    <div className="space-y-1">
                        <h2 className="text-3xl font-black font-headline text-on-surface tracking-tight mb-2">Konfiguroni biznesin tuaj</h2>
                        <p className="text-sm text-on-surface-variant mb-6">Kështu do t'ju gjejnë dhe rezervojnë klientët.</p>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-semibold uppercase tracking-wider text-on-surface-variant mb-2">Emri i biznesit</label>
                                <div className="relative">
                                    <Icon
                                        name="storefront"
                                        size="text-lg"
                                        className="absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant/60 pointer-events-none"
                                    />
                                    <input
                                        ref={businessNameRef}
                                        value={data.business_name}
                                        onChange={e => handleBusinessName(e.target.value)}
                                        className={authInputClass}
                                        placeholder="Bella's Hair Studio"
                                        autoFocus
                                        required
                                    />
                                </div>
                                <InputError message={errors.business_name} className="mt-1.5" />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold uppercase tracking-wider text-on-surface-variant mb-2">Lloji i biznesit</label>
                                <FilterListbox
                                    value={data.business_type_id === '' ? null : data.business_type_id}
                                    onChange={(v) => {
                                        setData('business_type_id', v == null ? '' : Number(v));
                                        clearErrors('business_type_id');
                                    }}
                                    groups={businessTypeGroups}
                                    placeholder="Zgjidhni llojin e biznesit"
                                    showLabel={false}
                                    wrapperClassName="w-full"
                                    buttonClassName={`${authInputNoIconClass} flex cursor-pointer items-center justify-between gap-2 text-left`}
                                    panelClassName="z-[100] mt-1 max-h-60 w-[var(--button-width)] overflow-auto rounded-2xl border border-outline-variant/40 bg-surface-container-low py-1 shadow-lg ring-1 ring-black/5 outline-none transition duration-100 ease-out data-[closed]:scale-95 data-[closed]:opacity-0"
                                    optionClassName="group cursor-pointer px-3 py-2 text-sm text-on-surface data-[focus]:bg-surface-container data-[selected]:font-semibold data-[selected]:text-on-surface"
                                />
                                <InputError message={errors.business_type_id} className="mt-1.5" />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold uppercase tracking-wider text-on-surface-variant mb-2">URL për rezervime</label>
                                <div className="flex items-center rounded-xl border border-outline-variant/40 bg-surface overflow-hidden focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 transition-all">
                                    <span className="shrink-0 px-3 py-3 text-xs font-medium text-on-surface-variant border-r border-outline-variant/40 bg-surface-container-low">
                                        bookslot.app/
                                    </span>
                                    <input
                                        ref={slugRef}
                                        value={data.slug}
                                        onChange={e => updateField('slug', slugify(e.target.value))}
                                        className="flex-1 border-0 bg-transparent px-3 py-3 text-sm text-on-surface focus:ring-0 focus:outline-none"
                                        placeholder="bellas-hair-studio"
                                        required
                                    />
                                </div>
                                <p className="mt-1.5 text-xs text-on-surface-variant">Vetëm shkronja të vogla, numra dhe viza.</p>
                                <InputError message={errors.slug} className="mt-1.5" />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold uppercase tracking-wider text-on-surface-variant mb-2">Lokacioni <span className="normal-case font-normal">(opsionale)</span></label>
                                <div className="relative">
                                    <Icon
                                        name="location_on"
                                        size="text-lg"
                                        className="absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant/60 pointer-events-none"
                                    />
                                    <input
                                        ref={locationRef}
                                        value={data.location}
                                        onChange={e => updateField('location', e.target.value)}
                                        className={authInputClass}
                                        placeholder="Rruga Kryesore 123, Prishtinë"
                                    />
                                </div>
                                <InputError message={errors.location} className="mt-1.5" />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold uppercase tracking-wider text-on-surface-variant mb-2">Telefoni i biznesit <span className="normal-case font-normal">(opsionale)</span></label>
                                <div className="relative">
                                    <Icon
                                        name="call"
                                        size="text-lg"
                                        className="absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant/60 pointer-events-none"
                                    />
                                    <input
                                        ref={phoneRef}
                                        type="tel"
                                        value={data.phone}
                                        onChange={e => updateField('phone', e.target.value)}
                                        className={authInputClass}
                                        placeholder="+383 44 123 456"
                                    />
                                </div>
                                <InputError message={errors.phone} className="mt-1.5" />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold uppercase tracking-wider text-on-surface-variant mb-2">
                                    Logo e biznesit <span className="normal-case font-normal">(opsionale)</span>
                                </label>
                                <div className="rounded-xl border border-dashed border-outline-variant/70 bg-surface-container-low px-4 py-4">
                                    <label className="flex cursor-pointer items-center justify-between gap-3 rounded-xl bg-surface px-4 py-3 transition-colors hover:bg-surface-container-low">
                                        <div className="min-w-0">
                                            <p className="text-sm font-medium text-on-surface">
                                                {data.logo ? data.logo.name : 'Ngarkoni logon e biznesit'}
                                            </p>
                                            <p className="mt-1 text-xs text-on-surface-variant">
                                                PNG, JPG, WEBP deri në 2 MB.
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
                                <InputError message={errors.logo} className="mt-1.5" />
                            </div>

                            <label className="flex items-start gap-3 rounded-xl border border-outline-variant/60 bg-surface-container-low/50 px-4 py-3 cursor-pointer hover:bg-surface-container-low transition-colors">
                                <input
                                    type="checkbox"
                                    className="mt-0.5 rounded border-outline-variant text-on-surface focus:ring-primary/40"
                                    checked={data.also_works_as_staff}
                                    onChange={(e) => {
                                        setData('also_works_as_staff', e.target.checked);
                                        clearErrors('also_works_as_staff');
                                    }}
                                />
                                <span className="text-sm text-on-surface leading-snug">
                                    <span className="font-semibold">Ofroj edhe shërbime</span>
                                    <span className="block text-xs text-on-surface-variant mt-0.5">
                                        Më shfaq në faqen e rezervimeve dhe listën e ekipit që klientët të rezervojnë me mua.
                                        Mund ta ndryshoni më vonë në Konfigurim.
                                    </span>
                                </span>
                            </label>
                        </div>

                        <div className="pt-6 flex items-center gap-3">
                            <button
                                type="button"
                                onClick={() => setStep(0)}
                                className="flex items-center gap-1.5 rounded-xl border border-outline-variant px-5 py-3.5 text-sm font-medium text-on-surface hover:bg-surface-container-low transition-all"
                            >
                                <Icon name="arrow_back" size="text-lg" /> Kthehu
                            </button>
                            <button
                                type="submit"
                                disabled={processing || !data.business_name || !data.slug || !data.business_type_id}
                                className="primary-gradient flex-1 flex items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-semibold text-white shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                            >
                                {processing ? 'Duke krijuar...' : 'Krijo biznesin'}
                                {!processing && <Icon name="check_circle" size="text-lg" />}
                            </button>
                        </div>
                    </div>
                )}
            </form>

            <p className="mt-6 text-center text-sm text-on-surface-variant">
                Keni tashmë një llogari?{' '}
                <Link href={route('login')} className="font-semibold text-primary hover:underline">
                    Kyçuni
                </Link>
            </p>
        </AuthLayout>
    );
}
