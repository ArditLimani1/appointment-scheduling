import { Head, Link } from '@inertiajs/react';
import { useEffect, useRef, useState } from 'react';
import LanguageSwitcher from '@/i18n/LanguageSwitcher';
import { useT } from '@/i18n/useT';

const LANDING_CSS = `
.ntr-landing{
  --ink:#0A0A0F; --ink2:#3A3A45; --ink3:#6B6B78;
  --line:#E6E6EB; --line2:#EFEFF3;
  --bg:#F5F6F8; --paper:#FFFFFF;
  --navy:#0B1730; --navy2:#152544;
  --blue:#2A6FDB; --blue-soft:#E8F0FC;
  --mint:#10B981; --mint-soft:#D1FAE5;
  --amber:#F59E0B; --amber-soft:#FEF3C7;
  --red:#EF4444; --red-soft:#FEE2E2;
  --purple:#6366F1; --purple-soft:#E0E7FF;
  --green:#16A34A; --green-soft:#BBF7D0;
  --orange:#F97316; --orange-soft:#FED7AA;
  --whatsapp:#25D366;
  background:var(--bg);color:var(--ink);
  font-family:'Inter',system-ui,sans-serif;-webkit-font-smoothing:antialiased;line-height:1.5;
}
.ntr-landing *{box-sizing:border-box}
.ntr-landing a{color:inherit;text-decoration:none}
.ntr-landing button{font-family:inherit;cursor:pointer;border:none;background:none;color:inherit}
.ntr-landing img{max-width:100%;display:block}
.ntr-landing .container{max-width:1240px;margin:0 auto;padding:0 32px}

/* Nav */
.ntr-landing .nav{position:sticky;top:0;z-index:50;backdrop-filter:saturate(180%) blur(14px);-webkit-backdrop-filter:saturate(180%) blur(14px);background:rgba(245,246,248,0.78);border-bottom:1px solid rgba(0,0,0,0.04)}
.ntr-landing .nav-inner{display:flex;align-items:center;justify-content:space-between;height:68px}
.ntr-landing .brand{display:flex;align-items:center;gap:10px;font-weight:600;letter-spacing:-0.5px;font-size:20px;color:var(--ink)}
.ntr-landing .brand .logo{width:32px;height:32px;border-radius:9px;background:var(--ink);display:flex;align-items:center;justify-content:center;color:#fff}
.ntr-landing .brand .word .dot{color:var(--ink3)}
.ntr-landing .nav-links{display:flex;align-items:center;gap:32px;font-size:14px;color:var(--ink2);font-weight:500}
.ntr-landing .nav-links a{position:relative;padding:6px 0;transition:color .15s}
.ntr-landing .nav-links a:hover{color:var(--ink)}
.ntr-landing .nav-links a::after{content:'';position:absolute;left:0;right:100%;bottom:0;height:1.5px;background:var(--ink);transition:right .25s ease}
.ntr-landing .nav-links a:hover::after{right:0}
.ntr-landing .nav-ctas{display:flex;align-items:center;gap:10px}
.ntr-landing .btn{display:inline-flex;align-items:center;gap:8px;padding:11px 18px;border-radius:10px;font-size:14px;font-weight:500;transition:transform .15s ease, background .15s ease, box-shadow .2s ease;white-space:nowrap;cursor:pointer}
.ntr-landing .btn-ghost{color:var(--ink2)}
.ntr-landing .btn-ghost:hover{background:rgba(0,0,0,0.04);color:var(--ink)}
.ntr-landing .btn-ink{background:var(--ink);color:#fff;box-shadow:0 1px 0 rgba(255,255,255,0.06) inset, 0 6px 14px -8px rgba(0,0,0,0.5)}
.ntr-landing .btn-ink:hover{transform:translateY(-1px);box-shadow:0 1px 0 rgba(255,255,255,0.08) inset, 0 12px 28px -10px rgba(0,0,0,0.55)}
.ntr-landing .btn-light{background:#fff;color:var(--ink);border:1px solid var(--line)}
.ntr-landing .btn-light:hover{border-color:#d8d8df;transform:translateY(-1px)}
.ntr-landing .btn-blue{background:var(--blue);color:#fff;box-shadow:0 8px 22px -10px rgba(42,111,219,0.7)}
.ntr-landing .btn-blue:hover{transform:translateY(-1px);background:#205eb9}

/* Hero */
.ntr-landing .hero{position:relative;padding:64px 0 80px;overflow:hidden}
.ntr-landing .hero::before{content:'';position:absolute;top:-20%;left:50%;transform:translateX(-50%);width:1200px;height:800px;background:radial-gradient(closest-side,rgba(42,111,219,0.10),transparent 70%);pointer-events:none}
.ntr-landing .hero-grid{display:grid;grid-template-columns:1.05fr 1fr;gap:64px;align-items:center;position:relative}
.ntr-landing .h1{font-size:72px;line-height:1.02;letter-spacing:-3.2px;font-weight:700;margin:0 0 22px;color:var(--ink)}
.ntr-landing .h1 em{font-family:'Fraunces',serif;font-style:italic;font-weight:500;color:var(--blue)}
.ntr-landing .lede{font-size:18px;color:var(--ink2);max-width:540px;margin-bottom:32px}
.ntr-landing .hero-ctas{display:flex;gap:12px;align-items:center;flex-wrap:wrap}
.ntr-landing .hero-trust{display:flex;align-items:center;gap:20px;margin-top:28px;color:var(--ink3);font-size:13px}
.ntr-landing .hero-trust .avatars{display:flex}
.ntr-landing .hero-trust .avatars span{width:30px;height:30px;border-radius:50%;border:2px solid #fff;margin-left:-8px;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:600;color:var(--ink)}
.ntr-landing .hero-trust .avatars span:nth-child(1){background:linear-gradient(135deg,#fde68a,#fca5a5);margin-left:0}
.ntr-landing .hero-trust .avatars span:nth-child(2){background:linear-gradient(135deg,#c7d2fe,#a5b4fc)}
.ntr-landing .hero-trust .avatars span:nth-child(3){background:linear-gradient(135deg,#bbf7d0,#86efac)}
.ntr-landing .hero-trust .avatars span:nth-child(4){background:linear-gradient(135deg,#fed7aa,#fdba74)}
.ntr-landing .hero-trust .avatars span:nth-child(5){background:linear-gradient(135deg,#fecaca,#fda4af)}
.ntr-landing .hero-trust strong{color:var(--ink);font-weight:600}

/* Hero mock */
.ntr-landing .hero-mock{position:relative}
.ntr-landing .mock-card{background:#fff;border:1px solid var(--line);border-radius:20px;box-shadow:0 30px 80px -30px rgba(11,23,48,0.25), 0 8px 20px -10px rgba(0,0,0,0.08);overflow:hidden;animation:ntr-floatY 8s ease-in-out infinite}
@keyframes ntr-floatY{0%,100%{transform:translateY(0)}50%{transform:translateY(-8px)}}
.ntr-landing .mock-head{display:flex;align-items:center;justify-content:space-between;padding:14px 18px;border-bottom:1px solid var(--line2);font-size:12px;color:var(--ink3);font-weight:500}
.ntr-landing .mock-head .dots{display:flex;gap:6px}
.ntr-landing .mock-head .dots span{width:9px;height:9px;border-radius:5px;background:#E0E0E5}
.ntr-landing .mock-head .dots span:nth-child(1){background:#FF5F57}
.ntr-landing .mock-head .dots span:nth-child(2){background:#FEBC2E}
.ntr-landing .mock-head .dots span:nth-child(3){background:#28C840}
.ntr-landing .mock-body{padding:18px}
.ntr-landing .mock-filters{display:flex;gap:8px;margin-bottom:14px;font-size:11px;color:var(--ink3);font-weight:500;flex-wrap:wrap}
.ntr-landing .mock-filters .chip{padding:6px 10px;border:1px solid var(--line);border-radius:8px;background:#fff;display:inline-flex;align-items:center;gap:6px}
.ntr-landing .mock-filters .chip.active{background:var(--ink);color:#fff;border-color:var(--ink)}
.ntr-landing .mock-staff{display:flex;align-items:center;gap:14px;margin-bottom:12px;font-size:11px;font-weight:500;color:var(--ink2);flex-wrap:wrap}
.ntr-landing .mock-staff .label{color:var(--ink3);letter-spacing:1px;font-size:10px;text-transform:uppercase}
.ntr-landing .mock-staff .s{display:inline-flex;align-items:center;gap:6px}
.ntr-landing .mock-staff .s .d{width:9px;height:9px;border-radius:5px}
.ntr-landing .mock-calendar{display:grid;grid-template-columns:36px repeat(7,1fr);gap:1px;background:var(--line2);border:1px solid var(--line2);border-radius:10px;overflow:hidden;font-size:10px}
.ntr-landing .mock-calendar .cell{background:#fff;min-height:34px;padding:4px 5px;position:relative}
.ntr-landing .mock-calendar .time{background:#FAFAFC;color:var(--ink3);text-align:right;font-family:'IBM Plex Mono',monospace;font-size:9px;display:flex;justify-content:flex-end;padding-top:6px;padding-right:8px}
.ntr-landing .mock-calendar .head{background:#FAFAFC;color:var(--ink2);font-weight:600;text-align:center;padding:8px 0;font-size:10px;letter-spacing:0.5px;text-transform:uppercase}
.ntr-landing .mock-calendar .head strong{display:block;font-size:13px;color:var(--ink);margin-top:2px;font-family:'Inter',sans-serif;letter-spacing:-0.4px}
.ntr-landing .event{position:absolute;left:3px;right:3px;border-radius:6px;padding:5px 7px;font-size:9px;font-weight:600;line-height:1.15;border-left:2px solid;animation:ntr-slideUp .5s ease both}
.ntr-landing .event small{display:block;font-weight:400;font-size:8.5px;color:rgba(0,0,0,0.55);margin-top:1px}
.ntr-landing .event.purple{background:var(--purple-soft);color:#3730A3;border-color:var(--purple)}
.ntr-landing .event.green{background:var(--green-soft);color:#14532D;border-color:var(--green)}
.ntr-landing .event.coral{background:#FECACA;color:#9F1239;border-color:#F43F5E}
.ntr-landing .event.orange{background:var(--orange-soft);color:#9A3412;border-color:var(--orange)}
@keyframes ntr-slideUp{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}

/* Floating notifs */
.ntr-landing .floater{position:absolute;background:#fff;border:1px solid var(--line);border-radius:14px;padding:12px 14px;box-shadow:0 18px 40px -16px rgba(11,23,48,0.25);display:flex;align-items:center;gap:10px;font-size:13px;animation:ntr-floatIn 1s ease both}
@keyframes ntr-floatIn{from{opacity:0;transform:translateY(20px) scale(.95)}to{opacity:1;transform:translateY(0) scale(1)}}
.ntr-landing .floater .icon{width:32px;height:32px;border-radius:8px;display:flex;align-items:center;justify-content:center;flex-shrink:0}
.ntr-landing .floater strong{display:block;font-weight:600;color:var(--ink);font-size:13px}
.ntr-landing .floater span{font-size:11px;color:var(--ink3)}
.ntr-landing .floater.f1{top:-22px;right:-18px;animation-delay:.4s}
.ntr-landing .floater.f2{bottom:-26px;left:-26px;animation-delay:1s}
.ntr-landing .floater.f3{top:48%;left:-44px;animation-delay:1.6s}

/* Logo strip */
.ntr-landing .logos{padding:48px 0 16px;border-top:1px solid var(--line);border-bottom:1px solid var(--line);background:#fff;margin-top:24px}
.ntr-landing .logos .label{text-align:center;font-size:11px;letter-spacing:2px;color:var(--ink3);text-transform:uppercase;margin-bottom:24px;font-family:'IBM Plex Mono',monospace}
.ntr-landing .logos-row{display:grid;grid-template-columns:repeat(6,1fr);gap:24px;align-items:center;font-family:'Fraunces',serif;font-style:italic;font-weight:500;font-size:22px;color:var(--ink3);justify-items:center}
.ntr-landing .logos-row span{transition:color .2s;letter-spacing:-0.5px}
.ntr-landing .logos-row span:hover{color:var(--ink)}
.ntr-landing .logos-row span.sans{font-family:'Inter',sans-serif;font-weight:700;font-style:normal;letter-spacing:-1px;font-size:20px}
.ntr-landing .logos-row span.mono{font-family:'IBM Plex Mono',monospace;font-size:15px;font-style:normal;font-weight:500;letter-spacing:0;text-transform:uppercase}

/* Section base */
.ntr-landing .section{padding:120px 0;position:relative}
.ntr-landing .section-head{text-align:center;max-width:760px;margin:0 auto 64px}
.ntr-landing .section-head .kicker{font-family:'IBM Plex Mono',monospace;font-size:11px;letter-spacing:2.4px;color:var(--blue);text-transform:uppercase;margin-bottom:18px;font-weight:500}
.ntr-landing .section-head h2{font-size:52px;line-height:1.04;letter-spacing:-2px;font-weight:700;margin-bottom:18px}
.ntr-landing .section-head h2 em{font-family:'Fraunces',serif;font-style:italic;font-weight:500;color:var(--blue)}
.ntr-landing .section-head p{color:var(--ink2);font-size:18px}

/* Reminders */
.ntr-landing .rem-section{padding:100px 0 40px}
.ntr-landing .rem-wrap{display:grid;grid-template-columns:1fr 1.15fr;gap:64px;align-items:center}
.ntr-landing .rem-copy .kicker{font-family:'IBM Plex Mono',monospace;font-size:11px;letter-spacing:2.4px;color:var(--blue);text-transform:uppercase;margin-bottom:18px;font-weight:500;display:inline-block}
.ntr-landing .rem-copy h2{font-size:48px;line-height:1.05;letter-spacing:-1.8px;font-weight:700;margin-bottom:18px}
.ntr-landing .rem-copy h2 em{font-family:'Fraunces',serif;font-style:italic;font-weight:500;color:var(--blue)}
.ntr-landing .rem-copy p.lede{font-size:17px;color:var(--ink2);margin-bottom:28px;max-width:480px}

.ntr-landing .rem-stage{position:relative;background:linear-gradient(160deg,#fff 0%,#FAFBFD 100%);border:1px solid var(--line);border-radius:24px;padding:36px;box-shadow:0 30px 80px -40px rgba(11,23,48,0.22);min-height:520px;overflow:hidden}
.ntr-landing .rem-stage::before{content:'';position:absolute;top:-30%;right:-20%;width:420px;height:420px;background:radial-gradient(closest-side,rgba(37,211,102,0.12),transparent 70%);pointer-events:none}

/* Phone */
.ntr-landing .phone{position:relative;width:280px;background:#1A1A1F;border-radius:36px;padding:10px;box-shadow:0 22px 50px -18px rgba(11,23,48,0.35);margin:0 auto}
.ntr-landing .phone::before{content:'';position:absolute;top:14px;left:50%;transform:translateX(-50%);width:90px;height:18px;background:#000;border-radius:12px;z-index:2}
.ntr-landing .phone-screen{background:#F2F3F5;border-radius:28px;overflow:hidden;height:480px;display:flex;flex-direction:column}
.ntr-landing .phone-statusbar{display:flex;justify-content:space-between;padding:10px 20px 6px;font-size:11px;font-weight:600;color:#1A1A1F}
.ntr-landing .phone-app{padding:32px 14px 14px;flex:1;display:flex;flex-direction:column;gap:10px;overflow:hidden;position:relative}
.ntr-landing .app-head{display:flex;align-items:center;justify-content:space-between;padding:0 4px 8px;font-size:13px;font-weight:600;color:#1A1A1F}
.ntr-landing .app-head .back{color:var(--whatsapp);font-size:18px}
.ntr-landing .app-head .who{display:flex;align-items:center;gap:8px;font-size:13px}
.ntr-landing .app-head .who .av{width:30px;height:30px;border-radius:50%;background:var(--whatsapp);color:#fff;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:13px}
.ntr-landing .app-head .who b{display:block;font-weight:600;font-size:13px;line-height:1.2}
.ntr-landing .app-head .who span{display:block;font-size:10px;color:#6B6B78;font-weight:400}
.ntr-landing .bubble{max-width:80%;padding:9px 12px;border-radius:14px;font-size:12.5px;line-height:1.4;animation:ntr-bubIn .5s ease both;position:relative}
.ntr-landing .bubble.bot{background:#fff;color:#1A1A1F;align-self:flex-start;border-bottom-left-radius:4px;box-shadow:0 1px 1px rgba(0,0,0,0.06)}
.ntr-landing .bubble.me{background:#DCF8C6;color:#1A1A1F;align-self:flex-end;border-bottom-right-radius:4px}
.ntr-landing .bubble small{display:block;font-size:9px;color:#9CA3AF;margin-top:4px;text-align:right}
.ntr-landing .bubble.me small::after{content:' ✓✓';color:#34B7F1}
.ntr-landing .bubble b{font-weight:600}
@keyframes ntr-bubIn{from{opacity:0;transform:translateY(8px) scale(.95)}to{opacity:1;transform:translateY(0) scale(1)}}

/* Reminder cards */
.ntr-landing .rem-cards{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:24px}
.ntr-landing .rem-card{background:#fff;border:1px solid var(--line);border-radius:14px;padding:16px;transition:transform .25s ease, border-color .2s, box-shadow .25s}
.ntr-landing .rem-card:hover{transform:translateY(-2px);border-color:#d8d8df;box-shadow:0 14px 28px -18px rgba(11,23,48,0.18)}
.ntr-landing .rem-card .rc-ic{width:30px;height:30px;border-radius:8px;display:inline-flex;align-items:center;justify-content:center;margin-bottom:10px}
.ntr-landing .rem-card .rc-ic.wa{background:#DCFCE7;color:#25D366}
.ntr-landing .rem-card .rc-ic.em{background:var(--blue-soft);color:var(--blue)}
.ntr-landing .rem-card .rc-ic.bell{background:#FEF3C7;color:#D97706}
.ntr-landing .rem-card .rc-ic.lang{background:#FCE7F3;color:#DB2777}
.ntr-landing .rem-card b{display:block;font-size:13.5px;font-weight:600;color:var(--ink);letter-spacing:-0.2px;margin-bottom:4px}
.ntr-landing .rem-card span{display:block;font-size:12.5px;color:var(--ink2);line-height:1.45}

/* Channels */
.ntr-landing .channels{position:absolute;display:flex;flex-direction:column;gap:12px}
.ntr-landing .channels.left{left:32px;top:80px}
.ntr-landing .channels.right{right:32px;top:140px}
.ntr-landing .chan{background:#fff;border:1px solid var(--line);border-radius:14px;padding:10px 14px;display:flex;align-items:center;gap:10px;box-shadow:0 14px 30px -14px rgba(11,23,48,0.18);min-width:170px;animation:ntr-floatIn 1s ease both}
.ntr-landing .chan .ico{width:32px;height:32px;border-radius:8px;display:flex;align-items:center;justify-content:center;flex-shrink:0;color:#fff;font-weight:700}
.ntr-landing .chan .ico.wa{background:var(--whatsapp)}
.ntr-landing .chan .ico.bell{background:var(--amber)}
.ntr-landing .chan b{display:block;font-size:12.5px;font-weight:600;color:var(--ink);line-height:1.2}
.ntr-landing .chan span{display:block;font-size:10.5px;color:var(--ink3);margin-top:2px}
.ntr-landing .chan .live{margin-left:auto;width:7px;height:7px;border-radius:4px;background:var(--mint);box-shadow:0 0 0 0 rgba(16,185,129,0.4);animation:ntr-pulse 2s infinite}
@keyframes ntr-pulse{0%{box-shadow:0 0 0 0 rgba(16,185,129,0.5)}70%{box-shadow:0 0 0 10px rgba(16,185,129,0)}100%{box-shadow:0 0 0 0 rgba(16,185,129,0)}}

.ntr-landing .rem-stats{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-top:20px}
.ntr-landing .rem-stat{background:#fff;border:1px solid var(--line);border-radius:12px;padding:14px}
.ntr-landing .rem-stat .v{font-size:24px;font-weight:700;letter-spacing:-0.8px;color:var(--ink)}
.ntr-landing .rem-stat .v em{font-family:'Fraunces',serif;font-style:italic;font-weight:500;color:var(--blue);font-size:14px;margin-left:3px;vertical-align:5px}
.ntr-landing .rem-stat small{display:block;font-size:11px;color:var(--ink3);margin-top:2px;letter-spacing:0.3px}

/* In-app notifications */
.ntr-landing .inapp-section{padding:60px 0 40px}
.ntr-landing .inapp-wrap{display:grid;grid-template-columns:1.15fr 1fr;gap:64px;align-items:center}
.ntr-landing .inapp-mock{background:#fff;border:1px solid var(--line);border-radius:20px;box-shadow:0 28px 70px -30px rgba(11,23,48,0.22);overflow:hidden;position:relative}
.ntr-landing .inapp-bar{background:#FAFAFC;border-bottom:1px solid var(--line2);padding:14px 18px;display:flex;align-items:center;justify-content:space-between}
.ntr-landing .inapp-bar .ttl{display:flex;align-items:center;gap:10px;font-size:14px;font-weight:600;color:var(--ink)}
.ntr-landing .inapp-bar .ttl .lv{display:inline-flex;align-items:center;gap:5px;background:var(--mint-soft);color:#0F7A4A;padding:3px 8px;border-radius:999px;font-size:10px;font-weight:600;letter-spacing:0.5px;text-transform:uppercase}
.ntr-landing .inapp-bar .ttl .lv .pdot{width:5px;height:5px;border-radius:3px;background:var(--mint);box-shadow:0 0 0 0 rgba(16,185,129,0.5);animation:ntr-pulse 2s infinite}
.ntr-landing .inapp-bar .acts{display:flex;align-items:center;gap:6px;color:var(--ink3)}
.ntr-landing .inapp-bar .acts .iconbtn{width:30px;height:30px;border-radius:8px;background:#fff;border:1px solid var(--line);display:flex;align-items:center;justify-content:center;color:var(--ink2);font-size:13px}
.ntr-landing .inapp-bar .acts .iconbtn.markall{width:auto;padding:0 10px;font-size:11px;color:var(--blue);border-color:var(--blue-soft);background:var(--blue-soft);font-weight:600;letter-spacing:0.3px}
.ntr-landing .inapp-filters{display:flex;gap:4px;padding:10px 14px;border-bottom:1px solid var(--line2);font-size:12px}
.ntr-landing .inapp-filters .fpill{padding:6px 11px;border-radius:8px;color:var(--ink3);font-weight:500;display:inline-flex;align-items:center;gap:6px;cursor:pointer}
.ntr-landing .inapp-filters .fpill.active{background:var(--ink);color:#fff}
.ntr-landing .inapp-filters .fpill .cnt{background:rgba(0,0,0,0.06);color:var(--ink2);padding:1px 6px;border-radius:4px;font-size:10px;font-weight:600}
.ntr-landing .inapp-filters .fpill.active .cnt{background:rgba(255,255,255,0.18);color:#fff}
.ntr-landing .inapp-body{position:relative;padding:14px 14px 18px}
.ntr-landing .inapp-day{display:flex;align-items:center;gap:10px;margin:6px 4px 10px;color:var(--ink3);font-size:10px;letter-spacing:1.6px;text-transform:uppercase;font-weight:600;font-family:'IBM Plex Mono',monospace}
.ntr-landing .inapp-day::after{content:'';flex:1;height:1px;background:var(--line2)}
.ntr-landing .toast-list{display:flex;flex-direction:column;gap:8px}
.ntr-landing .toast{display:grid;grid-template-columns:auto 1fr auto;gap:14px;align-items:flex-start;padding:14px;background:#fff;border:1px solid var(--line);border-radius:14px;animation:ntr-toastIn .6s ease both;position:relative;transition:transform .2s, box-shadow .2s, border-color .2s}
.ntr-landing .toast:hover{transform:translateX(2px);border-color:#d8d8df;box-shadow:0 14px 30px -18px rgba(11,23,48,0.15)}
.ntr-landing .toast.unread{background:linear-gradient(90deg,#FAFBFD 0%,#fff 30%)}
.ntr-landing .toast.unread::before{content:'';position:absolute;left:0;top:14px;bottom:14px;width:3px;background:var(--blue);border-radius:0 3px 3px 0}
.ntr-landing .toast .tic{width:38px;height:38px;border-radius:10px;display:flex;align-items:center;justify-content:center;flex-shrink:0;font-weight:600;position:relative}
.ntr-landing .toast .tic.book{background:var(--mint-soft);color:#0F7A4A}
.ntr-landing .toast .tic.cancel{background:var(--red-soft);color:#B91C1C}
.ntr-landing .toast .tic.remind{background:var(--blue-soft);color:var(--blue)}
.ntr-landing .toast .tic.pay{background:#FEF3C7;color:#92400E}
.ntr-landing .toast .t-body{min-width:0}
.ntr-landing .toast .t-body .tt{display:flex;align-items:center;gap:8px;margin-bottom:3px;flex-wrap:wrap}
.ntr-landing .toast .t-body .tt b{font-size:13.5px;font-weight:600;color:var(--ink);letter-spacing:-0.1px}
.ntr-landing .toast .t-body .tag{font-size:9.5px;font-weight:600;letter-spacing:0.5px;text-transform:uppercase;padding:2px 6px;border-radius:4px}
.ntr-landing .toast .t-body .tag.book{background:var(--mint-soft);color:#0F7A4A}
.ntr-landing .toast .t-body .tag.cancel{background:var(--red-soft);color:#B91C1C}
.ntr-landing .toast .t-body .tag.remind{background:var(--blue-soft);color:var(--blue)}
.ntr-landing .toast .t-body .tag.pay{background:#FEF3C7;color:#92400E}
.ntr-landing .toast .t-body p{font-size:12.5px;color:var(--ink2);line-height:1.45}
.ntr-landing .toast .t-body p b{color:var(--ink);font-weight:600}
.ntr-landing .toast .t-body .meta{display:flex;gap:6px;margin-top:8px;flex-wrap:wrap;align-items:center;font-size:11px;color:var(--ink3)}
.ntr-landing .toast .t-body .meta .chip{display:inline-flex;align-items:center;gap:5px;padding:3px 8px;background:#FAFAFC;border:1px solid var(--line2);border-radius:6px;font-weight:500}
.ntr-landing .toast .t-body .meta .chip .dot{width:6px;height:6px;border-radius:3px;background:var(--ink3)}
.ntr-landing .toast .t-body .meta .chip .dot.p{background:var(--purple)}
.ntr-landing .toast .t-body .meta .chip .dot.c{background:#F43F5E}
.ntr-landing .toast .t-side{display:flex;flex-direction:column;align-items:flex-end;gap:8px;flex-shrink:0}
.ntr-landing .toast .t-side .when{font-size:11px;color:var(--ink3);font-family:'IBM Plex Mono',monospace;letter-spacing:0.3px;white-space:nowrap}
.ntr-landing .toast .t-side .qact{font-size:10.5px;font-weight:600;color:var(--ink2);padding:4px 9px;background:#FAFAFC;border:1px solid var(--line);border-radius:6px;letter-spacing:0.3px;cursor:pointer;transition:all .15s}
.ntr-landing .toast .t-side .qact:hover{background:var(--ink);color:#fff;border-color:var(--ink)}
.ntr-landing .inapp-foot{padding:12px 14px;border-top:1px solid var(--line2);display:flex;justify-content:space-between;align-items:center;background:#FAFAFC;font-size:12px;color:var(--ink3)}
.ntr-landing .inapp-foot a{color:var(--blue);font-weight:600}
@keyframes ntr-toastIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}

.ntr-landing .inapp-copy .kicker{font-family:'IBM Plex Mono',monospace;font-size:11px;letter-spacing:2.4px;color:var(--blue);text-transform:uppercase;margin-bottom:18px;font-weight:500;display:inline-block}
.ntr-landing .inapp-copy h3{font-size:38px;line-height:1.08;letter-spacing:-1.4px;font-weight:700;margin-bottom:16px}
.ntr-landing .inapp-copy h3 em{font-family:'Fraunces',serif;font-style:italic;font-weight:500;color:var(--blue)}
.ntr-landing .inapp-copy p{color:var(--ink2);font-size:16px;margin-bottom:24px}
.ntr-landing .inapp-list{list-style:none;display:flex;flex-direction:column;gap:14px;padding:0}
.ntr-landing .inapp-list li{display:flex;gap:12px;font-size:14px;color:var(--ink2);align-items:flex-start}
.ntr-landing .inapp-list li .ic{width:30px;height:30px;border-radius:8px;background:var(--blue-soft);color:var(--blue);display:inline-flex;align-items:center;justify-content:center;flex-shrink:0}
.ntr-landing .inapp-list li b{color:var(--ink);font-weight:600;display:block;margin-bottom:1px;font-size:14.5px}

/* Bento */
.ntr-landing .bento{display:grid;grid-template-columns:repeat(6,1fr);grid-auto-rows:200px;gap:16px}
.ntr-landing .tile{background:#fff;border:1px solid var(--line);border-radius:18px;padding:24px;position:relative;overflow:hidden;transition:transform .35s ease, box-shadow .35s ease, border-color .35s ease}
.ntr-landing .tile:hover{transform:translateY(-3px);box-shadow:0 24px 50px -28px rgba(11,23,48,0.25);border-color:#d8d8df}
.ntr-landing .tile .t-icon{width:36px;height:36px;border-radius:9px;display:flex;align-items:center;justify-content:center;margin-bottom:14px}
.ntr-landing .tile h3{font-size:18px;font-weight:600;letter-spacing:-0.4px;margin-bottom:6px}
.ntr-landing .tile p{font-size:13.5px;color:var(--ink2);line-height:1.55}

.ntr-landing .t-1{grid-column:span 2;grid-row:span 2;background:linear-gradient(160deg,var(--navy) 0%,var(--navy2) 100%);color:#fff;border-color:transparent}
.ntr-landing .t-2{grid-column:span 2}
.ntr-landing .t-3{grid-column:span 2}
.ntr-landing .t-4{grid-column:span 2}
.ntr-landing .t-5{grid-column:span 2}
.ntr-landing .t-7{grid-column:span 6;grid-row:span 1;background:linear-gradient(135deg,#fff 0%,#FAFBFD 100%);min-height:240px;padding:36px}

.ntr-landing .t-7 .row{display:flex;align-items:center;justify-content:space-between;gap:32px;height:100%}
.ntr-landing .t-7 .lhs{flex:1;max-width:380px}
.ntr-landing .t-7 .badge2{display:inline-flex;align-items:center;gap:6px;font-family:'IBM Plex Mono',monospace;font-size:10px;letter-spacing:1.6px;color:var(--blue);text-transform:uppercase;margin-bottom:14px;font-weight:600;padding:5px 10px;background:var(--blue-soft);border-radius:999px}
.ntr-landing .t-7 h3{font-size:30px;font-weight:700;letter-spacing:-1px;line-height:1.1;margin-bottom:10px}
.ntr-landing .t-7 h3 em{font-family:'Fraunces',serif;font-style:italic;font-weight:500;color:var(--blue)}
.ntr-landing .t-7 p{font-size:14px;color:var(--ink2);line-height:1.55;margin:0}
.ntr-landing .t-7 .rhs{flex:1.2;display:flex;flex-direction:column;gap:14px;max-width:460px}
.ntr-landing .url-bar{display:flex;align-items:center;background:#fff;border:1.5px solid var(--line);border-radius:14px;padding:6px 6px 6px 18px;box-shadow:0 12px 32px -20px rgba(11,23,48,0.18);font-family:'IBM Plex Mono',monospace}
.ntr-landing .url-bar .proto{color:var(--ink3);font-size:13px;font-weight:500;margin-right:2px}
.ntr-landing .url-bar .host{color:var(--ink2);font-size:14px;font-weight:500}
.ntr-landing .url-bar .slash{color:var(--ink3);font-size:14px;margin:0 1px}
.ntr-landing .url-bar .slug{flex:1;font-size:15px;font-weight:700;color:var(--ink);letter-spacing:-0.2px;padding:0 4px;border-bottom:2px solid var(--blue);margin-left:2px}
.ntr-landing .url-bar .copy-btn{display:inline-flex;align-items:center;gap:6px;padding:10px 16px;background:var(--ink);color:#fff;border-radius:10px;font-family:'Inter',sans-serif;font-size:13px;font-weight:600;letter-spacing:0.3px;cursor:pointer;transition:transform .15s, background .15s;white-space:nowrap}
.ntr-landing .url-bar .copy-btn:hover{transform:translateY(-1px);background:#000}
.ntr-landing .url-bar .copy-btn.copied{background:var(--mint);color:#fff}
.ntr-landing .url-share{display:flex;gap:8px;font-size:12px;color:var(--ink3);align-items:center;flex-wrap:wrap}
.ntr-landing .url-share .lbl{font-family:'IBM Plex Mono',monospace;font-size:10px;letter-spacing:1.4px;text-transform:uppercase;color:var(--ink3);margin-right:4px;font-weight:600}
.ntr-landing .url-share .pill{display:inline-flex;align-items:center;gap:6px;padding:5px 10px;background:#fff;border:1px solid var(--line);border-radius:999px;font-size:11.5px;color:var(--ink2);font-weight:500;cursor:pointer;transition:all .15s}
.ntr-landing .url-share .pill:hover{border-color:var(--ink2);transform:translateY(-1px)}
.ntr-landing .url-share .pill .ic{width:12px;height:12px;display:inline-flex}

/* Revenue tile */
.ntr-landing .rev-card{position:relative;height:100%;display:flex;flex-direction:column;gap:0}
.ntr-landing .rev-top{display:flex;align-items:center;justify-content:space-between;margin-bottom:18px}
.ntr-landing .rev-meta{display:inline-flex;align-items:center;gap:10px;font-family:'IBM Plex Mono',monospace;font-size:10px;letter-spacing:1.2px;color:rgba(255,255,255,0.55);font-weight:500}
.ntr-landing .rev-dot{display:inline-flex;align-items:center;gap:6px;padding:4px 9px;background:rgba(16,185,129,0.18);color:#6EE7B7;border-radius:999px;font-weight:600}
.ntr-landing .rev-dot span{width:6px;height:6px;border-radius:4px;background:#10B981}
.ntr-landing .rev-period{padding:4px 8px;background:rgba(255,255,255,0.06);border-radius:6px}
.ntr-landing .rev-segs{display:inline-flex;background:rgba(255,255,255,0.06);border-radius:8px;padding:3px;font-family:'IBM Plex Mono',monospace;font-size:10px;letter-spacing:0.8px;font-weight:600;color:rgba(255,255,255,0.55)}
.ntr-landing .rev-segs span{padding:4px 9px;border-radius:5px;cursor:pointer}
.ntr-landing .rev-segs span.on{background:rgba(255,255,255,0.14);color:#fff}
.ntr-landing .rev-label{font-size:11.5px;color:rgba(255,255,255,0.6);letter-spacing:1.2px;text-transform:uppercase;margin-bottom:6px;font-weight:500}
.ntr-landing .rev-stat{font-family:'Inter',sans-serif;font-weight:700;font-size:clamp(38px,4.4vw,62px);letter-spacing:-2.5px;line-height:1;margin:0 0 12px;white-space:nowrap}
.ntr-landing .rev-stat .cur{font-size:clamp(22px,2.4vw,34px);color:rgba(255,255,255,0.55);font-weight:500;margin-right:5px;vertical-align:6px}
.ntr-landing .rev-stat .dec{font-size:clamp(22px,2.4vw,34px);color:rgba(255,255,255,0.55);font-weight:500;letter-spacing:-1px}
.ntr-landing .rev-row{display:flex;align-items:center;gap:10px;margin-bottom:14px;flex-wrap:wrap}
.ntr-landing .rev-trend{display:inline-flex;align-items:center;gap:5px;padding:4px 9px;background:rgba(16,185,129,0.18);color:#6EE7B7;border-radius:999px;font-size:12px;font-weight:600}
.ntr-landing .rev-vs{font-size:11.5px;color:rgba(135,196,255,0.6);font-family:'IBM Plex Mono',monospace}
.ntr-landing .spark{width:100%;height:60px;margin-top:auto}
.ntr-landing .rev-foot{display:flex;align-items:center;gap:8px;margin-top:14px;padding-top:14px;border-top:1px solid rgba(255,255,255,0.08);font-size:11.5px;color:rgba(255,255,255,0.55);font-weight:500}
.ntr-landing .rev-foot-dot{width:6px;height:6px;border-radius:4px;background:#87C4FF}
.ntr-landing .rev-foot-sep{opacity:0.4}

.ntr-landing .svc-head,.ntr-landing .exp-head{display:flex;align-items:center;gap:12px;margin-bottom:14px}
.ntr-landing .svc-head .t-icon,.ntr-landing .exp-head .t-icon{margin-bottom:0;flex-shrink:0;width:34px;height:34px}
.ntr-landing .svc-head h3,.ntr-landing .exp-head h3{font-size:16px;font-weight:600;letter-spacing:-0.3px;margin:0;line-height:1.2}
.ntr-landing .svc-sub{display:block;font-size:11px;color:var(--ink3);margin-top:2px;font-weight:400}
.ntr-landing .svc-stack{display:flex;flex-direction:column;gap:6px}
.ntr-landing .svc-item{display:flex;align-items:center;gap:10px;padding:9px 10px;background:#FAFAFC;border:1px solid var(--line2);border-radius:10px;transition:all .2s;min-width:0}
.ntr-landing .svc-item:hover{background:#fff;border-color:var(--line);transform:translateX(2px)}
.ntr-landing .svc-dot{width:8px;height:8px;border-radius:5px;flex-shrink:0;box-shadow:0 0 0 3px rgba(0,0,0,0.03)}
.ntr-landing .svc-info{flex:1;min-width:0}
.ntr-landing .svc-name{font-size:12.5px;font-weight:600;color:var(--ink);display:flex;align-items:center;gap:6px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.ntr-landing .svc-info small{font-size:10.5px;color:var(--ink3);font-family:'IBM Plex Mono',monospace;letter-spacing:0.3px;display:block;margin-top:1px}
.ntr-landing .svc-pop{display:inline-flex;align-items:center;gap:3px;background:linear-gradient(135deg,#FFF3D1,#FEE5A8);color:#92400E;padding:1px 6px 1px 4px;border-radius:999px;font-size:8px;font-weight:700;letter-spacing:0.5px;text-transform:uppercase;border:1px solid rgba(217,119,6,0.25);flex-shrink:0;line-height:1.3}
.ntr-landing .svc-pop svg{width:7px;height:7px}
.ntr-landing .svc-price{font-weight:700;font-size:13.5px;color:var(--ink);letter-spacing:-0.3px;flex-shrink:0;font-variant-numeric:tabular-nums}

.ntr-landing .exp-grid{display:flex;flex-direction:column;gap:8px}
.ntr-landing .exp-card{display:flex;align-items:center;gap:12px;width:100%;padding:10px 12px;background:#fff;border:1px solid var(--line);border-radius:10px;cursor:pointer;transition:all .2s;text-align:left}
.ntr-landing .exp-card:hover{transform:translateY(-2px);box-shadow:0 8px 18px -10px rgba(11,23,48,0.18)}
.ntr-landing .exp-card.pdf:hover{border-color:#EF4444}
.ntr-landing .exp-card.xls:hover{border-color:var(--mint)}
.ntr-landing .exp-ic{position:relative;width:36px;height:36px;display:flex;align-items:center;justify-content:center;flex-shrink:0;border-radius:7px}
.ntr-landing .exp-card.pdf .exp-ic{background:#FEE2E2;color:#EF4444}
.ntr-landing .exp-card.xls .exp-ic{background:#D1FAE5;color:var(--mint)}
.ntr-landing .exp-ic em{position:absolute;bottom:-2px;right:-4px;font-style:normal;font-family:'IBM Plex Mono',monospace;font-size:7.5px;font-weight:700;background:var(--ink);color:#fff;padding:2px 4px;border-radius:3px;letter-spacing:0.3px}
.ntr-landing .exp-info b{display:block;font-size:13px;font-weight:600;color:var(--ink);letter-spacing:-0.2px}
.ntr-landing .exp-info small{display:block;font-size:11px;color:var(--ink3);margin-top:1px}
.ntr-landing .exp-foot{display:flex;align-items:center;gap:6px;margin-top:auto;padding-top:10px;font-size:10.5px;color:var(--ink3);font-family:'IBM Plex Mono',monospace;letter-spacing:0.3px}
.ntr-landing .t-3{display:flex;flex-direction:column}

/* Preview */
.ntr-landing .preview-wrap{margin-top:64px;background:#fff;border:1px solid var(--line);border-radius:24px;padding:14px;box-shadow:0 40px 100px -40px rgba(11,23,48,0.3);position:relative}
.ntr-landing .preview-tabs{display:flex;gap:6px;padding:8px;background:#FAFAFC;border-radius:12px;margin-bottom:14px;font-size:13px;font-weight:500}
.ntr-landing .preview-tabs button{padding:9px 16px;border-radius:8px;color:var(--ink2);transition:all .2s}
.ntr-landing .preview-tabs button.active{background:#fff;color:var(--ink);box-shadow:0 1px 3px rgba(0,0,0,0.06)}
.ntr-landing .preview-stage{background:var(--bg);border-radius:16px;overflow:hidden;min-height:480px;position:relative}
.ntr-landing .preview-pane{padding:32px;display:none;animation:ntr-fadeIn .4s ease both}
.ntr-landing .preview-pane.active{display:block}
@keyframes ntr-fadeIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}

.ntr-landing .adm{display:grid;grid-template-columns:200px 1fr;gap:24px;font-size:13px}
.ntr-landing .adm-side{background:#fff;border:1px solid var(--line);border-radius:14px;padding:18px}
.ntr-landing .adm-side .brand-mini{font-size:11px;letter-spacing:2px;font-weight:600;color:var(--ink);margin-bottom:4px}
.ntr-landing .adm-side .brand-sub{font-size:9px;color:var(--ink3);letter-spacing:1.4px;margin-bottom:20px}
.ntr-landing .adm-side .nav-item{display:flex;align-items:center;gap:10px;padding:8px 10px;border-radius:8px;color:var(--ink2);margin-bottom:2px;font-size:12.5px;font-weight:500;cursor:pointer;transition:background .15s}
.ntr-landing .adm-side .nav-item:hover{background:#FAFAFC}
.ntr-landing .adm-side .nav-item.active{background:#FAFAFC;color:var(--ink);font-weight:600;position:relative}
.ntr-landing .adm-side .nav-item.active::before{content:'';position:absolute;left:-18px;top:8px;bottom:8px;width:2px;background:var(--ink);border-radius:2px}
.ntr-landing .adm-side .nav-item .i{width:14px;height:14px;color:var(--ink3)}
.ntr-landing .adm-main h4{font-size:22px;font-weight:700;letter-spacing:-0.6px;margin-bottom:4px}
.ntr-landing .adm-main .sub{color:var(--ink3);font-size:12px;margin-bottom:18px}

.ntr-landing .svc-card{background:#fff;border:1px solid var(--line);border-radius:14px;padding:18px}
.ntr-landing .svc-card-head{display:flex;align-items:center;justify-content:space-between;margin-bottom:16px;font-size:13px;font-weight:600}
.ntr-landing .svc-card-head .total{font-size:11px;color:var(--ink3);font-weight:400}
.ntr-landing .svc-row{display:grid;grid-template-columns:2fr 70px 80px 50px 40px;gap:12px;padding:12px 4px;border-top:1px solid var(--line2);align-items:center;font-size:12px}
.ntr-landing .svc-row:first-of-type{border-top:none;color:var(--ink3);font-size:10px;letter-spacing:1.2px;text-transform:uppercase;padding-bottom:6px}
.ntr-landing .svc-row .name b{display:block;font-weight:600;color:var(--ink);font-size:13px}
.ntr-landing .svc-row .name b .pop{margin-left:6px;display:inline-flex;align-items:center;gap:3px;background:linear-gradient(135deg,#FFF3D1,#FEE5A8);color:#92400E;padding:2px 7px 2px 5px;border-radius:999px;font-size:8.5px;font-weight:700;letter-spacing:0.6px;text-transform:uppercase;vertical-align:2px;border:1px solid rgba(217,119,6,0.2)}
.ntr-landing .svc-row .name span{display:block;color:var(--ink3);font-size:11px;margin-top:2px}
.ntr-landing .svc-row .dur{display:inline-flex;padding:3px 8px;background:#F1F1F4;color:var(--ink2);border-radius:999px;font-size:10.5px;justify-self:start}
.ntr-landing .svc-row .price{font-weight:600;font-size:13px}
.ntr-landing .toggle{width:32px;height:18px;border-radius:10px;background:var(--ink);position:relative;flex-shrink:0}
.ntr-landing .toggle::after{content:'';position:absolute;right:2px;top:2px;width:14px;height:14px;background:#fff;border-radius:7px}
.ntr-landing .toggle.off{background:#D4D4DA}
.ntr-landing .toggle.off::after{left:2px;right:auto}
.ntr-landing .actions{display:flex;gap:6px;color:var(--ink3)}

.ntr-landing .cal{background:#fff;border:1px solid var(--line);border-radius:14px;overflow:hidden}
.ntr-landing .cal-head{display:flex;gap:8px;padding:14px;border-bottom:1px solid var(--line2);font-size:11px;color:var(--ink3);align-items:center;flex-wrap:wrap}
.ntr-landing .cal-head .pill{padding:6px 10px;border:1px solid var(--line);border-radius:8px;background:#fff;font-size:11px;color:var(--ink2);font-weight:500;display:inline-flex;align-items:center;gap:6px}
.ntr-landing .cal-head .pill.dark{background:var(--ink);color:#fff;border-color:var(--ink)}
.ntr-landing .cal-staff{display:flex;gap:14px;padding:8px 14px 0;font-size:11px;font-weight:500;flex-wrap:wrap}
.ntr-landing .cal-staff .s{display:inline-flex;align-items:center;gap:6px;color:var(--ink2)}
.ntr-landing .cal-staff .s .d{width:8px;height:8px;border-radius:4px}
.ntr-landing .cal-grid{display:grid;grid-template-columns:50px repeat(7,1fr);font-size:10px;border-top:1px solid var(--line2);margin-top:10px}
.ntr-landing .cal-grid .ch{background:#FAFAFC;color:var(--ink3);text-align:center;padding:8px 0;font-size:10px;letter-spacing:0.8px;text-transform:uppercase;border-right:1px solid var(--line2)}
.ntr-landing .cal-grid .ch strong{display:block;font-size:14px;color:var(--ink);margin-top:2px;letter-spacing:-0.4px;font-family:'Inter',sans-serif;text-transform:none}
.ntr-landing .cal-grid .tc{background:#FAFAFC;color:var(--ink3);font-family:'IBM Plex Mono',monospace;font-size:9px;text-align:right;padding:4px 8px;border-right:1px solid var(--line2);border-top:1px solid var(--line2)}
.ntr-landing .cal-grid .gc{background:#fff;border-right:1px solid var(--line2);border-top:1px solid var(--line2);position:relative;min-height:36px}

.ntr-landing .ana-grid{display:grid;grid-template-columns:1fr 1.5fr;gap:14px}
.ntr-landing .kpi{background:#fff;border:1px solid var(--line);border-radius:14px;padding:18px;display:flex;flex-direction:column;justify-content:space-between;min-height:108px}
.ntr-landing .kpi .l{display:flex;align-items:center;gap:10px}
.ntr-landing .kpi .l .ic{width:32px;height:32px;border-radius:8px;display:flex;align-items:center;justify-content:center}
.ntr-landing .kpi .l small{font-size:10px;letter-spacing:1.2px;text-transform:uppercase;color:var(--ink3);font-weight:500}
.ntr-landing .kpi .v{font-size:32px;font-weight:700;letter-spacing:-1px;color:var(--ink)}
.ntr-landing .kpi.dark{background:linear-gradient(135deg,var(--navy),#1B2A4E);color:#fff;border-color:transparent}
.ntr-landing .kpi.dark .v{color:#fff}
.ntr-landing .kpi.dark small{color:rgba(255,255,255,0.6)}
.ntr-landing .kpi.dark .l .ic{background:rgba(255,255,255,0.08)}
.ntr-landing .kpi.dark p{color:rgba(135,196,255,0.8);font-size:11px;margin-top:4px}
.ntr-landing .kpi-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px;align-content:start}
.ntr-landing .kpi-grid .kpi{min-height:88px}

.ntr-landing .book-grid{display:grid;grid-template-columns:1.4fr 1fr;gap:16px}
.ntr-landing .book-card{background:#fff;border:1px solid var(--line);border-radius:14px;overflow:hidden}
.ntr-landing .book-step{padding:14px 18px;border-bottom:1px solid var(--line2);display:flex;align-items:center;justify-content:space-between;font-size:13px;font-weight:600}
.ntr-landing .book-step .left{display:flex;align-items:center;gap:10px}
.ntr-landing .book-step .num{width:24px;height:24px;border-radius:50%;background:var(--ink);color:#fff;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:600}
.ntr-landing .book-step.next{color:var(--ink3)}
.ntr-landing .book-step.next .num{background:#D4D4DA}
.ntr-landing .book-svc{padding:12px 18px;display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid var(--line2);font-size:12.5px}
.ntr-landing .book-svc:last-child{border-bottom:none}
.ntr-landing .book-svc .l b{display:block;font-weight:600;color:var(--ink)}
.ntr-landing .book-svc .l span{display:block;color:var(--ink3);font-size:11px;margin-top:2px}
.ntr-landing .book-svc .check{width:18px;height:18px;border-radius:5px;border:1.5px solid var(--line);flex-shrink:0;display:flex;align-items:center;justify-content:center}
.ntr-landing .book-svc.sel{background:#FAFAFC}
.ntr-landing .book-svc.sel .check{background:var(--ink);border-color:var(--ink);color:#fff}

.ntr-landing .summary{background:#fff;border:1px solid var(--line);border-radius:14px;padding:18px;font-size:12px;align-self:start}
.ntr-landing .summary h5{font-size:14px;font-weight:600;margin-bottom:14px}
.ntr-landing .summary .row{display:flex;align-items:flex-start;gap:10px;padding:10px 0;border-bottom:1px solid var(--line2)}
.ntr-landing .summary .row:last-of-type{border-bottom:none}
.ntr-landing .summary .row .ic{width:28px;height:28px;border-radius:7px;background:#FAFAFC;display:flex;align-items:center;justify-content:center;flex-shrink:0;color:var(--ink2)}
.ntr-landing .summary .row b{display:block;font-size:10px;color:var(--ink3);letter-spacing:1px;text-transform:uppercase;font-weight:500;margin-bottom:2px}
.ntr-landing .summary .total{display:flex;justify-content:space-between;align-items:center;margin:12px 0;font-size:13px;color:var(--ink2)}
.ntr-landing .summary .total .v{font-size:20px;font-weight:700;color:var(--ink);letter-spacing:-0.6px}
.ntr-landing .summary .conf{display:block;text-align:center;background:#D4D4DA;color:#fff;padding:12px;border-radius:10px;font-weight:600;font-size:13px;cursor:pointer}

/* Steps */
.ntr-landing .steps{display:grid;grid-template-columns:repeat(4,1fr);gap:18px;counter-reset:s}
.ntr-landing .step{background:#fff;border:1px solid var(--line);border-radius:16px;padding:24px;counter-increment:s;position:relative;transition:transform .25s ease}
.ntr-landing .step:hover{transform:translateY(-3px)}
.ntr-landing .step::before{content:counter(s,decimal-leading-zero);font-family:'IBM Plex Mono',monospace;font-size:11px;letter-spacing:1.5px;color:var(--blue);font-weight:500}
.ntr-landing .step h4{font-size:18px;font-weight:600;letter-spacing:-0.4px;margin:14px 0 6px}
.ntr-landing .step p{font-size:13.5px;color:var(--ink2);line-height:1.55}

/* Testimonial */
.ntr-landing .test{background:linear-gradient(135deg,var(--navy) 0%,#152544 100%);color:#fff;border-radius:24px;padding:72px 56px;position:relative;overflow:hidden}
.ntr-landing .test::before{content:'';position:absolute;top:-30%;right:-15%;width:480px;height:480px;background:radial-gradient(closest-side,rgba(42,111,219,0.35),transparent 70%);pointer-events:none}
.ntr-landing .test-grid{display:grid;grid-template-columns:1.4fr 1fr;gap:48px;align-items:center;position:relative}
.ntr-landing .test-q{font-family:'Fraunces',serif;font-style:italic;font-size:36px;line-height:1.25;letter-spacing:-1px;font-weight:500;color:#fff;margin-bottom:24px}
.ntr-landing .test-author{display:flex;align-items:center;gap:14px}
.ntr-landing .test-author .av{width:48px;height:48px;border-radius:50%;background:linear-gradient(135deg,#FED7AA,#F472B6);display:flex;align-items:center;justify-content:center;font-weight:600;color:var(--ink)}
.ntr-landing .test-author b{display:block;font-size:14px;color:#fff}
.ntr-landing .test-author span{display:block;font-size:12px;color:rgba(255,255,255,0.6)}
.ntr-landing .test-stats{display:grid;grid-template-columns:1fr 1fr;gap:14px}
.ntr-landing .test-stat{background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.1);border-radius:14px;padding:18px;backdrop-filter:blur(10px)}
.ntr-landing .test-stat .v{font-size:32px;font-weight:700;letter-spacing:-1px;color:#fff;margin-bottom:4px}
.ntr-landing .test-stat small{font-size:11px;color:rgba(255,255,255,0.6);letter-spacing:0.5px;text-transform:uppercase}
.ntr-landing .test-stat .v em{font-family:'Fraunces',serif;font-style:italic;font-weight:500;color:#87C4FF;font-size:18px;margin-left:4px;vertical-align:6px}

/* FAQ */
.ntr-landing .faq-wrap{display:grid;grid-template-columns:0.85fr 1.15fr;gap:48px;align-items:start}
.ntr-landing .faq-aside{position:sticky;top:96px}
.ntr-landing .faq-aside .kicker{font-family:'IBM Plex Mono',monospace;font-size:11px;letter-spacing:2.4px;color:var(--blue);text-transform:uppercase;margin-bottom:18px;font-weight:500;display:inline-block}
.ntr-landing .faq-aside h2{font-size:44px;line-height:1.05;letter-spacing:-1.6px;font-weight:700;margin-bottom:18px}
.ntr-landing .faq-aside h2 em{font-family:'Fraunces',serif;font-style:italic;font-weight:500;color:var(--blue)}
.ntr-landing .faq-aside p{color:var(--ink2);font-size:16px;margin-bottom:28px}
.ntr-landing .faq-help{background:#fff;border:1px solid var(--line);border-radius:16px;padding:20px;display:flex;align-items:center;gap:14px}
.ntr-landing .faq-help .av{width:42px;height:42px;border-radius:50%;background:linear-gradient(135deg,#c7d2fe,#a5b4fc);display:flex;align-items:center;justify-content:center;font-weight:600;color:var(--ink)}
.ntr-landing .faq-help b{display:block;font-size:13px;font-weight:600}
.ntr-landing .faq-help span{display:block;font-size:12px;color:var(--ink3)}
.ntr-landing .faq-help a{margin-left:auto;color:var(--blue);font-size:13px;font-weight:600}

.ntr-landing .faq-list{display:flex;flex-direction:column;gap:8px}
.ntr-landing .faq-list details{background:#fff;border:1px solid var(--line);border-radius:14px;overflow:hidden;transition:border-color .2s, box-shadow .2s}
.ntr-landing .faq-list details[open]{border-color:#d8d8df;box-shadow:0 12px 30px -16px rgba(11,23,48,0.12)}
.ntr-landing .faq-list summary{padding:20px 24px;cursor:pointer;display:grid;grid-template-columns:auto 1fr auto;gap:16px;align-items:center;list-style:none}
.ntr-landing .faq-list summary::-webkit-details-marker{display:none}
.ntr-landing .faq-list .num{font-family:'IBM Plex Mono',monospace;font-size:11px;color:var(--ink3);letter-spacing:1px;font-weight:500}
.ntr-landing .faq-list .q{font-weight:600;font-size:15.5px;color:var(--ink);letter-spacing:-0.2px}
.ntr-landing .faq-list .plus{width:32px;height:32px;border-radius:50%;background:#FAFAFC;color:var(--ink2);display:flex;align-items:center;justify-content:center;font-size:18px;font-weight:300;transition:transform .25s, background .2s}
.ntr-landing .faq-list details[open] .plus{background:var(--ink);color:#fff;transform:rotate(45deg)}
.ntr-landing .faq-list .a{padding:0 24px 22px 70px;color:var(--ink2);font-size:14.5px;line-height:1.65}
.ntr-landing .faq-list .a a{color:var(--blue);font-weight:500}

/* Footer */
.ntr-landing .footer{padding:72px 0 32px;border-top:1px solid var(--line);margin-top:80px}
.ntr-landing .foot-grid{display:grid;grid-template-columns:1.5fr repeat(3,1fr);gap:48px;margin-bottom:48px}
.ntr-landing .foot-grid h5{font-size:11px;letter-spacing:1.5px;color:var(--ink3);text-transform:uppercase;margin-bottom:16px;font-weight:600}
.ntr-landing .foot-grid ul{list-style:none;padding:0}
.ntr-landing .foot-grid li{margin-bottom:10px;font-size:14px;color:var(--ink2)}
.ntr-landing .foot-grid li a:hover{color:var(--ink)}
.ntr-landing .foot-grid .about{max-width:280px;font-size:14px;color:var(--ink2);line-height:1.6}
.ntr-landing .foot-bottom{padding-top:28px;border-top:1px solid var(--line);display:flex;justify-content:space-between;align-items:center;font-size:12px;color:var(--ink3);font-family:'IBM Plex Mono',monospace;letter-spacing:0.5px}

.ntr-landing .reveal{opacity:0;transform:translateY(20px);transition:opacity .8s ease, transform .8s cubic-bezier(.16,1,.3,1)}
.ntr-landing .reveal.in{opacity:1;transform:translateY(0)}

/* Prevent horizontal scroll caused by floaters / large headings */
.ntr-landing{overflow-x:hidden}
.ntr-landing img,.ntr-landing svg{max-width:100%}

/* === Large laptop (<=1180px) === */
@media (max-width:1180px){
  .ntr-landing .bento{grid-template-columns:repeat(4,1fr);grid-auto-rows:auto}
  .ntr-landing .t-1{grid-column:span 4;grid-row:span 1;min-height:260px}
  .ntr-landing .t-2,.ntr-landing .t-3,.ntr-landing .t-4,.ntr-landing .t-5{grid-column:span 2;grid-row:span 1}
  .ntr-landing .t-7{grid-column:span 4;grid-row:span 1}
  .ntr-landing .rev-stat{font-size:clamp(44px,7vw,62px) !important}
  .ntr-landing .container{padding:0 24px}
  .ntr-landing .h1{font-size:60px;letter-spacing:-2.6px}
  .ntr-landing .section{padding:96px 0}
}

/* === Tablet landscape (<=1024px) === */
@media (max-width:1024px){
  .ntr-landing .nav-links{gap:22px;font-size:13px}
  .ntr-landing .section-head h2{font-size:44px}
  .ntr-landing .rem-copy h2{font-size:40px}
  .ntr-landing .inapp-copy h3{font-size:32px}
  .ntr-landing .faq-aside h2{font-size:38px}
  .ntr-landing .t-7 h3{font-size:26px}
  .ntr-landing .t-7 .row{flex-direction:column;align-items:flex-start;gap:20px}
  .ntr-landing .t-7 .lhs,.ntr-landing .t-7 .rhs{max-width:100%;width:100%}
}

/* === Tablet portrait (<=980px) === */
@media (max-width:980px){
  .ntr-landing .hero{padding:48px 0 64px}
  .ntr-landing .hero-grid{grid-template-columns:1fr;gap:48px}
  .ntr-landing .h1{font-size:48px;letter-spacing:-2px}
  .ntr-landing .lede{font-size:17px;max-width:none}
  .ntr-landing .bento{grid-template-columns:repeat(2,1fr);grid-auto-rows:auto}
  .ntr-landing .t-1,.ntr-landing .t-2,.ntr-landing .t-3,.ntr-landing .t-4,.ntr-landing .t-5,.ntr-landing .t-7{grid-column:span 2;grid-row:auto}
  .ntr-landing .steps{grid-template-columns:1fr 1fr}
  .ntr-landing .nav-links{display:none}
  .ntr-landing .section-head h2{font-size:38px}
  .ntr-landing .test{padding:48px 28px}
  .ntr-landing .test-grid{grid-template-columns:1fr}
  .ntr-landing .test-q{font-size:26px}
  .ntr-landing .foot-grid{grid-template-columns:1fr 1fr;gap:32px}
  .ntr-landing .adm{grid-template-columns:1fr}
  .ntr-landing .adm-side{display:none}
  .ntr-landing .book-grid{grid-template-columns:1fr}
  .ntr-landing .ana-grid{grid-template-columns:1fr}
  .ntr-landing .rem-wrap,.ntr-landing .inapp-wrap,.ntr-landing .faq-wrap{grid-template-columns:1fr;gap:40px}
  .ntr-landing .faq-aside{position:static}
  .ntr-landing .rem-copy h2,.ntr-landing .faq-aside h2{font-size:32px}
  .ntr-landing .channels{display:none}
  .ntr-landing .preview-tabs{overflow-x:auto;-webkit-overflow-scrolling:touch;flex-wrap:nowrap;scrollbar-width:none}
  .ntr-landing .preview-tabs::-webkit-scrollbar{display:none}
  .ntr-landing .preview-tabs button{flex-shrink:0}
}

/* === Phone landscape / small tablet (<=720px) === */
@media (max-width:720px){
  .ntr-landing .container{padding:0 20px}
  .ntr-landing .nav-inner{height:60px}
  .ntr-landing .brand{font-size:18px}
  .ntr-landing .brand .logo{width:28px;height:28px}
  .ntr-landing .btn{padding:9px 14px;font-size:13px}
  .ntr-landing .nav-ctas .btn-ghost{display:none}
  .ntr-landing .hero{padding:32px 0 56px}
  .ntr-landing .h1{font-size:40px;letter-spacing:-1.6px;line-height:1.05}
  .ntr-landing .lede{font-size:16px}
  .ntr-landing .hero-mock{max-width:520px;margin:0 auto}
  .ntr-landing .floater{font-size:12px;padding:10px 12px}
  .ntr-landing .floater strong{font-size:12px}
  .ntr-landing .floater.f1{top:-14px;right:-6px}
  .ntr-landing .floater.f2{bottom:-18px;left:-6px}
  .ntr-landing .floater.f3{display:none}
  .ntr-landing .mock-calendar{font-size:9px;grid-template-columns:30px repeat(7,1fr)}
  .ntr-landing .mock-calendar .head{padding:6px 0;font-size:9px}
  .ntr-landing .mock-calendar .head strong{font-size:11px}
  .ntr-landing .event{font-size:8.5px;padding:4px 5px}
  .ntr-landing .event small{display:none}
  .ntr-landing .section{padding:72px 0}
  .ntr-landing .rem-section,.ntr-landing .inapp-section{padding:72px 0 24px}
  .ntr-landing .section-head{margin-bottom:48px}
  .ntr-landing .section-head h2{font-size:32px;letter-spacing:-1.2px}
  .ntr-landing .section-head p{font-size:16px}
  .ntr-landing .rem-copy h2,.ntr-landing .faq-aside h2,.ntr-landing .inapp-copy h3{font-size:28px;letter-spacing:-1px}
  .ntr-landing .rem-cards{grid-template-columns:1fr}
  .ntr-landing .rem-stage{padding:24px;min-height:0}
  .ntr-landing .phone{width:100%;max-width:280px}
  .ntr-landing .rem-stats{grid-template-columns:1fr 1fr 1fr;gap:8px}
  .ntr-landing .rem-stat{padding:10px}
  .ntr-landing .rem-stat .v{font-size:20px}
  .ntr-landing .bento{grid-template-columns:1fr;gap:14px}
  .ntr-landing .t-1,.ntr-landing .t-2,.ntr-landing .t-3,.ntr-landing .t-4,.ntr-landing .t-5,.ntr-landing .t-7{grid-column:span 1}
  .ntr-landing .tile{padding:20px}
  .ntr-landing .t-7{padding:24px}
  .ntr-landing .t-7 h3{font-size:24px}
  .ntr-landing .url-bar{flex-wrap:wrap;padding:10px;gap:6px}
  .ntr-landing .url-bar .proto,.ntr-landing .url-bar .host,.ntr-landing .url-bar .slash,.ntr-landing .url-bar .slug{font-size:12px}
  .ntr-landing .url-bar .slug{flex:1 1 auto;min-width:80px}
  .ntr-landing .url-bar .copy-btn{padding:8px 12px;font-size:12px;flex-shrink:0}
  .ntr-landing .preview-wrap{margin-top:48px;padding:10px}
  .ntr-landing .preview-pane{padding:20px}
  .ntr-landing .preview-tabs button{padding:8px 12px;font-size:12px}
  .ntr-landing .svc-card{padding:14px}
  .ntr-landing .svc-row{grid-template-columns:1fr auto;grid-template-areas:"name price" "dur status" "actions actions";gap:8px;padding:12px 0}
  .ntr-landing .svc-row:first-of-type{display:none}
  .ntr-landing .svc-row .name{grid-area:name;min-width:0}
  .ntr-landing .svc-row .name b{font-size:13px;white-space:normal}
  .ntr-landing .svc-row .name span{font-size:11px;white-space:normal}
  .ntr-landing .svc-row .dur{grid-area:dur;justify-self:start}
  .ntr-landing .svc-row .price{grid-area:price;justify-self:end;align-self:start}
  .ntr-landing .svc-row .toggle{grid-area:status;justify-self:end}
  .ntr-landing .svc-row .actions{grid-area:actions;justify-self:start}
  .ntr-landing .cal-head{padding:10px;gap:6px}
  .ntr-landing .cal-head .pill{font-size:10px;padding:5px 8px}
  .ntr-landing .cal-head .pill:nth-child(n+5){display:none}
  .ntr-landing .cal-grid{grid-template-columns:36px repeat(7,1fr);font-size:9px}
  .ntr-landing .cal-grid .ch{padding:6px 0;font-size:9px}
  .ntr-landing .cal-grid .ch strong{font-size:11px}
  .ntr-landing .cal-grid .event small{display:none}
  .ntr-landing .kpi-grid{grid-template-columns:1fr 1fr}
  .ntr-landing .kpi{padding:14px;min-height:88px}
  .ntr-landing .kpi .v{font-size:26px}
  .ntr-landing .steps{grid-template-columns:1fr;gap:14px}
  .ntr-landing .step{padding:20px}
  .ntr-landing .test{padding:40px 24px;border-radius:18px}
  .ntr-landing .test-q{font-size:22px}
  .ntr-landing .test-stats{grid-template-columns:1fr 1fr;gap:10px}
  .ntr-landing .test-stat{padding:14px}
  .ntr-landing .test-stat .v{font-size:24px}
  .ntr-landing .faq-list summary{padding:16px 18px;grid-template-columns:auto 1fr auto;gap:12px}
  .ntr-landing .faq-list .q{font-size:14.5px}
  .ntr-landing .faq-list .a{padding:0 18px 18px 50px;font-size:13.5px}
  .ntr-landing .faq-list .plus{width:28px;height:28px;font-size:16px}
  .ntr-landing .footer{padding:56px 0 24px;margin-top:48px}
  .ntr-landing .foot-grid{gap:28px;margin-bottom:32px}
  .ntr-landing .foot-bottom{flex-direction:column;gap:8px;text-align:center}
  .ntr-landing .hero-trust{flex-direction:column;align-items:flex-start;gap:12px}
  .ntr-landing .logos-row{grid-template-columns:repeat(3,1fr);gap:20px;font-size:18px}
  .ntr-landing .logos-row span.sans{font-size:16px}
  .ntr-landing .logos-row span.mono{font-size:12px}
  .ntr-landing .inapp-bar{padding:12px 14px}
  .ntr-landing .inapp-bar .ttl{font-size:13px}
  .ntr-landing .inapp-bar .acts .iconbtn.markall{font-size:10px;padding:0 8px}
  .ntr-landing .inapp-filters{padding:8px 10px;overflow-x:auto;-webkit-overflow-scrolling:touch;flex-wrap:nowrap;scrollbar-width:none}
  .ntr-landing .inapp-filters::-webkit-scrollbar{display:none}
  .ntr-landing .inapp-filters .fpill{flex-shrink:0;font-size:11px}
  .ntr-landing .toast{padding:12px;gap:10px}
  .ntr-landing .toast .tic{width:32px;height:32px}
  .ntr-landing .toast .t-body .meta{gap:4px}
  .ntr-landing .toast .t-body .meta .chip{font-size:10px;padding:2px 6px}
}

/* === Phone portrait (<=480px) === */
@media (max-width:480px){
  .ntr-landing .container{padding:0 16px}
  .ntr-landing .h1{font-size:34px;letter-spacing:-1.2px;margin-bottom:18px}
  .ntr-landing .lede{font-size:15px;margin-bottom:24px}
  .ntr-landing .hero-ctas{flex-direction:column;align-items:stretch}
  .ntr-landing .hero-ctas .btn{justify-content:center;width:100%}
  .ntr-landing .section-head h2{font-size:28px}
  .ntr-landing .rem-copy h2,.ntr-landing .faq-aside h2,.ntr-landing .inapp-copy h3{font-size:24px}
  .ntr-landing .rem-stage{padding:18px}
  .ntr-landing .rem-stats{grid-template-columns:1fr;gap:8px}
  .ntr-landing .floater.f1,.ntr-landing .floater.f2{display:none}
  .ntr-landing .mock-filters .chip:nth-child(n+3){display:none}
  .ntr-landing .mock-staff .s:nth-child(n+5){display:none}
  .ntr-landing .logos-row{grid-template-columns:repeat(2,1fr);font-size:16px}
  .ntr-landing .test-stats{grid-template-columns:1fr}
  .ntr-landing .foot-grid{grid-template-columns:1fr;gap:24px;text-align:left}
  .ntr-landing .cal-head .pill:nth-child(n+4){display:none}
  .ntr-landing .preview-pane{padding:14px}
  .ntr-landing .svc-card{padding:12px}
  .ntr-landing .kpi-grid{grid-template-columns:1fr}
  .ntr-landing .toast{grid-template-columns:auto 1fr;gap:10px}
  .ntr-landing .toast .t-side{grid-column:1 / -1;flex-direction:row;justify-content:space-between;align-items:center;margin-top:4px}
  .ntr-landing .url-share{gap:6px}
  .ntr-landing .url-share .pill{font-size:11px;padding:4px 8px}
  .ntr-landing .nav-ctas .btn-ink{padding:8px 12px;font-size:12px}
  .ntr-landing .nav-ctas .btn-ink svg{display:none}
}
`;

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

const PlayIcon = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <polygon points="6 4 20 12 6 20 6 4" fill="currentColor" />
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
            <style dangerouslySetInnerHTML={{ __html: LANDING_CSS }} />

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
                            {auth?.user ? (
                                <Link href={dashboardHref} className="btn btn-ink">
                                    {t('welcome.nav_dashboard')} <ArrowRight />
                                </Link>
                            ) : (
                                <>
                                    {canLogin && (
                                        <Link href={loginHref} className="btn btn-ghost">
                                            {t('welcome.nav_login')}
                                        </Link>
                                    )}
                                    {canRegister && (
                                        <Link href={primaryCtaHref} className="btn btn-ink">
                                            {t('welcome.nav_cta_trial')} <ArrowRight />
                                        </Link>
                                    )}
                                </>
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
                                <Link href={primaryCtaHref} className="btn btn-ink">
                                    {t('welcome.hero_cta_primary')} <ArrowRight />
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
                            <div className="floater f2">
                                <span className="icon" style={{ background: '#DCFCE7', color: '#25D366' }}>
                                    <WhatsAppGlyph />
                                </span>
                                <div><strong>{t('welcome.floater_wa_title')}</strong><span>{t('welcome.floater_wa_body')}</span></div>
                            </div>
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
                                <p className="lede">{t('welcome.rem_lede')}</p>
                                <div className="rem-cards">
                                    <div className="rem-card">
                                        <span className="rc-ic wa"><WhatsAppGlyph size={15} /></span>
                                        <b>{t('welcome.rem_card_wa_title')}</b>
                                        <span>{t('welcome.rem_card_wa_desc')}</span>
                                    </div>
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
                                    <div className="phone-screen">
                                        <div className="phone-statusbar">
                                            <span>9:41</span>
                                            <span>••• 5G ⏷</span>
                                        </div>
                                        <div className="phone-app">
                                            <div className="app-head">
                                                <span className="back">‹</span>
                                                <div className="who">
                                                    <span className="av">K</span>
                                                    <div><b>{t('welcome.mock_clinic')}</b><span>{t('welcome.phone_clinic_status')}</span></div>
                                                </div>
                                                <span style={{ color: 'var(--whatsapp)', fontSize: 18 }}>⋮</span>
                                            </div>

                                            <div className="bubble bot" style={{ animationDelay: '.1s' }}>
                                                <b>{t('welcome.phone_msg_greeting_strong')}</b><br />
                                                {t('welcome.phone_msg_booking_intro')}<br />
                                                <b>{t('welcome.phone_msg_booking_when')}</b><br />
                                                {t('welcome.phone_msg_booking_who')}<br />
                                                <span style={{ color: '#6B6B78', fontSize: 11 }}>{t('welcome.phone_msg_booking_addr')}</span>
                                                <small>{t('welcome.phone_msg_time_1')}</small>
                                            </div>
                                            <div className="bubble bot" style={{ animationDelay: '.4s' }}>
                                                {t('welcome.phone_msg_thanks')}
                                                <small>{t('welcome.phone_msg_time_1')}</small>
                                            </div>
                                            <div style={{ textAlign: 'center', fontSize: 9.5, color: '#9CA3AF', fontWeight: 600, letterSpacing: 1, margin: '6px 0', animation: 'ntr-bubIn .5s ease both', animationDelay: '.9s' }}>
                                                {t('welcome.phone_msg_24h_label')}
                                            </div>
                                            <div className="bubble bot" style={{ animationDelay: '1.1s' }}>
                                                <b>{t('welcome.phone_msg_reminder_strong')}</b> ⏰<br />
                                                {t('welcome.phone_msg_reminder_intro')}<br />
                                                <b>{t('welcome.phone_msg_reminder_when')}</b><br />
                                                {t('welcome.phone_msg_reminder_who')}
                                                <small>{t('welcome.phone_msg_time_2')}</small>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="channels left">
                                    <div className="chan" style={{ animationDelay: '.4s' }}>
                                        <span className="ico wa"><WhatsAppGlyph /></span>
                                        <div><b>{t('welcome.chan_wa_title')}</b><span>{t('welcome.chan_wa_sub')}</span></div>
                                        <span className="live" />
                                    </div>
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
                                                <p>{t('welcome.toast_remind_body')}</p>
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
                                        <p>{t('welcome.tile_link_desc')}</p>
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
                                            <span className="pill"><span className="ic" style={{ color: '#25D366' }}><WhatsAppGlyph size={12} /></span>{t('welcome.tile_link_share_wa')}</span>
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
                                    <summary><span className="num">02</span><span className="q">{t('welcome.faq_q2')}</span><span className="plus">+</span></summary>
                                    <div className="a">{t('welcome.faq_a2')}</div>
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
