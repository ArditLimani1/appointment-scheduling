import { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import Icon from '@/Components/Icon';
import PageHeader from '@/Components/PageHeader';
import DeleteConfirmModal from '@/Components/DeleteConfirmModal';
import EmployeeModal from './EmployeeModal';

export default function Index({ employees, services, businessRoles = [], businessOwnerId }) {
    const [showModal, setShowModal] = useState(false);
    const [editing, setEditing] = useState(null);
    const [deleteTarget, setDeleteTarget] = useState(null);

    const openCreate = () => { setEditing(null); setShowModal(true); };
    const openEdit = (emp) => { setEditing(emp); setShowModal(true); };

    const confirmDelete = () => {
        router.delete(route('admin.employees.destroy', deleteTarget.id));
        setDeleteTarget(null);
    };

    const toggleEmployeeActive = (employee) => {
        router.patch(route('admin.employees.update', employee.id), {
            name: employee.name,
            email: employee.email,
            phone: employee.phone ?? null,
            title: employee.title ?? null,
            is_active: !employee.is_active,
            service_ids: employee.services?.map(s => s.id) ?? [],
            business_role_id: employee.business_role_id ?? null,
        });
    };

    return (
        <AdminLayout>
            <Head title="Employees" />

            <PageHeader
                title="Employees"
                description="Manage your team members. Assign services and control their access and availability."
            >
                <button
                    onClick={openCreate}
                    className="flex items-center gap-2 rounded-xl bg-on-surface px-6 py-3 text-sm font-bold text-surface hover:opacity-90 transition-all active:scale-95 shadow-sm shrink-0"
                >
                    <Icon name="add_circle" size="text-lg" /> Add Employee
                </button>
            </PageHeader>

            <div className="bg-surface-container-lowest rounded-2xl overflow-hidden ring-1 ring-slate-100 shadow-sm">
                <div className="px-8 py-5 border-b border-slate-50 flex items-center justify-between bg-white">
                    <h3 className="font-headline font-bold text-base text-on-surface">Team Members</h3>
                    <p className="text-xs text-on-surface-variant">
                        {employees.length} employee{employees.length !== 1 ? 's' : ''} total
                    </p>
                </div>

                {employees.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-24 text-center">
                        <Icon name="people" size="text-5xl" className="text-outline mb-3" />
                        <p className="text-sm text-on-surface-variant mb-4">No employees yet.</p>
                        <button onClick={openCreate} className="flex items-center gap-2 rounded-xl bg-on-surface px-4 py-2 text-sm font-semibold text-surface hover:opacity-90 transition-opacity">
                            <Icon name="add" size="text-base" /> Add First Employee
                        </button>
                    </div>
                ) : (
                    <>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-slate-50/50">
                                        <th className="px-8 py-4 text-[11px] font-bold uppercase tracking-widest text-outline">
                                            Name
                                        </th>
                                        <th className="px-8 py-4 text-[11px] font-bold uppercase tracking-widest text-outline">Email</th>
                                        <th className="px-8 py-4 text-[11px] font-bold uppercase tracking-widest text-outline">Title</th>
                                        <th className="px-8 py-4 text-[11px] font-bold uppercase tracking-widest text-outline">Role</th>
                                        <th className="px-8 py-4 text-[11px] font-bold uppercase tracking-widest text-outline">Services</th>
                                        <th className="px-8 py-4 text-[11px] font-bold uppercase tracking-widest text-outline text-center">Status</th>
                                        <th className="px-8 py-4 text-[11px] font-bold uppercase tracking-widest text-outline text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {employees.map((emp) => {
                                        const isOwner = businessOwnerId != null && emp.id === businessOwnerId;
                                        return (
                                        <tr key={emp.id} className={`transition-colors ${emp.is_active ? 'hover:bg-slate-50/50' : 'bg-slate-200/70 opacity-50 hover:opacity-70'}`}>
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
                                            <td className="px-8 py-5">
                                                <p className="text-sm text-on-surface-variant">{emp.email}</p>
                                            </td>
                                            <td className="px-8 py-5">
                                                <p className="text-sm text-on-surface-variant">{emp.title || '—'}</p>
                                            </td>
                                            <td className="px-8 py-5">
                                                <p className="text-sm text-on-surface-variant">
                                                    {isOwner ? 'Owner account' : (emp.business_role?.name ?? 'Employee')}
                                                </p>
                                            </td>
                                            <td className="px-8 py-5">
                                                <div className="flex flex-wrap gap-1.5">
                                                    {emp.services?.length > 0 ? emp.services.map(s => (
                                                        <span key={s.id} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-surface-container text-on-surface-variant text-xs font-medium">
                                                            {s.name}
                                                        </span>
                                                    )) : <span className="text-xs text-outline">—</span>}
                                                </div>
                                            </td>
                                            <td className="px-8 py-5">
                                                <div className="flex justify-center">
                                                    <button
                                                        type="button"
                                                        onClick={() => toggleEmployeeActive(emp)}
                                                        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${emp.is_active ? 'bg-on-surface' : 'bg-surface-container-highest'}`}
                                                    >
                                                        <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${emp.is_active ? 'translate-x-5' : 'translate-x-0'}`} />
                                                    </button>
                                                </div>
                                            </td>
                                            <td className="px-8 py-5 text-right">
                                                <div className="flex items-center justify-end gap-1">
                                                    <button
                                                        onClick={() => openEdit(emp)}
                                                        className="p-2 text-outline hover:text-on-surface transition-colors rounded-lg hover:bg-surface-container"
                                                        title="Edit"
                                                    >
                                                        <Icon name="edit" size="text-[18px]" />
                                                    </button>
                                                    {!isOwner && (
                                                        <button
                                                            onClick={() => setDeleteTarget(emp)}
                                                            className="p-2 text-outline hover:text-error transition-colors rounded-lg hover:bg-error-container"
                                                            title="Delete"
                                                        >
                                                            <Icon name="delete" size="text-[18px]" />
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                    })}
                                </tbody>
                            </table>
                        </div>
                        <div className="px-8 py-4 bg-slate-50/30 flex items-center justify-between border-t border-slate-50">
                            <p className="text-sm text-on-surface-variant">
                                Showing <span className="font-bold text-on-surface">{employees.length}</span> employee{employees.length !== 1 ? 's' : ''}
                            </p>
                        </div>
                    </>
                )}
            </div>

            <DeleteConfirmModal
                show={!!deleteTarget}
                onClose={() => setDeleteTarget(null)}
                onConfirm={confirmDelete}
                title="Delete Employee?"
                message={`"${deleteTarget?.name}" will be permanently removed. This cannot be undone.`}
            />

            <EmployeeModal
                show={showModal}
                onClose={() => setShowModal(false)}
                editing={editing}
                services={services}
                businessRoles={businessRoles}
                businessOwnerId={businessOwnerId}
            />
        </AdminLayout>
    );
}
