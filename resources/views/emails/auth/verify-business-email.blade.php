<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Verify your email for {{ $businessName }}</title>
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
                        <div style="color:#d2dbe7; font-size:11px; letter-spacing:0.18em; text-transform:uppercase; margin-top:6px;">Business Verification</div>
                    </div>
                </div>
            </div>

            <div style="padding:32px;">
                <h1 style="margin:0 0 12px; font-size:28px; line-height:1.2; color:#111827;">Verify your email</h1>
                <p style="margin:0 0 18px; font-size:15px; line-height:1.7; color:#4b5563;">
                    Hello{{ $recipientName ? ' '.$recipientName : '' }}, thanks for creating {{ $businessName }} on NiTermin.
                </p>
                <p style="margin:0 0 24px; font-size:15px; line-height:1.7; color:#4b5563;">
                    Please confirm your email address to activate your business account and sign in to the dashboard.
                </p>

                <div style="border:1px solid #e5e7eb; border-radius:20px; background:#f9fafb; padding:20px 22px; margin-bottom:24px;">
                    <div style="font-size:12px; font-weight:700; letter-spacing:0.16em; text-transform:uppercase; color:#6b7280; margin-bottom:14px;">Next Step</div>
                    <p style="margin:0; font-size:14px; line-height:1.7; color:#374151;">
                        Click the button below to verify your email. This link expires in {{ $expiresInMinutes }} minutes.
                    </p>
                </div>

                <div style="margin-bottom:24px;">
                    <a href="{{ $verificationUrl }}" style="display:inline-block; padding:14px 24px; border-radius:16px; background:linear-gradient(135deg, #0f2740 0%, #14314f 100%); color:#ffffff; font-size:14px; font-weight:700; text-decoration:none;">
                        Verify Email Address
                    </a>
                </div>

                <p style="margin:0 0 12px; font-size:14px; line-height:1.7; color:#6b7280;">
                    If the button does not work, copy and paste this link into your browser:
                </p>
                <p style="margin:0 0 24px; word-break:break-all; font-size:13px; line-height:1.7; color:#0f2740;">
                    <a href="{{ $verificationUrl }}" style="color:#0f2740;">{{ $verificationUrl }}</a>
                </p>

                <p style="margin:0; font-size:14px; line-height:1.7; color:#6b7280;">
                    If you did not create this business account, you can safely ignore this email.
                </p>
            </div>
        </div>
    </div>
</body>
</html>
