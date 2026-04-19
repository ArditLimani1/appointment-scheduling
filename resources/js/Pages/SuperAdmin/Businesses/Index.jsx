import { useState } from 'react';
import { Head, Link, router, useForm } from '@inertiajs/react';
import SuperAdminLayout from '@/Layouts/SuperAdminLayout';
import PageHeader from '@/Components/PageHeader';
import DeleteConfirmModal from '@/Components/DeleteConfirmModal';
import Icon from '@/Components/Icon';

export default function BusinessesIndex({ businesses, filters }) {
    const { data, setData, get } = useForm({
        search: filters.search ?? '',
        status: filters.status ?? '',
    });

    const [deleteTarget, setDeleteTarget] = useState(null);

    const submit = (e) => {
        e.preventDefault();
        get(route('super-admin.businesses.index'), { preserveState: true, replace: true });
    };

    const toggleSuspend = (b) => {
        router.patch(route('super-admin.businesses.toggle-suspend', b.id), {}, { preserveScroll: true });
    };

    const confirmDelete = () => {
        router.delete(route('super-admin.businesses.destroy', deleteTarget.id));
        setDeleteTarget(null);
    };

    return (
        <SuperAdminLayout>
            <Head title="Businesses" />

            <PageHeader
                title="Businesses"
                description="Every tenant business on the platform. Suspend or remove any account."
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
                                placeholder="Search by name, slug or email"
                                className="w-full pl-10 pr-3 py-2 bg-surface border border-outline-variant rounded-lg text-sm text-on-surface placeholder-outline focus:outline-none focus:border-on-surface"
                            />
                        </div>
                        <select
                            value={data.status}
                            onChange={(e) => setData('status', e.target.value)}
                            className="bg-surface border border-outline-variant rounded-lg text-sm text-on-surface px-3 py-2 focus:outline-none focus:border-on-surface"
                        >
                            <option value="">All statuses</option>
                            <option value="active">Active</option>
                            <option value="suspended">Suspended</option>
                        </select>
                        <button type="submit" className="rounded-xl bg-on-surface px-4 py-2 text-sm font-bold text-surface hover:opacity-90 transition-opacity">
                            Filter
                        </button>
                    </form>
                    <p className="text-xs text-on-surface-variant">
                        {businesses.total} business{businesses.total !== 1 ? 'es' : ''} total
                    </p>
                </div>

                {businesses.data.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-24 text-center">
                        <Icon name="storefront" size="text-5xl" className="text-outline mb-3" />
                        <p className="text-sm text-on-surface-variant">No businesses match your filters.</p>
                    </div>
                ) : (
                    <>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-slate-50/50">
                                        <th className="px-8 py-4 text-[11px] font-bold uppercase tracking-widest text-outline">Business</th>
                                        <th className="px-8 py-4 text-[11px] font-bold uppercase tracking-widest text-outline">Owner</th>
                                        <th className="px-8 py-4 text-[11px] font-bold uppercase tracking-widest text-outline">Type</th>
                                        <th className="px-8 py-4 text-[11px] font-bold uppercase tracking-widest text-outline text-center">Staff</th>
                                        <th className="px-8 py-4 text-[11px] font-bold uppercase tracking-widest text-outline text-center">Appts</th>
                                        <th className="px-8 py-4 text-[11px] font-bold uppercase tracking-widest text-outline text-center">Status</th>
                                        <th className="px-8 py-4 text-[11px] font-bold uppercase tracking-widest text-outline text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {businesses.data.map((b) => (
                                        <tr key={b.id} className="hover:bg-slate-50/50 transition-colors">
                                            <td className="px-8 py-5">
                                                <Link
                                                    href={route('super-admin.businesses.show', b.id)}
                                                    className="font-headline font-bold text-on-surface text-sm hover:underline decoration-2 underline-offset-4"
                                                >
                                                    {b.name}
                                                </Link>
                                                <p className="text-xs text-on-surface-variant mt-0.5">/{b.slug}</p>
                                            </td>
                                            <td className="px-8 py-5">
                                                <p className="text-sm text-on-surface">{b.owner?.name ?? '—'}</p>
                                                <p className="text-xs text-on-surface-variant">{b.owner?.email ?? '—'}</p>
                                            </td>
                                            <td className="px-8 py-5">
                                                <p className="text-sm text-on-surface-variant">{b.business_type?.name ?? '—'}</p>
                                            </td>
                                            <td className="px-8 py-5 text-center text-sm text-on-surface tabular-nums">{b.employees_count}</td>
                                            <td className="px-8 py-5 text-center text-sm text-on-surface tabular-nums">{b.appointments_count}</td>
                                            <td className="px-8 py-5">
                                                <div className="flex justify-center">
                                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide ${b.is_active ? 'bg-tertiary-fixed text-on-tertiary-fixed-variant' : 'bg-error-container text-on-error-container'}`}>
                                                        {b.is_active ? 'Active' : 'Suspended'}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-8 py-5 text-right">
                                                <div className="flex items-center justify-end gap-1">
                                                    <Link
                                                        href={route('super-admin.businesses.show', b.id)}
                                                        className="p-2 text-outline hover:text-on-surface transition-colors rounded-lg hover:bg-surface-container"
                                                        title="View details"
                                                    >
                                                        <Icon name="visibility" size="text-[18px]" />
                                                    </Link>
                                                    <button
                                                        onClick={() => toggleSuspend(b)}
                                                        className="p-2 text-outline hover:text-on-surface transition-colors rounded-lg hover:bg-surface-container"
                                                        title={b.is_active ? 'Suspend' : 'Activate'}
                                                    >
                                                        <Icon name={b.is_active ? 'pause_circle' : 'play_circle'} size="text-[18px]" />
                                                    </button>
                                                    <button
                                                        onClick={() => setDeleteTarget(b)}
                                                        className="p-2 text-outline hover:text-error transition-colors rounded-lg hover:bg-error-container"
                                                        title="Delete"
                                                    >
                                                        <Icon name="delete" size="text-[18px]" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {businesses.links && businesses.last_page > 1 && (
                            <div className="px-8 py-4 bg-slate-50/30 flex items-center justify-between border-t border-slate-50">
                                <p className="text-sm text-on-surface-variant">
                                    Page <span className="font-bold text-on-surface">{businesses.current_page}</span> of {businesses.last_page}
                                </p>
                                <div className="flex gap-1">
                                    {businesses.links.map((link, i) => (
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

            <DeleteConfirmModal
                show={!!deleteTarget}
                onClose={() => setDeleteTarget(null)}
                onConfirm={confirmDelete}
                title="Delete business?"
                message={`"${deleteTarget?.name}" and all its data will be permanently removed. This cannot be undone.`}
            />
        </SuperAdminLayout>
    );
}
