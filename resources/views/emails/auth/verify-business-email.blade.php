@php
@endphp
<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{ __('mail.verify_business.subject', ['business' => $businessName]) }}</title>
</head>
<body style="margin:0; padding:0; background:#f5f6f8; font-family:Inter, Arial, Helvetica, sans-serif; color:#0a0a0f;">
    {{-- Inbox preview text: without it, mail clients show the "nitermin." wordmark from the header. --}}
    <div style="display:none; max-height:0; max-width:0; overflow:hidden; mso-hide:all; font-size:1px; line-height:1px; color:#f5f6f8; opacity:0;">
        {{ __('mail.verify_business.intro') }}
        <span>&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;</span>
    </div>
    <div style="max-width:640px; margin:0 auto; padding:32px 20px;">
        <div style="background:#ffffff; border:1px solid #e6e6eb; border-radius:28px; overflow:hidden; box-shadow:0 24px 48px -24px rgba(11, 23, 48, 0.22);">
            <div style="padding:26px 24px 18px; border-bottom:1px solid #efeff3; background:#ffffff;">
                <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                    <tr>
                        <td style="padding:0; vertical-align:middle;">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="44" height="44" style="display:block; color:#0e0e11;">
                                <g fill="none" stroke="currentColor" stroke-width="5" stroke-linecap="round">
                                    <circle cx="32" cy="32" r="27"></circle>
                                    <line x1="20" y1="46" x2="44" y2="18"></line>
                                    <line x1="32" y1="11" x2="32" y2="14"></line>
                                    <line x1="32" y1="50" x2="32" y2="53"></line>
                                </g>
                            </svg>
                        </td>
                        <td style="padding:0 0 0 12px; vertical-align:middle;">
                            <div style="font-size:27px; line-height:1; font-weight:600; letter-spacing:-0.04em; color:#0e0e11;">
                                nitermin<span style="color:#8a8a92;">.</span>
                            </div>
                        </td>
                    </tr>
                </table>
                <div style="margin-top:16px;">
                    <span style="display:inline-block; padding:7px 11px; border:1px solid #e6e6eb; border-radius:999px; background:#fafafc; color:#6b6b78; font-size:11px; font-weight:700; letter-spacing:0.16em; text-transform:uppercase;">{{ __('mail.verify_business.eyebrow') }}</span>
                </div>
            </div>

            <div style="padding:30px 24px 32px;">
                <h1 style="margin:0 0 14px; font-size:31px; line-height:1.08; letter-spacing:-0.03em; font-weight:800; color:#0a0a0f;">{{ __('mail.verify_business.title') }}</h1>
                <p style="margin:0 0 18px; font-size:15px; line-height:1.7; color:#3a3a45;">
                    {{ $recipientName
                        ? __('mail.verify_business.greeting', ['name' => $recipientName, 'business' => $businessName])
                        : __('mail.verify_business.greeting_generic', ['business' => $businessName]) }}
                </p>
                <p style="margin:0 0 24px; font-size:15px; line-height:1.7; color:#3a3a45;">
                    {{ __('mail.verify_business.intro') }}
                </p>

                <div style="border:1px solid #efeff3; border-radius:22px; background:#fafafc; padding:20px 22px; margin-bottom:24px;">
                    <div style="font-size:12px; font-weight:700; letter-spacing:0.16em; text-transform:uppercase; color:#6b6b78; margin-bottom:14px;">{{ __('mail.verify_business.next_step') }}</div>
                    <p style="margin:0; font-size:14px; line-height:1.7; color:#3a3a45;">
                        {{ __('mail.verify_business.next_step_body', ['minutes' => $expiresInMinutes]) }}
                    </p>
                </div>

                <div style="margin-bottom:24px;">
                    <a href="{{ $verificationUrl }}" style="display:inline-block; padding:14px 24px; border-radius:16px; background:#0a0a0f; color:#ffffff; font-size:14px; font-weight:700; text-decoration:none; box-shadow:0 14px 30px -18px rgba(10,10,15,0.7);">
                        {{ __('mail.verify_business.button') }}
                    </a>
                </div>

                <p style="margin:0 0 12px; font-size:14px; line-height:1.7; color:#6b6b78;">
                    {{ __('mail.verify_business.fallback') }}
                </p>
                <p style="margin:0 0 24px; word-break:break-all; font-size:13px; line-height:1.7; color:#0a0a0f;">
                    <a href="{{ $verificationUrl }}" style="color:#0a0a0f;">{{ $verificationUrl }}</a>
                </p>

                <p style="margin:0; font-size:14px; line-height:1.7; color:#6b6b78;">
                    {{ __('mail.verify_business.ignore') }}
                </p>
            </div>
        </div>
    </div>
</body>
</html>
