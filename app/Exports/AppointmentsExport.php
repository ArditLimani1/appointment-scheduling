<?php

namespace App\Exports;

use App\Enums\AppointmentStatus;
use App\Models\Appointment;
use Maatwebsite\Excel\Concerns\Exportable;
use Maatwebsite\Excel\Concerns\FromQuery;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;

class AppointmentsExport implements FromQuery, WithHeadings, WithMapping
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

        if (! empty($this->filters['status'])) {
            $status = AppointmentStatus::tryFrom((string) $this->filters['status']);
            if ($status !== null) {
                $query->where('status', $status);
            }
        }

        return $query->latest('date')->latest('start_time');
    }

    public function headings(): array
    {
        return [
            'ID',
            'Employee Name',
            'Client Name',
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
        return [
            $appointment->id,
            $appointment->employee?->name ?? 'N/A',
            $appointment->client_first_name.' '.$appointment->client_last_name,
            $appointment->service?->name ?? 'N/A',
            $appointment->date->format('Y-m-d'),
            $appointment->start_time.' - '.$appointment->end_time,
            $appointment->status->label(),
            $appointment->price,
        ];
    }
}
