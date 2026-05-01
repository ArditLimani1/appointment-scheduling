import { SuccessToastProvider } from '@/Components/SuccessToastProvider';
import Dropdown from '@/Components/Dropdown';
import Icon from '@/Components/Icon';
import WorkspaceTabs, { useWorkspace } from '@/Components/WorkspaceTabs';
import LanguageSwitcher from '@/i18n/LanguageSwitcher';
import { useT } from '@/i18n/useT';
import { Link, usePage } from '@inertiajs/react';
import { useMemo, useState } from 'react';

function toSlug(str) {
    return (str ?? '').toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

const navItems = [
    { labelKey: 'layout.employee.nav.dashboard', icon: 'dashboard', route: 'employee.dashboard', permission: 'employee.dashboard' },
    { labelKey: 'layout.employee.nav.appointments', icon: 'calendar_today', route: 'employee.appointments.index', permission: 'employee.dashboard' },
    { labelKey: 'layout.employee.nav.schedule', icon: 'calendar_view_week', route: 'employee.schedule.index', permission: 'employee.schedule' },
    { labelKey: 'layout.employee.nav.analytics', icon: 'analytics', route: 'employee.analytics.index', permission: 'employee.analytics' },
    { labelKey: 'layout.employee.nav.configuration', icon: 'tune', route: 'employee.schedule.configuration', permission: 'employee.schedule' },
];

const adminNavItems = [
    { labelKey: 'layout.admin.nav.dashboard', icon: 'dashboard', route: 'admin.dashboard', permission: 'admin.dashboard' },
    { labelKey: 'layout.admin.nav.services', icon: 'layers', route: 'admin.services.index', permission: 'admin.services' },
    { labelKey: 'layout.admin.nav.employees', icon: 'badge', route: 'admin.employees.index', permission: 'admin.employees' },
    { labelKey: 'layout.admin.nav.roles', icon: 'key', route: 'admin.roles.index', permission: 'admin.roles' },
    { labelKey: 'layout.admin.nav.appointments', icon: 'calendar_today', route: 'admin.appointments.index', permission: 'admin.appointments' },
    { labelKey: 'layout.admin.nav.analytics', icon: 'analytics', route: 'admin.analytics.index', permission: 'admin.analytics' },
    { labelKey: 'layout.admin.nav.configuration', icon: 'settings', route: 'admin.settings.index', permission: 'admin.settings' },
];

const mobileNavItems = [
    { labelKey: 'layout.employee.nav.dashboard', icon: 'dashboard', route: 'employee.dashboard', permission: 'employee.dashboard' },
    { labelKey: 'layout.employee.mobile.appts', icon: 'calendar_today', route: 'employee.appointments.index', permission: 'employee.dashboard' },
    { labelKey: 'layout.employee.nav.schedule', icon: 'calendar_view_week', route: 'employee.schedule.index', permission: 'employee.schedule' },
    { labelKey: 'layout.employee.nav.analytics', icon: 'analytics', route: 'employee.analytics.index', permission: 'employee.analytics' },
    { labelKey: 'layout.employee.mobile.config', icon: 'tune', route: 'employee.schedule.configuration', permission: 'employee.schedule' },
];

export default function EmployeeLayout({ children }) {
    const { auth } = usePage().props;
    const user = auth.user;
    const business = auth.business;
    const permissions = auth.permissions ?? [];
    const can = (key) => permissions.includes(key);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const t = useT();

    const visibleNav = useMemo(
        () =>
            navItems
                .filter((item) => can(item.permission))
                .map((item) => ({ ...item, label: t(item.labelKey) })),
        [permissions, t],
    );
    const visibleMobileNav = useMemo(
        () =>
            mobileNavItems
                .filter((item) => can(item.permission))
                .map((item) => ({ ...item, label: t(item.labelKey) })),
        [permissions, t],
    );
    const visibleAdminNav = useMemo(
        () =>
            adminNavItems
                .filter((item) => can(item.permission))
                .map((item) => ({ ...item, label: t(item.labelKey) })),
        [permissions, t],
    );

    const [workspace, setWorkspace] = useWorkspace();
    const showTabs = visibleAdminNav.length > 0;
    const effectiveWorkspace = showTabs ? workspace : 'employee';
    const sidebarItems = effectiveWorkspace === 'admin' ? visibleAdminNav : visibleNav;

    const employeeSlug = user?.booking_slug || toSlug(user?.name);
    const employeeBookingUrl = business?.slug
        ? (() => { try { return route('booking.employee', { slug: business.slug, employeeSlug: employeeSlug }); } catch { return `/book/${business.slug}/${employeeSlug}`; } })()
        : '#';

    const currentUrl = usePage().url;
    const createAppointmentHref = can('employee.appointments')
        ? (() => {
            try {
                return route('employee.appointments.create', { return_to: currentUrl });
            } catch {
                return '#';
            }
        })()
        : null;
    const onEmployeeAppointmentCreate = (() => {
        try {
            return Boolean(route().current('employee.appointments.create'));
        } catch {
            return false;
        }
    })();
    const showCreateAppointmentButton = Boolean(createAppointmentHref) && !onEmployeeAppointmentCreate;

    const isActive = (routeName) => {
        try {
            if (routeName === 'employee.dashboard') {
                return route().current('employee.dashboard');
            }
            if (routeName === 'employee.appointments.index') {
                return (
                    route().current('employee.appointments.index') || route().current('employee.appointments.calendar')
                );
            }
            if (route().current(routeName)) return true;
            if (routeName === 'employee.schedule.index' && route().current('employee.schedule.configuration')) {
                return false;
            }
            if (routeName === 'employee.analytics.index') {
                return route().current('employee.analytics.index');
            }
            return route().current(routeName + '.*');
        } catch {
            return false;
        }
    };

    return (
        <SuccessToastProvider>
        <div className="min-h-screen bg-surface font-body">
            {sidebarOpen && (
                <div
                    className="fixed inset-0 z-40 bg-black/40 lg:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            <aside className={`fixed top-0 left-0 z-50 h-screen w-72 bg-surface flex flex-col transition-transform duration-300 ${
                sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
            }`}>
                <div className="flex flex-col h-full py-10 px-8">
                    <div className="mb-10">
                        <p className="text-sm font-extrabold font-headline text-on-surface uppercase tracking-widest leading-none">
                            {business?.name ?? t('layout.employee.fallback_business')}
                        </p>
                        <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mt-1">
                            {t('layout.employee.portal_subtitle')}
                        </p>
                    </div>

                    {showTabs && (
                        <WorkspaceTabs
                            workspace={effectiveWorkspace}
                            onChange={setWorkspace}
                            labels={{ admin: t('layout.admin.tab_admin'), employee: t('layout.admin.tab_employee') }}
                            defaultRoutes={{ admin: 'admin.dashboard', employee: 'employee.dashboard' }}
                        />
                    )}

                    <nav className="flex-1 space-y-1 overflow-y-auto">
                        {sidebarItems.map((item) => {
                            const active = effectiveWorkspace === 'admin'
                                ? (() => { try { return route().current(item.route) || route().current(item.route + '.*'); } catch { return false; } })()
                                : isActive(item.route);
                            return (
                                <Link
                                    key={item.route}
                                    href={(() => {
                                        try {
                                            return route(item.route, {}, false);
                                        } catch {
                                            return '#';
                                        }
                                    })()}
                                    className={`flex items-center gap-4 py-3 pl-4 text-sm transition-all duration-200 ${
                                        active
                                            ? 'bg-surface-container-low text-on-surface font-bold border-l-2 border-on-surface rounded-r-lg'
                                            : 'text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface rounded-lg'
                                    }`}
                                >
                                    <Icon
                                        name={item.icon}
                                        filled={active}
                                        size="text-[20px]"
                                        className={active ? 'text-on-surface' : 'text-outline'}
                                    />
                                    <span className="font-medium">{item.label}</span>
                                </Link>
                            );
                        })}
                    </nav>

                    <div className="pt-8 border-t border-outline-variant/40 space-y-5">
                        {showCreateAppointmentButton && (
                            <Link
                                href={createAppointmentHref}
                                className="flex items-center justify-center gap-2 rounded-xl bg-on-surface px-4 py-2.5 text-xs font-bold uppercase tracking-widest text-surface transition-opacity hover:opacity-90"
                                aria-label={t('layout.employee.add_appointment')}
                            >
                                <Icon name="add" size="text-base" />
                                <span className="hidden sm:inline">{t('layout.employee.add_appointment')}</span>
                            </Link>
                        )}

                        <div className="flex items-center gap-3 px-2">
                            <div className="w-9 h-9 rounded-full bg-secondary-container flex items-center justify-center text-on-secondary-container text-xs font-bold shrink-0">
                                {user?.name?.charAt(0)?.toUpperCase()}
                            </div>
                            <div className="min-w-0 flex-1">
                                <p className="text-sm font-bold text-on-surface truncate">{user?.name}</p>
                                <p className="text-[10px] text-on-surface-variant">{t('layout.employee.employee_user')}</p>
                            </div>
                        </div>

                        <Link
                            href={route('logout')}
                            method="post"
                            as="button"
                            className="flex items-center gap-2 px-2 text-xs font-bold text-error hover:opacity-70 transition-opacity uppercase tracking-widest"
                        >
                            <Icon name="logout" size="text-sm" />
                            <span>{t('layout.employee.logout')}</span>
                        </Link>
                    </div>
                </div>
            </aside>

            <div className="lg:pl-72">
                <header className="sticky top-0 z-30 flex min-h-[73px] shrink-0 items-center justify-between border-b border-outline-variant/20 bg-surface/80 px-8 py-4 backdrop-blur-xl">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setSidebarOpen(true)}
                            className="lg:hidden rounded-lg p-1.5 text-on-surface-variant hover:bg-surface-container transition-colors"
                        >
                            <Icon name="menu" size="text-2xl" />
                        </button>
                        <h1 className="font-headline text-xl font-bold tracking-tight text-on-surface">
                            {business?.name ?? t('layout.employee.header_fallback')}
                        </h1>
                    </div>

                    <div className="flex items-center gap-3">
                        {showCreateAppointmentButton && (
                            <Link
                                href={createAppointmentHref}
                                className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-on-surface px-2.5 py-2 text-xs font-bold text-surface transition-opacity hover:opacity-90 sm:px-3 sm:py-1.5"
                                aria-label={t('layout.employee.add_appointment')}
                            >
                                <Icon name="add" size="text-lg sm:text-sm" />
                                <span className="hidden sm:inline">{t('layout.employee.add_appointment')}</span>
                            </Link>
                        )}
                        <Dropdown>
                            <Dropdown.Trigger>
                                <button className="flex items-center rounded-full p-0.5 hover:bg-surface-container transition-colors">
                                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary-container text-on-secondary-container text-sm font-bold">
                                        {user.name?.charAt(0)?.toUpperCase()}
                                    </div>
                                </button>
                            </Dropdown.Trigger>
                            <Dropdown.Content>
                                <Dropdown.Link href={route('profile.edit')}>{t('layout.employee.profile')}</Dropdown.Link>
                                <Dropdown.Link href={route('logout')} method="post" as="button">{t('layout.employee.log_out')}</Dropdown.Link>
                                <div className="mt-1 flex items-center justify-between gap-2 border-t border-outline-variant/40 px-4 py-2.5">
                                    <span className="text-xs font-medium text-on-surface-variant">{t('common.language')}</span>
                                    <LanguageSwitcher />
                                </div>
                            </Dropdown.Content>
                        </Dropdown>
                    </div>
                </header>

                <main className="p-6 sm:p-8 pb-24 lg:pb-8 bg-surface min-h-[calc(100vh-73px)]">
                    {children}
                </main>
            </div>

            <nav className="fixed bottom-0 left-0 right-0 z-40 flex items-center justify-around border-t border-outline-variant/30 bg-surface px-2 py-1.5 lg:hidden">
                {visibleMobileNav.map((item) => {
                    const active = isActive(item.route);
                    return (
                        <Link
                            key={item.route}
                            href={(() => {
                                try {
                                    return route(item.route, {}, false);
                                } catch {
                                    return '#';
                                }
                            })()}
                            className={`flex flex-col items-center gap-0.5 rounded-xl px-3 py-1.5 text-[10px] font-medium transition-all ${
                                active ? 'text-on-surface' : 'text-outline'
                            }`}
                        >
                            <div className={`rounded-full px-4 py-1 ${active ? 'bg-surface-container' : ''}`}>
                                <Icon name={item.icon} filled={active} size="text-xl" />
                            </div>
                            <span>{item.label}</span>
                        </Link>
                    );
                })}
            </nav>
        </div>
        </SuccessToastProvider>
    );
}
