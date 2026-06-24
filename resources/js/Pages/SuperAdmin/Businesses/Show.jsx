import { useState, useEffect } from 'react';
import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import SuperAdminLayout from '@/Layouts/SuperAdminLayout';
import DeleteConfirmModal from '@/Components/DeleteConfirmModal';
import Icon from '@/Components/Icon';

const inputCls = 'w-full border-0 rounded-lg py-2.5 px-3 text-sm text-on-surface font-medium bg-surface-container-lowest ring-1 ring-outline-variant focus:outline-none focus:ring-2 focus:ring-on-surface/20 transition-shadow';

function Field({ label, error, children }) {
    return (
        <div>
            <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2">{label}</label>
            {children}
            {error && <p className="text-xs text-error mt-1">{error}</p>}
        </div>
    );
}

export default function Show({ business, employees, stats, businessTypes }) {
    const [tab, setTab] = useState('employees');
    const [deleteTarget, setDeleteTarget] = useState(null);
    const { features } = usePage().props;
    const whatsappEnabled = features?.whatsapp ?? false;

    const form = useForm({
        name: business.name ?? '',
        slug: business.slug ?? '',
        email: business.email ?? '',
        phone: business.phone ?? '',
        location: business.location ?? '',
        business_type_id: business.business_type_id ?? '',
        timezone: business.timezone ?? 'UTC',
        currency: business.currency ?? 'EUR',
        currency_symbol: business.currency_symbol ?? '€',
        slot_duration: business.slot_duration ?? 30,
        min_booking_notice: business.min_booking_notice ?? 120,
        max_booking_window: business.max_booking_window ?? 30,
        client_identifier_type: whatsappEnabled
            ? (business.client_identifier_type ?? 'phone')
            : 'email',
        allow_employee_service_edit: business.allow_employee_service_edit ?? true,
    });

    useEffect(() => {
        if (!whatsappEnabled) {
            form.setData('client_identifier_type', 'email');
        }
    }, [whatsappEnabled]);

    const submit = (e) => {
        e.preventDefault();
        form.put(route('super-admin.businesses.update', business.id), { preserveScroll: true });
    };

    const toggleSuspend = () => {
        router.patch(route('super-admin.businesses.toggle-suspend', business.id), {}, { preserveScroll: true });
    };

    const confirmDelete = () => {
        router.delete(route('super-admin.businesses.destroy', business.id));
    };

    const formatDate = (s) => new Date(s).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });

    const tabs = [
        { key: 'employees', label: 'Employees', icon: 'badge', count: stats.employees },
        { key: 'configuration', label: 'Configuration', icon: 'settings' },
    ];

    return (
        <SuperAdminLayout>
            <Head title={business.name} />

            <div className="mb-8">
                <Link
                    href={route('super-admin.businesses.index')}
                    className="inline-flex items-center gap-1 text-xs font-bold text-on-surface-variant hover:text-on-surface uppercase tracking-widest mb-4"
                >
                    <Icon name="arrow_back" size="text-sm" /> All Businesses
                </Link>

                <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
                    <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-3 mb-2">
                            <h1 className="text-4xl font-headline font-extrabold tracking-tight text-on-surface">{business.name}</h1>
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide ${business.is_active ? 'bg-tertiary-fixed text-on-tertiary-fixed-variant' : 'bg-error-container text-on-error-container'}`}>
                                {business.is_active ? 'Active' : 'Suspended'}
                            </span>
                        </div>
                        <p className="text-sm text-on-surface-variant">
                            Owned by <span className="font-semibold text-on-surface">{business.owner?.name ?? '—'}</span>
                            {business.owner?.email && <span className="text-on-surface-variant"> ({business.owner.email})</span>}
                            <span className="mx-2 text-outline">·</span>
                            <span>/{business.slug}</span>
                            {business.business_type && <><span className="mx-2 text-outline">·</span><span>{business.business_type.name}</span></>}
                        </p>
                    </div>
                    <div className="flex shrink-0 flex-wrap items-center gap-2">
                        <button
                            onClick={toggleSuspend}
                            className="flex items-center gap-2 rounded-xl border border-outline-variant px-4 py-2.5 text-sm font-semibold text-on-surface hover:bg-surface-container-low transition-colors"
                        >
                            <Icon name={business.is_active ? 'pause_circle' : 'play_circle'} size="text-base" />
                            {business.is_active ? 'Suspend' : 'Activate'}
                        </button>
                        <button
                            onClick={() => setDeleteTarget(business)}
                            className="flex items-center gap-2 rounded-xl bg-error px-4 py-2.5 text-sm font-semibold text-on-error hover:opacity-90 transition-opacity"
                        >
                            <Icon name="delete" size="text-base" /> Delete
                        </button>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                <div className="rounded-xl bg-surface-container-lowest p-5">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-1">Employees</p>
                    <p className="text-2xl font-extrabold text-on-surface tabular-nums">{stats.employees}</p>
                    <p className="text-xs text-on-surface-variant mt-0.5">{stats.active_employees} active</p>
                </div>
                <div className="rounded-xl bg-surface-container-lowest p-5">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-1">Services</p>
                    <p className="text-2xl font-extrabold text-on-surface tabular-nums">{stats.services}</p>
                </div>
                <div className="rounded-xl bg-surface-container-lowest p-5">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-1">Appointments</p>
                    <p className="text-2xl font-extrabold text-on-surface tabular-nums">{stats.appointments}</p>
                </div>
                <div className="rounded-xl bg-surface-container-lowest p-5">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-1">Created</p>
                    <p className="text-sm font-bold text-on-surface">{formatDate(business.created_at)}</p>
                </div>
            </div>

            <div className="flex border-b border-outline-variant/40 mb-6">
                {tabs.map((t) => (
                    <button
                        key={t.key}
                        onClick={() => setTab(t.key)}
                        className={`flex items-center gap-2 px-5 py-3 text-sm font-bold transition-colors border-b-2 -mb-px ${tab === t.key ? 'border-on-surface text-on-surface' : 'border-transparent text-on-surface-variant hover:text-on-surface'}`}
                    >
                        <Icon name={t.icon} size="text-base" />
                        {t.label}
                        {t.count !== undefined && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-surface-container text-[10px] font-bold">{t.count}</span>
                        )}
                    </button>
                ))}
            </div>

            {tab === 'employees' && (
                <div className="bg-surface-container-lowest rounded-2xl overflow-hidden ring-1 ring-slate-100 shadow-sm">
                    <div className="px-8 py-5 border-b border-slate-50 bg-white">
                        <h3 className="font-headline font-bold text-base text-on-surface">Team Members</h3>
                    </div>
                    {employees.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16 text-center">
                            <Icon name="people" size="text-5xl" className="text-outline mb-3" />
                            <p className="text-sm text-on-surface-variant">This business has no employees yet.</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-slate-50/50">
                                        <th className="px-8 py-4 text-[11px] font-bold uppercase tracking-widest text-outline">Name</th>
                                        <th className="px-8 py-4 text-[11px] font-bold uppercase tracking-widest text-outline">Email</th>
                                        <th className="px-8 py-4 text-[11px] font-bold uppercase tracking-widest text-outline">Title</th>
                                        <th className="px-8 py-4 text-[11px] font-bold uppercase tracking-widest text-outline">Role</th>
                                        <th className="px-8 py-4 text-[11px] font-bold uppercase tracking-widest text-outline text-center">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {employees.map((emp) => {
                                        const isOwner = business.owner_id === emp.id;
                                        return (
                                            <tr key={emp.id} className={`transition-colors ${emp.is_active ? 'hover:bg-slate-50/50' : 'bg-slate-100/50 opacity-70'}`}>
                                                <td className="px-8 py-5">
                                                    <div className="flex flex-wrap items-center gap-2">
                                                        <p className="font-headline font-bold text-on-surface text-sm">{emp.name}</p>
                                                        {isOwner && (
                                                            <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-primary-container/40 text-on-surface text-[10px] font-bold uppercase tracking-wide">
                                                                Owner
                                                            </span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-8 py-5 text-sm text-on-surface-variant">{emp.email}</td>
                                                <td className="px-8 py-5 text-sm text-on-surface-variant">{emp.title || '—'}</td>
                                                <td className="px-8 py-5 text-sm text-on-surface-variant">
                                                    {isOwner ? 'Owner account' : (emp.business_role?.name ?? emp.role)}
                                                </td>
                                                <td className="px-8 py-5">
                                                    <div className="flex justify-center">
                                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide ${emp.is_active ? 'bg-tertiary-fixed text-on-tertiary-fixed-variant' : 'bg-surface-container-highest text-on-surface-variant'}`}>
                                                            {emp.is_active ? 'Active' : 'Inactive'}
                                                        </span>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}

            {tab === 'configuration' && (
                <form onSubmit={submit} className="bg-surface-container-lowest rounded-2xl ring-1 ring-slate-100 shadow-sm p-8">
                    <div className="mb-8">
                        <h3 className="font-headline font-bold text-lg text-on-surface">Identity</h3>
                        <p className="text-xs text-on-surface-variant mt-1">Core details shown to customers and used in the booking URL.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10">
                        <Field label="Business Name" error={form.errors.name}>
                            <input type="text" value={form.data.name} onChange={(e) => form.setData('name', e.target.value)} className={inputCls} />
                        </Field>
                        <Field label="Booking Slug" error={form.errors.slug}>
                            <input type="text" value={form.data.slug} onChange={(e) => form.setData('slug', e.target.value)} className={inputCls} />
                        </Field>
                        <Field label="Email" error={form.errors.email}>
                            <input type="email" value={form.data.email} onChange={(e) => form.setData('email', e.target.value)} className={inputCls} />
                        </Field>
                        <Field label="Phone" error={form.errors.phone}>
                            <input type="text" value={form.data.phone} onChange={(e) => form.setData('phone', e.target.value)} className={inputCls} />
                        </Field>
                        <Field label="Location" error={form.errors.location}>
                            <input type="text" value={form.data.location} onChange={(e) => form.setData('location', e.target.value)} className={inputCls} />
                        </Field>
                        <Field label="Business Type" error={form.errors.business_type_id}>
                            <select value={form.data.business_type_id ?? ''} onChange={(e) => form.setData('business_type_id', e.target.value || null)} className={inputCls}>
                                <option value="">—</option>
                                {businessTypes.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                            </select>
                        </Field>
                    </div>

                    <div className="mb-8">
                        <h3 className="font-headline font-bold text-lg text-on-surface">Locale</h3>
                        <p className="text-xs text-on-surface-variant mt-1">Timezone and currency used across the business.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
                        <Field label="Timezone" error={form.errors.timezone}>
                            <input type="text" value={form.data.timezone} onChange={(e) => form.setData('timezone', e.target.value)} className={inputCls} />
                        </Field>
                        <Field label="Currency Code" error={form.errors.currency}>
                            <input type="text" value={form.data.currency} onChange={(e) => form.setData('currency', e.target.value.toUpperCase())} className={inputCls} />
                        </Field>
                        <Field label="Currency Symbol" error={form.errors.currency_symbol}>
                            <input type="text" value={form.data.currency_symbol} onChange={(e) => form.setData('currency_symbol', e.target.value)} className={inputCls} />
                        </Field>
                    </div>

                    <div className="mb-8">
                        <h3 className="font-headline font-bold text-lg text-on-surface">Booking Rules</h3>
                        <p className="text-xs text-on-surface-variant mt-1">Slot duration, booking window and client identity requirements.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                        <Field label="Slot Duration (min)" error={form.errors.slot_duration}>
                            <input type="number" min="5" max="480" value={form.data.slot_duration} onChange={(e) => form.setData('slot_duration', parseInt(e.target.value, 10) || 0)} className={inputCls} />
                        </Field>
                        <Field label="Min Booking Notice (min)" error={form.errors.min_booking_notice}>
                            <input type="number" min="0" max="10080" value={form.data.min_booking_notice} onChange={(e) => form.setData('min_booking_notice', parseInt(e.target.value, 10) || 0)} className={inputCls} />
                        </Field>
                        <Field label="Max Booking Window (days)" error={form.errors.max_booking_window}>
                            <input type="number" min="1" max="365" value={form.data.max_booking_window} onChange={(e) => form.setData('max_booking_window', parseInt(e.target.value, 10) || 0)} className={inputCls} />
                        </Field>
                    </div>

                    <div className={`grid grid-cols-1 gap-4 ${whatsappEnabled ? 'md:grid-cols-2' : ''} mb-8`}>
                        {whatsappEnabled ? (
                            <Field label="Client Identifier" error={form.errors.client_identifier_type}>
                                <select value={form.data.client_identifier_type} onChange={(e) => form.setData('client_identifier_type', e.target.value)} className={inputCls}>
                                    <option value="phone">Phone</option>
                                    <option value="email">Email</option>
                                </select>
                            </Field>
                        ) : null}
                        <label className={`flex items-center gap-3 rounded-lg ring-1 ring-outline-variant bg-surface-container-lowest px-4 py-3 ${whatsappEnabled ? 'mt-7' : ''}`}>
                            <input
                                type="checkbox"
                                checked={!!form.data.allow_employee_service_edit}
                                onChange={(e) => form.setData('allow_employee_service_edit', e.target.checked)}
                                className="rounded border-outline-variant text-on-surface focus:ring-on-surface"
                            />
                            <span className="text-sm text-on-surface font-medium">Allow employees to edit services</span>
                        </label>
                    </div>

                    <div className="flex justify-end gap-3 pt-6 border-t border-outline-variant/40">
                        <Link
                            href={route('super-admin.businesses.index')}
                            className="rounded-xl border border-outline-variant px-5 py-2.5 text-sm font-medium text-on-surface hover:bg-surface-container-low transition-colors"
                        >
                            Cancel
                        </Link>
                        <button
                            type="submit"
                            disabled={form.processing}
                            className="rounded-xl bg-on-surface px-6 py-2.5 text-sm font-bold text-surface hover:opacity-90 transition-opacity disabled:opacity-50"
                        >
                            {form.processing ? 'Saving…' : 'Save Configuration'}
                        </button>
                    </div>
                </form>
            )}

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
