import SuperAdminLayout from '@/Layouts/SuperAdminLayout';
import MetricCard from '@/Components/MetricCard';
import Icon from '@/Components/Icon';
import { Head, Link } from '@inertiajs/react';

export default function Dashboard({ stats, signups_by_day, recent_businesses, recent_audit_logs }) {
    const maxSignup = Math.max(1, ...signups_by_day.map(d => d.count));

    const formatDate = (s) => new Date(s).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });

    return (
        <SuperAdminLayout>
            <Head title="Platform Overview" />

            <div className="mb-12">
                <h1 className="text-4xl font-extrabold font-headline tracking-tight text-on-surface mb-2">Platform Overview</h1>
                <p className="text-on-surface-variant text-lg">Health and activity across all tenants.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6 mb-12">
                <MetricCard
                    icon="storefront"
                    iconBg="bg-primary-fixed"
                    iconClass="text-on-primary-fixed-variant"
                    label="Businesses"
                    value={stats.businesses_total}
                    badge={`${stats.businesses_active} active`}
                />
                <MetricCard
                    icon="group"
                    iconBg="bg-secondary-container"
                    iconClass="text-on-secondary-container"
                    label="Users"
                    value={stats.users_total}
                />
                <MetricCard
                    icon="event_upcoming"
                    iconBg="bg-surface-container"
                    iconClass="text-on-surface-variant"
                    label="Appointments"
                    value={stats.appointments_total}
                    badge={`${stats.appointments_last_30_days} in 30d`}
                />
                <MetricCard
                    variant="primary"
                    icon="pause_circle"
                    label="Suspended"
                    value={stats.businesses_suspended}
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                <section className="lg:col-span-2 bg-surface-container-lowest rounded-xl p-8">
                    <div className="flex justify-between items-center mb-8">
                        <h2 className="text-xl font-extrabold font-headline text-on-surface">Signups (Last 30 Days)</h2>
                        <span className="text-sm text-on-surface-variant">{signups_by_day.reduce((s, r) => s + r.count, 0)} total</span>
                    </div>

                    {signups_by_day.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16 text-center">
                            <Icon name="trending_flat" size="text-4xl" className="text-outline mb-3" />
                            <p className="text-sm text-on-surface-variant">No signups in the last 30 days.</p>
                        </div>
                    ) : (
                        <div className="flex items-end gap-1 h-48">
                            {signups_by_day.map((row) => (
                                <div key={row.day} className="flex-1 flex flex-col items-center gap-1">
                                    <div
                                        className="w-full bg-on-surface hover:opacity-80 rounded-t transition-opacity"
                                        style={{ height: `${(row.count / maxSignup) * 100}%` }}
                                        title={`${row.day}: ${row.count}`}
                                    />
                                </div>
                            ))}
                        </div>
                    )}
                </section>

                <section className="bg-surface-container-lowest rounded-xl p-8">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-xl font-extrabold font-headline text-on-surface">Recent Businesses</h2>
                        <Link
                            href={route('super-admin.businesses.index')}
                            className="text-sm font-bold text-on-surface hover:underline decoration-2 underline-offset-4"
                        >
                            View all
                        </Link>
                    </div>
                    <ul className="space-y-4">
                        {recent_businesses.map((b) => (
                            <li key={b.id} className="flex items-center justify-between gap-3">
                                <div className="min-w-0 flex-1">
                                    <p className="font-headline font-bold text-on-surface text-sm truncate">{b.name}</p>
                                    <p className="text-xs text-on-surface-variant truncate">{b.owner?.email ?? '—'}</p>
                                </div>
                                <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${b.is_active ? 'bg-tertiary-fixed text-on-tertiary-fixed-variant' : 'bg-error-container text-on-error-container'}`}>
                                    {b.is_active ? 'Active' : 'Suspended'}
                                </span>
                            </li>
                        ))}
                        {recent_businesses.length === 0 && (
                            <li className="text-sm text-on-surface-variant text-center py-4">No businesses yet.</li>
                        )}
                    </ul>
                </section>
            </div>

            <section className="bg-surface-container-lowest rounded-xl p-8">
                <div className="flex justify-between items-center mb-8">
                    <h2 className="text-2xl font-extrabold font-headline text-on-surface">Recent Activity</h2>
                    <Link
                        href={route('super-admin.audit-logs.index')}
                        className="text-sm font-bold text-on-surface hover:underline decoration-2 underline-offset-4"
                    >
                        View audit log
                    </Link>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b border-surface-container-highest">
                                <th className="pb-5 text-xs font-bold uppercase tracking-[0.15em] text-on-surface-variant">Action</th>
                                <th className="pb-5 text-xs font-bold uppercase tracking-[0.15em] text-on-surface-variant">Target</th>
                                <th className="pb-5 text-xs font-bold uppercase tracking-[0.15em] text-on-surface-variant">Actor</th>
                                <th className="pb-5 text-xs font-bold uppercase tracking-[0.15em] text-on-surface-variant">When</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-surface-container-highest">
                            {recent_audit_logs.map((log) => (
                                <tr key={log.id}>
                                    <td className="py-4"><span className="font-mono text-xs text-on-surface">{log.action}</span></td>
                                    <td className="py-4 text-sm text-on-surface">{log.target_label ?? '—'}</td>
                                    <td className="py-4 text-sm text-on-surface-variant">{log.actor?.email ?? log.actor_email ?? '—'}</td>
                                    <td className="py-4 text-sm text-on-surface-variant">{formatDate(log.created_at)}</td>
                                </tr>
                            ))}
                            {recent_audit_logs.length === 0 && (
                                <tr><td colSpan={4} className="py-6 text-center text-sm text-on-surface-variant">No activity yet.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </section>
        </SuperAdminLayout>
    );
}
