@php
    $business = $appointment->business;
    $employee = $appointment->employee;
    $service = $appointment->service;
    $clientName = trim(($appointment->client_first_name ?? '').' '.($appointment->client_last_name ?? ''));
    $formattedDate = optional($appointment->date)->format('d M Y');
    $formattedTime = $appointment->start_time
        ? \Carbon\Carbon::parse($appointment->start_time)->format('H:i')
        : '—';
@endphp
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{ $subjectLine }}</title>
</head>
<body style="margin:0; padding:0; background:#f5f7fb; font-family:Arial, Helvetica, sans-serif; color:#111827;">
    <div style="max-width:640px; margin:0 auto; padding:32px 20px;">
        <div style="background:#ffffff; border:1px solid #e5e7eb; border-radius:24px; overflow:hidden; box-shadow:0 12px 30px rgba(15, 23, 42, 0.08);">
            <div style="background:linear-gradient(135deg, #0f2740 0%, #14314f 100%); padding:28px 32px;">
                <div style="display:inline-flex; align-items:center; gap:12px;">
                    <div style="width:44px; height:44px; border-radius:16px; background:#ffffff1a; text-align:center; line-height:44px; color:#ffffff; font-weight:700; font-size:18px;">
                        N
                    </div>
                    <div>
                        <div style="color:#ffffff; font-size:20px; font-weight:800; line-height:1;">NiTermin</div>
                        <div style="color:#d2dbe7; font-size:11px; letter-spacing:0.18em; text-transform:uppercase; margin-top:6px;">Appointment Update</div>
                    </div>
                </div>
            </div>

            <div style="padding:32px;">
                <h1 style="margin:0 0 12px; font-size:28px; line-height:1.2; color:#111827;">{{ $subjectLine }}</h1>
                <p style="margin:0 0 24px; font-size:15px; line-height:1.7; color:#4b5563;">
                    Hello{{ $clientName !== '' ? ' '.$clientName : '' }}, we wanted to let you know that your appointment{{ $business?->name ? ' with '.$business->name : '' }} has been updated.
                </p>

                <div style="border:1px solid #e5e7eb; border-radius:20px; background:#f9fafb; padding:20px 22px; margin-bottom:24px;">
                    <div style="font-size:12px; font-weight:700; letter-spacing:0.16em; text-transform:uppercase; color:#6b7280; margin-bottom:14px;">Appointment Details</div>
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
                        <tr>
                            <td style="padding:8px 0; font-size:14px; color:#6b7280;">Service</td>
                            <td style="padding:8px 0; font-size:14px; font-weight:700; color:#111827; text-align:right;">{{ $service?->name ?? '—' }}</td>
                        </tr>
                        <tr>
                            <td style="padding:8px 0; font-size:14px; color:#6b7280;">Staff</td>
                            <td style="padding:8px 0; font-size:14px; font-weight:700; color:#111827; text-align:right;">{{ $employee?->name ?? '—' }}</td>
                        </tr>
                        <tr>
                            <td style="padding:8px 0; font-size:14px; color:#6b7280;">Date</td>
                            <td style="padding:8px 0; font-size:14px; font-weight:700; color:#111827; text-align:right;">{{ $formattedDate ?? '—' }}</td>
                        </tr>
                        <tr>
                            <td style="padding:8px 0; font-size:14px; color:#6b7280;">Time</td>
                            <td style="padding:8px 0; font-size:14px; font-weight:700; color:#111827; text-align:right;">{{ $formattedTime }}</td>
                        </tr>
                        <tr>
                            <td style="padding:8px 0; font-size:14px; color:#6b7280;">Status</td>
                            <td style="padding:8px 0; font-size:14px; font-weight:700; color:#111827; text-align:right;">{{ ucfirst($appointment->status->value) }}</td>
                        </tr>
                    </table>
                </div>

                @if(!empty($changes))
                    <div style="margin-bottom:24px;">
                        <div style="font-size:12px; font-weight:700; letter-spacing:0.16em; text-transform:uppercase; color:#6b7280; margin-bottom:12px;">What Changed</div>
                        <ul style="margin:0; padding-left:18px; color:#374151; font-size:14px; line-height:1.8;">
                            @foreach($changes as $change)
                                <li>{!! $change !!}</li>
                            @endforeach
                        </ul>
                    </div>
                @endif

                <p style="margin:0; font-size:14px; line-height:1.7; color:#6b7280;">
                    If you have any questions, please contact {{ $business?->name ?? 'the business' }} directly.
                </p>
            </div>
        </div>
    </div>
</body>
</html>
