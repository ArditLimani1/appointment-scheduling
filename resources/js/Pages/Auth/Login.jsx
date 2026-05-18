import { Head, Link, useForm } from '@inertiajs/react';
import InputError from '@/Components/InputError';
import LanguageSwitcher from '@/i18n/LanguageSwitcher';
import { useT } from '@/i18n/useT';
import NiterminLogo from '@/Components/NiterminLogo';
import './Login.css';

const ArrowRight = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M5 12h14M13 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
);

const CheckGlyph = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4">
        <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
);

export default function Login({ status, canResetPassword }) {
    const t = useT();

    const featureBullets = [
        t('auth_pages.login.feature_1'),
        t('auth_pages.login.feature_2'),
        t('auth_pages.login.feature_3'),
    ];

    const { data, setData, post, processing, errors, reset } = useForm({
        email: '',
        password: '',
        remember: false,
    });

    const submit = (e) => {
        e.preventDefault();
        post(route('login'), { onFinish: () => reset('password') });
    };

    return (
        <div className="ntr-login-shell">
            <Head title={t('auth_pages.login.head_title')} />

            <div className="ntr-login-lang">
                <LanguageSwitcher />
            </div>

            <div className="ntr-login-grid">
                <section className="ntr-login-showcase">
                    <div className="ntr-login-noise" />

                    <Link href="/" className="ntr-login-brand">
                        <NiterminLogo
                            markClassName="ntr-login-brand-mark"
                            wordClassName="ntr-login-brand-word"
                            dotClassName="ntr-login-brand-dot"
                        />
                    </Link>

                    <div className="ntr-login-copy">
                        <h1>
                            {t('auth_pages.login.hero_title_main')}
                            <em> {t('auth_pages.login.hero_title_em')}</em>
                            <span>{t('auth_pages.login.hero_sub')}</span>
                        </h1>
                    </div>

                    <div className="ntr-login-text-list">
                        {featureBullets.map((text) => (
                            <div key={text} className="ntr-login-text-row">
                                <span className="ntr-login-point-icon">
                                    <CheckGlyph />
                                </span>
                                <p>{text}</p>
                            </div>
                        ))}
                    </div>

                </section>

                <section className="ntr-login-panel">
                    <div className="ntr-login-panel-inner">
                        <Link href="/" className="ntr-login-brand-mobile">
                            <NiterminLogo
                                markClassName="ntr-login-brand-mark-mobile"
                                wordClassName="ntr-login-brand-word-mobile"
                                dotClassName="ntr-login-brand-dot-mobile"
                            />
                        </Link>

                        <div className="ntr-login-form-head">
                            <span className="eyebrow">{t('auth_pages.login.brand')}</span>
                            <h2>{t('auth_pages.login.form_title')}</h2>
                            <p>{t('auth_pages.login.form_sub')}</p>
                        </div>

                        {status && (
                            <div className="ntr-login-status">
                                <CheckGlyph />
                                <span>{status}</span>
                            </div>
                        )}

                        <form onSubmit={submit} className="ntr-login-form">
                            <div className="ntr-login-field">
                                <label htmlFor="email">{t('auth_pages.login.email')}</label>
                                <input
                                    id="email"
                                    type="email"
                                    value={data.email}
                                    onChange={(e) => setData('email', e.target.value)}
                                    placeholder={t('auth_pages.login.email_ph')}
                                    autoComplete="username"
                                    autoFocus
                                    required
                                />
                                <InputError message={errors.email} className="mt-2" />
                            </div>

                            <div className="ntr-login-field">
                                <div className="ntr-login-field-head">
                                    <label htmlFor="password">{t('auth_pages.login.password')}</label>
                                    {canResetPassword && (
                                        <Link href={route('password.request')} className="ntr-login-inline-link">
                                            {t('auth_pages.login.forgot')}
                                        </Link>
                                    )}
                                </div>
                                <input
                                    id="password"
                                    type="password"
                                    value={data.password}
                                    onChange={(e) => setData('password', e.target.value)}
                                    placeholder="••••••••"
                                    autoComplete="current-password"
                                    required
                                />
                                <InputError message={errors.password} className="mt-2" />
                            </div>

                            <label className="ntr-login-remember">
                                <input
                                    type="checkbox"
                                    checked={data.remember}
                                    onChange={(e) => setData('remember', e.target.checked)}
                                />
                                <span className="box" />
                                <span className="text">{t('auth_pages.login.remember')}</span>
                            </label>

                            <button type="submit" disabled={processing} className="ntr-login-submit">
                                <span>{processing ? t('auth_pages.login.submitting') : t('auth_pages.login.submit')}</span>
                                {!processing && <ArrowRight />}
                            </button>
                        </form>

                        <p className="ntr-login-register">
                            {t('auth_pages.login.no_account')}{' '}
                            <Link href={route('register')}>{t('auth_pages.login.create')}</Link>
                        </p>
                    </div>
                </section>
            </div>
        </div>
    );
}
