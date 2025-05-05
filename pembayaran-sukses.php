<?php
// Autoload Composer dan Midtrans
require_once 'vendor/autoload.php';

\Midtrans\Config::$serverKey = 'SB-Mid-server-POVgPWLqPgTc6ZOihxtbB2Jz';
\Midtrans\Config::$isProduction = false; // true jika sudah produksi

// Ambil order_id dari URL
$order_id = $_GET['order_id'] ?? null;

if (!$order_id) {
    die("Order ID tidak ditemukan.");
}

try {
    // Ambil status transaksi dari Midtrans
    $status = \Midtrans\Transaction::status($order_id);
} catch (Exception $e) {
    die("Terjadi kesalahan: " . $e->getMessage());
}
?>

<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <title>Konfirmasi Pembayaran</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet"/>
</head>
<body class="bg-light">
<div class="container py-5">
    <div class="card mx-auto shadow-sm p-4" style="max-width: 600px;">
        <h3 class="text-center mb-4">Pembayaran Berhasil</h3>
        <p class="text-success text-center fw-bold">Terima kasih, pembayaran Anda telah berhasil diproses.</p>
        
        <ul class="list-group mb-4">
            <li class="list-group-item"><strong>Order ID:</strong> <?= htmlspecialchars($status->order_id) ?></li>
            <li class="list-group-item"><strong>Status Transaksi:</strong> <?= htmlspecialchars($status->transaction_status) ?></li>
            <li class="list-group-item"><strong>Waktu Transaksi:</strong> <?= htmlspecialchars($status->transaction_time) ?></li>
            <li class="list-group-item"><strong>Metode Pembayaran:</strong> <?= htmlspecialchars($status->payment_type) ?></li>
            <li class="list-group-item"><strong>Total Bayar:</strong> Rp <?= number_format($status->gross_amount, 0, ',', '.') ?></li>
        </ul>

        <div class="text-center">
            <a href="user-dashboard.html" class="btn btn-primary">Selanjutnya</a>
        </div>
    </div>
</div>
</body>
</html>
