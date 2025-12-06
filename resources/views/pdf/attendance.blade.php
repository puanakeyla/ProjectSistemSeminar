<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Laporan Kehadiran Seminar</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            font-size: 12px;
            line-height: 1.6;
            margin: 20px;
        }
        .header {
            text-align: center;
            margin-bottom: 30px;
            border-bottom: 2px solid #333;
            padding-bottom: 10px;
        }
        .header h1 {
            margin: 0;
            font-size: 18px;
            font-weight: bold;
        }
        .header p {
            margin: 5px 0;
            font-size: 11px;
        }
        .info-section {
            margin-bottom: 20px;
        }
        .info-row {
            display: flex;
            margin-bottom: 5px;
        }
        .info-label {
            width: 150px;
            font-weight: bold;
        }
        .info-value {
            flex: 1;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 15px;
        }
        th, td {
            border: 1px solid #333;
            padding: 8px;
            text-align: left;
        }
        th {
            background-color: #f0f0f0;
            font-weight: bold;
        }
        .section-title {
            font-size: 14px;
            font-weight: bold;
            margin-top: 25px;
            margin-bottom: 10px;
            border-bottom: 1px solid #666;
            padding-bottom: 5px;
        }
        .footer {
            margin-top: 40px;
            font-size: 10px;
            text-align: center;
            color: #666;
        }
        .signature-section {
            margin-top: 40px;
            display: flex;
            justify-content: space-between;
        }
        .signature-box {
            width: 45%;
            text-align: center;
        }
        .signature-line {
            margin-top: 60px;
            border-top: 1px solid #333;
            padding-top: 5px;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>LAPORAN KEHADIRAN SEMINAR</h1>
        <p>Sistem Informasi Seminar - Universitas</p>
        <p>Dicetak pada: {{ $generated_at }}</p>
    </div>

    <div class="info-section">
        <h2 class="section-title">Informasi Seminar</h2>
        <div class="info-row">
            <div class="info-label">Judul Seminar:</div>
            <div class="info-value">{{ $seminar->judul }}</div>
        </div>
        <div class="info-row">
            <div class="info-label">Jenis Seminar:</div>
            <div class="info-value">{{ $seminar->getJenisSeminarDisplay() }}</div>
        </div>
        <div class="info-row">
            <div class="info-label">Mahasiswa:</div>
            <div class="info-value">{{ $seminar->mahasiswa->name }} ({{ $seminar->mahasiswa->npm }})</div>
        </div>
        <div class="info-row">
            <div class="info-label">Tanggal:</div>
            <div class="info-value">{{ $schedule->waktu_mulai->format('d F Y') }}</div>
        </div>
        <div class="info-row">
            <div class="info-label">Waktu:</div>
            <div class="info-value">{{ $schedule->waktu_mulai->format('H:i') }} - {{ $schedule->waktu_mulai->addMinutes($schedule->durasi_menit ?? 90)->format('H:i') }} WIB</div>
        </div>
        <div class="info-row">
            <div class="info-label">Ruangan:</div>
            <div class="info-value">{{ $schedule->ruang }}</div>
        </div>
    </div>

    <div class="info-section">
        <h2 class="section-title">Tim Dosen</h2>
        <table>
            <thead>
                <tr>
                    <th style="width: 5%">No</th>
                    <th style="width: 40%">Nama Dosen</th>
                    <th style="width: 25%">Peran</th>
                    <th style="width: 15%">Status</th>
                    <th style="width: 15%">Waktu Check-in</th>
                </tr>
            </thead>
            <tbody>
                @php
                    $dosenList = [
                        ['name' => $seminar->pembimbing1->name, 'role' => 'Pembimbing 1'],
                    ];
                    if ($seminar->pembimbing2) {
                        $dosenList[] = ['name' => $seminar->pembimbing2->name, 'role' => 'Pembimbing 2'];
                    }
                    if ($seminar->penguji) {
                        $dosenList[] = ['name' => $seminar->penguji->name, 'role' => 'Penguji'];
                    }
                @endphp

                @foreach ($dosenList as $index => $dosen)
                    @php
                        $attendance = $dosen_attendances->firstWhere('dosen.name', $dosen['name']);
                    @endphp
                    <tr>
                        <td style="text-align: center">{{ $index + 1 }}</td>
                        <td>{{ $dosen['name'] }}</td>
                        <td>{{ $dosen['role'] }}</td>
                        <td>{{ $attendance ? $attendance->getStatusDisplay() : 'Belum Check-in' }}</td>
                        <td>{{ $attendance && $attendance->confirmed_at ? $attendance->confirmed_at->format('H:i') : '-' }}</td>
                    </tr>
                @endforeach
            </tbody>
        </table>
    </div>

    <div class="info-section">
        <h2 class="section-title">Kehadiran Mahasiswa ({{ $mahasiswa_attendances->count() }} orang)</h2>
        <table>
            <thead>
                <tr>
                    <th style="width: 5%">No</th>
                    <th style="width: 15%">NPM</th>
                    <th style="width: 40%">Nama Mahasiswa</th>
                    <th style="width: 20%">Waktu Absen</th>
                    <th style="width: 20%">Metode</th>
                </tr>
            </thead>
            <tbody>
                @forelse ($mahasiswa_attendances as $index => $attendance)
                    <tr>
                        <td style="text-align: center">{{ $index + 1 }}</td>
                        <td>{{ $attendance->mahasiswa->npm }}</td>
                        <td>{{ $attendance->mahasiswa->name }}</td>
                        <td>{{ $attendance->waktu_absen ? $attendance->waktu_absen->format('H:i') : '-' }}</td>
                        <td style="text-align: center">{{ strtoupper($attendance->metode_absen ?? $attendance->metode) }}</td>
                    </tr>
                @empty
                    <tr>
                        <td colspan="5" style="text-align: center; font-style: italic; color: #666;">
                            Belum ada mahasiswa yang melakukan absensi
                        </td>
                    </tr>
                @endforelse
            </tbody>
        </table>
    </div>

    <div class="signature-section">
        <div class="signature-box">
            <p>Mengetahui,<br>Koordinator Seminar</p>
            <div class="signature-line">
                (&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;)
            </div>
        </div>
        <div class="signature-box">
            <p>Admin Sistem</p>
            <div class="signature-line">
                (&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;)
            </div>
        </div>
    </div>

    <div class="footer">
        <p>Dokumen ini dicetak secara otomatis oleh Sistem Informasi Seminar</p>
        <p>Untuk informasi lebih lanjut, hubungi administrator sistem</p>
    </div>
</body>
</html>
