<?php

namespace App\Enums;

enum UserType: string
{
    case Tenant = 'tenant';
    case SuperAdmin = 'super_admin';
}
