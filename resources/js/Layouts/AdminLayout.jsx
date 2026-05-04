import { SuccessToastProvider } from '@/Components/SuccessToastProvider';
import Dropdown from '@/Components/Dropdown';
import EmployeeNotificationBell from '@/Components/EmployeeNotificationBell';
import Icon from '@/Components/Icon';
import LanguageSwitcher from '@/i18n/LanguageSwitcher';
import { useT } from '@/i18n/useT';
import { Link, usePage } from '@inertiajs/react';
import { useEffect, useMemo, useState } from 'react';

const WORKSPACE_STORAGE_KEY = 'admin-layout:workspace';

const navItems = [
    { labelKey: 'layout.admin.nav.dashboard', icon: 'dashboard', route: 'admin.dashboard', permission: 'admin.dashboard' },
    { labelKey: 'layout.admin.nav.services', icon: 'layers', route: 'admin.services.index', permission: 'admin.services' },
    { labelKey: 'layout.admin.nav.resources', icon: 'meeting_room', route: 'admin.shared-resources.index', permission: 'admin.shared_resources' },
    { labelKey: 'layout.admin.nav.employees', icon: 'badge', route: 'admin.employees.index', permission: 'admin.employees' },
    { labelKey: 'layout.admin.nav.roles', icon: 'key', route: 'admin.roles.index', permission: 'admin.roles' },
    { labelKey: 'layout.admin.nav.appointments', icon: 'calendar_today', route: 'admin.appointments.index', permission: 'admin.appointments' },
    { labelKey: 'layout.admin.nav.analytics', icon: 'analytics', route: 'admin.analytics.index', permission: 'admin.analytics' },
    { labelKey: 'layout.admin.nav.configuration', icon: 'settings', route: 'admin.settings.index', permission: 'admin.settings' },
];

const employeeNavItems = [
    { labelKey: 'layout.admin.nav.my_dashboard', icon: 'dashboard', route: 'employee.dashboard', permission: 'employee.dashboard' },
    { labelKey: 'layout.admin.nav.my_appointments', icon: 'calendar_today', route: 'employee.appointments.index', permission: 'employee.dashboard' },
    { labelKey: 'layout.admin.nav.my_schedule', icon: 'calendar_view_week', route: 'employee.schedule.index', permission: 'employee.schedule' },
    { labelKey: 'layout.admin.nav.my_analytics', icon: 'analytics', route: 'employee.analytics.index', permission: 'employee.analytics' },
    { labelKey: 'layout.admin.nav.my_configuration', icon: 'tune', route: 'employee.schedule.configuration', permission: 'employee.schedule' },
];

const mobileNavItems = [
    { labelKey: 'layout.admin.nav.dashboard', icon: 'dashboard', route: 'admin.dashboard', permission: 'admin.dashboard' },
    { labelKey: 'layout.admin.nav.services', icon: 'layers', route: 'admin.services.index', permission: 'admin.services' },
    { labelKey: 'layout.admin.nav.employees', icon: 'badge', route: 'admin.employees.index', permission: 'admin.employees' },
    { labelKey: 'layout.admin.nav.appointments', icon: 'calendar_today', route: 'admin.appointments.index', permission: 'admin.appointments' },
    { labelKey: 'layout.admin.nav.analytics', icon: 'analytics', route: 'admin.analytics.index', permission: 'admin.analytics' },
    { labelKey: 'layout.admin.mobile.config', icon: 'settings', route: 'admin.settings.index', permission: 'admin.settings' },
];

export default function AdminLayout({ children }) {
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
                .filter((item) => {
                    if (item.permission === 'admin.shared_resources' && business?.uses_shared_resources === false) {
                        return false;
                    }
                    return can(item.permission);
                })
                .map((item) => ({ ...item, label: t(item.labelKey) })),
        [permissions, t, business?.uses_shared_resources],
    );
    const visibleMobileNav = useMemo(
        () =>
            mobileNavItems
                .filter((item) => can(item.permission))
                .map((item) => ({ ...item, label: t(item.labelKey) })),
        [permissions, t],
    );

    const showEmployeeSection = user?.role === 'employee'
        ? permissions.some(p => p.startsWith('employee.'))
        : user?.also_works_as_staff === true;
    const visibleEmployeeNav = useMemo(
        () =>
            showEmployeeSection
                ? employeeNavItems
                    .filter((item) => can(item.permission))
                    .map((item) => ({ ...item, label: t(item.labelKey) }))
                : [],
        [showEmployeeSection, permissions, t, user?.id, user?.also_works_as_staff, user?.role],
    );

    const isActive = (routeName) => {
        try {
            if (routeName === 'admin.appointments.index') {
                return route().current('admin.appointments.index') || route().current('admin.appointments.calendar');
            }
            if (routeName === 'employee.appointments.index') {
                return route().current('employee.appointments.index') || route().current('employee.appointments.calendar');
            }
            if (routeName === 'employee.schedule.index') {
                return route().current('employee.schedule.index');
            }
            return route().current(routeName) || route().current(routeName + '.*');
        } catch {
            return false;
        }
    };

    const currentRouteIsEmployee = (() => {
        try {
            return route().current()?.startsWith('employee.') ?? false;
        } catch {
            return false;
        }
    })();

    const [workspace, setWorkspace] = useState(() => {
        if (typeof window === 'undefined') return 'admin';
        if (currentRouteIsEmployee) return 'employee';
        const stored = window.localStorage.getItem(WORKSPACE_STORAGE_KEY);
        return stored === 'employee' ? 'employee' : 'admin';
    });

    useEffect(() => {
        if (currentRouteIsEmployee && workspace !== 'employee') {
            setWorkspace('employee');
        }
    }, [currentRouteIsEmployee, workspace]);

    useEffect(() => {
        if (typeof window === 'undefined') return;
        window.localStorage.setItem(WORKSPACE_STORAGE_KEY, workspace);
    }, [workspace]);

    const showTabs = visibleEmployeeNav.length > 0;
    const effectiveWorkspace = showTabs ? workspace : 'admin';
    const sidebarItems = effectiveWorkspace === 'employee' ? visibleEmployeeNav : visibleNav;

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
                            {business?.name ?? t('layout.admin.fallback_business')}
                        </p>
                        <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mt-1">
                            {t('layout.admin.panel_subtitle')}
                        </p>
                    </div>

                    {showTabs && (
                        <div className="mb-4 grid grid-cols-2 gap-1 rounded-2xl border border-outline-variant/60 bg-surface-container-low p-1">
                            {[
                                { value: 'admin', label: t('layout.admin.tab_admin'), icon: 'admin_panel_settings' },
                                { value: 'employee', label: t('layout.admin.tab_employee'), icon: 'badge' },
                            ].map((tab) => {
                                const isSelected = effectiveWorkspace === tab.value;
                                return (
                                    <button
                                        key={tab.value}
                                        type="button"
                                        onClick={() => setWorkspace(tab.value)}
                                        className={`flex items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold uppercase tracking-wider transition-all ${
                                            isSelected
                                                ? 'bg-primary-container text-white shadow-md'
                                                : 'text-on-surface-variant hover:bg-surface hover:text-on-surface'
                                        }`}
                                    >
                                        <Icon name={tab.icon} filled={isSelected} size="text-base" />
                                        {tab.label}
                                    </button>
                                );
                            })}
                        </div>
                    )}

                    <nav className="flex-1 space-y-1 overflow-y-auto">
                        {sidebarItems.map((item) => {
                            const active = isActive(item.route);
                            return (
                                <Link
                                    key={item.route}
                                    href={(() => { try { return route(item.route); } catch { return '#'; } })()}
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
                        <div className="flex items-center gap-3 px-2">
                            <div className="w-9 h-9 rounded-full bg-primary-container flex items-center justify-center text-on-primary text-xs font-bold shrink-0">
                                {user?.name?.charAt(0)?.toUpperCase()}
                            </div>
                            <div className="min-w-0 flex-1">
                                <p className="text-sm font-bold text-on-surface truncate">{user?.name}</p>
                                <p className="text-[10px] text-on-surface-variant">{t('layout.admin.admin_user')}</p>
                            </div>
                        </div>

                        <Link
                            href={route('logout')}
                            method="post"
                            as="button"
                            className="flex items-center gap-2 px-2 text-xs font-bold text-error hover:opacity-70 transition-opacity uppercase tracking-widest"
                        >
                            <Icon name="logout" size="text-sm" />
                            <span>{t('layout.admin.logout')}</span>
                        </Link>
                    </div>
                </div>
            </aside>

            <div className="lg:pl-72">
                <header className="sticky top-0 z-30 flex min-h-[73px] shrink-0 items-center justify-between border-b border-outline-variant/20 bg-surface/80 px-4 py-4 backdrop-blur-xl sm:px-8">
                    <div className="flex min-w-0 flex-1 items-center gap-3 sm:gap-4">
                        <button
                            type="button"
                            onClick={() => setSidebarOpen(true)}
                            className="shrink-0 rounded-lg p-1.5 text-on-surface-variant transition-colors hover:bg-surface-container lg:hidden"
                        >
                            <Icon name="menu" size="text-2xl" />
                        </button>
                        <h1 className="min-w-0 truncate font-headline text-lg font-bold tracking-tight text-on-surface sm:text-xl">
                            {business?.name ?? t('layout.admin.header_fallback')}
                        </h1>
                    </div>

                    <div className="ml-2 flex shrink-0 items-center gap-2 sm:gap-3">
                        <EmployeeNotificationBell />
                        <Dropdown>
                            <Dropdown.Trigger>
                                <button className="flex items-center rounded-full p-0.5 hover:bg-surface-container transition-colors">
                                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-container text-on-primary text-sm font-bold">
                                        {user.name?.charAt(0)?.toUpperCase()}
                                    </div>
                                </button>
                            </Dropdown.Trigger>
                            <Dropdown.Content>
                                <Dropdown.Link href={route('profile.edit')}>{t('layout.admin.profile')}</Dropdown.Link>
                                {can('admin.settings') && (
                                    <Dropdown.Link href={route('admin.settings.index')}>{t('layout.admin.configuration')}</Dropdown.Link>
                                )}
                                <Dropdown.Link href={route('logout')} method="post" as="button">{t('layout.admin.log_out')}</Dropdown.Link>
                                <div className="mt-1 flex items-center justify-between gap-2 border-t border-outline-variant/40 px-4 py-2.5">
                                    <span className="text-xs font-medium text-on-surface-variant">{t('common.language')}</span>
                                    <LanguageSwitcher />
                                </div>
                            </Dropdown.Content>
                        </Dropdown>
                    </div>
                </header>

                <main className="min-h-[calc(100vh-73px)] bg-surface p-4 pb-24 sm:p-8 lg:pb-8">
                    {children}
                </main>
            </div>

            <nav className="fixed bottom-0 left-0 right-0 z-40 grid grid-cols-6 items-center border-t border-outline-variant/30 bg-surface px-1 py-1.5 lg:hidden">
                {visibleMobileNav.map((item) => {
                    const active = isActive(item.route);
                    return (
                        <Link
                            key={item.route}
                            href={(() => { try { return route(item.route); } catch { return '#'; } })()}
                            className={`flex min-w-0 flex-col items-center gap-0.5 px-1 py-1.5 text-[9px] font-medium transition-all ${
                                active ? 'text-on-surface' : 'text-outline'
                            }`}
                        >
                            <div className={`rounded-full px-2.5 py-1 ${active ? 'bg-surface-container' : ''}`}>
                                <Icon name={item.icon} filled={active} size="text-xl" />
                            </div>
                            <span className="max-w-full truncate">{item.label}</span>
                        </Link>
                    );
                })}
            </nav>
        </div>
        </SuccessToastProvider>
    );
}
