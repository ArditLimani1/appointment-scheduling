<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Employee Analytics</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: DejaVu Sans, sans-serif;
            font-size: 11px;
            color: #1e293b;
            background: #fff;
            padding: 28px 32px;
        }
        .header {
            display: table;
            width: 100%;
            margin-bottom: 22px;
            padding-bottom: 14px;
            border-bottom: 2px solid #1e293b;
        }
        .header-left, .header-right { display: table-cell; vertical-align: top; }
        .header-right { text-align: right; }
        .header h1 { font-size: 20px; font-weight: 700; }
        .header p { font-size: 10px; color: #64748b; margin-top: 4px; }
        .business-name { font-size: 12px; font-weight: 700; }
        .generated { font-size: 9px; color: #94a3b8; margin-top: 3px; }
        .period-bar {
            background: #f1f5f9;
            border-radius: 6px;
            padding: 8px 12px;
            margin-bottom: 18px;
            font-size: 10px;
            color: #475569;
        }
        .period-bar strong { color: #1e293b; }
        .section-title {
            font-size: 10px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.7px;
            color: #64748b;
            margin: 16px 0 6px 0;
        }
        table { width: 100%; border-collapse: collapse; margin-bottom: 8px; }
        thead th {
            background: #1e293b;
            color: #fff;
            font-size: 8px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            padding: 7px 8px;
            text-align: left;
        }
        tbody td {
            padding: 7px 8px;
            font-size: 10px;
            border-bottom: 1px solid #f1f5f9;
        }
        tbody tr:nth-child(even) { background: #f8fafc; }
        .footer {
            margin-top: 20px;
            padding-top: 10px;
            border-top: 1px solid #e2e8f0;
            font-size: 8px;
            color: #94a3b8;
            text-align: center;
        }
    </style>
</head>
<body>

    <div class="header">
        <div class="header-left">
            <h1>Employee Analytics</h1>
            <p>Personal performance for {{ $employeeName }}</p>
        </div>
        <div class="header-right">
            <div class="business-name">{{ $businessName }}</div>
            <div class="generated">Generated: {{ $generatedAt }}</div>
        </div>
    </div>

    <div class="period-bar">
        Period: <strong>{{ $dateFrom }}</strong> &mdash; <strong>{{ $dateTo }}</strong>
        &nbsp;&bull;&nbsp; Service: <strong>{{ $serviceFilter }}</strong>
    </div>

    <table style="width:100%; margin-bottom:18px; border-collapse:separate; border-spacing:6px 0;">
        <tr>
            <td style="width:20%; background:#f8fafc; border:1px solid #e2e8f0; border-radius:6px; padding:10px 8px; text-align:center;">
                <div style="font-size:16px; font-weight:700;">{{ (int) $summary['total_appointments'] }}</div>
                <div style="font-size:8px; font-weight:700; text-transform:uppercase; color:#94a3b8; margin-top:3px;">Total</div>
            </td>
            <td style="width:20%; background:#f8fafc; border:1px solid #e2e8f0; border-radius:6px; padding:10px 8px; text-align:center;">
                <div style="font-size:16px; font-weight:700; color:#166534;">{{ (int) $summary['confirmed_count'] }}</div>
                <div style="font-size:8px; font-weight:700; text-transform:uppercase; color:#94a3b8; margin-top:3px;">Confirmed</div>
            </td>
            <td style="width:20%; background:#f8fafc; border:1px solid #e2e8f0; border-radius:6px; padding:10px 8px; text-align:center;">
                <div style="font-size:16px; font-weight:700; color:#991b1b;">{{ (int) $summary['cancelled_count'] }}</div>
                <div style="font-size:8px; font-weight:700; text-transform:uppercase; color:#94a3b8; margin-top:3px;">Cancelled</div>
            </td>
            <td style="width:20%; background:#f8fafc; border:1px solid #e2e8f0; border-radius:6px; padding:10px 8px; text-align:center;">
                <div style="font-size:16px; font-weight:700; color:#92400e;">{{ (int) $summary['pending_count'] }}</div>
                <div style="font-size:8px; font-weight:700; text-transform:uppercase; color:#94a3b8; margin-top:3px;">Pending</div>
            </td>
            <td style="width:20%; background:#1e293b; border-radius:6px; padding:10px 8px; text-align:center;">
                <div style="font-size:15px; font-weight:700; color:#fff;">{{ number_format((float) $summary['revenue'], 2) }} {{ $currencySymbol }}</div>
                <div style="font-size:8px; font-weight:700; text-transform:uppercase; color:#cbd5e1; margin-top:3px;">Revenue</div>
            </td>
        </tr>
    </table>

    <p class="section-title">By service</p>
    <table>
        <thead>
            <tr>
                <th>Service</th>
                <th style="text-align:center;">Cancelled</th>
                <th style="text-align:center;">Pending</th>
                <th style="text-align:center;">Confirmed</th>
                <th style="text-align:center;">Revenue</th>
            </tr>
        </thead>
        <tbody>
            @forelse($serviceStats as $s)
            <tr>
                <td>{{ $s['service_name'] }}</td>
                <td style="text-align:center;">{{ (int) $s['cancelled_count'] }}</td>
                <td style="text-align:center;">{{ (int) $s['pending_count'] }}</td>
                <td style="text-align:center;">{{ (int) $s['confirmed_count'] }}</td>
                <td style="text-align:center;">{{ number_format((float) $s['revenue'], 2) }} {{ $currencySymbol }}</td>
            </tr>
            @empty
            <tr><td colspan="5" style="text-align:center; color:#64748b;">No appointments in this period</td></tr>
            @endforelse
        </tbody>
    </table>

    <p class="section-title">Monthly overview</p>
    <table>
        <thead>
            <tr>
                <th>Month</th>
                <th style="text-align:center;">Cancelled</th>
                <th style="text-align:center;">Pending</th>
                <th style="text-align:center;">Confirmed</th>
                <th style="text-align:center;">Revenue</th>
            </tr>
        </thead>
        <tbody>
            @foreach($monthlyPerformance as $m)
            <tr>
                <td>{{ $m['label'] }}</td>
                <td style="text-align:center;">{{ (int) $m['cancelled'] }}</td>
                <td style="text-align:center;">{{ (int) $m['pending'] }}</td>
                <td style="text-align:center;">{{ (int) $m['confirmed'] }}</td>
                <td style="text-align:center;">{{ number_format((float) $m['revenue'], 2) }} {{ $currencySymbol }}</td>
            </tr>
            @endforeach
        </tbody>
    </table>

    <div class="footer">
        This report reflects your appointments only. Revenue is based on confirmed appointments.
    </div>
</body>
</html>
