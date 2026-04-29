<?php

namespace Tests\Feature\Support;

use App\Support\InternalRedirect;
use Tests\TestCase;

class InternalRedirectTest extends TestCase
{
    public function test_returns_fallback_for_null_or_empty_input(): void
    {
        $this->assertSame('/admin/x', InternalRedirect::resolve(null, '/admin/x'));
        $this->assertSame('/admin/x', InternalRedirect::resolve('', '/admin/x'));
        $this->assertSame('/admin/x', InternalRedirect::resolve('   ', '/admin/x'));
    }

    public function test_rejects_external_urls(): void
    {
        $fallback = '/admin/appointments';

        $this->assertSame($fallback, InternalRedirect::resolve('https://evil.example.com/admin', $fallback));
        $this->assertSame($fallback, InternalRedirect::resolve('http://evil.example.com', $fallback));
        $this->assertSame($fallback, InternalRedirect::resolve('//evil.example.com/path', $fallback));
        $this->assertSame($fallback, InternalRedirect::resolve('javascript:alert(1)', $fallback));
    }

    public function test_rejects_paths_outside_admin_or_employee(): void
    {
        $fallback = '/admin/appointments';

        $this->assertSame($fallback, InternalRedirect::resolve('/login', $fallback));
        $this->assertSame($fallback, InternalRedirect::resolve('/book/some-biz', $fallback));
        $this->assertSame($fallback, InternalRedirect::resolve('/dashboard', $fallback));
        $this->assertSame($fallback, InternalRedirect::resolve('admin/appointments', $fallback));
    }

    public function test_accepts_admin_or_employee_paths(): void
    {
        $fallback = '/admin/appointments';

        $this->assertSame('/admin', InternalRedirect::resolve('/admin', $fallback));
        $this->assertSame('/admin/appointments', InternalRedirect::resolve('/admin/appointments', $fallback));
        $this->assertSame(
            '/admin/appointments?service_id=2',
            InternalRedirect::resolve('/admin/appointments?service_id=2', $fallback)
        );
        $this->assertSame('/employee/appointments', InternalRedirect::resolve('/employee/appointments', $fallback));
        $this->assertSame(
            '/employee/appointments/calendar?date=2026-04-29',
            InternalRedirect::resolve('/employee/appointments/calendar?date=2026-04-29', $fallback)
        );
    }

    public function test_does_not_match_path_prefix_lookalikes(): void
    {
        $fallback = '/admin/appointments';

        $this->assertSame($fallback, InternalRedirect::resolve('/administrator', $fallback));
        $this->assertSame($fallback, InternalRedirect::resolve('/employees', $fallback));
        $this->assertSame($fallback, InternalRedirect::resolve('/admin-something', $fallback));
    }
}
