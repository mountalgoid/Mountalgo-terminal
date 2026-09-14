import { X, BookOpen, BarChart3, TrendingUp, Layers, Activity, Zap, Scale, Palette, Eye, Sparkles } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export function CandleCvdGuideModal({ isOpen, onClose }: Props) {
  const { palette } = useTheme();

  if (!isOpen) return null;

  return (
    <div className="fixed top-[60px] left-4 right-4 sm:left-auto bottom-4 z-[200] flex flex-col justify-start pointer-events-none animate-fadeIn">
      <div
        className="bg-[var(--color-panel)]/95 backdrop-blur-2xl rounded-2xl shadow-2xl w-full sm:w-[540px] md:w-[600px] overflow-hidden flex flex-col h-[calc(100vh-80px)] pointer-events-auto"
        style={{ border: `1px solid ${palette.bull}60` }}
      >
        {/* Header */}
        <div className="p-4 border-b border-[var(--color-border)] flex items-center justify-between bg-[var(--color-panel)]/50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-500/20 rounded-lg">
              <BookOpen size={20} className="text-amber-400" />
            </div>
            <div>
              <h2 className="font-bold text-white text-lg">Panduan: CVD Candles</h2>
              <p className="text-xs text-[var(--color-text-muted)]">CVD Candles</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-[var(--color-text-muted)] hover:text-white p-2 rounded-lg hover:bg-[var(--color-panel)] cursor-pointer transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-0 bg-[var(--color-bg)] custom-scrollbar text-sm leading-relaxed text-[var(--color-text)]">
          <div className="p-6 space-y-8">
            {/* Intro */}
            <section>
      <h3 className="text-xl font-bold text-[var(--color-text)] mb-3 flex items-center gap-2">
        <BarChart3 className="text-amber-400" /> Apa itu CVD Candles?
      </h3>
      <p className="mb-4 text-[var(--color-text-muted)]">
                <strong className="text-[var(--color-text)]">CVD Candles</strong> adalah
                indikator <em>order flow</em> tingkat lanjut yang mengakumulasi delta (selisih volume pembeli vs penjual) dari setiap candle
                secara berurutan dan merendernya dalam format lilin (candlestick). Berbeda dengan CVD Oscillator biasa yang menampilkan akumulasi delta pada <em>seluruh
                sesi</em>, CVD Candles membangun struktur lilinnya <strong>per candle</strong> sehingga Anda
                bisa melihat dengan presisi institusional sejak kapan tekanan beli/jual mulai mendominasi.
              </p>
              <div className="bg-blue-950/30 border border-blue-900/50 p-4 rounded-lg flex gap-3">
                <Sparkles className="text-blue-400 flex-shrink-0 mt-0.5" size={18} />
                <p className="text-blue-100 text-xs">
                  <strong className="text-blue-300">Konsep Utama:</strong> Setiap candle berkontribusi satu nilai delta
                  (buy − sell). Nilai-nilai ini dijumlahkan secara berjalan (kumulatif) sehingga garis yang dihasilkan
                  mencerminkan <em>tekanan agresif bersih</em> yang sebenarnya terjadi di pasar, bukan sekadar arah harga.
                </p>
              </div>
            </section>

            {/* Where it renders */}
            <section>
              <h3 className="text-xl font-bold text-[var(--color-text)] mb-3 flex items-center gap-2">
                <Layers className="text-amber-400" /> Lokasi Tampilan
              </h3>
              <p className="text-[var(--color-text-muted)] mb-3">
                Saat diaktifkan, panel <strong className="text-amber-400">CVD Candles</strong> dirender sebagai
                sub-window tersendiri <strong>tepat di bawah panel CVD Oscillator</strong>. Tinggi panel diatur lewat pengaturan{' '}
                <em>Pane Height</em> (persentase dari tinggi chart).
              </p>
              <div className="bg-[var(--color-panel-header)]/80 p-4 rounded-lg border border-[var(--color-border)]">
                <h5 className="font-bold text-[var(--color-text)] text-xs mb-2">📊 Isi Panel:</h5>
                <ul className="list-disc pl-5 space-y-1 text-xs text-[var(--color-text-muted)]">
                  <li><strong>CVD Candlesticks:</strong> Representasi lilin delta (hijau = delta bersih positif, merah = negatif).</li>
                  <li><strong>Garis Kumulatif (Line):</strong> Garis halus yang mencerminkan aliran akumulasi bersih.</li>
                  <li><strong>SMA Overlay:</strong> Filter tren institusional untuk menyaring noise mikro.</li>
                  <li><strong>Penanda Divergensi:</strong> ▲ Bullish & ▼ Bearish Divergence otomatis.</li>
                </ul>
              </div>
            </section>

            {/* Advanced settings */}
            <section>
              <h3 className="text-xl font-bold text-[var(--color-text)] border-b border-[var(--color-border)] pb-2 mb-4 flex items-center gap-2">
                <Palette className="text-amber-400" /> Pengaturan Advanced
              </h3>

              <div className="space-y-4">
                <div className="space-y-2">
                  <h4 className="text-base font-bold text-cyan-400 flex items-center gap-2">
                    <Scale size={16} /> Smoothing Length
                  </h4>
                  <p className="text-xs text-[var(--color-text-muted)]">
                    Nilai 1 = garis mentah tanpa smoothing. Nilai lebih besar (misal 5–10) menghaluskan garis kumulatif
                    sehingga tren jangka pendek lebih mudah dibaca, namun sinyal menjadi sedikit lebih lambat.
                  </p>
                </div>

                <div className="space-y-2">
                  <h4 className="text-base font-bold text-cyan-400 flex items-center gap-2">
                    <Activity size={16} /> Style Tampilan
                  </h4>
                  <p className="text-xs text-[var(--color-text-muted)]">
                    <strong>Candle</strong> = Lilin delta high-fidelity (Rekomendasi). <strong>Line</strong> = Garis kumulatif institusional. 
                    <strong>Histogram</strong> = Bar per candle klasik.
                  </p>
                </div>

                <div className="space-y-2">
                  <h4 className="text-base font-bold text-cyan-400 flex items-center gap-2">
                    <Eye size={16} /> Show SMA / Zero Line / Divergence
                  </h4>
                  <ul className="list-disc pl-5 space-y-1 text-xs text-[var(--color-text-muted)]">
                    <li><strong>SMA:</strong> overlay rata-rata bergerak (panjang default 14) sebagai filter tren.</li>
                    <li><strong>Zero Line:</strong> garis putus-putus di tengah panel sebagai referensi seimbangnya tekanan beli vs jual.</li>
                    <li><strong>Divergence:</strong> penanda otomatis saat harga membuat HH/LL tetapi CVD membuat LH/HL (hanya pada separuh terakhir tampilan agar sinyal tetap segar).</li>
                  </ul>
                </div>

                <div className="space-y-2">
                  <h4 className="text-base font-bold text-cyan-400 flex items-center gap-2">
                    <Zap size={16} /> Warna & Ukuran
                  </h4>
                  <p className="text-xs text-[var(--color-text-muted)]">
                    <strong>Line Color</strong> untuk garis kumulatif, <strong>Hist Bull/Bear</strong> untuk bar histogram
                    positif/negatif, <strong>SMA Color</strong> untuk overlay, <strong>Line Width</strong> untuk ketebalan
                    garis, dan <strong>Pane Height %</strong> untuk tinggi panel relatif terhadap tinggi chart.
                  </p>
                </div>
              </div>
            </section>

            {/* How to read */}
            <section>
              <h3 className="text-xl font-bold text-[var(--color-text)] border-b border-[var(--color-border)] pb-2 mb-4 flex items-center gap-2">
                <TrendingUp className="text-amber-400" /> Cara Membaca Sinyal
              </h3>
              <div className="space-y-4">
                <div className="bg-emerald-950/20 border border-emerald-900/30 p-4 rounded-lg">
                  <h5 className="font-bold text-emerald-400 text-xs mb-2">🟢 Tekanan Beli Dominan (Bullish)</h5>
                  <ul className="list-disc pl-5 space-y-1 text-xs text-emerald-100">
                    <li>Histogram sebagian besar positif (di atas garis nol).</li>
                    <li>Garis kumulatif bergerak naik secara konsisten — <em>buyer agresif</em> mengendalikan pasar.</li>
                    <li>Harga pullback kecil tetapi CVD tidak turun dalam: penyerapan jual → peluang akumulasi.</li>
                  </ul>
                </div>
                <div className="bg-red-950/20 border border-red-900/30 p-4 rounded-lg">
                  <h5 className="font-bold text-red-400 text-xs mb-2">🔴 Tekanan Jual Dominan (Bearish)</h5>
                  <ul className="list-disc pl-5 space-y-1 text-xs text-red-100">
                    <li>Histogram sebagian besar negatif (di bawah garis nol).</li>
                    <li>Garis kumulatif bergerak turun — <em>seller agresif</em> mengendalikan pasar.</li>
                    <li>Harga rally kecil tetapi CVD tidak naik dalam: distribusi → peluang short.</li>
                  </ul>
                </div>
                <div className="bg-amber-950/20 border border-amber-900/30 p-4 rounded-lg">
                  <h5 className="font-bold text-amber-400 text-xs mb-2">⚡ Divergensi Harga vs CVD</h5>
                  <ul className="list-disc pl-5 space-y-1 text-xs text-amber-100">
                    <li><strong>Bearish Divergence (▼):</strong> harga membuat Higher High tetapi CVD membuat Lower High — momentum beli melemah, waspadai pembalikan turun.</li>
                    <li><strong>Bullish Divergence (▲):</strong> harga membuat Lower Low tetapi CVD membuat Higher Low — tekanan jual habis, waspadai pembalikan naik.</li>
                  </ul>
                </div>
              </div>
            </section>

            {/* Best practices */}
            <section className="bg-emerald-950/20 border border-emerald-900/30 p-5 rounded-xl">
              <h3 className="text-lg font-bold text-emerald-400 mb-3 flex items-center gap-2">
                <Zap size={18} /> Best Practice & Strategi
              </h3>
              <ol className="list-decimal pl-5 space-y-3 text-xs text-emerald-100">
                <li>
                  <strong>Konfirmasi dengan Harga:</strong> Jangan trade hanya dari CVD Candles. Tunggu konfluensi — misalnya
                  garis kumulatif naik + harga breakout dari level resistance (atau volume spike) sebelum entry Long.
                </li>
                <li>
                  <strong>Gunakan SMA sebagai Filter:</strong> Saat garis kumulatif berada di atas SMA-nya, fokus cari sinyal
                  beli; saat di bawah SMA-nya, fokus cari sinyal jual. Ini menyaring banyak sinyal palsu di pasar ranging.
                </li>
                <li>
                  <strong>Divergensi = Early Warning:</strong> Penanda divergensi muncul lebih dulu daripada perubahan
                  harga. Gunakan untuk mempersiapkan reversal, tetapi konfirmasi dengan aksi harga (rejection wick, double
                  top/bottom) sebelum eksekusi.
                </li>
                <li>
                  <strong>Sesuaikan Smoothing dengan Timeframe:</strong> Timeframe kecil (M1/M5) cocok dengan smoothing
                  rendah (1–3) untuk reaksi cepat; timeframe besar (H1/H4) lebih bersih dengan smoothing 5–10.
                </li>
                <li>
                  <strong>Kombinasi dengan CVD Oscillator:</strong> Gunakan CVD Oscillator untuk melihat akumulasi
                  keseluruhan sesi, dan CVD Candles untuk menemukan <em>di candle mana</em> tekanan mulai berbalik. Ketika
                  keduanya searah, konfidensi sinyal jauh lebih tinggi.
                </li>
              </ol>
            </section>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[var(--color-border)] bg-[var(--color-panel)] flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 rounded-lg font-bold text-white shadow-lg transition-transform hover:scale-105 active:scale-95"
            style={{ backgroundColor: palette.bull }}
          >
            Mengerti & Tutup
          </button>
        </div>
      </div>
    </div>
  );
}