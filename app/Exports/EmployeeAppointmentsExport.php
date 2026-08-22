<?php

namespace App\Exports;

use App\Enums\AppointmentStatus;
use App\Models\Appointment;
use App\Support\AppointmentListScope;
use Maatwebsite\Excel\Concerns\Exportable;
use Maatwebsite\Excel\Concerns\FromQuery;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;

/**
 * Employee list export — columns match the employee appointments table (no staff column).
 */
class EmployeeAppointmentsExport implements FromQuery, WithHeadings, WithMapping
{
    use Exportable;

    protected array $filters;

    public function __construct(array $filters = [])
    {
        $this->filters = $filters;
    }

    public function query()
    {
        $query = Appointment::query()->with(['employee', 'service']);

        if (! empty($this->filters['business_id'])) {
            $query->where('business_id', $this->filters['business_id']);
        }

        if (! empty($this->filters['employee_id'])) {
            $query->where('employee_id', $this->filters['employee_id']);
        }

        if (! empty($this->filters['date_from'])) {
            $query->whereDate('date', '>=', $this->filters['date_from']);
        }

        if (! empty($this->filters['date_to'])) {
            $query->whereDate('date', '<=', $this->filters['date_to']);
        }

        if (! empty($this->filters['statuses']) && is_array($this->filters['statuses'])) {
            $cases = array_values(array_filter(array_map(
                fn ($s) => AppointmentStatus::tryFrom((string) $s),
                $this->filters['statuses'],
            )));
            if ($cases !== []) {
                $query->whereIn('status', $cases);
            }
        }

        if (! empty($this->filters['service_id'])) {
            $query->where('service_id', (int) $this->filters['service_id']);
        }

        if (! empty($this->filters['search']) && is_string($this->filters['search'])) {
            $term = trim($this->filters['search']);
            if ($term !== '') {
                $like = '%'.addcslashes($term, '%_\\').'%';
                $query->where(function ($q) use ($like) {
                    $q->where('client_first_name', 'like', $like)
                        ->orWhere('client_last_name', 'like', $like);
                });
            }
        }

        AppointmentListScope::applyUpcoming($query, $this->filters);

        return AppointmentListScope::applyOrder($query, $this->filters);
    }

    public function headings(): array
    {
        return [
            __('exports.excel.my_appointments.client_name'),
            __('exports.excel.my_appointments.contact'),
            __('exports.excel.my_appointments.service'),
            __('exports.excel.my_appointments.date'),
            __('exports.excel.my_appointments.time'),
            __('exports.excel.my_appointments.status'),
            __('exports.excel.my_appointments.price'),
        ];
    }

    /**
     * @param  Appointment  $appointment
     */
    public function map($appointment): array
    {
        $contact = $appointment->client_email ?: $appointment->client_phone ?: __('exports.common.none');

        return [
            $appointment->client_first_name.' '.$appointment->client_last_name,
            $contact,
            $appointment->resolvedServiceName() ?? __('exports.common.not_available'),
            $appointment->date->locale(app()->getLocale())->translatedFormat('d F Y'),
            $appointment->start_time.' - '.$appointment->end_time,
            __('exports.common.'.$appointment->status->value),
            $appointment->price,
        ];
    }
}
