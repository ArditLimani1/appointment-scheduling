<?php

namespace App\Services;

use App\Models\AuditLog;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Request;

class AuditLogger
{
    public static function log(string $action, ?Model $target = null, array $metadata = [], ?string $targetLabel = null): AuditLog
    {
        $actor = Auth::user();

        return AuditLog::create([
            'actor_id' => $actor?->id,
            'actor_email' => $actor?->email,
            'action' => $action,
            'target_type' => $target ? class_basename($target) : null,
            'target_id' => $target?->getKey(),
            'target_label' => $targetLabel,
            'metadata' => $metadata ?: null,
            'ip_address' => Request::ip(),
        ]);
    }
}
