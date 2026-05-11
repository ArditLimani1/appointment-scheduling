<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
<head>
    <meta charset="UTF-8">
    <title>{{ __('exports.pdf.appointments.title') }}</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }

        body {
            font-family: DejaVu Sans, sans-serif;
            font-size: 10px;
            color: #1e293b;
            background: #fff;
            padding: 28px 32px;
        }

        /* ── Header ── */
        .header {
            display: table;
            width: 100%;
            margin-bottom: 22px;
            padding-bottom: 16px;
            border-bottom: 2px solid #1e293b;
        }
        .header-left  { display: table-cell; vertical-align: middle; }
        .header-right { display: table-cell; vertical-align: middle; text-align: right; }

        .header-left h1 {
            font-size: 20px;
            font-weight: 700;
            color: #1e293b;
        }
        .header-left p { font-size: 10px; color: #64748b; margin-top: 3px; }

        .header-right .business-name { font-size: 12px; font-weight: 700; color: #1e293b; }
        .header-right .generated     { font-size: 9px;  color: #94a3b8; margin-top: 3px; }

        /* ── Period / filter bar ── */
        .filter-bar {
            background: #f1f5f9;
            border-radius: 6px;
            padding: 7px 12px;
            margin-bottom: 18px;
            font-size: 10px;
            color: #475569;
        }
        .filter-bar strong { color: #1e293b; }

        /* ── Summary widgets ── */
        .widgets {
            display: table;
            width: 100%;
            border-collapse: separate;
            border-spacing: 8px 0;
            margin-bottom: 20px;
        }
        .widget {
            display: table-cell;
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            padding: 12px 14px;
            text-align: center;
            vertical-align: top;
        }
        .widget .w-value {
            font-size: 18px;
            font-weight: 700;
            color: #1e293b;
        }
        .widget .w-label {
            font-size: 8px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.7px;
            color: #94a3b8;
            margin-top: 4px;
        }

        /* ── Section title ── */
        .section-title {
            font-size: 10px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.7px;
            color: #64748b;
            margin-bottom: 7px;
        }

        /* ── Table ── */
        table {
            width: 100%;
            border-collapse: collapse;
        }
        thead th {
            background: #1e293b;
            color: #fff;
            font-size: 8px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.6px;
            padding: 8px 10px;
            text-align: left;
        }

        tbody tr { border-bottom: 1px solid #f1f5f9; }
        tbody tr:nth-child(even) { background: #f8fafc; }
        tbody td {
            padding: 7px 10px;
            font-size: 10px;
            color: #334155;
            vertical-align: middle;
        }

        /* Status badges */
        .badge {
            display: inline-block;
            padding: 2px 7px;
            border-radius: 100px;
            font-size: 8px;
            font-weight: 700;
            text-transform: capitalize;
        }
        .badge-confirmed  { background: #dcfce7; color: #166534; }
        .badge-pending    { background: #fef3c7; color: #92400e; }
        .badge-cancelled  { background: #fee2e2; color: #991b1b; }

        /* ── Footer ── */
        .footer {
            margin-top: 22px;
            padding-top: 10px;
            border-top: 1px solid #e2e8f0;
            font-size: 9px;
            color: #94a3b8;
            text-align: center;
        }
    </style>
</head>
<body>

    {{-- Header --}}
    <div class="header">
        <div class="header-left">
            <h1>{{ __('exports.pdf.appointments.title') }}</h1>
            <p>{{ __('exports.pdf.appointments.subtitle') }}</p>
        </div>
        <div class="header-right">
            <div class="business-name">{{ $businessName }}</div>
            <div class="generated">{{ __('exports.common.generated') }}: {{ $generatedAt }}</div>
        </div>
    </div>

    {{-- Active filters --}}
    <div class="filter-bar">
        {{ __('exports.common.period') }}: <strong>{{ $dateFrom }}</strong> &mdash; <strong>{{ $dateTo }}</strong>
        @if($employeeFilter) &nbsp;&bull;&nbsp; {{ __('exports.common.employee') }}: <strong>{{ $employeeFilter }}</strong> @endif
        @if(!empty($serviceFilter)) &nbsp;&bull;&nbsp; {{ __('exports.common.service') }}: <strong>{{ $serviceFilter }}</strong> @endif
        @if($statusFilter)   &nbsp;&bull;&nbsp; {{ __('exports.common.status') }}: <strong>{{ $statusFilter }}</strong> @endif
    </div>

    {{-- Summary widgets --}}
    <table class="widgets">
        <tr>
            <td class="widget">
                <div class="w-value">{{ $totalCount }}</div>
                <div class="w-label">{{ __('exports.common.total') }}</div>
            </td>
            <td class="widget">
                <div class="w-value">{{ $confirmedCount }}</div>
                <div class="w-label">{{ __('exports.common.confirmed') }}</div>
            </td>
            <td class="widget">
                <div class="w-value">{{ $pendingCount }}</div>
                <div class="w-label">{{ __('exports.common.pending') }}</div>
            </td>
            <td class="widget">
                <div class="w-value">{{ $cancelledCount }}</div>
                <div class="w-label">{{ __('exports.common.cancelled') }}</div>
            </td>
            <td class="widget">
                <div class="w-value">{{ number_format($totalRevenue, 2) }} {{ $currencySymbol }}</div>
                <div class="w-label">{{ __('exports.common.revenue_confirmed') }}</div>
            </td>
        </tr>
    </table>

    {{-- Appointments table --}}
    <p class="section-title">{{ __('exports.pdf.appointments.section_title', ['count' => $totalCount]) }}</p>
    <table>
        <thead>
            <tr>
                <th>{{ __('exports.pdf.appointments.employee') }}</th>
                <th>{{ __('exports.pdf.appointments.client') }}</th>
                <th>{{ __('exports.pdf.appointments.service') }}</th>
                <th>{{ __('exports.pdf.appointments.date') }}</th>
                <th>{{ __('exports.pdf.appointments.time') }}</th>
                <th style="text-align:center;">{{ __('exports.pdf.appointments.status') }}</th>
                <th style="text-align:right;">{{ __('exports.pdf.appointments.price') }}</th>
            </tr>
        </thead>
        <tbody>
            @forelse($appointments as $apt)
            <tr>
                <td>{{ $apt->resolvedEmployeeName() ?? __('exports.common.none') }}</td>
                <td>{{ $apt->client_first_name }} {{ $apt->client_last_name }}</td>
                <td>{{ $apt->resolvedServiceName() ?? __('exports.common.none') }}</td>
                <td>{{ $apt->date->locale(app()->getLocale())->translatedFormat('d F Y') }}</td>
                <td>{{ \Illuminate\Support\Str::substr($apt->start_time, 0, 5) }} – {{ \Illuminate\Support\Str::substr($apt->end_time, 0, 5) }}</td>
                <td style="text-align:center;">
                    <span class="badge badge-{{ $apt->status->value }}">{{ __('exports.common.'.$apt->status->value) }}</span>
                </td>
                <td style="text-align:right;">{{ number_format((float) $apt->price, 2) }} {{ $currencySymbol }}</td>
            </tr>
            @empty
            <tr>
                <td colspan="7" style="text-align:center; padding:20px; color:#94a3b8;">{{ __('exports.common.no_appointments_selected_filters') }}</td>
            </tr>
            @endforelse
        </tbody>
    </table>

    {{-- Footer --}}
    <div class="footer">
        {{ __('exports.common.footer_auto') }}
    </div>

</body>
</html>
