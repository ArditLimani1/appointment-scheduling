import { Head } from '@inertiajs/react';
import EmployeeLayout from '@/Layouts/EmployeeLayout';
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
    const backHref = return_to || route('employee.appointments.index');

    return (
        <EmployeeLayout>
            <Head title={t('employee.appointments.create_head_title')} />

            <InternalAppointmentForm
                context="employee"
                business={business}
                employees={employees}
                services={services}
                preselectedEmployeeId={preselected_employee_id}
                returnTo={return_to ?? null}
                bookingToday={booking_today}
                backHref={backHref}
            />
        </EmployeeLayout>
    );
}
