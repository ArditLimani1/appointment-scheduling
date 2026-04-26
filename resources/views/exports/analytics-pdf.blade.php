<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
<head>
    <meta charset="UTF-8">
    <title>{{ __('exports.pdf.analytics.title') }}</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }

        body {
            font-family: DejaVu Sans, sans-serif;
            font-size: 11px;
            color: #1e293b;
            background: #fff;
            padding: 32px 36px;
        }

        /* ── Header ── */
        .header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 28px;
            padding-bottom: 18px;
            border-bottom: 2px solid #1e293b;
        }
        .header-left h1 {
            font-size: 22px;
            font-weight: 700;
            color: #1e293b;
            letter-spacing: -0.3px;
        }
        .header-left p {
            font-size: 11px;
            color: #64748b;
            margin-top: 3px;
        }
        .header-right {
            text-align: right;
        }
        .header-right .business-name {
            font-size: 13px;
            font-weight: 700;
            color: #1e293b;
        }
        .header-right .generated {
            font-size: 10px;
            color: #94a3b8;
            margin-top: 3px;
        }

        /* ── Period badge ── */
        .period-bar {
            background: #f1f5f9;
            border-radius: 6px;
            padding: 8px 14px;
            margin-bottom: 22px;
            font-size: 11px;
            color: #475569;
        }
        .period-bar strong { color: #1e293b; }

        /* ── Summary widgets ── */
        .widgets {
            display: table;
            width: 100%;
            margin-bottom: 24px;
            border-spacing: 0;
        }
        .widget {
            display: table-cell;
            width: 25%;
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            padding: 14px 16px;
            text-align: center;
            vertical-align: top;
        }
        .widget + .widget { margin-left: 10px; }
        .widget .w-value {
            font-size: 20px;
            font-weight: 700;
            color: #1e293b;
            line-height: 1.2;
        }
        .widget .w-label {
            font-size: 9px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.8px;
            color: #94a3b8;
            margin-top: 4px;
        }

        /* ── Table ── */
        .section-title {
            font-size: 11px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.8px;
            color: #64748b;
            margin-bottom: 8px;
        }
        table {
            width: 100%;
            border-collapse: collapse;
        }
        thead th {
            background: #1e293b;
            color: #fff;
            font-size: 9px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.7px;
            padding: 9px 12px;
            text-align: left;
        }
        tbody tr { border-bottom: 1px solid #f1f5f9; }
        tbody tr:nth-child(even) { background: #f8fafc; }
        tbody td {
            padding: 9px 12px;
            font-size: 11px;
            color: #334155;
        }

        /* Summary / totals row */
        tfoot tr { background: #f1f5f9 !important; }
        tfoot td {
            padding: 10px 12px;
            font-size: 11px;
            font-weight: 700;
            color: #1e293b;
            border-top: 2px solid #cbd5e1;
        }

        /* ── Cancelled / Pending / Confirmed colour pills ── */
        .pill {
            display: inline-block;
            padding: 2px 8px;
            border-radius: 100px;
            font-size: 10px;
            font-weight: 700;
        }
        .pill-cancelled  { background: #fee2e2; color: #991b1b; }
        .pill-pending    { background: #fef3c7; color: #92400e; }
        .pill-confirmed  { background: #dcfce7; color: #166534; }

        /* ── Footer ── */
        .footer {
            margin-top: 28px;
            padding-top: 12px;
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
            <h1>{{ __('exports.pdf.analytics.title') }}</h1>
            <p>{{ __('exports.pdf.analytics.subtitle') }}</p>
        </div>
        <div class="header-right">
            <div class="business-name">{{ $businessName }}</div>
            <div class="generated">{{ __('exports.common.generated') }}: {{ $generatedAt }}</div>
        </div>
    </div>

    {{-- Period --}}
    <div class="period-bar">
        {{ __('exports.common.period') }}: <strong>{{ $dateFrom }}</strong> &mdash; <strong>{{ $dateTo }}</strong>
        @if($employeeFilter) &nbsp;&bull;&nbsp; {{ __('exports.common.employee') }}: <strong>{{ $employeeFilter }}</strong> @endif
    </div>

    {{-- Summary widgets (dompdf doesn't support CSS flex well — use a table for layout) --}}
    <table style="width:100%; margin-bottom:24px; border-collapse:separate; border-spacing:8px 0;">
        <tr>
            <td style="width:25%; background:#f8fafc; border:1px solid #e2e8f0; border-radius:8px; padding:14px 16px; text-align:center;">
                <div style="font-size:20px; font-weight:700; color:#1e293b;">{{ $totalAppointments }}</div>
                <div style="font-size:9px; font-weight:700; text-transform:uppercase; letter-spacing:0.8px; color:#94a3b8; margin-top:4px;">{{ __('exports.pdf.analytics.total_appointments') }}</div>
            </td>
            <td style="width:25%; background:#f8fafc; border:1px solid #e2e8f0; border-radius:8px; padding:14px 16px; text-align:center;">
                <div style="font-size:20px; font-weight:700; color:#1e293b;">{{ $totalConfirmed }}</div>
                <div style="font-size:9px; font-weight:700; text-transform:uppercase; letter-spacing:0.8px; color:#94a3b8; margin-top:4px;">{{ __('exports.pdf.analytics.confirmed') }}</div>
            </td>
            <td style="width:25%; background:#f8fafc; border:1px solid #e2e8f0; border-radius:8px; padding:14px 16px; text-align:center;">
                <div style="font-size:20px; font-weight:700; color:#1e293b;">{{ $totalCancelled }}</div>
                <div style="font-size:9px; font-weight:700; text-transform:uppercase; letter-spacing:0.8px; color:#94a3b8; margin-top:4px;">{{ __('exports.pdf.analytics.cancelled') }}</div>
            </td>
            <td style="width:25%; background:#f8fafc; border:1px solid #e2e8f0; border-radius:8px; padding:14px 16px; text-align:center;">
                <div style="font-size:20px; font-weight:700; color:#1e293b;">{{ number_format($totalRevenue, 2) }} {{ $currencySymbol }}</div>
                <div style="font-size:9px; font-weight:700; text-transform:uppercase; letter-spacing:0.8px; color:#94a3b8; margin-top:4px;">{{ __('exports.pdf.analytics.total_revenue') }}</div>
            </td>
        </tr>
    </table>

    {{-- Table --}}
    <p class="section-title">{{ __('exports.common.employee_breakdown') }}</p>
    <table>
        <thead>
            <tr>
                <th style="text-align:left;">{{ __('exports.pdf.analytics.employee') }}</th>
                <th style="text-align:center;">{{ __('exports.pdf.analytics.cancelled') }}</th>
                <th style="text-align:center;">{{ __('exports.pdf.analytics.pending') }}</th>
                <th style="text-align:center;">{{ __('exports.pdf.analytics.confirmed') }}</th>
                <th style="text-align:center;">{{ __('exports.pdf.analytics.revenue') }}</th>
            </tr>
        </thead>
        <tbody>
            @foreach($employeeStats as $stat)
            <tr>
                <td style="text-align:left;">{{ $stat['name'] }}</td>
                <td style="text-align:center;">{{ (int) $stat['cancelled_count'] }}</td>
                <td style="text-align:center;">{{ (int) $stat['pending_count'] }}</td>
                <td style="text-align:center;">{{ (int) $stat['confirmed_count'] }}</td>
                <td style="text-align:center;">{{ number_format((float) $stat['revenue'], 2) }} {{ $currencySymbol }}</td>
            </tr>
            @endforeach
        </tbody>
        <tfoot>
            <tr>
                <td style="text-align:left;">{{ __('exports.common.total_row') }}</td>
                <td style="text-align:center;">{{ (int) array_sum(array_column($employeeStats, 'cancelled_count')) }}</td>
                <td style="text-align:center;">{{ (int) array_sum(array_column($employeeStats, 'pending_count')) }}</td>
                <td style="text-align:center;">{{ (int) array_sum(array_column($employeeStats, 'confirmed_count')) }}</td>
                <td style="text-align:center;">{{ number_format(array_sum(array_column($employeeStats, 'revenue')), 2) }} {{ $currencySymbol }}</td>
            </tr>
        </tfoot>
    </table>

    <p class="section-title" style="margin-top:22px;">{{ __('exports.common.monthly_overview') }}</p>
    <p style="font-size:10px; color:#64748b; margin-bottom:8px;">{{ __('exports.common.monthly_overview_hint') }}</p>
    <table>
        <thead>
            <tr>
                <th style="text-align:left;">{{ __('exports.common.month') }}</th>
                <th style="text-align:center;">{{ __('exports.pdf.analytics.cancelled') }}</th>
                <th style="text-align:center;">{{ __('exports.pdf.analytics.pending') }}</th>
                <th style="text-align:center;">{{ __('exports.pdf.analytics.confirmed') }}</th>
                <th style="text-align:center;">{{ __('exports.pdf.analytics.revenue') }}</th>
            </tr>
        </thead>
        <tbody>
            @foreach($monthlyPerformance as $m)
            <tr>
                <td style="text-align:left;">{{ $m['label'] }}</td>
                <td style="text-align:center;">{{ (int) $m['cancelled'] }}</td>
                <td style="text-align:center;">{{ (int) $m['pending'] }}</td>
                <td style="text-align:center;">{{ (int) $m['confirmed'] }}</td>
                <td style="text-align:center;">{{ number_format((float) $m['revenue'], 2) }} {{ $currencySymbol }}</td>
            </tr>
            @endforeach
        </tbody>
    </table>

    {{-- Footer --}}
    <div class="footer">
        {{ __('exports.common.footer_auto') }}
    </div>

</body>
</html>
