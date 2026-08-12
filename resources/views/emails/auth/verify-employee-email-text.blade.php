{{ __('mail.verify_employee.text_title', ['business' => $businessName]) }}

{{ $recipientName ? __('mail.verify_employee.text_greeting', ['name' => $recipientName]) : __('mail.verify_employee.text_greeting_generic') }}

{{ __('mail.verify_employee.text_thanks', ['business' => $businessName]) }}

{{ __('mail.verify_employee.text_intro') }}

{{ __('mail.verify_employee.text_cta') }}
{{ $verificationUrl }}

{{ __('mail.verify_employee.text_expiry', ['minutes' => $expiresInMinutes]) }}

{{ __('mail.verify_employee.text_ignore') }}
