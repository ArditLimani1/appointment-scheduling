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

        return $query->latest('date')->latest('start_time');
    }

    public function headings(): array
    {
        return [
            __('exports.excel.appointments.employee_name'),
            __('exports.excel.appointments.client_name'),
            __('exports.excel.appointments.service'),
            __('exports.excel.appointments.date'),
            __('exports.excel.appointments.time'),
            __('exports.excel.appointments.status'),
            __('exports.excel.appointments.price'),
        ];
    }

    /**
     * @param  Appointment  $appointment
     */
    public function map($appointment): array
    {
        return [
            $appointment->employee?->name ?? __('exports.common.not_available'),
            $appointment->client_first_name.' '.$appointment->client_last_name,
            $appointment->service?->name ?? __('exports.common.not_available'),
            $appointment->date->locale(app()->getLocale())->translatedFormat('d F Y'),
            $appointment->start_time.' - '.$appointment->end_time,
            __('exports.common.'.$appointment->status->value),
            $appointment->price,
        ];
    }
}
