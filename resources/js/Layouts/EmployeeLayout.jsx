import { Link, usePage } from '@inertiajs/react';
import Icon from '@/Components/Icon';
import Dropdown from '@/Components/Dropdown';
import { useState } from 'react';

const navItems = [
    { label: 'Schedule', icon: 'calendar_today', route: 'employee.schedule.index' },
    { label: 'My Appointments', icon: 'event_available', route: 'employee.dashboard' },
    { label: 'Services', icon: 'content_cut', route: 'admin.services.index' },
    { label: 'Settings', icon: 'tune', route: 'admin.settings.index' },
];

const mobileNavItems = [
    { label: 'Schedule', icon: 'calendar_today', route: 'employee.schedule.index' },
    { label: 'Appointments', icon: 'event_available', route: 'employee.dashboard' },
    { label: 'Services', icon: 'content_cut', route: 'admin.services.index' },
    { label: 'Settings', icon: 'tune', route: 'admin.settings.index' },
];

export default function EmployeeLayout({ children }) {
    const { auth } = usePage().props;
    const user = auth.user;
    const [sidebarOpen, setSidebarOpen] = useState(false);

    const isActive = (routeName) => {
        try {
            return route().current(routeName) || route().current(routeName + '.*');
        } catch {
            return false;
        }
    };

    return (
        <div className="min-h-screen bg-surface font-body">
            {/* Mobile sidebar overlay */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 z-40 bg-black/50 lg:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside
                className={`fixed top-0 left-0 z-50 h-full w-[280px] lg:w-[72px] xl:w-[240px] bg-surface-container-lowest border-r border-outline-variant flex flex-col transition-transform duration-300 ${
                    sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
                }`}
            >
                {/* Brand */}
                <div className="flex items-center gap-2 px-4 py-5 lg:justify-center xl:justify-start">
                    <span className="text-2xl font-black font-headline text-on-surface tracking-tight">
                        S<span className="hidden lg:hidden xl:inline">tratos</span>
                    </span>
                </div>

                {/* Employee Role Card */}
                <div className="mx-3 mb-4 rounded-2xl bg-secondary-container px-3 py-2.5 lg:mx-1 lg:px-1 xl:mx-3 xl:px-3">
                    <div className="flex items-center gap-2 lg:justify-center xl:justify-start">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-on-secondary-container/20">
                            <Icon name="person" size="text-base" className="text-on-secondary-container" />
                        </div>
                        <div className="lg:hidden xl:block">
                            <p className="text-xs font-semibold text-on-secondary-container">Employee</p>
                            <p className="text-[10px] text-on-secondary-container/70 truncate max-w-[140px]">{user.name}</p>
                        </div>
                    </div>
                </div>

                {/* Navigation */}
                <nav className="flex-1 space-y-1 px-2">
                    {navItems.map((item) => {
                        const active = isActive(item.route);
                        return (
                            <Link
                                key={item.route}
                                href={(() => { try { return route(item.route); } catch { return '#'; } })()}
                                className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all lg:justify-center xl:justify-start ${
                                    active
                                        ? 'bg-secondary-container text-on-secondary-container'
                                        : 'text-on-surface-variant hover:bg-surface-container-high'
                                }`}
                            >
                                <Icon
                                    name={item.icon}
                                    filled={active}
                                    size="text-xl"
                                    className={active ? 'text-on-secondary-container' : ''}
                                />
                                <span className="lg:hidden xl:inline">{item.label}</span>
                            </Link>
                        );
                    })}
                </nav>

                {/* Bottom logout */}
                <div className="border-t border-outline-variant p-3">
                    <Link
                        href={route('logout')}
                        method="post"
                        as="button"
                        className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-on-surface-variant hover:bg-surface-container-high transition-all lg:justify-center xl:justify-start"
                    >
                        <Icon name="logout" size="text-xl" />
                        <span className="lg:hidden xl:inline">Log Out</span>
                    </Link>
                </div>
            </aside>

            {/* Main content area */}
            <div className="lg:pl-[72px] xl:pl-[240px]">
                {/* Top bar */}
                <header className="glass-header sticky top-0 z-30 flex items-center justify-between border-b border-outline-variant px-4 py-3 sm:px-6">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setSidebarOpen(true)}
                            className="lg:hidden rounded-lg p-1.5 text-on-surface-variant hover:bg-surface-container-high"
                        >
                            <Icon name="menu" size="text-2xl" />
                        </button>
                        <div>
                            <h1 className="text-sm font-semibold text-on-surface font-headline">
                                Stratos Scheduler
                            </h1>
                            <p className="text-xs text-on-surface-variant">Employee Portal</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <button className="rounded-full p-2 text-on-surface-variant hover:bg-surface-container-high transition-colors">
                            <Icon name="notifications" size="text-xl" />
                        </button>
                        <Dropdown>
                            <Dropdown.Trigger>
                                <button className="flex items-center gap-2 rounded-full p-1 hover:bg-surface-container-high transition-colors">
                                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary-container text-on-secondary-container text-sm font-semibold">
                                        {user.name?.charAt(0)?.toUpperCase()}
                                    </div>
                                </button>
                            </Dropdown.Trigger>
                            <Dropdown.Content>
                                <Dropdown.Link href={route('profile.edit')}>
                                    Profile
                                </Dropdown.Link>
                                <Dropdown.Link href={route('logout')} method="post" as="button">
                                    Log Out
                                </Dropdown.Link>
                            </Dropdown.Content>
                        </Dropdown>
                    </div>
                </header>

                {/* Page content */}
                <main className="p-4 sm:p-6 pb-24 lg:pb-6">
                    {children}
                </main>
            </div>

            {/* Mobile bottom navigation */}
            <nav className="fixed bottom-0 left-0 right-0 z-40 flex items-center justify-around border-t border-outline-variant bg-surface-container-lowest px-2 py-1.5 lg:hidden">
                {mobileNavItems.map((item) => {
                    const active = isActive(item.route);
                    return (
                        <Link
                            key={item.route}
                            href={(() => { try { return route(item.route); } catch { return '#'; } })()}
                            className={`flex flex-col items-center gap-0.5 rounded-xl px-3 py-1.5 text-[10px] font-medium transition-all ${
                                active
                                    ? 'text-on-secondary-container'
                                    : 'text-on-surface-variant'
                            }`}
                        >
                            <div className={`rounded-full px-4 py-1 ${active ? 'bg-secondary-container' : ''}`}>
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
