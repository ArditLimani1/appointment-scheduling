import { Head, Link, useForm } from '@inertiajs/react';
import SuperAdminLayout from '@/Layouts/SuperAdminLayout';
import PageHeader from '@/Components/PageHeader';
import Icon from '@/Components/Icon';

export default function AuditLogsIndex({ logs, actions, filters }) {
    const { data, setData, get } = useForm({
        search: filters.search ?? '',
        action: filters.action ?? '',
    });

    const submit = (e) => {
        e.preventDefault();
        get(route('super-admin.audit-logs.index'), { preserveState: true, replace: true });
    };

    const formatDate = (s) => new Date(s).toLocaleString();

    return (
        <SuperAdminLayout>
            <Head title="Audit Log" />

            <PageHeader
                title="Audit Log"
                description="A record of every destructive and sensitive action on the platform."
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
                                placeholder="Search action, target or email"
                                className="w-full pl-10 pr-3 py-2 bg-surface border border-outline-variant rounded-lg text-sm text-on-surface placeholder-outline focus:outline-none focus:border-on-surface"
                            />
                        </div>
                        <select
                            value={data.action}
                            onChange={(e) => setData('action', e.target.value)}
                            className="bg-surface border border-outline-variant rounded-lg text-sm text-on-surface px-3 py-2 focus:outline-none focus:border-on-surface"
                        >
                            <option value="">All actions</option>
                            {actions.map((a) => <option key={a} value={a}>{a}</option>)}
                        </select>
                        <button type="submit" className="rounded-xl bg-on-surface px-4 py-2 text-sm font-bold text-surface hover:opacity-90 transition-opacity">
                            Filter
                        </button>
                    </form>
                    <p className="text-xs text-on-surface-variant">
                        {logs.total} entr{logs.total !== 1 ? 'ies' : 'y'} total
                    </p>
                </div>

                {logs.data.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-24 text-center">
                        <Icon name="fact_check" size="text-5xl" className="text-outline mb-3" />
                        <p className="text-sm text-on-surface-variant">No audit entries match your filters.</p>
                    </div>
                ) : (
                    <>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-slate-50/50">
                                        <th className="px-8 py-4 text-[11px] font-bold uppercase tracking-widest text-outline whitespace-nowrap">When</th>
                                        <th className="px-8 py-4 text-[11px] font-bold uppercase tracking-widest text-outline">Action</th>
                                        <th className="px-8 py-4 text-[11px] font-bold uppercase tracking-widest text-outline">Target</th>
                                        <th className="px-8 py-4 text-[11px] font-bold uppercase tracking-widest text-outline">Actor</th>
                                        <th className="px-8 py-4 text-[11px] font-bold uppercase tracking-widest text-outline">IP</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {logs.data.map((log) => (
                                        <tr key={log.id} className="hover:bg-slate-50/50 transition-colors align-top">
                                            <td className="px-8 py-5 whitespace-nowrap text-xs text-on-surface-variant">{formatDate(log.created_at)}</td>
                                            <td className="px-8 py-5">
                                                <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-surface-container text-on-surface-variant text-xs font-mono">
                                                    {log.action}
                                                </span>
                                            </td>
                                            <td className="px-8 py-5">
                                                <p className="text-sm text-on-surface">{log.target_label ?? '—'}</p>
                                                {log.target_type && (
                                                    <p className="text-xs text-on-surface-variant mt-0.5">{log.target_type} #{log.target_id}</p>
                                                )}
                                            </td>
                                            <td className="px-8 py-5 text-sm text-on-surface-variant">{log.actor?.email ?? log.actor_email ?? '—'}</td>
                                            <td className="px-8 py-5 text-xs text-on-surface-variant font-mono">{log.ip_address ?? '—'}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {logs.links && logs.last_page > 1 && (
                            <div className="px-8 py-4 bg-slate-50/30 flex items-center justify-between border-t border-slate-50">
                                <p className="text-sm text-on-surface-variant">
                                    Page <span className="font-bold text-on-surface">{logs.current_page}</span> of {logs.last_page}
                                </p>
                                <div className="flex gap-1">
                                    {logs.links.map((link, i) => (
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
