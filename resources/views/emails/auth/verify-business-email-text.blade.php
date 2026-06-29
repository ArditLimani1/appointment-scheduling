{{ __('mail.verify_business.text_title', ['business' => $businessName]) }}

{{ $recipientName ? __('mail.verify_business.text_greeting', ['name' => $recipientName]) : __('mail.verify_business.text_greeting_generic') }}

{{ __('mail.verify_business.text_thanks', ['business' => $businessName]) }}

{{ __('mail.verify_business.text_intro') }}

{{ __('mail.verify_business.text_cta') }}
{{ $verificationUrl }}

{{ __('mail.verify_business.text_expiry', ['minutes' => $expiresInMinutes]) }}

{{ __('mail.verify_business.text_ignore') }}
