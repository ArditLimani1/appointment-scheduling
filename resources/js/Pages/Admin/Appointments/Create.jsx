import { Head } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import InternalAppointmentForm from '@/Components/InternalAppointmentForm';
import { useT } from '@/i18n/useT';

export default function Create({
    business,
    employees,
    services,
    preselected_employee_id,
    return_to,
    booking_today,
}) {
    const t = useT();
    const backHref = return_to || route('admin.appointments.index');

    return (
        <AdminLayout>
            <Head title={t('admin.appointments.create_head_title')} />

            <InternalAppointmentForm
                context="admin"
                business={business}
                employees={employees}
                services={services}
                preselectedEmployeeId={preselected_employee_id}
                returnTo={return_to ?? null}
                bookingToday={booking_today}
                backHref={backHref}
            />
        </AdminLayout>
    );
}
