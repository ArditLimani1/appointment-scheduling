import { Head, useForm, router } from '@inertiajs/react';
import { useState } from 'react';
import AdminLayout from '@/Layouts/AdminLayout';
import Icon from '@/Components/Icon';

const STATUS_STYLES = {
    pending: 'bg-secondary-container text-on-secondary-container',
    confirmed: 'bg-secondary-container text-on-secondary-container',
    checked_in: 'bg-tertiary-fixed/30 text-on-tertiary-container',
    completed: 'bg-tertiary-fixed/30 text-on-tertiary-container',
    cancelled: 'bg-error-container text-on-error-container',
};

export default function Index({ appointments, employees, filters = {} }) {
    const [localFilters, setLocalFilters] = useState({
        employee_id: filters.employee_id || '',
        date_from: filters.date_from || '',
        date_to: filters.date_to || '',
        status: filters.status || '',
    });

    const applyFilters = () => {
        router.get(route('admin.appointments.index'), localFilters, { preserveState: true, replace: true });
    };

    const clearFilters = () => {
        setLocalFilters({ employee_id: '', date_from: '', date_to: '', status: '' });
        router.get(route('admin.appointments.index'), {}, { preserveState: true, replace: true });
    };

    const updateStatus = (apt, status) => {
        router.patch(route('admin.appointments.update', apt.id), { status }, { preserveScroll: true });
    };

    const deleteAppointment = (apt) => {
        if (confirm('Delete this appointment?')) {
            router.delete(route('admin.appointments.destroy', apt.id), { preserveScroll: true });
        }
    };

    const exportUrl = () => {
        const params = new URLSearchParams(localFilters).toString();
        return route('admin.appointments.export') + (params ? '?' + params : '');
    };

    return (
        <AdminLayout>
            <Head title="Appointments" />

            <div className="mb-6 flex items-center justify-between flex-wrap gap-3">
                <div>
                    <h1 className="text-3xl font-black font-headline tracking-tight text-on-surface">All Appointments</h1>
                    <p className="mt-1 text-sm text-on-surface-variant">{appointments.length} appointment{appointments.length !== 1 ? 's' : ''} found</p>
                </div>
                <a href={exportUrl()} className="flex items-center gap-2 rounded-2xl bg-tertiary-fixed/30 px-4 py-2.5 text-sm font-semibold text-on-tertiary-container hover:opacity-80 transition-opacity">
                    <Icon name="download" size="text-lg" /> Export Excel
                </a>
            </div>

            {/* Filters */}
            <div className="mb-5 rounded-3xl bg-surface-container-lowest border border-outline-variant p-4">
                <div className="flex flex-wrap gap-3 items-end">
                    <div className="flex-1 min-w-[160px]">
                        <label className="block text-[10px] font-semibold uppercase tracking-widest text-on-surface-variant mb-1">Employee</label>
                        <select value={localFilters.employee_id} onChange={e => setLocalFilters(f => ({ ...f, employee_id: e.target.value }))}
                            className="w-full rounded-xl border-0 bg-surface-container-low px-3 py-2 text-sm text-on-surface focus:ring-2 focus:ring-surface-tint">
                            <option value="">All Staff</option>
                            {employees.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                        </select>
                    </div>
                    <div className="flex-1 min-w-[140px]">
                        <label className="block text-[10px] font-semibold uppercase tracking-widest text-on-surface-variant mb-1">From</label>
                        <input type="date" value={localFilters.date_from} onChange={e => setLocalFilters(f => ({ ...f, date_from: e.target.value }))}
                            className="w-full rounded-xl border-0 bg-surface-container-low px-3 py-2 text-sm text-on-surface focus:ring-2 focus:ring-surface-tint" />
                    </div>
                    <div className="flex-1 min-w-[140px]">
                        <label className="block text-[10px] font-semibold uppercase tracking-widest text-on-surface-variant mb-1">To</label>
                        <input type="date" value={localFilters.date_to} onChange={e => setLocalFilters(f => ({ ...f, date_to: e.target.value }))}
                            className="w-full rounded-xl border-0 bg-surface-container-low px-3 py-2 text-sm text-on-surface focus:ring-2 focus:ring-surface-tint" />
                    </div>
                    <div className="flex-1 min-w-[140px]">
                        <label className="block text-[10px] font-semibold uppercase tracking-widest text-on-surface-variant mb-1">Status</label>
                        <select value={localFilters.status} onChange={e => setLocalFilters(f => ({ ...f, status: e.target.value }))}
                            className="w-full rounded-xl border-0 bg-surface-container-low px-3 py-2 text-sm text-on-surface focus:ring-2 focus:ring-surface-tint">
                            <option value="">All Statuses</option>
                            {['pending','confirmed','checked_in','completed','cancelled'].map(s => <option key={s} value={s} className="capitalize">{s.replace('_',' ')}</option>)}
                        </select>
                    </div>
                    <div className="flex gap-2">
                        <button onClick={applyFilters} className="primary-gradient rounded-xl px-4 py-2 text-sm font-semibold text-white">Filter</button>
                        <button onClick={clearFilters} className="rounded-xl border border-outline-variant px-4 py-2 text-sm font-medium text-on-surface hover:bg-surface-container-low">Clear</button>
                    </div>
                </div>
            </div>

            {appointments.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-3xl bg-surface-container-lowest border border-outline-variant py-20">
                    <Icon name="event_busy" size="text-5xl" className="text-outline mb-4" />
                    <p className="text-on-surface-variant">No appointments found for the selected filters.</p>
                </div>
            ) : (
                <div className="rounded-3xl bg-surface-container-lowest border border-outline-variant overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[700px]">
                            <thead>
                                <tr className="border-b border-outline-variant bg-surface-container-low">
                                    <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Client</th>
                                    <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Employee</th>
                                    <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Service</th>
                                    <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Date & Time</th>
                                    <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Status</th>
                                    <th className="px-4 py-3 text-right text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Price</th>
                                    <th className="px-4 py-3 text-right text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-outline-variant">
                                {appointments.map(apt => (
                                    <tr key={apt.id} className="hover:bg-surface-container-low transition-colors">
                                        <td className="px-4 py-3">
                                            <p className="font-semibold text-sm text-on-surface">{apt.client_first_name} {apt.client_last_name}</p>
                                            <p className="text-xs text-on-surface-variant">{apt.client_phone}</p>
                                        </td>
                                        <td className="px-4 py-3 text-sm text-on-surface">{apt.employee?.name}</td>
                                        <td className="px-4 py-3 text-sm text-on-surface-variant">{apt.service?.name || '—'}</td>
                                        <td className="px-4 py-3">
                                            <p className="text-sm text-on-surface">{new Date(apt.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                                            <p className="text-xs text-on-surface-variant">{apt.start_time} – {apt.end_time}</p>
                                        </td>
                                        <td className="px-4 py-3">
                                            <select value={apt.status} onChange={e => updateStatus(apt, e.target.value)}
                                                className={`rounded-full px-2.5 py-1 text-xs font-semibold border-0 focus:ring-1 focus:ring-surface-tint capitalize ${STATUS_STYLES[apt.status] || ''}`}>
                                                {['pending','confirmed','checked_in','completed','cancelled'].map(s => <option key={s} value={s}>{s.replace('_',' ')}</option>)}
                                            </select>
                                        </td>
                                        <td className="px-4 py-3 text-right text-sm font-semibold text-on-surface">€{Number(apt.price).toFixed(2)}</td>
                                        <td className="px-4 py-3 text-right">
                                            <button onClick={() => deleteAppointment(apt)} className="rounded-xl bg-error-container p-1.5 text-on-error-container hover:opacity-80 transition-opacity">
                                                <Icon name="delete" size="text-sm" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </AdminLayout>
    );
}
