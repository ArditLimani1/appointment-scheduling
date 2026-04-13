<?php

namespace App\Exports;

use App\Enums\AppointmentStatus;
use App\Models\Appointment;
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

        return $query->latest('date')->latest('start_time');
    }

    public function headings(): array
    {
        return [
            'Client Name',
            'Contact',
            'Service',
            'Date',
            'Time',
            'Status',
            'Price',
        ];
    }

    /**
     * @param  Appointment  $appointment
     */
    public function map($appointment): array
    {
        $contact = $appointment->client_email ?: $appointment->client_phone ?: '—';

        return [
            $appointment->client_first_name.' '.$appointment->client_last_name,
            $contact,
            $appointment->service?->name ?? 'N/A',
            $appointment->date->format('Y-m-d'),
            $appointment->start_time.' - '.$appointment->end_time,
            $appointment->status->label(),
            $appointment->price,
        ];
    }
}
