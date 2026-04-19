import { SuccessToastProvider } from '@/Components/SuccessToastProvider';
import Dropdown from '@/Components/Dropdown';
import Icon from '@/Components/Icon';
import { Link, usePage, router } from '@inertiajs/react';
import { useState } from 'react';

const navItems = [
    { label: 'Dashboard', icon: 'dashboard', route: 'super-admin.dashboard' },
    { label: 'Businesses', icon: 'storefront', route: 'super-admin.businesses.index' },
    { label: 'Users', icon: 'group', route: 'super-admin.users.index' },
    { label: 'Categories', icon: 'category', route: 'super-admin.business-type-categories.index' },
    { label: 'Business Types', icon: 'business_center', route: 'super-admin.business-types.index' },
    { label: 'Audit Log', icon: 'fact_check', route: 'super-admin.audit-logs.index' },
];

const mobileNavItems = [
    { label: 'Dashboard', icon: 'dashboard', route: 'super-admin.dashboard' },
    { label: 'Businesses', icon: 'storefront', route: 'super-admin.businesses.index' },
    { label: 'Users', icon: 'group', route: 'super-admin.users.index' },
    { label: 'Types', icon: 'business_center', route: 'super-admin.business-types.index' },
    { label: 'Audit', icon: 'fact_check', route: 'super-admin.audit-logs.index' },
];

export default function SuperAdminLayout({ children }) {
    const { auth } = usePage().props;
    const user = auth.user;
    const impersonating = auth.impersonating ?? false;
    const [sidebarOpen, setSidebarOpen] = useState(false);

    const isActive = (routeName) => {
        try {
            return route().current(routeName) || route().current(routeName + '.*');
        } catch {
            return false;
        }
    };

    const stopImpersonating = () => {
        router.post(route('super-admin.stop-impersonating'));
    };

    return (
        <SuccessToastProvider>
        <div className="min-h-screen bg-surface font-body">
            {impersonating && (
                <div className="sticky top-0 z-[60] flex items-center justify-between gap-3 bg-tertiary-container px-6 py-2 text-sm text-on-tertiary-container">
                    <span className="flex items-center gap-2 font-medium">
                        <Icon name="visibility" size="text-base" />
                        Impersonating {user?.name} ({user?.email})
                    </span>
                    <button
                        onClick={stopImpersonating}
                        className="rounded-lg bg-on-surface px-3 py-1 text-xs font-bold text-surface hover:opacity-90 transition-opacity uppercase tracking-widest"
                    >
                        Stop impersonating
                    </button>
                </div>
            )}

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
                            Super Admin
                        </p>
                        <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mt-1">
                            Platform Console
                        </p>
                    </div>

                    <nav className="flex-1 space-y-1 overflow-y-auto">
                        {navItems.map((item) => {
                            const active = isActive(item.route);
                            return (
                                <Link
                                    key={item.label}
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
                                <p className="text-[10px] text-on-surface-variant">Super Admin</p>
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
                <header className="sticky top-0 z-30 flex min-h-[73px] shrink-0 items-center justify-between border-b border-outline-variant/20 bg-surface/80 px-8 py-4 backdrop-blur-xl">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => setSidebarOpen(true)}
                            className="lg:hidden rounded-lg p-1.5 text-on-surface-variant hover:bg-surface-container transition-colors"
                        >
                            <Icon name="menu" size="text-2xl" />
                        </button>
                        <h1 className="font-headline text-xl font-bold tracking-tight text-on-surface">
                            Platform Console
                        </h1>
                    </div>

                    <div className="flex items-center gap-3">
                        <Dropdown>
                            <Dropdown.Trigger>
                                <button className="flex items-center rounded-full p-0.5 hover:bg-surface-container transition-colors">
                                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-container text-on-primary text-sm font-bold">
                                        {user?.name?.charAt(0)?.toUpperCase()}
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
                {mobileNavItems.map((item) => {
                    const active = isActive(item.route);
                    return (
                        <Link
                            key={item.route}
                            href={(() => { try { return route(item.route); } catch { return '#'; } })()}
                            className={`flex flex-col items-center gap-0.5 px-3 py-1.5 text-[10px] font-medium transition-all ${
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
