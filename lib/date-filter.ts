import { parse, isValid, addDays, isWithinInterval, startOfDay, endOfDay } from 'date-fns';
import { id } from 'date-fns/locale';

/**
 * Parsing tanggal "Omnivora" - Memakan segala jenis format.
 */
export function parseFlexibleDate(dateInput: string | number | any): Date | null {
  if (!dateInput) return null;

  // 1. HANDLE EXCEL SERIAL NUMBER
  // Jika input berupa angka (misal: 45617), konversi ke Date JS
  // (Excel base date: Dec 30, 1899)
  if (typeof dateInput === 'number') {
      return new Date(Math.round((dateInput - 25569) * 86400 * 1000));
  }

  let str = String(dateInput).trim().toLowerCase();

  // 2. CLEANING (Pembersihan Noise)
  // Hapus nama hari (Indonesia & Inggris) karena sering typo & tidak butuh untuk parsing tanggal
  const noiseWords = [
      'senin', 'selasa', 'rabu', 'kamis', 'jumat', 'jum\'at', 'sabtu', 'minggu',
      'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday',
      'pukul', 'jam', 'wib', 'wita', 'wit'
  ];
  
  noiseWords.forEach(word => {
      // Replace kata utuh saja
      const regex = new RegExp(`\\b${word}\\b`, 'g');
      str = str.replace(regex, '');
  });

  // Normalisasi karakter pemisah
  str = str
    .replace(/[,]/g, '')        // Hapus koma
    .replace(/[.-]/g, '/')      // Ubah titik (.) dan strip (-) jadi slash (/)
    .replace(/\s+/g, ' ')       // Ubah spasi ganda jadi satu spasi
    .trim();

  // Contoh transformasi sejauh ini:
  // "Jumat, 21-11-2025 Pukul 13.00" -> "21/11/2025 13/00"
  // "03.01.25" -> "03/01/25"

  // 3. DAFTAR FORMAT (Prioritas)
  // date-fns tokens: d (hari), M (bulan angka), MMM (bulan nama), y (tahun), yy (tahun 2 digit)
  const formats = [
    // Format Angka
    'd/M/yyyy',       // 21/11/2025, 3/1/2025
    'd/M/yy',         // 21/11/25, 03/01/25
    'yyyy/M/d',       // 2025/11/21 (ISO like)
    
    // Format Teks (Indonesia) - Perhatikan 'str' sudah dinormalisasi jadi spasi/slash
    'd MMMM yyyy',    // 21 november 2025
    'd MMM yyyy',     // 21 nov 2025
    'd MMMM yy',      // 21 november 25
    
    // Format Campuran (jika normalisasi slash gagal di spasi)
    'd MMMM yyyy HH:mm', 
    'd/M/yyyy HH:mm',
  ];

  // 4. EKSEKUSI PARSING
  for (const fmt of formats) {
    // Gunakan locale Indonesia agar 'Agustus', 'Desember' terbaca
    const d = parse(str.split(' ')[0], fmt, new Date(), { locale: id });
    
    // Jika gagal, coba parse string utuh (mungkin ada jam yang nempel)
    if (!isValid(d)) {
        const dFull = parse(str, fmt, new Date(), { locale: id });
        if (isValid(dFull) && isYearReasonable(dFull)) return dFull;
    } else if (isYearReasonable(d)) {
        return d;
    }
  }

  // 5. FALLBACK TERAKHIR (Native JS Date)
  // Bagus untuk format Inggris standard (e.g. "2025-01-03")
  const dNative = new Date(dateInput);
  if (isValid(dNative) && isYearReasonable(dNative)) return dNative;

  return null;
}

// Helper validasi tahun (mencegah angka acak dianggap tahun)
function isYearReasonable(d: Date): boolean {
    const year = d.getFullYear();
    return year > 2020 && year < 2030; // Sesuaikan range TA (misal 2020-2030)
}

/**
 * Filter data untuk 7 hari ke depan + hari ini.
 * Mencari tanggal secara otomatis di semua kolom jika tidak dimapping.
 */
export function filterDataForUpcomingWeek(data: any[], dateColumnIndex: number = -1): any[] {
  const today = startOfDay(new Date());
  const nextWeek = endOfDay(addDays(today, 7));

  return data.filter(row => {
    let rowDate: Date | null = null;

    // Opsi 1: Kolom Tanggal sudah ditentukan (Mapping)
    if (dateColumnIndex !== -1) {
        // Cek kolom tersebut, atau kolom sekitarnya (kadang user salah hitung index 0-based)
        const val = row[dateColumnIndex];
        rowDate = parseFlexibleDate(val);
    }

    // Opsi 2: Auto-Detect (Cari di semua sel baris ini)
    // Jika Opsi 1 gagal atau null, kita cari "brute force" di baris tersebut
    if (!rowDate) {
      const cells = Array.isArray(row) ? row : Object.values(row);
      for (const cell of cells) {
        const d = parseFlexibleDate(cell);
        // Kita hanya ambil jika tanggalnya MASUK AKAL (ada dalam range filter)
        // Ini untuk menghindari salah deteksi angka "1" sebagai tanggal "1900-01-01" dsb
        if (d && isWithinInterval(d, { start: today, end: nextWeek })) {
          rowDate = d;
          break; 
        }
      }
    }

    // Final Check
    if (rowDate) {
      return isWithinInterval(rowDate, { start: today, end: nextWeek });
    }

    return false;
  });
}

export function filterDataForToday(data: any[]): any[] {
    return filterDataForUpcomingWeek(data); 
}
