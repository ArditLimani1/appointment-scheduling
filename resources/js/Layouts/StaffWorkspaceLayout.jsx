import { usePage } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import EmployeeLayout from '@/Layouts/EmployeeLayout';

export default function StaffWorkspaceLayout({ children }) {
    const solo = usePage().props.auth?.business?.single_employee_mode === true;
    const Layout = solo ? AdminLayout : EmployeeLayout;

    return <Layout>{children}</Layout>;
}
