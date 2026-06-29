<?php

namespace App\Notifications;

use Illuminate\Auth\Notifications\VerifyEmail;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\URL;

class VerifyBusinessEmail extends VerifyEmail implements ShouldQueue
{
    use Queueable;

    protected function verificationUrl($notifiable): string
    {
        $signedPath = URL::temporarySignedRoute(
            'verification.verify',
            Carbon::now()->addMinutes(Config::get('auth.verification.expire', 60)),
            [
                'id' => $notifiable->getKey(),
                'hash' => sha1($notifiable->getEmailForVerification()),
            ],
            absolute: false,
        );

        return rtrim((string) config('app.url'), '/').$signedPath;
    }

    public function toMail($notifiable): MailMessage
    {
        $verificationUrl = $this->verificationUrl($notifiable);
        $businessName = $notifiable->ownedBusiness?->name ?? 'your business';

        return (new MailMessage)
            ->subject(__('mail.verify_business.subject', ['business' => $businessName]))
            ->view([
                'html' => 'emails.auth.verify-business-email',
                'text' => 'emails.auth.verify-business-email-text',
            ], [
                'verificationUrl' => $verificationUrl,
                'businessName' => $businessName,
                'recipientName' => $notifiable->name,
                'expiresInMinutes' => (int) Config::get('auth.verification.expire', 60),
            ]);
    }
}
