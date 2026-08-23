@php
    $business = $appointment->business;
    $clientName = trim(($appointment->client_first_name ?? '').' '.($appointment->client_last_name ?? ''));
    $formattedDate = $appointment->date?->copy()?->locale(app()->getLocale())?->translatedFormat('d M Y');
    $formattedTime = $appointment->start_time
        ? \Carbon\Carbon::parse($appointment->start_time)->format('H:i')
        : '—';
    $businessMention = \App\Support\BusinessMention::at($business?->name);
    $withBusiness = $businessMention !== '' ? ' '.$businessMention : '';
    // Each notification type gets its own wording, so the badge and the intro line
    // always agree with the subject built in CustomerAppointmentUpdateMail.
    $eyebrowLine = match ($notificationType) {
        'reminder' => __('mail.appointment_update.eyebrow_reminder'),
        'confirmed' => __('mail.appointment_update.eyebrow_confirmed'),
        'cancelled' => __('mail.appointment_update.eyebrow_cancelled'),
        'rescheduled' => __('mail.appointment_update.eyebrow_rescheduled'),
        default => __('mail.appointment_update.eyebrow'),
    };
    $introLine = match ($notificationType) {
        'reminder' => __('mail.appointment_update.intro_reminder', ['with_business' => $withBusiness]),
        'confirmed' => __('mail.appointment_update.intro_confirmed', ['with_business' => $withBusiness]),
        'cancelled' => __('mail.appointment_update.intro_cancelled', ['with_business' => $withBusiness]),
        'rescheduled' => __('mail.appointment_update.intro_rescheduled', ['with_business' => $withBusiness]),
        default => __('mail.appointment_update.intro', ['with_business' => $withBusiness]),
    };
@endphp
<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{ $subjectLine }}</title>
</head>
<body style="margin:0; padding:0; background:#f5f6f8; font-family:Inter, Arial, Helvetica, sans-serif; color:#0a0a0f;">
    {{-- Inbox preview text: without it, mail clients show the "nitermin." wordmark from the header. --}}
    <div style="display:none; max-height:0; max-width:0; overflow:hidden; mso-hide:all; font-size:1px; line-height:1px; color:#f5f6f8; opacity:0;">
        {{ $introLine }}
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
                    <span style="display:inline-block; padding:7px 11px; border:1px solid #e6e6eb; border-radius:999px; background:#fafafc; color:#6b6b78; font-size:11px; font-weight:700; letter-spacing:0.16em; text-transform:uppercase;">{{ $eyebrowLine }}</span>
                </div>
            </div>

            <div style="padding:30px 24px 32px;">
                <h1 style="margin:0 0 14px; font-size:31px; line-height:1.08; letter-spacing:-0.03em; font-weight:800; color:#0a0a0f;">{{ $subjectLine }}</h1>
                <p style="margin:0 0 14px; font-size:15px; line-height:1.7; color:#3a3a45;">
                    {{ $clientName !== '' ? __('mail.appointment_update.greeting', ['name' => $clientName]) : __('mail.appointment_update.greeting_generic') }}
                </p>
                <p style="margin:0 0 26px; font-size:15px; line-height:1.7; color:#3a3a45;">
                    {{ $introLine }}
                </p>

                <div style="border:1px solid #efeff3; border-radius:22px; background:#fafafc; padding:20px; margin-bottom:24px;">
                    <div style="font-size:12px; font-weight:700; letter-spacing:0.16em; text-transform:uppercase; color:#6b6b78; margin-bottom:14px;">{{ __('mail.appointment_update.details_title') }}</div>
                    <div style="display:block;">
                        @foreach ([
                            __('mail.appointment_update.service') => $appointment->resolvedServiceName() ?? '—',
                            __('mail.appointment_update.staff') => $appointment->resolvedEmployeeName() ?? '—',
                            __('mail.appointment_update.date') => $formattedDate ?? '—',
                            __('mail.appointment_update.time') => $formattedTime,
                            __('mail.appointment_update.status') => __('common.status.'.$appointment->status->value),
                        ] as $label => $value)
                            <div style="padding:12px 0; border-top: {{ $loop->first ? '0' : '1px solid #e6e6eb' }};">
                                <div style="font-size:12px; font-weight:700; letter-spacing:0.04em; text-transform:uppercase; color:#6b6b78; margin-bottom:6px;">{{ $label }}</div>
                                <div style="font-size:15px; font-weight:700; color:#0a0a0f; line-height:1.5;">{{ $value }}</div>
                            </div>
                        @endforeach
                    </div>
                </div>

                @if(!empty($localizedChanges))
                    <div style="margin-bottom:24px;">
                        <div style="font-size:12px; font-weight:700; letter-spacing:0.16em; text-transform:uppercase; color:#6b6b78; margin-bottom:12px;">{{ __('mail.appointment_update.changes_title') }}</div>
                        <ul style="margin:0; padding-left:18px; color:#3a3a45; font-size:14px; line-height:1.8;">
                            @foreach($localizedChanges as $change)
                                <li>{!! $change !!}</li>
                            @endforeach
                        </ul>
                    </div>
                @endif

                <p style="margin:0; font-size:14px; line-height:1.7; color:#6b6b78;">
                    {{ $business?->name
                        ? __('mail.appointment_update.contact', ['business' => $business->name])
                        : __('mail.appointment_update.contact_generic') }}
                </p>
            </div>
        </div>
    </div>
</body>
</html>
