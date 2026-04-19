<?php

namespace App\Console\Commands;

use App\Enums\UserType;
use App\Models\User;
use Illuminate\Console\Command;

class MakeSuperAdminCommand extends Command
{
    protected $signature = 'user:make-super-admin {email}';

    protected $description = 'Promote a user to super admin by email';

    public function handle(): int
    {
        $email = $this->argument('email');

        $user = User::where('email', $email)->first();

        if (! $user) {
            $this->error("No user found with email {$email}.");

            return self::FAILURE;
        }

        $user->user_type = UserType::SuperAdmin;
        $user->save();

        $this->info("User {$user->email} is now a super admin.");

        return self::SUCCESS;
    }
}
