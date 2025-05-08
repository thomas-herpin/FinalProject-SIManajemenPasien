<?php

require_once 'vendor/autoload.php'; // pastikan sudah install midtrans/midtrans-php via Composer

\Midtrans\Config::$serverKey = 'SB-Mid-server-POVgPWLqPgTc6ZOihxtbB2Jz';
\Midtrans\Config::$isProduction = false; // Ganti ke true di production
\Midtrans\Config::$isSanitized = true;
\Midtrans\Config::$is3ds = true;

// Data pembayaran
$order_id = 'JANJI-' . time();
$gross_amount = 160000;

// Buat data transaksi
$params = [
  'transaction_details' => [
    'order_id' => $order_id,
    'gross_amount' => $gross_amount,
  ],
  'customer_details' => [
    'first_name' => 'Amanda',
    'last_name' => 'Putri',
    'email' => 'amanda@example.com',
    'phone' => '08123456789',
  ],
  
];

// Ambil Snap Token
$snapToken = \Midtrans\Snap::getSnapToken($params);
?>

<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Pembayaran Janji Temu</title>
  <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet"/>
  <link href="https://cdn.jsdelivr.net/npm/bootstrap-icons/font/bootstrap-icons.css" rel="stylesheet"/>
  <style>
    body { background-color: #f8f9fa; }
    .card { border: none; border-radius: 1rem; }
    .payment-method {
      border: 2px solid transparent; border-radius: 10px; padding: 12px;
      text-align: center; cursor: pointer; transition: all 0.3s ease-in-out;
      background-color: #fff;
    }
    .payment-method img { 
      max-height: 40px; 
      width: 120px; 
      object-fit: cover; 
      margin-bottom: 8px; 
    }
    .payment-method.active {
      border-color: #0d6efd; background-color: #e9f3ff;
    }
    .payment-method input { display: none; }
  </style>
</head>
<body>

<div class="container py-5">
  <div class="row justify-content-center">
    <div class="col-lg-6">
      <div class="card shadow-sm p-4">
        <h4 class="text-center mb-4">Pembayaran Janji Temu</h4>

        <div class="mb-3">
          <strong>Nama Pasien:</strong> Amanda Putri<br/>
          <strong>Dokter:</strong> dr. Andi Surya<br/>
          <strong>Tanggal & Waktu:</strong> 12 Mei 2025, 10:00 WIB
        </div>

        <div class="mb-4">
          <div class="d-flex justify-content-between">
            <span>Biaya Konsultasi</span>
            <span>Rp 150.000</span>
          </div>
          <div class="d-flex justify-content-between">
            <span>Biaya Layanan</span>
            <span>Rp 10.000</span>
          </div>
          <hr/>
          <div class="d-flex justify-content-between fw-bold">
            <span>Total Bayar</span>
            <span class="text-primary">Rp 160.000</span>
          </div>
        </div>

        <div class="mb-4">
          <h6>Pilih Metode Pembayaran</h6>
          <div class="row g-3">
            <div class="col-4">
              <label class="payment-method active">
                <input type="radio" name="payment" value="bca" checked/>
                <img src="../../assets/logo_BCA.png" alt="BCA"/>
                <div>Transfer BCA</div>
              </label>
            </div>
            <div class="col-4">
              <label class="payment-method">
                <input type="radio" name="payment" value="gopay"/>
                <img src="../../assets/logo_gopay.png" alt="GoPay"/>
                <div>GoPay</div>
              </label>
            </div>
            <div class="col-4">
              <label class="payment-method">
                <input type="radio" name="payment" value="shopeepay"/>
                <img src="../../assets/logo_shopeepay.png" alt="ShopeePay"/>
                <div>ShopeePay</div>
              </label>
            </div>
          </div>
        </div>

        <div class="form-check mb-3">
          <input class="form-check-input" type="checkbox" id="agreeTerms" required/>
          <label class="form-check-label" for="agreeTerms">
            Saya setuju dengan <a href="#">Syarat & Ketentuan</a>
          </label>
        </div>

        <button id="pay-button" class="btn btn-primary w-100 py-2">Bayar Sekarang</button>
      </div>
    </div>
  </div>
</div>

<!-- Midtrans Snap.js -->
<script src="https://app.sandbox.midtrans.com/snap/snap.js" data-client-key="SB-Mid-client-s0mgRoQg7dsmMaK2"></script>
<script>
  document.querySelectorAll('.payment-method').forEach((method) => {
    method.addEventListener('click', function () {
      document.querySelectorAll('.payment-method').forEach((m) => m.classList.remove('active'));
      this.classList.add('active');
      this.querySelector('input[type="radio"]').checked = true;
    });
  });

  document.getElementById('pay-button').addEventListener('click', function () {
    if (!document.getElementById('agreeTerms').checked) {
      alert("Silakan setujui syarat & ketentuan.");
      return;
    }

    snap.pay('<?= $snapToken ?>', {
      onSuccess: function(result) {
        // Redirect otomatis ke halaman sukses dengan order_id
        window.location.href = 'pembayaran-sukses.php?order_id=' + result.order_id;
      },
      onPending: function(result) {
        alert("Pembayaran menunggu konfirmasi.");
        console.log(result);
      },
      onError: function(result) {
        alert("Terjadi kesalahan saat pembayaran.");
        console.log(result);
      },
      onClose: function() {
        alert('Anda menutup pop-up pembayaran.');
      }
    });
  });
</script>

</body>
</html>
