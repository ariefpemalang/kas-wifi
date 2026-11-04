// src/utils/format.js

export function formatRupiah(nominal) {
  if (nominal === undefined || nominal === null || isNaN(nominal)) return 'Rp 0';
  return 'Rp ' + Number(nominal).toLocaleString('id-ID');
}

export function formatTanggalIndo(dateStr, includeTime = false) {
  if (!dateStr) return '-';
  const d = new Date(dateStr.replace(' ', 'T'));
  if (isNaN(d.getTime())) return dateStr;

  const tgl = String(d.getDate()).padStart(2, '0');
  const bln = String(d.getMonth() + 1).padStart(2, '0');
  const thn = d.getFullYear();
  const jam = String(d.getHours()).padStart(2, '0');
  const mnt = String(d.getMinutes()).padStart(2, '0');

  // Format hari/bulan/tahun: dd/mm/yyyy
  if (includeTime) {
    return `${tgl}/${bln}/${thn}, ${jam}:${mnt} WIB`;
  }
  return `${tgl}/${bln}/${thn}`;
}

export function formatJamIndo(dateStr) {
  if (!dateStr) return '-';
  const d = new Date(dateStr.replace(' ', 'T'));
  if (isNaN(d.getTime())) return dateStr;
  const jam = String(d.getHours()).padStart(2, '0');
  const mnt = String(d.getMinutes()).padStart(2, '0');
  return `${jam}:${mnt} WIB`;
}

export function getHariIndo(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr.replace(' ', 'T'));
  if (isNaN(d.getTime())) return '';
  const hari = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
  return hari[d.getDay()];
}

export function generateWhatsAppMessage(receipt) {
  return encodeURIComponent(
`*BUKTI PEMBAYARAN KAS WIFI*
----------------------------------------
*${receipt.shopName || 'KAS WIFI'}*
${receipt.shopAddress || ''}
----------------------------------------
No. Nota  : #${receipt.id}
Tanggal   : ${formatTanggalIndo(receipt.time, true)}
Kasir     : ${receipt.cashier || 'Kasir'}
Metode    : ${receipt.walletName || 'TUNAI'}
----------------------------------------
Item      : ${receipt.categoryName || 'Voucher WiFi'}
Keterangan: ${receipt.description || '-'}
----------------------------------------
*TOTAL    : ${formatRupiah(receipt.amount)}*
----------------------------------------
${receipt.footerNote || 'Terima kasih atas kunjungan Anda!'}
`
  );
}
