import { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import Icon from '@/Components/Icon';
import PageHeader from '@/Components/PageHeader';
import DeleteConfirmModal from '@/Components/DeleteConfirmModal';
import RoleModal from './RoleModal';

function permissionLabel(key, permissionGroups) {
    const all = [...(permissionGroups?.admin ?? []), ...(permissionGroups?.employee ?? [])];
    return all.find((p) => p.value === key)?.label ?? key;
}

export default function Index({ roles, permissionGroups }) {
    const [showModal, setShowModal] = useState(false);
    const [editing, setEditing] = useState(null);
    const [deleteTarget, setDeleteTarget] = useState(null);

    const openCreate = () => {
        setEditing(null);
        setShowModal(true);
    };

    const openEdit = (role) => {
        setEditing(role);
        setShowModal(true);
    };

    const confirmDelete = () => {
        router.delete(route('admin.roles.destroy', deleteTarget.id));
        setDeleteTarget(null);
    };

    return (
        <AdminLayout>
            <Head title="Roles" />

            <PageHeader
                title="Roles & permissions"
                description="Create roles such as business manager or receptionist, choose what each role can do, then assign a role when you add or edit employees."
            >
                <button
                    onClick={openCreate}
                    className="flex items-center gap-2 rounded-xl bg-on-surface px-6 py-3 text-sm font-bold text-surface hover:opacity-90 transition-all active:scale-95 shadow-sm shrink-0"
                >
                    <Icon name="add_circle" size="text-lg" /> New role
                </button>
            </PageHeader>

            <div className="bg-surface-container-lowest rounded-2xl overflow-hidden ring-1 ring-slate-100 shadow-sm">
                <div className="px-8 py-5 border-b border-slate-50 flex items-center justify-between bg-white">
                    <h3 className="font-headline font-bold text-base text-on-surface">Custom roles</h3>
                    <p className="text-xs text-on-surface-variant">
                        {roles.length} role{roles.length !== 1 ? 's' : ''}
                    </p>
                </div>

                {roles.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-24 text-center">
                        <Icon name="key" size="text-5xl" className="text-outline mb-3" />
                        <p className="text-sm text-on-surface-variant mb-4 max-w-md">
                            No custom roles yet. Employees without a role keep full access to the employee workspace
                            only. Add a role to grant admin sections or limit employee features.
                        </p>
                        <button
                            onClick={openCreate}
                            className="flex items-center gap-2 rounded-xl bg-on-surface px-4 py-2 text-sm font-semibold text-surface hover:opacity-90 transition-opacity"
                        >
                            <Icon name="add" size="text-base" /> Create first role
                        </button>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50/50">
                                    <th className="px-8 py-4 text-[11px] font-bold uppercase tracking-widest text-outline">
                                        Role
                                    </th>
                                    <th className="px-8 py-4 text-[11px] font-bold uppercase tracking-widest text-outline">
                                        Permissions
                                    </th>
                                    <th className="px-8 py-4 text-[11px] font-bold uppercase tracking-widest text-outline text-right">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {roles.map((role) => (
                                    <tr key={role.id} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="px-8 py-5">
                                            <p className="font-headline font-bold text-on-surface text-sm">{role.name}</p>
                                        </td>
                                        <td className="px-8 py-5">
                                            <p className="text-xs text-on-surface-variant leading-relaxed max-w-xl">
                                                {(role.permissions || []).length === 0
                                                    ? '—'
                                                    : (role.permissions || []).map((k) => permissionLabel(k, permissionGroups)).join(', ')}
                                            </p>
                                        </td>
                                        <td className="px-8 py-5 text-right">
                                            <div className="flex items-center justify-end gap-1">
                                                <button
                                                    onClick={() => openEdit(role)}
                                                    className="p-2 text-outline hover:text-on-surface transition-colors rounded-lg hover:bg-surface-container"
                                                    title="Edit"
                                                >
                                                    <Icon name="edit" size="text-[18px]" />
                                                </button>
                                                <button
                                                    onClick={() => setDeleteTarget(role)}
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
                )}
            </div>

            <DeleteConfirmModal
                show={!!deleteTarget}
                onClose={() => setDeleteTarget(null)}
                onConfirm={confirmDelete}
                title="Delete role?"
                message={`"${deleteTarget?.name}" will be removed. Employees using it will fall back to default employee access.`}
            />

            <RoleModal
                show={showModal}
                onClose={() => setShowModal(false)}
                editing={editing}
                permissionGroups={permissionGroups}
            />
        </AdminLayout>
    );
}
