import Dropdown from '@/Components/Dropdown';
import Icon from '@/Components/Icon';
import NiterminLogo from '@/Components/NiterminLogo';
import LanguageSwitcher from '@/i18n/LanguageSwitcher';
import { useT } from '@/i18n/useT';
import { Link, usePage } from '@inertiajs/react';
import { useState } from 'react';

export default function AuthenticatedLayout({ header, children }) {
    const { auth } = usePage().props;
    const t = useT();
    const user = auth.user;
    const [mobileOpen, setMobileOpen] = useState(false);
    const onProfilePage = (() => {
        try {
            return route().current('profile.edit');
        } catch {
            return false;
        }
    })();

    return (
        <div className="min-h-screen bg-surface font-body">
            <header className="sticky top-0 z-30 border-b border-outline-variant/20 bg-surface/85 backdrop-blur-xl">
                <div className="mx-auto flex min-h-[73px] max-w-6xl items-center justify-between px-6 py-4 lg:px-8">
                    <div className="flex items-center gap-4">
                        <button
                            type="button"
                            onClick={() => setMobileOpen((value) => !value)}
                            className="rounded-xl p-2 text-on-surface-variant transition-colors hover:bg-surface-container lg:hidden"
                        >
                            <Icon name={mobileOpen ? 'close' : 'menu'} size="text-2xl" />
                        </button>

                        <Link href="/" className="flex items-center gap-3">
                            <NiterminLogo
                                markClassName="h-9 w-9 text-on-surface"
                                wordClassName="text-lg font-semibold tracking-tight text-on-surface"
                                dotClassName="text-on-surface-variant"
                            />
                        </Link>
                    </div>

                    <div className="hidden items-center gap-3 lg:flex">
                        <Dropdown>
                            <Dropdown.Trigger>
                                <button className="flex items-center rounded-full p-0.5 transition-colors hover:bg-surface-container">
                                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-container text-on-primary-container text-sm font-bold">
                                        {user?.name?.charAt(0)?.toUpperCase()}
                                    </div>
                                </button>
                            </Dropdown.Trigger>

                            <Dropdown.Content>
                                {!onProfilePage && (
                                    <Dropdown.Link href={route('profile.edit')}>{t('layout.authenticated.profile')}</Dropdown.Link>
                                )}
                                <Dropdown.Link href={route('dashboard')}>{t('layout.authenticated.dashboard')}</Dropdown.Link>
                                <Dropdown.Link href={route('logout')} method="post" as="button">
                                    {t('layout.authenticated.log_out')}
                                </Dropdown.Link>
                                <div className="mt-1 flex items-center justify-between gap-2 border-t border-outline-variant/40 px-4 py-2.5">
                                    <span className="text-xs font-medium text-on-surface-variant">{t('common.language')}</span>
                                    <LanguageSwitcher />
                                </div>
                            </Dropdown.Content>
                        </Dropdown>
                    </div>
                </div>

                {mobileOpen && (
                    <div className="border-t border-outline-variant/20 bg-surface lg:hidden">
                        <div className="mx-auto max-w-6xl space-y-2 px-6 py-4">
                            <Link
                                href={route('dashboard')}
                                className="flex items-center gap-3 rounded-2xl bg-surface-container-low px-4 py-3 text-sm font-medium text-on-surface"
                            >
                                <Icon name="dashboard" size="text-lg" />
                                {t('layout.authenticated.dashboard')}
                            </Link>

                            {!onProfilePage && (
                                <Link
                                    href={route('profile.edit')}
                                    className="flex items-center gap-3 rounded-2xl bg-surface-container-low px-4 py-3 text-sm font-medium text-on-surface"
                                >
                                    <Icon name="person" size="text-lg" />
                                    {t('layout.authenticated.profile')}
                                </Link>
                            )}

                            <div className="rounded-2xl border border-outline-variant bg-surface-container-lowest px-4 py-4">
                                <p className="text-sm font-semibold text-on-surface">{user?.name}</p>
                                <p className="mt-1 text-xs text-on-surface-variant">{t('layout.authenticated.account')}</p>
                            </div>

                            <Link
                                href={route('logout')}
                                method="post"
                                as="button"
                                className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold text-error"
                            >
                                <Icon name="logout" size="text-lg" />
                                {t('layout.authenticated.log_out')}
                            </Link>

                            <div className="flex items-center justify-between gap-3 rounded-2xl border border-outline-variant/40 bg-surface-container-lowest px-4 py-3">
                                <span className="text-sm font-medium text-on-surface-variant">{t('common.language')}</span>
                                <LanguageSwitcher />
                            </div>
                        </div>
                    </div>
                )}
            </header>

            {header && (
                <section className="border-b border-outline-variant/20 bg-surface">
                    <div className="mx-auto max-w-6xl px-6 py-8 lg:px-8">
                        {header}
                    </div>
                </section>
            )}

            <main>{children}</main>
        </div>
    );
}
