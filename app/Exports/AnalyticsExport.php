<?php

namespace App\Exports;

use Maatwebsite\Excel\Concerns\FromArray;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithStrictNullComparison;
use Maatwebsite\Excel\Concerns\WithStyles;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;

class AnalyticsExport implements FromArray, WithHeadings, WithStrictNullComparison, WithStyles
{
    public function __construct(
        private array $employeeStats,
        private string $currencySymbol = '€',
    ) {}

    public function headings(): array
    {
        return [
            'Employee',
            'Cancelled',
            'Pending',
            'Confirmed',
            'Revenue',
        ];
    }

    public function array(): array
    {
        $rows = [];

        foreach ($this->employeeStats as $stat) {
            $rows[] = [
                $stat['name'],
                (int) $stat['cancelled_count'],
                (int) $stat['pending_count'],
                (int) $stat['confirmed_count'],
                number_format((float) $stat['revenue'], 2, '.', '').' '.$this->currencySymbol,
            ];
        }

        // Summary row
        $rows[] = [
            'TOTAL',
            (int) array_sum(array_column($this->employeeStats, 'cancelled_count')),
            (int) array_sum(array_column($this->employeeStats, 'pending_count')),
            (int) array_sum(array_column($this->employeeStats, 'confirmed_count')),
            number_format(array_sum(array_column($this->employeeStats, 'revenue')), 2, '.', '').' '.$this->currencySymbol,
        ];

        return $rows;
    }

    public function styles(Worksheet $sheet): array
    {
        $lastRow = count($this->employeeStats) + 2; // +1 header, +1 summary

        return [
            1 => ['font' => ['bold' => true]],
            $lastRow => ['font' => ['bold' => true], 'fill' => ['fillType' => 'solid', 'startColor' => ['rgb' => 'F1F5F9']]],
        ];
    }
}
