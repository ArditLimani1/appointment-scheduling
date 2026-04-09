<?php

namespace App\Exports;

use Maatwebsite\Excel\Concerns\FromArray;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithStrictNullComparison;
use Maatwebsite\Excel\Concerns\WithStyles;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;

class EmployeeAnalyticsExport implements FromArray, WithHeadings, WithStrictNullComparison, WithStyles
{
    /**
     * @param  list<array<string, mixed>>  $serviceStats
     */
    public function __construct(
        private array $serviceStats,
        private string $currencySymbol = '€',
    ) {}

    public function headings(): array
    {
        return [
            'Service',
            'Cancelled',
            'Pending',
            'Confirmed',
            'Revenue',
        ];
    }

    public function array(): array
    {
        $rows = [];

        foreach ($this->serviceStats as $s) {
            $rows[] = [
                $s['service_name'],
                (int) $s['cancelled_count'],
                (int) $s['pending_count'],
                (int) $s['confirmed_count'],
                number_format((float) $s['revenue'], 2, '.', '').' '.$this->currencySymbol,
            ];
        }

        $totalCancelled = (int) array_sum(array_column($this->serviceStats, 'cancelled_count'));
        $totalPending = (int) array_sum(array_column($this->serviceStats, 'pending_count'));
        $totalConfirmed = (int) array_sum(array_column($this->serviceStats, 'confirmed_count'));
        $totalRevenue = (float) array_sum(array_column($this->serviceStats, 'revenue'));

        $rows[] = [
            'TOTAL',
            $totalCancelled,
            $totalPending,
            $totalConfirmed,
            number_format($totalRevenue, 2, '.', '').' '.$this->currencySymbol,
        ];

        return $rows;
    }

    public function styles(Worksheet $sheet): array
    {
        $lastRow = 1 + count($this->serviceStats) + 1;

        return [
            1 => ['font' => ['bold' => true]],
            $lastRow => ['font' => ['bold' => true], 'fill' => ['fillType' => 'solid', 'startColor' => ['rgb' => 'F1F5F9']]],
        ];
    }
}
