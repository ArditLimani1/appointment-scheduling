import { Head, Link, router, useForm } from '@inertiajs/react';
import SuperAdminLayout from '@/Layouts/SuperAdminLayout';
import PageHeader from '@/Components/PageHeader';
import Icon from '@/Components/Icon';

export default function UsersIndex({ users, filters }) {
    const { data, setData, get } = useForm({
        search: filters.search ?? '',
        role: filters.role ?? '',
    });

    const submit = (e) => {
        e.preventDefault();
        get(route('super-admin.users.index'), { preserveState: true, replace: true });
    };

    const resetPassword = (u) => {
        if (!confirm(`Send a password reset link to ${u.email}?`)) return;
        router.post(route('super-admin.users.password-reset', u.id), {}, { preserveScroll: true });
    };

    const impersonate = (u) => {
        if (!confirm(`Impersonate ${u.name} (${u.email})?`)) return;
        router.post(route('super-admin.users.impersonate', u.id));
    };

    const formatDate = (s) => new Date(s).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });

    return (
        <SuperAdminLayout>
            <Head title="Users" />

            <PageHeader
                title="Users"
                description="All tenant accounts. Send a password reset or impersonate to debug a user session."
            />

            <div className="bg-surface-container-lowest rounded-2xl overflow-hidden ring-1 ring-slate-100 shadow-sm">
                <div className="px-8 py-5 border-b border-slate-50 flex flex-wrap items-center justify-between gap-4 bg-white">
                    <form onSubmit={submit} className="flex flex-wrap gap-3 flex-1 min-w-0">
                        <div className="relative flex-1 min-w-[220px]">
                            <Icon name="search" size="text-base" className="absolute left-3 top-1/2 -translate-y-1/2 text-outline" />
                            <input
                                type="text"
                                value={data.search}
                                onChange={(e) => setData('search', e.target.value)}
                                placeholder="Search by name or email"
                                className="w-full pl-10 pr-3 py-2 bg-surface border border-outline-variant rounded-lg text-sm text-on-surface placeholder-outline focus:outline-none focus:border-on-surface"
                            />
                        </div>
                        <select
                            value={data.role}
                            onChange={(e) => setData('role', e.target.value)}
                            className="bg-surface border border-outline-variant rounded-lg text-sm text-on-surface px-3 py-2 focus:outline-none focus:border-on-surface"
                        >
                            <option value="">All roles</option>
                            <option value="admin">Admin</option>
                            <option value="employee">Employee</option>
                        </select>
                        <button type="submit" className="rounded-xl bg-on-surface px-4 py-2 text-sm font-bold text-surface hover:opacity-90 transition-opacity">
                            Filter
                        </button>
                    </form>
                    <p className="text-xs text-on-surface-variant">
                        {users.total} user{users.total !== 1 ? 's' : ''} total
                    </p>
                </div>

                {users.data.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-24 text-center">
                        <Icon name="group" size="text-5xl" className="text-outline mb-3" />
                        <p className="text-sm text-on-surface-variant">No users match your filters.</p>
                    </div>
                ) : (
                    <>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-slate-50/50">
                                        <th className="px-8 py-4 text-[11px] font-bold uppercase tracking-widest text-outline">User</th>
                                        <th className="px-8 py-4 text-[11px] font-bold uppercase tracking-widest text-outline">Business</th>
                                        <th className="px-8 py-4 text-[11px] font-bold uppercase tracking-widest text-outline">Role</th>
                                        <th className="px-8 py-4 text-[11px] font-bold uppercase tracking-widest text-outline">Joined</th>
                                        <th className="px-8 py-4 text-[11px] font-bold uppercase tracking-widest text-outline text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {users.data.map((u) => {
                                        const biz = u.owned_business ?? u.business;
                                        return (
                                            <tr key={u.id} className="hover:bg-slate-50/50 transition-colors">
                                                <td className="px-8 py-5">
                                                    <p className="font-headline font-bold text-on-surface text-sm">{u.name}</p>
                                                    <p className="text-xs text-on-surface-variant mt-0.5">{u.email}</p>
                                                </td>
                                                <td className="px-8 py-5 text-sm text-on-surface-variant">{biz?.name ?? '—'}</td>
                                                <td className="px-8 py-5">
                                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-surface-container text-on-surface-variant text-[10px] font-bold uppercase tracking-wide">
                                                        {u.role}
                                                    </span>
                                                </td>
                                                <td className="px-8 py-5 text-sm text-on-surface-variant">{formatDate(u.created_at)}</td>
                                                <td className="px-8 py-5 text-right">
                                                    <div className="flex items-center justify-end gap-1">
                                                        <button
                                                            onClick={() => resetPassword(u)}
                                                            className="p-2 text-outline hover:text-on-surface transition-colors rounded-lg hover:bg-surface-container"
                                                            title="Send password reset"
                                                        >
                                                            <Icon name="lock_reset" size="text-[18px]" />
                                                        </button>
                                                        <button
                                                            onClick={() => impersonate(u)}
                                                            className="p-2 text-outline hover:text-on-surface transition-colors rounded-lg hover:bg-surface-container"
                                                            title="Impersonate"
                                                        >
                                                            <Icon name="visibility" size="text-[18px]" />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>

                        {users.links && users.last_page > 1 && (
                            <div className="px-8 py-4 bg-slate-50/30 flex items-center justify-between border-t border-slate-50">
                                <p className="text-sm text-on-surface-variant">
                                    Page <span className="font-bold text-on-surface">{users.current_page}</span> of {users.last_page}
                                </p>
                                <div className="flex gap-1">
                                    {users.links.map((link, i) => (
                                        <Link
                                            key={i}
                                            href={link.url ?? '#'}
                                            preserveState
                                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${link.active ? 'bg-on-surface text-surface' : 'text-on-surface-variant hover:bg-surface-container'} ${!link.url && 'opacity-40 pointer-events-none'}`}
                                            dangerouslySetInnerHTML={{ __html: link.label }}
                                        />
                                    ))}
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>
        </SuperAdminLayout>
    );
}
