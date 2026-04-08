import { Link, usePage } from '@inertiajs/react';
import Icon from '@/Components/Icon';
import Dropdown from '@/Components/Dropdown';
import { useState } from 'react';

const navItems = [
    { label: 'Appointments', icon: 'dashboard',      route: 'employee.dashboard',              permission: 'employee.dashboard' },
    { label: 'Schedule',     icon: 'calendar_today', route: 'employee.schedule.index',          permission: 'employee.schedule' },
    { label: 'Configuration',icon: 'tune',           route: 'employee.schedule.configuration',  permission: 'employee.schedule' },
];

const mobileNavItems = [
    { label: 'Appointments', icon: 'dashboard',      route: 'employee.dashboard',              permission: 'employee.dashboard' },
    { label: 'Schedule',     icon: 'calendar_today', route: 'employee.schedule.index',          permission: 'employee.schedule' },
    { label: 'Config',       icon: 'tune',           route: 'employee.schedule.configuration',  permission: 'employee.schedule' },
];

export default function EmployeeLayout({ children }) {
    const { auth } = usePage().props;
    const user = auth.user;
    const business = auth.business;
    const permissions = auth.permissions ?? [];
    const can = (key) => permissions.includes(key);
    const [sidebarOpen, setSidebarOpen] = useState(false);

    const visibleNav = navItems.filter((item) => can(item.permission));
    const visibleMobileNav = mobileNavItems.filter((item) => can(item.permission));

    const isActive = (routeName) => {
        try {
            // Exact match first, then wildcard children but exclude sibling routes
            if (route().current(routeName)) return true;
            // For schedule.index, don't highlight when on configuration
            if (routeName === 'employee.schedule.index' && route().current('employee.schedule.configuration')) return false;
            return route().current(routeName + '.*');
        } catch {
            return false;
        }
    };

    return (
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
                            {business?.name ?? 'Employee Portal'}
                        </p>
                        <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mt-1">
                            Employee Workspace
                        </p>
                    </div>

                    <nav className="flex-1 space-y-1">
                        {visibleNav.map((item) => {
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
                            <div className="w-9 h-9 rounded-full bg-secondary-container flex items-center justify-center text-on-secondary-container text-xs font-bold shrink-0">
                                {user?.name?.charAt(0)?.toUpperCase()}
                            </div>
                            <div className="min-w-0 flex-1">
                                <p className="text-sm font-bold text-on-surface truncate">{user?.name}</p>
                                <p className="text-[10px] text-on-surface-variant">Employee User</p>
                            </div>
                        </div>

                        <Link
                            href={route('logout')}
                            method="post"
                            as="button"
                            className="flex items-center gap-2 px-2 text-xs font-bold text-error hover:opacity-70 transition-opacity uppercase tracking-widest"
                        >
                            <Icon name="logout" size="text-sm" />
                            <span>Logout</span>
                        </Link>
                    </div>
                </div>
            </aside>

            <div className="lg:pl-72">
                <header className="sticky top-0 z-30 flex items-center justify-between bg-surface/80 backdrop-blur-xl border-b border-outline-variant/20 px-8 py-4">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setSidebarOpen(true)}
                            className="lg:hidden rounded-lg p-1.5 text-on-surface-variant hover:bg-surface-container transition-colors"
                        >
                            <Icon name="menu" size="text-2xl" />
                        </button>
                        <h1 className="font-headline text-xl font-bold tracking-tight text-on-surface">
                            {business?.name ?? 'My Workspace'}
                        </h1>
                    </div>

                    <div className="flex items-center gap-3">
                        <Dropdown>
                            <Dropdown.Trigger>
                                <button className="flex items-center rounded-full p-0.5 hover:bg-surface-container transition-colors">
                                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary-container text-on-secondary-container text-sm font-bold">
                                        {user.name?.charAt(0)?.toUpperCase()}
                                    </div>
                                </button>
                            </Dropdown.Trigger>
                            <Dropdown.Content>
                                <Dropdown.Link href={route('profile.edit')}>Profile</Dropdown.Link>
                                <Dropdown.Link href={route('logout')} method="post" as="button">Log Out</Dropdown.Link>
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
                            href={(() => { try { return route(item.route); } catch { return '#'; } })()}
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
    );
}
