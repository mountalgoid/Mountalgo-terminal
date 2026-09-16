import React, { useState } from 'react';
import { 
  X, 
  BookOpen, 
  BarChart3, 
  Layers, 
  Target, 
  Compass, 
  ShieldCheck, 
  Sparkles, 
  ArrowRight, 
  CheckCircle2, 
  Zap, 
  Sliders, 
  HelpCircle,
  TrendingUp,
  Activity
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export function LeftVolumeProfileGuideModal({ isOpen, onClose }: Props) {
  const { palette } = useTheme();
  const [activeTab, setActiveTab] = useState<'overview' | 'anatomy' | 'synergy' | 'strategies' | 'settings'>('overview');

  if (!isOpen) return null;

  return (
    <div className="fixed top-[60px] left-4 right-4 sm:left-auto bottom-4 z-[210] flex flex-col justify-start pointer-events-none animate-fadeIn">
      <div 
        className="bg-[var(--color-panel)]/95 backdrop-blur-2xl rounded-2xl shadow-2xl w-full sm:w-[560px] md:w-[620px] overflow-hidden flex flex-col h-[calc(100vh-80px)] pointer-events-auto border"
        style={{ borderColor: `${palette.poc || '#f59e0b'}80` }}
      >
        {/* Header */}
        <div className="p-4 border-b border-[var(--color-border)] flex items-center justify-between bg-[var(--color-panel)]/60">
          <div className="flex items-center gap-3">
            <div 
              className="p-2.5 rounded-xl border flex items-center justify-center"
              style={{ 
                backgroundColor: `${palette.poc || '#f59e0b'}20`, 
                borderColor: `${palette.poc || '#f59e0b'}40` 
              }}
            >
              <BarChart3 size={22} style={{ color: palette.poc || '#f59e0b' }} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  Heatmap Sub-Engine
                </span>
                <span className="text-[10px] font-mono text-cyan-400">VPVR Pro 70% VA</span>
              </div>
              <h2 className="font-bold text-white text-base sm:text-lg">
                Panduan & Pengenalan: Left Volume Profile (VPVR)
              </h2>
              <p className="text-xs text-[var(--color-text-muted)]">
                Integrasi Distribusi Volume Horizontal & Order Book Heatmap
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-[var(--color-text-muted)] hover:text-white p-2 rounded-lg hover:bg-[var(--color-panel)] cursor-pointer transition-colors"
            title="Tutup Panduan"
          >
            <X size={20} />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-1 p-2 bg-[var(--color-panel-header)]/80 border-b border-[var(--color-border)] overflow-x-auto custom-scrollbar text-xs">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'overview'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold'
                : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-panel)]'
            }`}
          >
            <BookOpen size={13} />
            <span>Pengenalan</span>
          </button>
          <button
            onClick={() => setActiveTab('anatomy')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'anatomy'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold'
                : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-panel)]'
            }`}
          >
            <Layers size={13} />
            <span>Anatomi POC & VA</span>
          </button>
          <button
            onClick={() => setActiveTab('synergy')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'synergy'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold'
                : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-panel)]'
            }`}
          >
            <Zap size={13} />
            <span>Sinergi Heatmap</span>
          </button>
          <button
            onClick={() => setActiveTab('strategies')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'strategies'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold'
                : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-panel)]'
            }`}
          >
            <Target size={13} />
            <span>3 Strategi Trading</span>
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'settings'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold'
                : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-panel)]'
            }`}
          >
            <Sliders size={13} />
            <span>Panduan Parameter</span>
          </button>
        </div>

        {/* Tab Content Body */}
        <div className="flex-1 overflow-y-auto p-5 bg-[var(--color-bg)] custom-scrollbar text-sm leading-relaxed text-[var(--color-text)] space-y-6">
          
          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-5 animate-fadeIn">
              <div className="p-4 rounded-xl border border-amber-500/30 bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent flex gap-3.5">
                <Sparkles className="text-amber-400 flex-shrink-0 mt-1" size={22} />
                <div>
                  <h3 className="font-bold text-white text-base mb-1">
                    Apa itu Left Volume Profile (VPVR) dalam Liquidity Heatmap?
                  </h3>
                  <p className="text-xs text-[var(--color-text-muted)] leading-relaxed">
                    <strong>Left Volume Profile</strong> adalah histogram horizontal berbasis harga (*Volume Profile Visible Range*) yang dirender langsung di sisi kiri panel chart secara presisi tanpa bertabrakan dengan pita matriks Liquidity Heatmap. 
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="font-bold text-cyan-400 text-sm flex items-center gap-2">
                  <Compass size={16} /> Mengapa Ditempatkan di Sisi Kiri?
                </h4>
                <p className="text-xs text-[var(--color-text-muted)]">
                  Secara arsitektur tampilan trading institusional (seperti Sierra Chart, Bookmap, dan TT Platform), penempatan Left Volume Profile memisahkan dua fungsi kognitif trader:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div className="p-3.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-panel)]/50">
                    <div className="flex items-center gap-2 text-amber-300 font-bold text-xs mb-1.5">
                      <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                      Sisi Kiri: Struktur Historis (VPVR)
                    </div>
                    <p className="text-[11px] text-[var(--color-text-muted)] leading-relaxed">
                      Menunjukkan <strong>akumulasi volume nyata yang sudah tereksekusi</strong> pada tiap tingkatan harga sepanjang jendela waktu yang sedang terlihat (*visible range*).
                    </p>
                  </div>
                  <div className="p-3.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-panel)]/50">
                    <div className="flex items-center gap-2 text-cyan-300 font-bold text-xs mb-1.5">
                      <span className="w-2 h-2 rounded-full bg-cyan-400"></span>
                      Sisi Kanan: Kedalaman Masa Depan (DOM)
                    </div>
                    <p className="text-[11px] text-[var(--color-text-muted)] leading-relaxed">
                      Menampilkan <strong>Order Book Ladder (DOM)</strong> dan antrean limit order bid/ask aktif yang bersiap dieksekusi di level harga saat ini.
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-panel)]/40 space-y-2.5">
                <h4 className="font-bold text-white text-xs uppercase tracking-wider flex items-center gap-2">
                  <CheckCircle2 size={14} className="text-emerald-400" />
                  Keunggulan Mesin Left Volume Profile Terpadu:
                </h4>
                <ul className="text-xs text-[var(--color-text-muted)] space-y-2 list-none pl-0">
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-400 font-bold">✓</span>
                    <span><strong>Presisi Node Diskrit:</strong> Membagi rentang harga menjadi bar-bar horizontal independen dengan perhitungan split volume Beli (Agresor Bid) dan Jual (Agresor Ask).</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-400 font-bold">✓</span>
                    <span><strong>Zona Nilai Otomatis (70% Value Area):</strong> Mengkalkulasi area di mana 70% transaksi pasar terjadi untuk menentukan level penerimaan *fair price*.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-400 font-bold">✓</span>
                    <span><strong>Pemisah Matriks Adaptif:</strong> Menyediakan margin batas kiri sehingga spektrum panas heatmap tidak menimpa histogram profil volume.</span>
                  </li>
                </ul>
              </div>
            </div>
          )}

          {/* TAB 2: ANATOMY */}
          {activeTab === 'anatomy' && (
            <div className="space-y-4 animate-fadeIn">
              <h3 className="font-bold text-white text-sm flex items-center gap-2 border-b border-[var(--color-border)] pb-2">
                <Layers className="text-amber-400" size={16} /> Anatomi Elemen Kunci Volume Profile
              </h3>

              {/* POC */}
              <div className="p-3.5 rounded-xl border border-amber-500/40 bg-amber-500/10 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-amber-300 text-xs flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-400 inline-block shadow-sm"></span>
                    1. POC (Point of Control)
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-400/20 text-amber-200 border border-amber-400/30">
                    Highest Traded Volume
                  </span>
                </div>
                <p className="text-xs text-[var(--color-text-muted)]">
                  Level harga tunggal dengan akumulasi volume transaksi terbesar dalam rentang chart yang terlihat. POC bertindak sebagai <strong>pusat gravitasi (magnet harga)</strong> dan support/resistance terkuat di pasar.
                </p>
                <div className="text-[11px] text-amber-200/90 font-mono bg-amber-950/40 p-2 rounded border border-amber-500/20 mt-1">
                  💡 Indikator merender garis ray emas memanjang (*POC Ray*) dan badge label harga di sumbu kanan.
                </div>
              </div>

              {/* Value Area (VAH & VAL) */}
              <div className="p-3.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-emerald-300 text-xs flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 inline-block shadow-sm"></span>
                    2. Value Area (VA 70%), VAH & VAL
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-400/20 text-emerald-200 border border-emerald-400/30">
                    Fair Value Range
                  </span>
                </div>
                <p className="text-xs text-[var(--color-text-muted)]">
                  Sesuai hukum distribusi normal statistik pasar (*Market Profile Auction Theory*), <strong>Value Area</strong> mencakup 70% total volume perdagangan:
                </p>
                <div className="grid grid-cols-2 gap-2 pt-1 text-[11px]">
                  <div className="p-2 rounded bg-[var(--color-bg)]/30 border border-emerald-500/20">
                    <strong className="text-emerald-300 block">VAH (Value Area High):</strong>
                    Batas atas harga wajar. Penolakan di atas VAH mengindikasikan harga *overbought* (mahal).
                  </div>
                  <div className="p-2 rounded bg-[var(--color-bg)]/30 border border-emerald-500/20">
                    <strong className="text-emerald-300 block">VAL (Value Area Low):</strong>
                    Batas bawah harga wajar. Penolakan di bawah VAL mengindikasikan harga *oversold* (murah).
                  </div>
                </div>
              </div>

              {/* HVN & LVN */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3.5 rounded-xl border border-blue-500/30 bg-blue-500/10 space-y-1">
                  <div className="font-bold text-blue-300 text-xs flex items-center gap-1.5">
                    <Activity size={14} /> HVN (High Volume Nodes)
                  </div>
                  <p className="text-[11px] text-[var(--color-text-muted)]">
                    Puncak-puncak node volume tebal. Menandakan area di mana trader institusi senang melakukan akumulasi/konsolidasi. Harga cenderung melambat dan bolak-balik di area ini.
                  </p>
                </div>
                <div className="p-3.5 rounded-xl border border-rose-500/30 bg-rose-500/10 space-y-1">
                  <div className="font-bold text-rose-300 text-xs flex items-center gap-1.5">
                    <Zap size={14} /> LVN (Low Volume Nodes)
                  </div>
                  <p className="text-[11px] text-[var(--color-text-muted)]">
                    Lembah tipis di antara node volume. Menandakan zona penolakan harga (*rejection*) di mana harga meluncur cepat tanpa hambatan (*slippage highway*).
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: SYNERGY */}
          {activeTab === 'synergy' && (
            <div className="space-y-4 animate-fadeIn">
              <h3 className="font-bold text-white text-sm flex items-center gap-2 border-b border-[var(--color-border)] pb-2">
                <Zap className="text-amber-400" size={16} /> Sinergi: Liquidity Heatmap vs Left Volume Profile
              </h3>

              <p className="text-xs text-[var(--color-text-muted)]">
                Kombinasi antara Heatmap dan Left Volume Profile adalah salah satu keunggulan terbesar sistem trading order flow modern. Keduanya menjawab dua pertanyaan fundamental yang berbeda:
              </p>

              <div className="overflow-hidden rounded-xl border border-[var(--color-border)]">
                <table className="w-full text-left text-[11px]">
                  <thead className="bg-[var(--color-panel-header)] text-white border-b border-[var(--color-border)]">
                    <tr>
                      <th className="p-2.5 font-bold">Parameter</th>
                      <th className="p-2.5 text-cyan-300 font-bold">Liquidity Heatmap</th>
                      <th className="p-2.5 text-amber-300 font-bold">Left Volume Profile</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--color-border)] text-[var(--color-text-muted)]">
                    <tr>
                      <td className="p-2.5 font-semibold text-white">Jenis Pesanan</td>
                      <td className="p-2.5 text-cyan-200">Resting Limit Orders (Bid/Ask)</td>
                      <td className="p-2.5 text-amber-200">Executed Market Orders</td>
                    </tr>
                    <tr>
                      <td className="p-2.5 font-semibold text-white">Dimensi Waktu</td>
                      <td className="p-2.5">Ekspektasi Masa Depan / Niat Likuiditas</td>
                      <td className="p-2.5">Fakta Historis Transaksi Nyata</td>
                    </tr>
                    <tr>
                      <td className="p-2.5 font-semibold text-white">Visual Utama</td>
                      <td className="p-2.5">Pita Spektrum Panas & Resting Walls</td>
                      <td className="p-2.5">Horizontal Bar Histogram + POC Ray</td>
                    </tr>
                    <tr>
                      <td className="p-2.5 font-semibold text-white">Fungsi Utama</td>
                      <td className="p-2.5">Mendeteksi Spoofing, Iceberg & Dinding Pertahanan</td>
                      <td className="p-2.5">Mendeteksi Fair Value, Value Area & Level Akumulasi</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* The Golden Confluence */}
              <div className="p-4 rounded-xl border border-amber-500/40 bg-gradient-to-br from-amber-500/20 via-amber-500/5 to-transparent space-y-2">
                <div className="flex items-center gap-2 text-amber-300 font-bold text-xs">
                  <Sparkles size={16} />
                  <span>The Institutional "Golden Confluence"</span>
                </div>
                <p className="text-xs text-[var(--color-text-muted)] leading-relaxed">
                  Ketika Anda melihat <strong>Dinding Likuiditas Tebal (Liquidity Wall) pada Heatmap</strong> berada tepat di level harga yang sama dengan <strong>Point of Control (POC)</strong> atau batas <strong>VAH/VAL</strong> pada Left Volume Profile, ini adalah konfirmasi institusional tingkat tertinggi.
                </p>
                <div className="p-2.5 rounded-lg bg-[var(--color-bg)]/40 border border-amber-500/30 text-[11px] text-amber-200 font-mono">
                  🎯 Sinyal: Level tersebut memiliki riwayat transaksi terpadat di masa lalu DAN sekaligus dijaga oleh modal limit order aktif institusi saat ini.
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: STRATEGIES */}
          {activeTab === 'strategies' && (
            <div className="space-y-4 animate-fadeIn">
              <h3 className="font-bold text-white text-sm flex items-center gap-2 border-b border-[var(--color-border)] pb-2">
                <Target className="text-amber-400" size={16} /> 3 Strategi Trading Institusional
              </h3>

              {/* Strategy 1 */}
              <div className="p-3.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-panel)]/50 space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-emerald-400 text-xs flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-300 flex items-center justify-center text-[10px]">1</span>
                    Value Area Mean Reversion (Rotasi ke POC)
                  </h4>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono">High Win-Rate</span>
                </div>
                <p className="text-xs text-[var(--color-text-muted)]">
                  Ketika harga menembus keluar dari Value Area (di atas VAH atau di bawah VAL) namun gagal mempertahankan momentum karena volume pasar menipis:
                </p>
                <div className="bg-[var(--color-bg)]/30 p-2.5 rounded text-[11px] space-y-1 text-[var(--color-text-muted)]">
                  <div><strong>Kondisi:</strong> Harga reject di luar VAL, candle ditutup kembali masuk ke dalam Value Area.</div>
                  <div><strong>Entri:</strong> Buy ketika harga kembali menyeberangi VAL ke atas.</div>
                  <div><strong>Target:</strong> Ambil profit bertahap di POC (Point of Control) dan VAH.</div>
                  <div><strong>Stop Loss:</strong> Tempatkan beberapa tick di bawah swing low penolakan di luar VAL.</div>
                </div>
              </div>

              {/* Strategy 2 */}
              <div className="p-3.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-panel)]/50 space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-cyan-400 text-xs flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-300 flex items-center justify-center text-[10px]">2</span>
                    Value Area Breakout & LVN Accelerator
                  </h4>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-mono">Trend Following</span>
                </div>
                <p className="text-xs text-[var(--color-text-muted)]">
                  Ketika harga menembus VAH atau VAL disertai lonjakan volume delta agresif dan langsung memasuki zona Low Volume Node (LVN):
                </p>
                <div className="bg-[var(--color-bg)]/30 p-2.5 rounded text-[11px] space-y-1 text-[var(--color-text-muted)]">
                  <div><strong>Kondisi:</strong> Candle breakout bervolume besar ditutup di atas VAH, dan Heatmap menunjukkan dinding resistensi di atasnya telah terlahap (*absorbed*).</div>
                  <div><strong>Aksi:</strong> Masuk posisi Long mengikuti arah breakout. Harga akan bergerak sangat kencang melintasi LVN menuju HVN berikutnya.</div>
                  <div><strong>Stop Loss:</strong> Tepat di bawah level VAH yang ditembus (re-test buffer).</div>
                </div>
              </div>

              {/* Strategy 3 */}
              <div className="p-3.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-panel)]/50 space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-amber-400 text-xs flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-300 flex items-center justify-center text-[10px]">3</span>
                    Naked POC Retest & Wall Absorption Play
                  </h4>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-mono">Confluence Sniper</span>
                </div>
                <p className="text-xs text-[var(--color-text-muted)]">
                  Level POC dari sesi atau rentang sebelumnya yang belum pernah disentuh (*Naked POC*) menyimpan likuiditas tertahan yang sangat besar:
                </p>
                <div className="bg-[var(--color-bg)]/30 p-2.5 rounded text-[11px] space-y-1 text-[var(--color-text-muted)]">
                  <div><strong>Setup:</strong> Pantau garis ray POC yang memanjang ke masa depan. Saat harga mendekatinya, perhatikan apakah limit wall di Heatmap menyerap pesanan market order (*absorption nodes*).</div>
                  <div><strong>Eksekusi:</strong> Lakukan entri reaksi bounce dengan target kembali ke level ekstrim sebelumnya.</div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: SETTINGS GUIDE */}
          {activeTab === 'settings' && (
            <div className="space-y-4 animate-fadeIn">
              <h3 className="font-bold text-white text-sm flex items-center gap-2 border-b border-[var(--color-border)] pb-2">
                <Sliders className="text-amber-400" size={16} /> Panduan Lengkap Pengaturan Parameter
              </h3>

              <div className="space-y-3 text-xs">
                <div className="p-3 rounded-lg bg-[var(--color-panel)]/60 border border-[var(--color-border)]">
                  <div className="font-bold text-cyan-300 mb-1 flex items-center justify-between">
                    <span>1. Lebar Panel Profil (Width %)</span>
                    <span className="text-[10px] font-mono text-gray-400">Default: 18% (10% - 35%)</span>
                  </div>
                  <p className="text-[var(--color-text-muted)] text-[11px]">
                    Mengatur seberapa lebar histogram horizontal di sisi kiri layar. Lebar yang lebih tinggi (22-28%) memberikan detail resolusi node yang lebih jelas, sedangkan lebar ramping (12-16%) memberikan ruang maksimal bagi pergerakan candlestick.
                  </p>
                </div>

                <div className="p-3 rounded-lg bg-[var(--color-panel)]/60 border border-[var(--color-border)]">
                  <div className="font-bold text-amber-300 mb-1 flex items-center justify-between">
                    <span>2. Value Area Percentage (%)</span>
                    <span className="text-[10px] font-mono text-gray-400">Standar: 70% (50% - 90%)</span>
                  </div>
                  <p className="text-[var(--color-text-muted)] text-[11px]">
                    Persentase volume total yang dihitung untuk menentukan batas VAH dan VAL. Standar internasional Chicago Board of Trade (CBOT) adalah 70% (1 standar deviasi dari distribusi normal).
                  </p>
                </div>

                <div className="p-3 rounded-lg bg-[var(--color-panel)]/60 border border-[var(--color-border)]">
                  <div className="font-bold text-emerald-300 mb-1 flex items-center justify-between">
                    <span>3. Mode Pewarnaan (Color Mode)</span>
                    <span className="text-[10px] font-mono text-gray-400">Dual Split vs Net Delta</span>
                  </div>
                  <p className="text-[var(--color-text-muted)] text-[11px]">
                    <strong>Dual Split (Buy/Sell):</strong> Membagi tiap bar volume menjadi dua warna (hijau untuk buyer agresif, merah untuk seller agresif).<br />
                    <strong>Net Delta:</strong> Memberikan warna bar berdasarkan selisih neto volume agresor (gradien hijau neon jika positif, merah tua jika negatif).
                  </p>
                </div>

                <div className="p-3 rounded-lg bg-[var(--color-panel)]/60 border border-[var(--color-border)]">
                  <div className="font-bold text-purple-300 mb-1 flex items-center justify-between">
                    <span>4. Opasitas Profil (Opacity %)</span>
                    <span className="text-[10px] font-mono text-gray-400">Default: 85%</span>
                  </div>
                  <p className="text-[var(--color-text-muted)] text-[11px]">
                    Tingkat transparansi bar volume di sisi kiri. Opasitas yang seimbang menjaga agar latar belakang chart dan grid tetap terlihat nyaman di mata trader.
                  </p>
                </div>

                <div className="p-3 rounded-lg bg-[var(--color-panel)]/60 border border-[var(--color-border)]">
                  <div className="font-bold text-rose-300 mb-1 flex items-center justify-between">
                    <span>5. Garis Ray POC & VAH/VAL</span>
                    <span className="text-[10px] font-mono text-gray-400">Toggle On/Off</span>
                  </div>
                  <p className="text-[var(--color-text-muted)] text-[11px]">
                    Mengaktifkan atau menyembunyikan garis horizontal yang ditarik melintasi chart dari level POC (garis emas solid), VAH (garis putus-putus atas), dan VAL (garis putus-putus bawah).
                  </p>
                </div>

                <div className="p-3 rounded-lg bg-[var(--color-panel)]/60 border border-[var(--color-border)]">
                  <div className="font-bold text-blue-300 mb-1 flex items-center justify-between">
                    <span>6. Deteksi HVN & LVN & Label Angka Volume</span>
                    <span className="text-[10px] font-mono text-gray-400">High/Low Nodes & Text</span>
                  </div>
                  <p className="text-[var(--color-text-muted)] text-[11px]">
                    Memberikan border sorotan pada High Volume Nodes, arsiran khusus pada Low Volume Nodes (vakum), serta mencetak angka volume numerik ringkas (misal: 12.4K, 1.2M) langsung di ujung tiap node.
                  </p>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="p-3 bg-[var(--color-panel-header)] border-t border-[var(--color-border)] flex items-center justify-between text-xs">
          <span className="text-[var(--color-text-muted)] font-mono text-[11px]">
            Volume Profile Engine v2.4 • Order Flow Parity
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg font-bold text-black bg-amber-400 hover:bg-amber-300 transition-all cursor-pointer shadow-sm text-xs"
          >
            Mengerti & Tutup
          </button>
        </div>
      </div>
    </div>
  );
}
