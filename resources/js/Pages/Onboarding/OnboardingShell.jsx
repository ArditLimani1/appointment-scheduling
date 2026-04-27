import { Link, usePage } from '@inertiajs/react';
import { useEffect, useRef, useState } from 'react';
import Icon from '@/Components/Icon';
import NiterminLogo from '@/Components/NiterminLogo';
import LanguageSwitcher from '@/i18n/LanguageSwitcher';
import { useT } from '@/i18n/useT';

/**
 * Fullscreen, sidebar-free shell shared by the admin & employee onboarding wizards.
 * Renders branding, language/logout, hero copy, a compact numbered step rail
 * (1 — 2 — 3 …), the active step body with a slide+fade transition, and a sticky
 * footer with Back / Continue (or Finish) actions.
 */
export default function OnboardingShell({
    eyebrow,
    heroTitle,
    heroSubtitle,
    steps,
    currentStep,
    onStepClick,
    children,
    onBack,
    onContinue,
    isLastStep,
    isProcessing = false,
    canContinue = true,
}) {
    const t = useT();
    const { auth } = usePage().props;
    const user = auth?.user;

    const totalSteps = steps.length;
    const currentIndex = Math.max(0, Math.min(currentStep, totalSteps - 1));
    const activeStep = steps[currentIndex];
    const progressPct = Math.round(((currentIndex + 1) / totalSteps) * 100);

    const previousIndexRef = useRef(currentIndex);
    const [direction, setDirection] = useState('forward');

    useEffect(() => {
        if (previousIndexRef.current === currentIndex) {
            return;
        }
        setDirection(currentIndex >= previousIndexRef.current ? 'forward' : 'back');
        previousIndexRef.current = currentIndex;
    }, [currentIndex]);

    const animationClass =
        direction === 'back' ? 'animate-onboarding-step-back' : 'animate-onboarding-step-forward';

    return (
        <div className="min-h-screen bg-surface font-body flex flex-col">
            <header className="sticky top-0 z-30 border-b border-outline-variant/30 bg-surface/90 backdrop-blur-xl">
                <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-10">
                    <div className="flex items-center gap-3">
                        <NiterminLogo
                            markClassName="h-9 w-9 text-on-surface"
                            wordClassName="text-base font-semibold tracking-tight text-on-surface hidden sm:inline"
                            dotClassName="text-on-surface-variant"
                        />
                        <span className="hidden md:inline-flex items-center gap-2 rounded-full border border-outline-variant/40 bg-surface-container-lowest px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
                            <span className="h-1.5 w-1.5 rounded-full bg-on-tertiary-container animate-pulse" />
                            {eyebrow ?? t('onboarding.shared.eyebrow')}
                        </span>
                    </div>

                    <div className="flex items-center gap-2 sm:gap-3">
                        <LanguageSwitcher />
                        {user?.name && (
                            <div className="hidden md:flex items-center gap-2 rounded-full border border-outline-variant/40 bg-surface-container-lowest px-3 py-1.5">
                                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary-container text-on-primary text-[10px] font-bold">
                                    {user.name.charAt(0).toUpperCase()}
                                </div>
                                <span className="text-xs font-semibold text-on-surface">{user.name}</span>
                            </div>
                        )}
                        <Link
                            href={route('logout')}
                            method="post"
                            as="button"
                            className="inline-flex items-center gap-1.5 rounded-xl border border-outline-variant/40 bg-surface-container-lowest px-3 py-2 text-xs font-bold uppercase tracking-widest text-on-surface-variant hover:text-error transition-colors"
                        >
                            <Icon name="logout" size="text-sm" />
                            <span className="hidden sm:inline">{t('onboarding.shared.logout')}</span>
                        </Link>
                    </div>
                </div>
            </header>

            <main className="flex-1">
                <div className="mx-auto w-full max-w-5xl px-4 pb-32 pt-10 sm:px-6 sm:pt-14 lg:px-10">
                    <section className="mb-8 sm:mb-10">
                        <p className="mb-3 inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-on-surface-variant">
                            <Icon name="auto_awesome" size="text-sm" />
                            {t('onboarding.shared.step_label', {
                                current: currentIndex + 1,
                                total: totalSteps,
                            })}
                        </p>
                        <h1 className="text-3xl font-extrabold font-headline tracking-tight text-on-surface sm:text-4xl">
                            {heroTitle}
                        </h1>
                        {heroSubtitle && (
                            <p className="mt-2 text-sm text-on-surface-variant sm:text-base">{heroSubtitle}</p>
                        )}
                    </section>

                    <ol
                        className="mb-10 flex items-center justify-center gap-1 sm:gap-2"
                        aria-label={t('onboarding.shared.eyebrow')}
                    >
                        {steps.map((step, index) => {
                            const isActive = index === currentIndex;
                            const isComplete = index < currentIndex;
                            const isClickable = typeof onStepClick === 'function' && index <= currentIndex;
                            const dotTone = isActive
                                ? 'bg-on-surface text-surface ring-4 ring-on-surface/15 scale-105'
                                : isComplete
                                    ? 'bg-on-surface text-surface'
                                    : 'bg-surface-container-high text-on-surface-variant';
                            return (
                                <li key={step.id} className="flex items-center">
                                    <button
                                        type="button"
                                        onClick={() => isClickable && onStepClick(index)}
                                        disabled={!isClickable}
                                        title={step.label}
                                        aria-label={`${step.eyebrow} — ${step.label}`}
                                        aria-current={isActive ? 'step' : undefined}
                                        className={`relative flex h-9 w-9 items-center justify-center rounded-full text-sm font-extrabold transition-all duration-300 ${dotTone} ${
                                            isClickable ? 'cursor-pointer hover:opacity-90' : 'cursor-default'
                                        }`}
                                    >
                                        {isComplete ? <Icon name="check" size="text-base" /> : index + 1}
                                    </button>
                                    {index < totalSteps - 1 && (
                                        <span
                                            className={`mx-1 h-px w-6 transition-colors duration-300 sm:w-10 md:w-14 ${
                                                index < currentIndex ? 'bg-on-surface' : 'bg-outline-variant'
                                            }`}
                                            aria-hidden="true"
                                        />
                                    )}
                                </li>
                            );
                        })}
                    </ol>

                    <div className="rounded-3xl border border-outline-variant/40 bg-surface-container-lowest p-6 shadow-sm sm:p-10">
                        <div
                            key={currentIndex}
                            className={`${animationClass} will-change-transform`}
                        >
                            <div className="mb-6 sm:mb-8">
                                <div className="flex items-center gap-3">
                                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary-container text-on-primary">
                                        <Icon name={activeStep?.icon ?? 'tune'} size="text-xl" />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
                                            {activeStep?.eyebrow}
                                        </p>
                                        <h2 className="font-headline text-xl font-extrabold text-on-surface sm:text-2xl">
                                            {activeStep?.label}
                                        </h2>
                                    </div>
                                </div>
                                {activeStep?.description && (
                                    <p className="mt-3 max-w-3xl text-sm text-on-surface-variant">
                                        {activeStep.description}
                                    </p>
                                )}
                            </div>

                            <div>{children}</div>
                        </div>
                    </div>
                </div>
            </main>

            <footer className="fixed bottom-0 left-0 right-0 z-30 border-t border-outline-variant/30 bg-surface/95 backdrop-blur-xl">
                <div className="mx-auto flex max-w-5xl items-center gap-3 px-4 py-4 sm:px-6 sm:py-5 lg:px-10">
                    <div className="hidden flex-1 items-center gap-3 sm:flex">
                        <div className="relative h-2 w-full max-w-xs overflow-hidden rounded-full bg-surface-container">
                            <div
                                className="absolute inset-y-0 left-0 rounded-full bg-on-surface transition-all duration-500"
                                style={{ width: `${Math.max(8, progressPct)}%` }}
                            />
                        </div>
                        <span className="text-[11px] font-bold uppercase tracking-widest text-on-surface-variant">
                            {progressPct}%
                        </span>
                    </div>

                    <div className="ml-auto flex w-full items-center gap-3 sm:w-auto">
                        <button
                            type="button"
                            onClick={onBack}
                            disabled={currentIndex === 0 || isProcessing}
                            className="flex-1 inline-flex items-center justify-center gap-2 rounded-2xl border border-outline-variant/60 bg-surface-container-lowest px-5 py-3 text-sm font-bold text-on-surface hover:bg-surface-container transition-colors disabled:opacity-40 disabled:cursor-not-allowed sm:flex-none"
                        >
                            <Icon name="arrow_back" size="text-base" />
                            {t('onboarding.shared.back')}
                        </button>
                        <button
                            type="button"
                            onClick={onContinue}
                            disabled={isProcessing || !canContinue}
                            className="primary-gradient flex-1 inline-flex items-center justify-center gap-2 rounded-2xl px-6 py-3 text-sm font-bold text-white shadow-lg disabled:opacity-50 disabled:cursor-not-allowed sm:flex-none"
                        >
                            {isProcessing ? (
                                <>
                                    <Icon name="sync" size="text-base" className="animate-spin" />
                                    {t('onboarding.shared.saving')}
                                </>
                            ) : (
                                <>
                                    {isLastStep ? t('onboarding.shared.finish') : t('onboarding.shared.continue')}
                                    <Icon name={isLastStep ? 'check' : 'arrow_forward'} size="text-base" />
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </footer>
        </div>
    );
}
