import { Head, Link, usePage } from '@inertiajs/react';
import { useEffect, useRef, useState } from 'react';
import LanguageSwitcher from '@/i18n/LanguageSwitcher';
import { useT } from '@/i18n/useT';
import './Welcome.css';

const Logo = () => (
    <svg width="18" height="18" viewBox="0 0 64 64" fill="none">
        <circle cx="32" cy="32" r="24" stroke="currentColor" strokeWidth="5" fill="none" />
        <line x1="20" y1="44" x2="44" y2="20" stroke="currentColor" strokeWidth="5" strokeLinecap="round" />
        <line x1="32" y1="12" x2="32" y2="14" stroke="currentColor" strokeWidth="5" strokeLinecap="round" />
        <line x1="32" y1="50" x2="32" y2="52" stroke="currentColor" strokeWidth="5" strokeLinecap="round" />
    </svg>
);

const ArrowRight = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M5 12h14M13 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
);

const LoginIcon = ({ className = '' }) => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
        <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4M10 17l5-5-5-5M15 12H3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
);

const PlayIcon = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <polygon points="6 4 20 12 6 20 6 4" fill="currentColor" />
    </svg>
);

const MailGlyph = ({ size = 16 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="3" y="5" width="18" height="14" rx="2" />
        <path d="M3 7l9 6 9-6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
);

const WhatsAppGlyph = ({ size = 16 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2A10 10 0 0 0 3.4 17.2L2 22l4.9-1.3A10 10 0 1 0 12 2z" />
    </svg>
);

const StarSvg = ({ size = 7 }) => (
    <svg width={size} height={size} viewBox="0 0 12 12" fill="currentColor">
        <path d="M6 1l1.5 3 3.3.5-2.4 2.3.6 3.3L6 8.5 3 10.1l.6-3.3L1.2 4.5 4.5 4z" />
    </svg>
);

export default function Welcome({ auth, canLogin, canRegister }) {
    const t = useT();
    const { features } = usePage().props;
    const whatsappEnabled = features?.whatsapp ?? false;
    const [activeTab, setActiveTab] = useState('services');
    const [copied, setCopied] = useState(false);
    const [revText, setRevText] = useState('0');
    const [counts, setCounts] = useState({ total: 0, confirmed: 0, pending: 0, cancelled: 0, revenue: 0 });
    const rootRef = useRef(null);

    // Reveal-on-scroll
    useEffect(() => {
        const root = rootRef.current;
        if (!root) return;
        const io = new IntersectionObserver(
            (entries) => {
                entries.forEach((e) => {
                    if (e.isIntersecting) {
                        e.target.classList.add('in');
                        io.unobserve(e.target);
                    }
                });
            },
            { threshold: 0.12 },
        );
        root.querySelectorAll('.reveal').forEach((el) => io.observe(el));
        return () => io.disconnect();
    }, []);

    // Animate revenue number on mount
    useEffect(() => {
        const target = 2486;
        const start = performance.now();
        let raf;
        const tick = (now) => {
            const t = Math.min(1, (now - start) / 1500);
            const eased = 1 - Math.pow(1 - t, 3);
            setRevText(Math.round(target * eased).toLocaleString());
            if (t < 1) raf = requestAnimationFrame(tick);
        };
        raf = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(raf);
    }, []);

    // Animate analytics counts when analytics tab activates
    useEffect(() => {
        if (activeTab !== 'analytics') return;
        const targets = { total: 142, confirmed: 98, pending: 36, cancelled: 8, revenue: 2486 };
        const start = performance.now();
        let raf;
        const tick = (now) => {
            const t = Math.min(1, (now - start) / 1200);
            const eased = 1 - Math.pow(1 - t, 3);
            setCounts({
                total: Math.round(targets.total * eased),
                confirmed: Math.round(targets.confirmed * eased),
                pending: Math.round(targets.pending * eased),
                cancelled: Math.round(targets.cancelled * eased),
                revenue: Math.round(targets.revenue * eased),
            });
            if (t < 1) raf = requestAnimationFrame(tick);
        };
        raf = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(raf);
    }, [activeTab]);

    const handleCopy = () => {
        const url = `https://nitermin.com/${t('welcome.tile_link_slug')}`;
        if (navigator?.clipboard) navigator.clipboard.writeText(url).catch(() => {});
        setCopied(true);
        setTimeout(() => setCopied(false), 1800);
    };

    const primaryCtaHref = canRegister ? route('register') : '#';
    const loginHref = canLogin ? route('login') : '#';
    const dashboardHref = auth?.user ? route('dashboard') : '#';

    return (
        <>
            <Head title={t('welcome.meta_title')} />

            <div className="ntr-landing" ref={rootRef}>
                {/* NAV */}
                <header className="nav">
                    <div className="container nav-inner">
                        <Link href="/" className="brand">
                            <span className="logo">
                                <Logo />
                            </span>
                            <span className="word">nitermin<span className="dot">.</span></span>
                        </Link>
                        <nav className="nav-links">
                            <a href="#reminders">{t('welcome.nav_reminders')}</a>
                            <a href="#notifications">{t('welcome.nav_notifications')}</a>
                            <a href="#features">{t('welcome.nav_features')}</a>
                            <a href="#preview">{t('welcome.nav_product')}</a>
                            <a href="#faq">{t('welcome.nav_faq')}</a>
                        </nav>
                        <div className="nav-ctas">
                            <LanguageSwitcher />
                            {!auth?.user && canLogin && (
                                <Link
                                    href={loginHref}
                                    className="nav-login"
                                    title={t('welcome.nav_login_hint')}
                                >
                                    <LoginIcon className="nav-login-icon" />
                                    <span>{t('welcome.nav_login')}</span>
                                </Link>
                            )}
                            {auth?.user ? (
                                <Link href={dashboardHref} className="btn btn-ink nav-cta-trial nav-cta-dashboard">
                                    {t('welcome.nav_dashboard')}
                                    <ArrowRight className="nav-cta-arrow" />
                                </Link>
                            ) : (
                                canRegister && (
                                    <Link href={primaryCtaHref} className="btn btn-ink nav-cta-trial">
                                        <span className="nav-cta-label-full">{t('welcome.nav_cta_trial')}</span>
                                        <span className="nav-cta-label-mobile">{t('welcome.nav_cta_trial_mobile')}</span>
                                        <ArrowRight className="nav-cta-arrow" />
                                    </Link>
                                )
                            )}
                        </div>
                    </div>
                </header>

                {/* HERO */}
                <section className="hero">
                    <div className="container hero-grid">
                        <div>
                            <h1 className="h1">
                                {t('welcome.hero_h1_line1')} <em>{t('welcome.hero_h1_em')}</em> {t('welcome.hero_h1_line2')}
                            </h1>
                            <p className="lede">{t('welcome.hero_lede')}</p>
                            <div className="hero-ctas">
                                <Link href={primaryCtaHref} className="btn btn-hero-trial">
                                    <span className="btn-hero-trial-text">
                                        <span className="btn-hero-trial-lead">{t('welcome.hero_cta_primary_lead')}</span>
                                        <span className="btn-hero-trial-highlight">{t('welcome.hero_cta_primary_highlight')}</span>
                                    </span>
                                    <ArrowRight />
                                </Link>
                                <a href="#preview" className="btn btn-light">
                                    <PlayIcon /> {t('welcome.hero_cta_secondary')}
                                </a>
                            </div>
                            <div className="hero-trust">
                                <div className="avatars">
                                    <span>A</span><span>D</span><span>S</span><span>M</span><span>E</span>
                                </div>
                                <span>
                                    <strong>{t('welcome.hero_trust_strong_1')}</strong> {t('welcome.hero_trust_middle')}{' '}
                                    <strong>{t('welcome.hero_trust_strong_2')}</strong> {t('welcome.hero_trust_tail')}
                                </span>
                            </div>
                        </div>

                        <div className="hero-mock">
                            <div className="mock-card">
                                <div className="mock-head">
                                    <div className="dots"><span /><span /><span /></div>
                                    <span>{t('welcome.mock_url')}</span>
                                    <span>{t('welcome.mock_clinic')}</span>
                                </div>
                                <div className="mock-body">
                                    <div className="mock-filters">
                                        <span className="chip">{t('welcome.mock_filter_all_doctors')} ▾</span>
                                        <span className="chip">📅 {t('welcome.mock_filter_date')}</span>
                                        <span className="chip active">{t('welcome.mock_filter_week')} ▾</span>
                                        <span className="chip">{t('welcome.mock_filter_status')} ▾</span>
                                    </div>
                                    <div className="mock-staff">
                                        <span className="label">{t('welcome.mock_doctors_label')}</span>
                                        <span className="s"><span className="d" style={{ background: '#6366F1' }} />Dr. Agim</span>
                                        <span className="s"><span className="d" style={{ background: '#16A34A' }} />Dr. Sara</span>
                                        <span className="s"><span className="d" style={{ background: '#F43F5E' }} />Dr. Marko</span>
                                        <span className="s"><span className="d" style={{ background: '#F97316' }} />Dr. Elena</span>
                                    </div>
                                    <div className="mock-calendar">
                                        <div className="head" />
                                        <div className="head">HËN <strong>6</strong></div>
                                        <div className="head">MAR <strong>7</strong></div>
                                        <div className="head">MËR <strong>8</strong></div>
                                        <div className="head">ENJ <strong>9</strong></div>
                                        <div className="head">PRE <strong>10</strong></div>
                                        <div className="head">SHT <strong>11</strong></div>
                                        <div className="head">DIE <strong>12</strong></div>

                                        <div className="time">09:00</div>
                                        <div className="cell"><div className="event green" style={{ height: 46, animationDelay: '.1s' }}>Dr. Sara<small>{t('welcome.mock_event_gynec')}</small></div></div>
                                        <div className="cell"><div className="event purple" style={{ height: 22, animationDelay: '.2s' }}>Dr. Agim</div></div>
                                        <div className="cell" />
                                        <div className="cell"><div className="event green" style={{ height: 22, animationDelay: '.3s' }}>Dr. Sara<small>{t('welcome.mock_event_visit')}</small></div></div>
                                        <div className="cell"><div className="event coral" style={{ height: 22, animationDelay: '.4s' }}>Dr. Marko</div></div>
                                        <div className="cell" />
                                        <div className="cell" />

                                        <div className="time">10:00</div>
                                        <div className="cell" />
                                        <div className="cell"><div className="event coral" style={{ height: 46, animationDelay: '.5s' }}>Dr. Marko<small>{t('welcome.mock_event_echo')}</small></div></div>
                                        <div className="cell"><div className="event orange" style={{ height: 46, animationDelay: '.6s' }}>Dr. Elena<small>{t('welcome.mock_event_pediatric')}</small></div></div>
                                        <div className="cell" />
                                        <div className="cell" />
                                        <div className="cell" />
                                        <div className="cell" />

                                        <div className="time">11:00</div>
                                        <div className="cell"><div className="event purple" style={{ height: 46, animationDelay: '.7s' }}>Dr. Agim<small>{t('welcome.mock_event_checkup')}</small></div></div>
                                        <div className="cell" />
                                        <div className="cell"><div className="event purple" style={{ height: 22, animationDelay: '.8s' }}>Dr. Agim</div></div>
                                        <div className="cell" />
                                        <div className="cell"><div className="event orange" style={{ height: 46, animationDelay: '.9s' }}>Dr. Elena<small>{t('welcome.mock_event_vaccine')}</small></div></div>
                                        <div className="cell" />
                                        <div className="cell" />
                                    </div>
                                </div>
                            </div>

                            <div className="floater f1">
                                <span className="icon" style={{ background: '#D1FAE5', color: '#10B981' }}>
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                        <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                </span>
                                <div><strong>{t('welcome.floater_new_appt_title')}</strong><span>{t('welcome.floater_new_appt_body')}</span></div>
                            </div>
                            {whatsappEnabled ? (
                                <div className="floater f2">
                                    <span className="icon" style={{ background: '#DCFCE7', color: '#25D366' }}>
                                        <WhatsAppGlyph />
                                    </span>
                                    <div><strong>{t('welcome.floater_wa_title')}</strong><span>{t('welcome.floater_wa_body')}</span></div>
                                </div>
                            ) : null}
                            <div className="floater f3">
                                <span className="icon" style={{ background: '#FEF3C7', color: '#D97706' }}>
                                    <strong style={{ fontSize: 14 }}>€</strong>
                                </span>
                                <div><strong>{t('welcome.floater_revenue_amount')}</strong><span>{t('welcome.floater_revenue_body')}</span></div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* LOGO STRIP */}
                <section className="logos">
                    <div className="container">
                        <div className="label">{t('welcome.logos_label')}</div>
                        <div className="logos-row">
                            <span className="sans">POLIKLINIKA</span>
                            <span>Mediq&nbsp;Center</span>
                            <span className="mono">CLINICA·09</span>
                            <span>Vita&nbsp;Salus</span>
                            <span className="sans">NORTHWELL</span>
                            <span>San&nbsp;Lazar</span>
                        </div>
                    </div>
                </section>

                {/* REMINDERS */}
                <section className="rem-section" id="reminders">
                    <div className="container">
                        <div className="rem-wrap">
                            <div className="rem-copy reveal">
                                <span className="kicker">⬢ {t('welcome.rem_kicker')}</span>
                                <h2>
                                    {t('welcome.rem_h2_line1')} <em>{t('welcome.rem_h2_em')}</em> {t('welcome.rem_h2_line2')}
                                </h2>
                                <p className="lede">{t(whatsappEnabled ? 'welcome.rem_lede' : 'welcome.rem_lede_no_wa')}</p>
                                <div className="rem-cards">
                                    {whatsappEnabled ? (
                                        <div className="rem-card">
                                            <span className="rc-ic wa"><WhatsAppGlyph size={15} /></span>
                                            <b>{t('welcome.rem_card_wa_title')}</b>
                                            <span>{t('welcome.rem_card_wa_desc')}</span>
                                        </div>
                                    ) : null}
                                    <div className="rem-card">
                                        <span className="rc-ic em">
                                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <rect x="3" y="5" width="18" height="14" rx="2" /><path d="M3 7l9 6 9-6" />
                                            </svg>
                                        </span>
                                        <b>{t('welcome.rem_card_email_title')}</b>
                                        <span>{t('welcome.rem_card_email_desc')}</span>
                                    </div>
                                    <div className="rem-card">
                                        <span className="rc-ic bell">
                                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" />
                                            </svg>
                                        </span>
                                        <b>{t('welcome.rem_card_bell_title')}</b>
                                        <span>{t('welcome.rem_card_bell_desc')}</span>
                                    </div>
                                    <div className="rem-card">
                                        <span className="rc-ic lang">
                                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18" />
                                            </svg>
                                        </span>
                                        <b>{t('welcome.rem_card_lang_title')}</b>
                                        <span>{t('welcome.rem_card_lang_desc')}</span>
                                    </div>
                                </div>
                                <div className="hero-ctas">
                                    <Link href={primaryCtaHref} className="btn btn-blue">
                                        {t('welcome.rem_cta_primary')} <ArrowRight />
                                    </Link>
                                    <a href="#features" className="btn btn-light">{t('welcome.rem_cta_secondary')}</a>
                                </div>
                            </div>

                            <div className="rem-stage reveal">
                                <div className="phone">
                                    <div className="phone-screen phone-screen-mail">
                                        <div className="phone-statusbar">
                                            <span>9:41</span>
                                            <span>••• 5G ⏷</span>
                                        </div>
                                        <div className="phone-app phone-mail-app">
                                            <div className="mail-toolbar">
                                                <span className="back">‹</span>
                                                <span className="mail-title">{t('welcome.phone_mail_inbox')}</span>
                                                <span className="mail-action">
                                                    <MailGlyph size={15} />
                                                </span>
                                            </div>

                                            <div className="mail-open" style={{ animationDelay: '.1s' }}>
                                                <div className="mail-sender">
                                                    <span className="av em">K</span>
                                                    <div className="mail-sender-text">
                                                        <b>{t('welcome.mock_clinic')}</b>
                                                        <span>{t('welcome.phone_mail_from_addr')}</span>
                                                    </div>
                                                    <small>{t('welcome.phone_msg_time_1')}</small>
                                                </div>
                                                <div className="mail-subject">{t('welcome.phone_mail_subject_confirm')}</div>
                                                <div className="mail-body">
                                                    <b>{t('welcome.phone_msg_greeting_strong')}</b>
                                                    <p>{t('welcome.phone_msg_booking_intro')}</p>
                                                    <p><b>{t('welcome.phone_msg_booking_when')}</b></p>
                                                    <p>{t('welcome.phone_msg_booking_who')}</p>
                                                    <p className="mail-muted">{t('welcome.phone_msg_booking_addr')}</p>
                                                </div>
                                            </div>

                                            <div className="mail-divider">{t('welcome.phone_msg_24h_label')}</div>

                                            <div className="mail-preview" style={{ animationDelay: '1.1s' }}>
                                                <span className="mail-unread" />
                                                <div className="mail-preview-text">
                                                    <b>{t('welcome.phone_mail_subject_reminder')}</b>
                                                    <span>
                                                        {t('welcome.mock_clinic')} · {t('welcome.phone_msg_reminder_when')}
                                                    </span>
                                                </div>
                                                <small>{t('welcome.phone_msg_time_2')}</small>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="channels left">
                                    {whatsappEnabled ? (
                                        <div className="chan" style={{ animationDelay: '.4s' }}>
                                            <span className="ico wa"><WhatsAppGlyph /></span>
                                            <div><b>{t('welcome.chan_wa_title')}</b><span>{t('welcome.chan_wa_sub')}</span></div>
                                            <span className="live" />
                                        </div>
                                    ) : (
                                        <div className="chan" style={{ animationDelay: '.4s' }}>
                                            <span className="ico em">
                                                <MailGlyph size={14} />
                                            </span>
                                            <div><b>{t('welcome.chan_email_title')}</b><span>{t('welcome.chan_email_sub')}</span></div>
                                            <span className="live" />
                                        </div>
                                    )}
                                </div>
                                <div className="channels right">
                                    <div className="chan" style={{ animationDelay: '.8s' }}>
                                        <span className="ico bell">
                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                                            </svg>
                                        </span>
                                        <div><b>{t('welcome.chan_bell_title')}</b><span>{t('welcome.chan_bell_sub')}</span></div>
                                        <span className="live" />
                                    </div>
                                </div>

                                <div className="rem-stats">
                                    <div className="rem-stat"><div className="v">{t('welcome.rem_stat_1_value')}<em>{t('welcome.rem_stat_1_unit')}</em></div><small>{t('welcome.rem_stat_1_label')}</small></div>
                                    <div className="rem-stat"><div className="v">{t('welcome.rem_stat_2_value')}<em>{t('welcome.rem_stat_2_unit')}</em></div><small>{t('welcome.rem_stat_2_label')}</small></div>
                                    <div className="rem-stat"><div className="v">{t('welcome.rem_stat_3_value')}<em>{t('welcome.rem_stat_3_unit')}</em></div><small>{t('welcome.rem_stat_3_label')}</small></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* IN-APP NOTIFICATIONS */}
                <section className="inapp-section" id="notifications">
                    <div className="container">
                        <div className="inapp-wrap">
                            <div className="inapp-mock reveal">
                                <div className="inapp-bar">
                                    <div className="ttl">
                                        <span>{t('welcome.inapp_title')}</span>
                                        <span className="lv"><span className="pdot" />{t('welcome.inapp_live')}</span>
                                    </div>
                                    <div className="acts">
                                        <span className="iconbtn markall">{t('welcome.inapp_mark_all')}</span>
                                        <span className="iconbtn">⚙</span>
                                    </div>
                                </div>
                                <div className="inapp-filters">
                                    <span className="fpill active">{t('welcome.inapp_filter_all')} <span className="cnt">12</span></span>
                                    <span className="fpill">{t('welcome.inapp_filter_appts')} <span className="cnt">5</span></span>
                                    <span className="fpill">{t('welcome.inapp_filter_cancels')} <span className="cnt">2</span></span>
                                    <span className="fpill">{t('welcome.inapp_filter_payments')} <span className="cnt">3</span></span>
                                    <span className="fpill">{t('welcome.inapp_filter_system')}</span>
                                </div>
                                <div className="inapp-body">
                                    <div className="inapp-day">{t('welcome.inapp_day_today')}</div>
                                    <div className="toast-list">
                                        <div className="toast unread" style={{ animationDelay: '.1s' }}>
                                            <span className="tic book">
                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                                    <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
                                                </svg>
                                            </span>
                                            <div className="t-body">
                                                <div className="tt"><b>{t('welcome.toast_book_title')}</b><span className="tag book">{t('welcome.toast_book_tag')}</span></div>
                                                <p><b>{t('welcome.toast_book_who')}</b> {t('welcome.toast_book_body_tail')}</p>
                                                <div className="meta">
                                                    <span className="chip">{t('welcome.toast_book_when')}</span>
                                                    <span className="chip"><span className="dot p" />{t('welcome.toast_book_doctor')}</span>
                                                    <span className="chip">{t('welcome.toast_book_price')}</span>
                                                </div>
                                            </div>
                                            <div className="t-side">
                                                <span className="when">{t('welcome.toast_book_meta_when')}</span>
                                                <span className="qact">{t('welcome.toast_book_action')}</span>
                                            </div>
                                        </div>
                                        <div className="toast unread" style={{ animationDelay: '.25s' }}>
                                            <span className="tic cancel">
                                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                                    <line x1="6" y1="6" x2="18" y2="18" strokeLinecap="round" />
                                                    <line x1="6" y1="18" x2="18" y2="6" strokeLinecap="round" />
                                                </svg>
                                            </span>
                                            <div className="t-body">
                                                <div className="tt"><b>{t('welcome.toast_cancel_title')}</b><span className="tag cancel">{t('welcome.toast_cancel_tag')}</span></div>
                                                <p><b>{t('welcome.toast_cancel_who')}</b> {t('welcome.toast_cancel_body_tail')}</p>
                                                <div className="meta">
                                                    <span className="chip"><span className="dot c" />{t('welcome.toast_cancel_doctor')}</span>
                                                    <span className="chip">{t('welcome.toast_cancel_slot')}</span>
                                                </div>
                                            </div>
                                            <div className="t-side">
                                                <span className="when">{t('welcome.toast_cancel_when')}</span>
                                                <span className="qact">{t('welcome.toast_cancel_action')}</span>
                                            </div>
                                        </div>
                                        <div className="toast" style={{ animationDelay: '.4s' }}>
                                            <span className="tic pay"><strong>€</strong></span>
                                            <div className="t-body">
                                                <div className="tt"><b>{t('welcome.toast_pay_title')}</b><span className="tag pay">{t('welcome.toast_pay_tag')}</span></div>
                                                <p><b>{t('welcome.toast_pay_who')}</b> {t('welcome.toast_pay_paid')} <b>{t('welcome.toast_pay_amount')}</b> {t('welcome.toast_pay_for')}</p>
                                            </div>
                                            <div className="t-side">
                                                <span className="when">{t('welcome.toast_pay_when')}</span>
                                            </div>
                                        </div>
                                        <div className="toast" style={{ animationDelay: '.55s' }}>
                                            <span className="tic remind">
                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" />
                                                </svg>
                                            </span>
                                            <div className="t-body">
                                                <div className="tt"><b>{t('welcome.toast_remind_title')}</b><span className="tag remind">{t('welcome.toast_remind_tag')}</span></div>
                                                <p>{t(whatsappEnabled ? 'welcome.toast_remind_body' : 'welcome.toast_remind_body_no_wa')}</p>
                                            </div>
                                            <div className="t-side">
                                                <span className="when">{t('welcome.toast_remind_when')}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="inapp-foot">
                                    <span>{t('welcome.inapp_foot_count')}</span>
                                    <a href="#">{t('welcome.inapp_foot_link')}</a>
                                </div>
                            </div>

                            <div className="inapp-copy reveal">
                                <span className="kicker">⬡ {t('welcome.inapp_kicker')}</span>
                                <h3>
                                    {t('welcome.inapp_h3_line1')} <em>{t('welcome.inapp_h3_em')}</em>{t('welcome.inapp_h3_line2')}
                                </h3>
                                <p>{t('welcome.inapp_lede')}</p>
                                <ul className="inapp-list">
                                    <li>
                                        <span className="ic">
                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <circle cx="12" cy="12" r="9" /><polyline points="12 6 12 12 16 14" />
                                            </svg>
                                        </span>
                                        <div><b>{t('welcome.inapp_li_1_title')}</b>{t('welcome.inapp_li_1_desc')}</div>
                                    </li>
                                    <li>
                                        <span className="ic">
                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
                                            </svg>
                                        </span>
                                        <div><b>{t('welcome.inapp_li_2_title')}</b>{t('welcome.inapp_li_2_desc')}</div>
                                    </li>
                                    <li>
                                        <span className="ic">
                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <path d="M3 6h18M3 12h18M3 18h18" />
                                            </svg>
                                        </span>
                                        <div><b>{t('welcome.inapp_li_3_title')}</b>{t('welcome.inapp_li_3_desc')}</div>
                                    </li>
                                    <li>
                                        <span className="ic">
                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <rect x="4" y="4" width="16" height="16" rx="2" /><path d="M9 9h6v6H9z" />
                                            </svg>
                                        </span>
                                        <div><b>{t('welcome.inapp_li_4_title')}</b>{t('welcome.inapp_li_4_desc')}</div>
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </section>

                {/* FEATURES BENTO + PREVIEW */}
                <section className="section" id="features" style={{ paddingTop: 80 }}>
                    <div className="container">
                        <div className="section-head reveal">
                            <div className="kicker">{t('welcome.features_kicker')}</div>
                            <h2>
                                {t('welcome.features_h2_line1')} <em>{t('welcome.features_h2_em')}</em> {t('welcome.features_h2_line2')}
                            </h2>
                            <p>{t('welcome.features_desc')}</p>
                        </div>

                        <div className="bento">
                            {/* Revenue tile */}
                            <div className="tile t-1 reveal">
                                <div className="rev-card">
                                    <div className="rev-top">
                                        <div className="rev-meta">
                                            <span className="rev-dot"><span />{t('welcome.tile_revenue_live')}</span>
                                            <span className="rev-period">{t('welcome.tile_revenue_period')}</span>
                                        </div>
                                        <div className="rev-segs">
                                            <span>30D</span><span className="on">90D</span><span>1V</span>
                                        </div>
                                    </div>
                                    <div className="rev-label">{t('welcome.tile_revenue_label')}</div>
                                    <div className="rev-stat">
                                        <span className="cur">€</span><span>{revText}</span><span className="dec">.00</span>
                                    </div>
                                    <div className="rev-row">
                                        <div className="rev-trend">
                                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                                                <path d="M7 17l5-5 4 4 5-9" strokeLinecap="round" strokeLinejoin="round" />
                                            </svg>
                                            <span>+24.3%</span>
                                        </div>
                                        <span className="rev-vs">{t('welcome.tile_revenue_vs')}</span>
                                    </div>
                                    <svg className="spark" viewBox="0 0 300 70" fill="none" preserveAspectRatio="none">
                                        <defs>
                                            <linearGradient id="sparkG" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="0%" stopColor="#87C4FF" stopOpacity="0.45" />
                                                <stop offset="100%" stopColor="#87C4FF" stopOpacity="0" />
                                            </linearGradient>
                                            <linearGradient id="sparkLine" x1="0" y1="0" x2="1" y2="0">
                                                <stop offset="0%" stopColor="#5BA8FF" />
                                                <stop offset="100%" stopColor="#87C4FF" />
                                            </linearGradient>
                                        </defs>
                                        <path d="M0,55 L25,50 L50,46 L75,42 L100,36 L125,40 L150,30 L175,33 L200,22 L225,26 L250,16 L275,12 L300,6 L300,70 L0,70 Z" fill="url(#sparkG)" />
                                        <path d="M0,55 L25,50 L50,46 L75,42 L100,36 L125,40 L150,30 L175,33 L200,22 L225,26 L250,16 L275,12 L300,6" stroke="url(#sparkLine)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                                        <circle cx="300" cy="6" r="4" fill="#87C4FF" />
                                        <circle cx="300" cy="6" r="8" fill="#87C4FF" opacity="0.25" />
                                    </svg>
                                    <div className="rev-foot">
                                        <span className="rev-foot-dot" />
                                        <span>{t('welcome.tile_revenue_foot_1')}</span>
                                        <span className="rev-foot-sep">·</span>
                                        <span>{t('welcome.tile_revenue_foot_2')}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Services tile */}
                            <div className="tile t-2 reveal">
                                <div className="svc-head">
                                    <span className="t-icon" style={{ background: 'var(--blue-soft)', color: 'var(--blue)' }}>
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                                        </svg>
                                    </span>
                                    <div>
                                        <h3>{t('welcome.tile_svc_title')}</h3>
                                        <small className="svc-sub">{t('welcome.tile_svc_sub')}</small>
                                    </div>
                                </div>
                                <div className="svc-stack">
                                    <div className="svc-item">
                                        <span className="svc-dot" style={{ background: 'var(--blue)' }} />
                                        <div className="svc-info">
                                            <div className="svc-name">{t('welcome.svc_item_1_name')} <span className="svc-pop"><StarSvg />{t('welcome.tile_svc_pop')}</span></div>
                                            <small>{t('welcome.svc_item_1_dur')}</small>
                                        </div>
                                        <span className="svc-price">{t('welcome.svc_item_1_price')}</span>
                                    </div>
                                    <div className="svc-item">
                                        <span className="svc-dot" style={{ background: 'var(--purple)' }} />
                                        <div className="svc-info">
                                            <div className="svc-name">{t('welcome.svc_item_2_name')}</div>
                                            <small>{t('welcome.svc_item_2_dur')}</small>
                                        </div>
                                        <span className="svc-price">{t('welcome.svc_item_2_price')}</span>
                                    </div>
                                    <div className="svc-item">
                                        <span className="svc-dot" style={{ background: '#F43F5E' }} />
                                        <div className="svc-info">
                                            <div className="svc-name">{t('welcome.svc_item_3_name')}</div>
                                            <small>{t('welcome.svc_item_3_dur')}</small>
                                        </div>
                                        <span className="svc-price">{t('welcome.svc_item_3_price')}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Exports tile */}
                            <div className="tile t-3 reveal">
                                <div className="exp-head">
                                    <span className="t-icon" style={{ background: 'var(--mint-soft)', color: 'var(--mint)' }}>
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" strokeLinecap="round" strokeLinejoin="round" />
                                        </svg>
                                    </span>
                                    <div>
                                        <h3>{t('welcome.tile_exp_title')}</h3>
                                        <small className="svc-sub">{t('welcome.tile_exp_sub')}</small>
                                    </div>
                                </div>
                                <div className="exp-grid">
                                    <button className="exp-card pdf">
                                        <span className="exp-ic">
                                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                                                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><path d="M14 2v6h6" />
                                            </svg>
                                            <em>PDF</em>
                                        </span>
                                        <div className="exp-info"><b>{t('welcome.tile_exp_pdf_title')}</b><small>{t('welcome.tile_exp_pdf_sub')}</small></div>
                                    </button>
                                    <button className="exp-card xls">
                                        <span className="exp-ic">
                                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                                                <rect x="3" y="3" width="18" height="18" rx="2" /><path d="M3 9h18M9 3v18" />
                                            </svg>
                                            <em>XLS</em>
                                        </span>
                                        <div className="exp-info"><b>{t('welcome.tile_exp_xls_title')}</b><small>{t('welcome.tile_exp_xls_sub')}</small></div>
                                    </button>
                                </div>
                                <div className="exp-foot">
                                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <circle cx="12" cy="12" r="9" /><polyline points="12 7 12 12 15 14" />
                                    </svg>
                                    <span>{t('welcome.tile_exp_foot')}</span>
                                </div>
                            </div>

                            {/* Booking link tile (full-width) */}
                            <div className="tile t-7 reveal">
                                <div className="row">
                                    <div className="lhs">
                                        <span className="badge2">⬢ {t('welcome.tile_link_badge')}</span>
                                        <h3>
                                            {t('welcome.tile_link_h3_line1')} <em>{t('welcome.tile_link_h3_em')}</em> {t('welcome.tile_link_h3_line2')}
                                        </h3>
                                        <p>{t(whatsappEnabled ? 'welcome.tile_link_desc' : 'welcome.tile_link_desc_no_wa')}</p>
                                    </div>
                                    <div className="rhs">
                                        <div className="url-bar">
                                            <span className="proto">https://</span>
                                            <span className="host">nitermin.com</span>
                                            <span className="slash">/</span>
                                            <span className="slug">{t('welcome.tile_link_slug')}</span>
                                            <span className={`copy-btn${copied ? ' copied' : ''}`} onClick={handleCopy}>
                                                {copied ? (
                                                    <>
                                                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                                            <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
                                                        </svg>
                                                        {t('welcome.tile_link_copied')}
                                                    </>
                                                ) : (
                                                    <>
                                                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                            <rect x="9" y="9" width="13" height="13" rx="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                                                        </svg>
                                                        {t('welcome.tile_link_copy')}
                                                    </>
                                                )}
                                            </span>
                                        </div>
                                        <div className="url-share">
                                            <span className="lbl">{t('welcome.tile_link_share_label')}</span>
                                            {whatsappEnabled ? (
                                                <span className="pill"><span className="ic" style={{ color: '#25D366' }}><WhatsAppGlyph size={12} /></span>{t('welcome.tile_link_share_wa')}</span>
                                            ) : null}
                                            <span className="pill"><span className="ic" style={{ color: '#E1306C' }}>
                                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="4" /><circle cx="12" cy="12" r="4" /><circle cx="17.5" cy="6.5" r="1" fill="currentColor" /></svg>
                                            </span>{t('welcome.tile_link_share_ig')}</span>
                                            <span className="pill"><span className="ic" style={{ color: '#4285F4' }}>
                                                <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="10" /></svg>
                                            </span>{t('welcome.tile_link_share_g')}</span>
                                            <span className="pill">
                                                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="4" y="4" width="16" height="16" rx="2" /><path d="M9 9h6v6H9z" /></svg>
                                                {t('welcome.tile_link_share_qr')}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* PRODUCT PREVIEW */}
                        <div className="preview-wrap reveal" id="preview">
                            <div className="preview-tabs">
                                <button className={activeTab === 'services' ? 'active' : ''} onClick={() => setActiveTab('services')}>{t('welcome.preview_tab_services')}</button>
                                <button className={activeTab === 'calendar' ? 'active' : ''} onClick={() => setActiveTab('calendar')}>{t('welcome.preview_tab_calendar')}</button>
                                <button className={activeTab === 'analytics' ? 'active' : ''} onClick={() => setActiveTab('analytics')}>{t('welcome.preview_tab_analytics')}</button>
                                <button className={activeTab === 'booking' ? 'active' : ''} onClick={() => setActiveTab('booking')}>{t('welcome.preview_tab_booking')}</button>
                            </div>
                            <div className="preview-stage">

                                {/* Services pane */}
                                <div className={`preview-pane${activeTab === 'services' ? ' active' : ''}`}>
                                    <div className="adm">
                                        <aside className="adm-side">
                                            <div className="brand-mini">{t('welcome.adm_brand_mini')}</div>
                                            <div className="brand-sub">{t('welcome.adm_brand_sub')}</div>
                                            <div className="nav-item"><span className="i">▦</span>{t('welcome.adm_nav_dashboard')}</div>
                                            <div className="nav-item active"><span className="i">◐</span>{t('welcome.adm_nav_services')}</div>
                                            <div className="nav-item"><span className="i">◑</span>{t('welcome.adm_nav_doctors')}</div>
                                            <div className="nav-item"><span className="i">◒</span>{t('welcome.adm_nav_roles')}</div>
                                            <div className="nav-item"><span className="i">◤</span>{t('welcome.adm_nav_appts')}</div>
                                            <div className="nav-item"><span className="i">◥</span>{t('welcome.adm_nav_analytics')}</div>
                                            <div className="nav-item"><span className="i">◧</span>{t('welcome.adm_nav_settings')}</div>
                                        </aside>
                                        <div className="adm-main">
                                            <h4>{t('welcome.svc_page_title')}</h4>
                                            <div className="sub">{t('welcome.svc_page_sub')}</div>
                                            <div className="svc-card">
                                                <div className="svc-card-head"><span>{t('welcome.svc_card_head')}</span><span className="total">{t('welcome.svc_card_total')}</span></div>
                                                <div className="svc-row">
                                                    <span>{t('welcome.svc_col_name')}</span>
                                                    <span style={{ textAlign: 'left' }}>{t('welcome.svc_col_dur')}</span>
                                                    <span>{t('welcome.svc_col_price')}</span>
                                                    <span>{t('welcome.svc_col_status')}</span>
                                                    <span>{t('welcome.svc_col_actions')}</span>
                                                </div>
                                                <div className="svc-row">
                                                    <span className="name"><b>{t('welcome.svc_row_1_name')} <span className="pop"><StarSvg />{t('welcome.svc_pop_label')}</span></b><span>{t('welcome.svc_row_1_desc')}</span></span>
                                                    <span className="dur">{t('welcome.svc_row_1_dur')}</span>
                                                    <span className="price">{t('welcome.svc_row_1_price')}</span>
                                                    <div className="toggle" />
                                                    <div className="actions">✎ 🗑</div>
                                                </div>
                                                <div className="svc-row">
                                                    <span className="name"><b>{t('welcome.svc_row_2_name')} <span className="pop"><StarSvg />{t('welcome.svc_pop_label')}</span></b><span>{t('welcome.svc_row_2_desc')}</span></span>
                                                    <span className="dur">{t('welcome.svc_row_2_dur')}</span>
                                                    <span className="price">{t('welcome.svc_row_2_price')}</span>
                                                    <div className="toggle" />
                                                    <div className="actions">✎ 🗑</div>
                                                </div>
                                                <div className="svc-row">
                                                    <span className="name"><b>{t('welcome.svc_row_3_name')}</b><span>{t('welcome.svc_row_3_desc')}</span></span>
                                                    <span className="dur">{t('welcome.svc_row_3_dur')}</span>
                                                    <span className="price">{t('welcome.svc_row_3_price')}</span>
                                                    <div className="toggle" />
                                                    <div className="actions">✎ 🗑</div>
                                                </div>
                                                <div className="svc-row">
                                                    <span className="name"><b>{t('welcome.svc_row_4_name')}</b><span>{t('welcome.svc_row_4_desc')}</span></span>
                                                    <span className="dur">{t('welcome.svc_row_4_dur')}</span>
                                                    <span className="price">{t('welcome.svc_row_4_price')}</span>
                                                    <div className="toggle" />
                                                    <div className="actions">✎ 🗑</div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Calendar pane */}
                                <div className={`preview-pane${activeTab === 'calendar' ? ' active' : ''}`}>
                                    <div className="cal">
                                        <div className="cal-head">
                                            <span className="pill">{t('welcome.cal_filter_all_doctors')} ▾</span>
                                            <span className="pill">📅 {t('welcome.cal_filter_date')}</span>
                                            <span className="pill">{t('welcome.cal_filter_all_services')} ▾</span>
                                            <span className="pill">{t('welcome.cal_filter_status')} ▾</span>
                                            <span className="pill" style={{ flex: 1 }}>{t('welcome.cal_filter_search')}</span>
                                            <span className="pill">{t('welcome.cal_filter_clear')}</span>
                                            <span className="pill">‹</span>
                                            <span className="pill dark">{t('welcome.cal_filter_week')} ▾</span>
                                            <span className="pill">›</span>
                                        </div>
                                        <div className="cal-staff">
                                            <span style={{ color: 'var(--ink3)', letterSpacing: '1px', fontSize: 10, textTransform: 'uppercase' }}>{t('welcome.cal_doctors_label')}</span>
                                            <span className="s"><span className="d" style={{ background: '#6366F1' }} />Dr. Agim</span>
                                            <span className="s"><span className="d" style={{ background: '#16A34A' }} />Dr. Sara</span>
                                            <span className="s"><span className="d" style={{ background: '#F43F5E' }} />Dr. Marko</span>
                                            <span className="s"><span className="d" style={{ background: '#F97316' }} />Dr. Elena</span>
                                        </div>
                                        <div className="cal-grid">
                                            <div className="ch" />
                                            <div className="ch">HËN <strong>6</strong></div>
                                            <div className="ch">MAR <strong>7</strong></div>
                                            <div className="ch">MËR <strong>8</strong></div>
                                            <div className="ch">ENJ <strong>9</strong></div>
                                            <div className="ch">PRE <strong>10</strong></div>
                                            <div className="ch">SHT <strong>11</strong></div>
                                            <div className="ch">DIE <strong>12</strong></div>

                                            <div className="tc">09:00</div>
                                            <div className="gc"><div className="event green" style={{ position: 'absolute', left: 4, right: 4, top: 4, height: 50, animationDelay: '.1s' }}>Dr. Sara<small>{t('welcome.mock_event_gynec')}</small></div></div>
                                            <div className="gc"><div className="event purple" style={{ position: 'absolute', left: 4, right: 4, top: 4, height: 24, animationDelay: '.2s' }}>Dr. Agim</div></div>
                                            <div className="gc" />
                                            <div className="gc"><div className="event green" style={{ position: 'absolute', left: 4, right: 4, top: 4, height: 24, animationDelay: '.3s' }}>Dr. Sara<small>{t('welcome.mock_event_visit')}</small></div></div>
                                            <div className="gc"><div className="event coral" style={{ position: 'absolute', left: 4, right: 4, top: 4, height: 24, animationDelay: '.4s' }}>Dr. Marko</div></div>
                                            <div className="gc" />
                                            <div className="gc" />

                                            <div className="tc">10:00</div>
                                            <div className="gc" />
                                            <div className="gc"><div className="event coral" style={{ position: 'absolute', left: 4, right: 4, top: 4, height: 50, animationDelay: '.6s' }}>Dr. Marko<small>{t('welcome.mock_event_echo')}</small></div></div>
                                            <div className="gc" /><div className="gc" /><div className="gc" /><div className="gc" /><div className="gc" />

                                            <div className="tc">10:30</div>
                                            <div className="gc" /><div className="gc" /><div className="gc" /><div className="gc" />
                                            <div className="gc"><div className="event orange" style={{ position: 'absolute', left: 4, right: 4, top: 4, height: 50, animationDelay: '.7s' }}>Dr. Elena<small>{t('welcome.mock_event_vaccine')}</small></div></div>
                                            <div className="gc" /><div className="gc" />

                                            <div className="tc">11:00</div>
                                            <div className="gc" /><div className="gc" />
                                            <div className="gc"><div className="event purple" style={{ position: 'absolute', left: 4, right: 4, top: 4, height: 50, animationDelay: '.8s' }}>Dr. Agim<small>{t('welcome.mock_event_checkup')}</small></div></div>
                                            <div className="gc" /><div className="gc" /><div className="gc" /><div className="gc" />
                                        </div>
                                    </div>
                                </div>

                                {/* Analytics pane */}
                                <div className={`preview-pane${activeTab === 'analytics' ? ' active' : ''}`}>
                                    <h4 style={{ fontSize: 24, fontWeight: 700, letterSpacing: '-0.6px', marginBottom: 4 }}>{t('welcome.ana_h4')}</h4>
                                    <p style={{ color: 'var(--ink3)', fontSize: 13, marginBottom: 20 }}>{t('welcome.ana_sub')}</p>
                                    <div className="ana-grid">
                                        <div className="kpi-grid">
                                            <div className="kpi"><div className="l"><span className="ic" style={{ background: 'var(--blue-soft)', color: 'var(--blue)' }}>📅</span><small>{t('welcome.ana_kpi_total')}</small></div><div className="v">{counts.total.toLocaleString()}</div></div>
                                            <div className="kpi"><div className="l"><span className="ic" style={{ background: 'var(--mint-soft)', color: 'var(--mint)' }}>✓</span><small>{t('welcome.ana_kpi_confirmed')}</small></div><div className="v">{counts.confirmed.toLocaleString()}</div></div>
                                            <div className="kpi"><div className="l"><span className="ic" style={{ background: 'var(--amber-soft)', color: 'var(--amber)' }}>⏱</span><small>{t('welcome.ana_kpi_pending')}</small></div><div className="v">{counts.pending.toLocaleString()}</div></div>
                                            <div className="kpi"><div className="l"><span className="ic" style={{ background: 'var(--red-soft)', color: 'var(--red)' }}>✕</span><small>{t('welcome.ana_kpi_cancelled')}</small></div><div className="v">{counts.cancelled.toLocaleString()}</div></div>
                                        </div>
                                        <div className="kpi dark">
                                            <div className="l">
                                                <span className="ic">€</span>
                                                <small>{t('welcome.ana_kpi_revenue')}</small>
                                            </div>
                                            <div>
                                                <div className="v">{counts.revenue.toLocaleString()}<span style={{ fontSize: 18, color: 'rgba(255,255,255,0.55)', fontWeight: 500, marginLeft: 6 }}>.00 €</span></div>
                                                <p>{t('welcome.ana_kpi_revenue_sub')}</p>
                                            </div>
                                            <svg className="spark" viewBox="0 0 300 60" fill="none" preserveAspectRatio="none">
                                                <path d="M0,50 L40,42 L80,38 L120,32 L160,28 L200,20 L240,16 L300,8" stroke="#87C4FF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                                            </svg>
                                        </div>
                                    </div>
                                </div>

                                {/* Booking pane */}
                                <div className={`preview-pane${activeTab === 'booking' ? ' active' : ''}`}>
                                    <h4 style={{ fontSize: 24, fontWeight: 700, letterSpacing: '-0.6px', marginBottom: 4 }}>{t('welcome.book_h4')}</h4>
                                    <p style={{ color: 'var(--ink3)', fontSize: 13, marginBottom: 20 }}>{t('welcome.book_sub')}</p>
                                    <div className="book-grid">
                                        <div className="book-card">
                                            <div className="book-step"><div className="left"><span className="num">1</span>{t('welcome.book_step1')}</div><span style={{ color: 'var(--ink3)', fontSize: 18 }}>⌃</span></div>
                                            <div className="book-svc"><div className="l"><b>{t('welcome.book_svc_1')}</b><span>{t('welcome.book_svc_1_meta')}</span></div><div className="check" /></div>
                                            <div className="book-svc"><div className="l"><b>{t('welcome.book_svc_2')}</b><span>{t('welcome.book_svc_2_meta')}</span></div><div className="check" /></div>
                                            <div className="book-svc sel"><div className="l"><b>{t('welcome.book_svc_3')}</b><span>{t('welcome.book_svc_3_meta')}</span></div><div className="check">✓</div></div>
                                            <div className="book-step next"><div className="left"><span className="num">2</span>{t('welcome.book_step2')}</div><span style={{ fontSize: 18 }}>▾</span></div>
                                            <div className="book-step next"><div className="left"><span className="num">3</span>{t('welcome.book_step3')}</div><span style={{ fontSize: 18 }}>▾</span></div>
                                            <div className="book-step next"><div className="left"><span className="num">4</span>{t('welcome.book_step4')}</div><span style={{ fontSize: 18 }}>▾</span></div>
                                        </div>
                                        <div className="summary">
                                            <h5>{t('welcome.book_summary_title')}</h5>
                                            <div className="row"><span className="ic">⚕</span><div><b>{t('welcome.book_summary_svc')}</b><span style={{ color: 'var(--ink)', fontWeight: 600, fontSize: 13 }}>{t('welcome.book_svc_3')}</span><span style={{ display: 'block', color: 'var(--ink3)', fontSize: 11, marginTop: 1 }}>{t('welcome.book_summary_svc_meta')}</span></div></div>
                                            <div className="row"><span className="ic">⚕</span><div><b>{t('welcome.book_summary_doc')}</b><span style={{ color: 'var(--ink3)' }}>{t('welcome.book_summary_none')}</span></div></div>
                                            <div className="row"><span className="ic">📅</span><div><b>{t('welcome.book_summary_when')}</b><span style={{ color: 'var(--ink3)' }}>{t('welcome.book_summary_none')}</span></div></div>
                                            <div className="total"><span>{t('welcome.book_summary_total')}</span><span className="v">{t('welcome.book_summary_total_value')}</span></div>
                                            <span className="conf">{t('welcome.book_summary_confirm')}</span>
                                            <p style={{ fontSize: 10.5, color: 'var(--ink3)', textAlign: 'center', marginTop: 8 }}>{t('welcome.book_summary_terms')}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* HOW IT WORKS */}
                <section className="section" style={{ paddingTop: 0 }}>
                    <div className="container">
                        <div className="section-head reveal">
                            <div className="kicker">{t('welcome.steps_kicker')}</div>
                            <h2>
                                {t('welcome.steps_h2_line1')} <em>{t('welcome.steps_h2_em')}</em>{t('welcome.steps_h2_line2')}
                            </h2>
                        </div>
                        <div className="steps">
                            <div className="step reveal"><h4>{t('welcome.step_1_title')}</h4><p>{t('welcome.step_1_desc')}</p></div>
                            <div className="step reveal"><h4>{t('welcome.step_2_title')}</h4><p>{t('welcome.step_2_desc')}</p></div>
                            <div className="step reveal"><h4>{t('welcome.step_3_title')}</h4><p>{t('welcome.step_3_desc')}</p></div>
                            <div className="step reveal"><h4>{t('welcome.step_4_title')}</h4><p>{t('welcome.step_4_desc')}</p></div>
                        </div>
                    </div>
                </section>

                {/* TESTIMONIAL */}
                <section className="section" style={{ paddingTop: 0 }}>
                    <div className="container">
                        <div className="test reveal">
                            <div className="test-grid">
                                <div>
                                    <div className="test-q">
                                        {t('welcome.test_q_part1')} <em>{t('welcome.test_q_em')}</em>{t('welcome.test_q_part2')}
                                    </div>
                                    <div className="test-author">
                                        <span className="av">EM</span>
                                        <div><b>{t('welcome.test_author_name')}</b><span>{t('welcome.test_author_role')}</span></div>
                                    </div>
                                </div>
                                <div className="test-stats">
                                    <div className="test-stat"><div className="v">{t('welcome.test_stat_1_value')}<em>{t('welcome.test_stat_1_unit')}</em></div><small>{t('welcome.test_stat_1_label')}</small></div>
                                    <div className="test-stat"><div className="v">{t('welcome.test_stat_2_value')}</div><small>{t('welcome.test_stat_2_label')}</small></div>
                                    <div className="test-stat"><div className="v">{t('welcome.test_stat_3_value')}<em>{t('welcome.test_stat_3_unit')}</em></div><small>{t('welcome.test_stat_3_label')}</small></div>
                                    <div className="test-stat"><div className="v">{t('welcome.test_stat_4_value')}<em>{t('welcome.test_stat_4_unit')}</em></div><small>{t('welcome.test_stat_4_label')}</small></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* FAQ */}
                <section className="section" id="faq" style={{ paddingTop: 40 }}>
                    <div className="container">
                        <div className="faq-wrap">
                            <aside className="faq-aside reveal">
                                <span className="kicker">{t('welcome.faq_kicker')}</span>
                                <h2>
                                    {t('welcome.faq_h2_line1')} <em>{t('welcome.faq_h2_em')}</em> {t('welcome.faq_h2_line2')}
                                </h2>
                                <p>{t('welcome.faq_desc')}</p>
                                <div className="faq-help">
                                    <span className="av">A</span>
                                    <div>
                                        <b>{t('welcome.faq_help_name')}</b>
                                        <span>{t('welcome.faq_help_meta')}</span>
                                    </div>
                                    <a href="#">{t('welcome.faq_help_link')}</a>
                                </div>
                            </aside>

                            <div className="faq-list">
                                <details open className="reveal">
                                    <summary>
                                        <span className="num">01</span>
                                        <span className="q">{t('welcome.faq_q1')}</span>
                                        <span className="plus">+</span>
                                    </summary>
                                    <div className="a">{t('welcome.faq_a1')}</div>
                                </details>
                                <details className="reveal">
                                    <summary><span className="num">02</span><span className="q">{t(whatsappEnabled ? 'welcome.faq_q2' : 'welcome.faq_q2_no_wa')}</span><span className="plus">+</span></summary>
                                    <div className="a">{t(whatsappEnabled ? 'welcome.faq_a2' : 'welcome.faq_a2_no_wa')}</div>
                                </details>
                                <details className="reveal">
                                    <summary><span className="num">03</span><span className="q">{t('welcome.faq_q3')}</span><span className="plus">+</span></summary>
                                    <div className="a">{t('welcome.faq_a3')}</div>
                                </details>
                                <details className="reveal">
                                    <summary><span className="num">04</span><span className="q">{t('welcome.faq_q4')}</span><span className="plus">+</span></summary>
                                    <div className="a">{t('welcome.faq_a4')}</div>
                                </details>
                                <details className="reveal">
                                    <summary><span className="num">05</span><span className="q">{t('welcome.faq_q5')}</span><span className="plus">+</span></summary>
                                    <div className="a">{t('welcome.faq_a5')}</div>
                                </details>
                                <details className="reveal">
                                    <summary><span className="num">06</span><span className="q">{t('welcome.faq_q6')}</span><span className="plus">+</span></summary>
                                    <div className="a">{t('welcome.faq_a6')}</div>
                                </details>
                            </div>
                        </div>
                    </div>
                </section>

                {/* FOOTER */}
                <footer className="footer">
                    <div className="container">
                        <div className="foot-grid">
                            <div>
                                <Link href="/" className="brand" style={{ marginBottom: 14 }}>
                                    <span className="logo">
                                        <Logo />
                                    </span>
                                    <span className="word">nitermin<span className="dot">.</span></span>
                                </Link>
                                <p className="about" style={{ marginTop: 12 }}>{t('welcome.footer_about')}</p>
                            </div>
                            <div>
                                <h5>{t('welcome.footer_col_product')}</h5>
                                <ul>
                                    <li><a href="#features">{t('welcome.footer_link_features')}</a></li>
                                    <li><a href="#reminders">{t('welcome.footer_link_reminders')}</a></li>
                                    <li><a href="#notifications">{t('welcome.footer_link_notifications')}</a></li>
                                    <li><a href="#preview">{t('welcome.footer_link_demo')}</a></li>
                                </ul>
                            </div>
                            <div>
                                <h5>{t('welcome.footer_col_company')}</h5>
                                <ul>
                                    <li><a href="#">{t('welcome.footer_link_about')}</a></li>
                                    <li><a href="#">{t('welcome.footer_link_clients')}</a></li>
                                    <li><a href="#">{t('welcome.footer_link_careers')}</a></li>
                                    <li><a href="#">{t('welcome.footer_link_press')}</a></li>
                                </ul>
                            </div>
                            <div>
                                <h5>{t('welcome.footer_col_support')}</h5>
                                <ul>
                                    <li><a href="#">{t('welcome.footer_link_help')}</a></li>
                                    <li><a href="#">{t('welcome.footer_link_contact')}</a></li>
                                    <li><a href="#">{t('welcome.footer_link_status')}</a></li>
                                    <li><a href="#">{t('welcome.footer_link_privacy')}</a></li>
                                </ul>
                            </div>
                        </div>
                        <div className="foot-bottom">
                            <span>{t('welcome.footer_copy')}</span>
                            <span>{t('welcome.footer_version')}</span>
                        </div>
                    </div>
                </footer>
            </div>
        </>
    );
}
