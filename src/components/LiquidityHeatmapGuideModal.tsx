import React, { useState } from 'react';
import { X, BookOpen, Flame, Activity, Zap, Shield, TrendingUp, Layers, Crosshair, Sparkles, BarChart3 } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export function LiquidityHeatmapGuideModal({ isOpen, onClose }: Props) {
  const { palette } = useTheme();
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed top-[60px] left-4 right-4 sm:left-auto bottom-4 z-[200] flex flex-col justify-start pointer-events-none animate-fadeIn">
      <div 
        className="bg-[var(--color-panel)]/85 backdrop-blur-2xl rounded-2xl shadow-[0_0_35px_rgba(0,0,0,0.2)] w-full sm:w-[540px] md:w-[600px] overflow-hidden flex flex-col h-[calc(100vh-80px)] pointer-events-auto border border-[var(--color-border)]/40 relative"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 via-transparent to-amber-500/5 pointer-events-none" />
        {/* Header */}
        <div className="relative p-4 border-b border-[var(--color-border)]/30 flex items-center justify-between bg-[var(--color-panel)]/40 backdrop-blur-xl">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-500/20 rounded-lg border border-amber-500/30">
              <BookOpen size={20} className="text-amber-400" />
            </div>
            <div>
              <h2 className="font-bold text-white text-lg">Panduan Lengkap & Strategi: Institutional Liquidity Heatmap</h2>
              <p className="text-xs text-[var(--color-text-muted)]">Bookmap Engine & Order Flow Profiler</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-[var(--color-text-muted)] hover:text-white p-2 rounded-lg hover:bg-white/5 cursor-pointer transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="relative flex-1 overflow-y-auto p-0 bg-transparent custom-scrollbar text-sm leading-relaxed text-[var(--color-text)]">
          
          <div className="p-6 space-y-8">
            {/* Intro */}
            <section>
              <h3 className="text-xl font-bold text-[var(--color-text)] mb-3 flex items-center gap-2">
                <Flame className="text-amber-400" /> Apa itu Liquidity Heatmap?
              </h3>
              <p className="mb-4 text-[var(--color-text-muted)]">
                Liquidity Heatmap (sering disebut Bookmap) adalah visualisasi 3 dimensi dari Limit Order Book (LOB) yang memberikan pandangan sinar-X ke dalam struktur pasar. Berbeda dengan chart candlestick tradisional yang hanya menampilkan harga masa lalu (Open, High, Low, Close), heatmap menampilkan niat (intent) pelaku pasar sebelum transaksi terjadi.
              </p>
              <div className="bg-blue-950/30 border border-blue-900/50 p-4 rounded-lg flex gap-3">
                <Sparkles className="text-blue-400 flex-shrink-0 mt-0.5" size={18} />
                <p className="text-blue-100 text-xs">
                  <strong className="text-blue-300">Konsep Utama:</strong> Semakin terang warna pada sebuah level harga (merah/kuning terang), semakin besar jumlah likuiditas (Limit Order) yang bersandar di level tersebut. Ini menciptakan "tembok" yang dapat menahan harga atau menarik harga seperti magnet.
                </p>
              </div>
            </section>

            {/* Core Features & Strategies */}
            <section className="space-y-6">
              <h3 className="text-xl font-bold text-[var(--color-text)] border-b border-[var(--color-border)] pb-2">Fitur Utama & Studi Kasus</h3>

              {/* 1. Liquidity Walls & Magnet */}
              <div className="space-y-3">
                <h4 className="text-base font-bold text-cyan-400 flex items-center gap-2">
                  <Layers size={16} /> 1. Liquidity Walls (Tembok Likuiditas) & Efek Magnet
                </h4>
                <p className="text-[var(--color-text-muted)]">
                  Level dengan likuiditas tinggi sering bertindak sebagai <strong>Support/Resistance dinamis</strong> yang jauh lebih akurat daripada garis teknikal biasa. Harga cenderung tertarik ke area likuiditas tinggi (Liquidity Magnet) karena algoritma institusi mencari likuiditas untuk mengeksekusi pesanan besar mereka tanpa menyebabkan slippage besar.
                </p>
                <div className="bg-[var(--color-panel-header)]/80 p-4 rounded-lg border border-[var(--color-border)]">
                  <h5 className="font-bold text-[var(--color-text)] text-xs mb-2">🎯 Best Practice & Studi Kasus: Reversal Trade</h5>
                  <ul className="list-disc pl-5 space-y-1 text-xs text-[var(--color-text-muted)]">
                    <li><strong>Kasus:</strong> Harga Bitcoin naik mendekati level $65,000, dan Anda melihat garis terang yang sangat tebal (Liquidity Wall) terbentuk di level tersebut pada heatmap.</li>
                    <li><strong>Aksi:</strong> Level ini berpotensi kuat menjadi resistance. Masuk posisi Short ketika harga mendekati dinding likuiditas dan mulai terlihat "Absorption" (harga tertahan).</li>
                    <li><strong>Penempatan Stop Loss:</strong> Tempatkan SL sedikit di atas dinding likuiditas. Jika dinding tembus (atau ditarik/spoofed), momentum akan berbalik kuat (breakout).</li>
                  </ul>
                </div>
              </div>

              {/* 2. Spoofing */}
              <div className="space-y-3">
                <h4 className="text-base font-bold text-cyan-400 flex items-center gap-2">
                  <Shield size={16} /> 2. Spoofing & Manipulasi Order Book
                </h4>
                <p className="text-[var(--color-text-muted)]">
                  Spoofing terjadi ketika entitas besar menempatkan limit order masif untuk menciptakan ilusi tekanan beli/jual, namun mereka <strong>menarik (membatalkan)</strong> order tersebut sebelum dieksekusi. Tujuannya adalah menakut-nakuti trader retail untuk memindahkan harga ke arah yang mereka inginkan.
                </p>
                <div className="bg-[var(--color-panel-header)]/80 p-4 rounded-lg border border-[var(--color-border)]">
                  <h5 className="font-bold text-[var(--color-text)] text-xs mb-2">🎯 Best Practice & Studi Kasus: Menghindari Jebakan Breakout</h5>
                  <ul className="list-disc pl-5 space-y-1 text-xs text-[var(--color-text-muted)]">
                    <li><strong>Visual Heatmap:</strong> Anda melihat dinding likuiditas tebal tiba-tiba muncul dan menghilang sesaat sebelum harga menyentuhnya (garis putus-putus pada heatmap).</li>
                    <li><strong>Aksi:</strong> Jika Anda melihat dinding penahan harga ditarik, jangan gunakan level itu sebagai support. Waspadai manipulasi; jika order ditarik, harga kemungkinan akan menembus (break) level tersebut.</li>
                  </ul>
                </div>
              </div>

              {/* 3. Absorption */}
              <div className="space-y-3">
                <h4 className="text-base font-bold text-cyan-400 flex items-center gap-2">
                  <Zap size={16} /> 3. Liquidity Absorption (Penyerapan) & Exhaustion
                </h4>
                <p className="text-[var(--color-text-muted)]">
                  Absorption terjadi ketika trader agresif (Market Order) mencoba menembus level harga, namun semua pesanan mereka "diserap" oleh Limit Order pasif institusi.
                </p>
                <div className="bg-[var(--color-panel-header)]/80 p-4 rounded-lg border border-[var(--color-border)]">
                  <h5 className="font-bold text-[var(--color-text)] text-xs mb-2">🎯 Best Practice & Studi Kasus: Trading Exhaustion</h5>
                  <ul className="list-disc pl-5 space-y-1 text-xs text-[var(--color-text-muted)]">
                    <li><strong>Visual Heatmap:</strong> Anda melihat Volume Bubbles yang sangat besar di area harga yang sama, namun harga tidak bergerak maju. Bubble besar menabrak dinding likuiditas terang, tetapi dinding tidak jebol.</li>
                    <li><strong>Aksi:</strong> Ini adalah sinyal Exhaustion (kelelahan). Market order agresif telah habis diserap. Bersiaplah untuk mengambil posisi ke arah sebaliknya (Reversal) karena likuiditas pasif (Iceberg orders) memenangkan pertarungan.</li>
                  </ul>
                </div>
              </div>

              {/* 4. Vacuum */}
              <div className="space-y-3">
                <h4 className="text-base font-bold text-cyan-400 flex items-center gap-2">
                  <Activity size={16} /> 4. Liquidity Vacuums (Zona Kosong) & Slippage
                </h4>
                <p className="text-[var(--color-text-muted)]">
                  Liquidity Vacuum adalah area di mana order book sangat tipis (warna gelap pada heatmap). Di area ini, harga dapat bergerak sangat cepat dan drastis dengan volume transaksi yang kecil karena tidak ada penahan (resistance/support).
                </p>
                <div className="bg-[var(--color-panel-header)]/80 p-4 rounded-lg border border-[var(--color-border)]">
                  <h5 className="font-bold text-[var(--color-text)] text-xs mb-2">🎯 Best Practice & Studi Kasus: Fast Market</h5>
                  <ul className="list-disc pl-5 space-y-1 text-xs text-[var(--color-text-muted)]">
                    <li><strong>Kasus:</strong> Setelah rilis berita NFP, Anda melihat zona gelap yang luas terbentuk di bawah harga saat ini.</li>
                    <li><strong>Aksi:</strong> Hindari menempatkan stop loss ketat di zona vacuum, karena Anda akan mengalami slippage ekstrem. Sebaliknya, jika harga mulai memasuki zona vacuum, Anda dapat menunggangi momentum breakout yang cepat (Fast Market).</li>
                  </ul>
                </div>
              </div>

              {/* 5. Liquidity Sweep */}
              <div className="space-y-3">
                <h4 className="text-base font-bold text-cyan-400 flex items-center gap-2">
                  <Crosshair size={16} /> 5. Swept Liquidity & Stop-Run (Liquidity Sweep)
                </h4>
                <p className="text-[var(--color-text-muted)]">
                  Liquidity Sweep terjadi ketika harga dengan cepat menembus area dengan kumpulan stop loss (biasanya di atas High atau di bawah Low sebelumnya), menyapu likuiditas tersebut, lalu berbalik arah dengan tajam.
                </p>
                <div className="bg-[var(--color-panel-header)]/80 p-4 rounded-lg border border-[var(--color-border)]">
                  <h5 className="font-bold text-[var(--color-text)] text-xs mb-2">🎯 Best Practice & Studi Kasus: Menangkap Stop-Run</h5>
                  <ul className="list-disc pl-5 space-y-1 text-xs text-[var(--color-text-muted)]">
                    <li><strong>Visual Heatmap:</strong> Anda melihat dinding likuiditas tipis yang mewakili kumpulan stop loss tertembus dengan cepat oleh spike volume besar, dan dinding likuiditas baru segera muncul menahan harga untuk terus melaju.</li>
                    <li><strong>Aksi:</strong> Tunggu harga kembali masuk ke dalam range sebelumnya setelah sweep. Ini adalah setup probabilitas tinggi (sering disebut turtle soup) untuk trading reversal mengikuti arah institusi yang baru saja mengisi pesanan mereka.</li>
                  </ul>
                </div>
              </div>

              {/* 6. Slippage Simulator */}
              <div className="space-y-3">
                <h4 className="text-base font-bold text-cyan-400 flex items-center gap-2">
                  <Zap size={16} /> 6. Slippage Simulator & Market Order Impact
                </h4>
                <p className="text-[var(--color-text-muted)]">
                  Fitur ini mensimulasikan dampak harga dari eksekusi Market Order berukuran besar secara instan, dengan menghitung kedalaman order book nyata di berbagai level harga.
                </p>
                <div className="bg-[var(--color-panel-header)]/80 p-4 rounded-lg border border-[var(--color-border)]">
                  <h5 className="font-bold text-[var(--color-text)] text-xs mb-2">🎯 Best Practice & Studi Kasus: Eksekusi Ukuran Besar</h5>
                  <ul className="list-disc pl-5 space-y-1 text-xs text-[var(--color-text-muted)]">
                    <li><strong>Kasus:</strong> Anda ingin mengeksekusi posisi senilai $1 Juta dengan Market Order di pasar berlikuiditas rendah.</li>
                    <li><strong>Aksi:</strong> Gunakan Slippage Simulator untuk melihat sampai level harga mana order Anda akan "menyapu" order book. Jika slippage diprediksi lebih dari 0.5%, pertimbangkan menggunakan Iceberg Order (TWAP/VWAP) atau Limit Order pasif alih-alih Market Order.</li>
                  </ul>
                </div>
              </div>

              {/* 7. Crosshair Inspector & FIFO */}
              <div className="space-y-3">
                <h4 className="text-base font-bold text-cyan-400 flex items-center gap-2">
                  <Activity size={16} /> 7. Crosshair Level Inspector & FIFO Queue
                </h4>
                <p className="text-[var(--color-text-muted)]">
                  Menganalisis antrean (queue) di setiap level harga. Aturan FIFO (First-In, First-Out) menentukan prioritas eksekusi order; order yang ditempatkan lebih awal akan dieksekusi lebih dulu.
                </p>
                <div className="bg-[var(--color-panel-header)]/80 p-4 rounded-lg border border-[var(--color-border)]">
                  <h5 className="font-bold text-[var(--color-text)] text-xs mb-2">🎯 Best Practice & Studi Kasus: Estimasi Antrean Eksekusi</h5>
                  <ul className="list-disc pl-5 space-y-1 text-xs text-[var(--color-text-muted)]">
                    <li><strong>Kasus:</strong> Anda menempatkan Limit Order pada dinding likuiditas yang tebal.</li>
                    <li><strong>Aksi:</strong> Gunakan inspektur crosshair untuk melihat seberapa besar order book mendahului order Anda. Jika antrean terlalu panjang dan harga mendekat dengan momentum tinggi, Anda berisiko tidak terisi (unfilled) sebelum harga berbalik.</li>
                  </ul>
                </div>
              </div>

              {/* 8. GEX Options Greeks */}
              <div className="space-y-3">
                <h4 className="text-base font-bold text-cyan-400 flex items-center gap-2">
                  <TrendingUp size={16} /> 8. Option Gamma Exposure (GEX) & Dealer Greeks
                </h4>
                <p className="text-[var(--color-text-muted)]">
                  Melapiskan data Options Market Maker (Dealer) ke atas heatmap, termasuk level Call Wall, Put Wall, dan Zero Gamma Flip. Ketika Dealer "Short Gamma", mereka harus menjual saat pasar turun dan membeli saat pasar naik (menciptakan volatilitas tinggi).
                </p>
                <div className="bg-[var(--color-panel-header)]/80 p-4 rounded-lg border border-[var(--color-border)]">
                  <h5 className="font-bold text-[var(--color-text)] text-xs mb-2">🎯 Best Practice & Studi Kasus: Level Magnet Magnetik Gamma</h5>
                  <ul className="list-disc pl-5 space-y-1 text-xs text-[var(--color-text-muted)]">
                    <li><strong>Visual Heatmap:</strong> Level Call Wall dan Put Wall akan sering sejajar dengan dinding likuiditas tebal.</li>
                    <li><strong>Aksi:</strong> Jika harga menembus level Zero Gamma Flip ke bawah (Negative Gamma Environment), antisipasi volatilitas dan rentang (range) harga yang lebih lebar. Jika harga berada di atasnya (Positive Gamma), ekspektasikan pergerakan mean-reverting (cenderung kembali ke rata-rata).</li>
                  </ul>
                </div>
              </div>

              {/* 9. Hawkes Process */}
              <div className="space-y-3">
                <h4 className="text-base font-bold text-cyan-400 flex items-center gap-2">
                  <Shield size={16} /> 9. Hawkes Flash-Crash Early Warning Radar
                </h4>
                <p className="text-[var(--color-text-muted)]">
                  Menggunakan model matematika "Self-Exciting Point Process" untuk mendeteksi anomali kecepatan eksekusi order (order arrival rate) yang tidak wajar, yang sering mendahului flash-crash atau pergerakan algoritmik instan.
                </p>
                <div className="bg-[var(--color-panel-header)]/80 p-4 rounded-lg border border-[var(--color-border)]">
                  <h5 className="font-bold text-[var(--color-text)] text-xs mb-2">🎯 Best Practice & Studi Kasus: Deteksi Dini Algoritma Predatori</h5>
                  <ul className="list-disc pl-5 space-y-1 text-xs text-[var(--color-text-muted)]">
                    <li><strong>Kasus:</strong> Radar menunjukkan lonjakan rasio Hawkes di atas ambang batas kritis di tengah pasar yang tenang.</li>
                    <li><strong>Aksi:</strong> Ini menandakan aktivitas bot HFT (High Frequency Trading) yang saling merespons (cascade). Segera perketat Stop Loss atau kurangi ukuran posisi, karena volatilitas ekstrem akan segera terjadi dalam hitungan detik.</li>
                  </ul>
                </div>
              </div>

              {/* 10. Almgren-Chriss */}
              <div className="space-y-3">
                <h4 className="text-base font-bold text-cyan-400 flex items-center gap-2">
                  <Layers size={16} /> 10. Almgren-Chriss Optimal Execution
                </h4>
                <p className="text-[var(--color-text-muted)]">
                  Kerangka matematis untuk menemukan keseimbangan optimal antara biaya transaksi (market impact/slippage) dan risiko volatilitas ketika mengeksekusi order blok yang sangat besar.
                </p>
                <div className="bg-[var(--color-panel-header)]/80 p-4 rounded-lg border border-[var(--color-border)]">
                  <h5 className="font-bold text-[var(--color-text)] text-xs mb-2">🎯 Best Practice & Studi Kasus: Eksekusi Institusional Trajectory</h5>
                  <ul className="list-disc pl-5 space-y-1 text-xs text-[var(--color-text-muted)]">
                    <li><strong>Visual Heatmap:</strong> Anda akan melihat kurva optimal eksekusi (Front-loaded vs Back-loaded) di overlay chart.</li>
                    <li><strong>Aksi:</strong> Berguna bagi fund manager untuk membagi eksekusi besar dalam horizon waktu (Time Horizon) yang efisien, guna meminimalkan jejak pasar sambil menghindari risiko pasar berubah arah sebelum order selesai terisi penuh.</li>
                  </ul>
                </div>
              </div>

              {/* 11. Cross-Exchange Arbitrage */}
              <div className="space-y-3">
                <h4 className="text-base font-bold text-cyan-400 flex items-center gap-2">
                  <Sparkles size={16} /> 11. Consolidated Cross-Exchange Matrix
                </h4>
                <p className="text-[var(--color-text-muted)]">
                  Menggabungkan feed order book dari berbagai bursa (Binance, Bybit, Coinbase, dll) untuk membentuk satu Consolidated BBO (Best Bid Offer) dan mengidentifikasi ketidakseimbangan likuiditas antar platform.
                </p>
                <div className="bg-[var(--color-panel-header)]/80 p-4 rounded-lg border border-[var(--color-border)]">
                  <h5 className="font-bold text-[var(--color-text)] text-xs mb-2">🎯 Best Practice & Studi Kasus: Arbitrase Mikro & BBO Leader</h5>
                  <ul className="list-disc pl-5 space-y-1 text-xs text-[var(--color-text-muted)]">
                    <li><strong>Kasus:</strong> Terjadi ledakan likuiditas besar (Spoofing) di Coinbase, tetapi tidak terlihat di Binance.</li>
                    <li><strong>Aksi:</strong> Gunakan informasi ini untuk menilai sentimen agregat. Seringkali satu bursa (leader) akan bergerak lebih dulu (price discovery) mendahului bursa lain (laggard), memberikan keunggulan milidetik untuk masuk ke pasar.</li>
                  </ul>
                </div>
              </div>

              {/* 12. Volume Bubbles & Whale Clusters */}
              <div className="space-y-3">
                <h4 className="text-base font-bold text-cyan-400 flex items-center gap-2">
                  <Activity size={16} /> 12. Interactive Volume Bubbles & Dynamic Pulsating Whale Clusters (🐋)
                </h4>
                <p className="text-[var(--color-text-muted)]">
                  Bubble (gelembung) merepresentasikan eksekusi <strong>Market Order</strong> agresif. Ketika terdeteksi anomali volume institusional di atas ambang batas (contohnya &gt; $100K atau 2.2x volume rata-rata), sistem secara otomatis mengaktifkan <strong>Whale Bubble Logic</strong>:
                </p>
                <div className="bg-[var(--color-panel-header)]/80 p-4 rounded-lg border border-[var(--color-border)] space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                    <div className="bg-cyan-950/20 p-2.5 rounded border border-cyan-500/20">
                      <strong className="text-cyan-300 block mb-1">🌊 Gelombang Kejut Sonar (Sonar Shockwave):</strong>
                      <span className="text-[var(--color-text-muted)]">Riak sonar konsentris berdenyut harmonik di sekeliling bubble untuk menyorot klaster volume whale secara real-time.</span>
                    </div>
                    <div className="bg-amber-950/20 p-2.5 rounded border border-amber-500/20">
                      <strong className="text-amber-300 block mb-1">⚡ Braket Berlian Absorpsi (Absorption Diamond):</strong>
                      <span className="text-[var(--color-text-muted)]">Muncul saat volume masif terabsorpsi di dekat dinding likuiditas pasif tanpa mampu menembusnya.</span>
                    </div>
                    <div className="bg-purple-950/20 p-2.5 rounded border border-purple-500/20">
                      <strong className="text-purple-300 block mb-1">✦ Sinar Kardinal Mega Whale (Cardinal Beams):</strong>
                      <span className="text-[var(--color-text-muted)]">Marker empat arah khusus untuk transaksi kaliber raksasa (&gt; $1M+ atau Z-Score &gt; 2.8σ).</span>
                    </div>
                    <div className="bg-emerald-950/20 p-2.5 rounded border border-emerald-500/20">
                      <strong className="text-emerald-300 block mb-1">🔔 Peringatan Audio Sonar (`WHALE_PING`):</strong>
                      <span className="text-[var(--color-text-muted)]">Suara sonar sub-frekuensi terdengar saat terdeteksi transaksi paus segar di candle aktif.</span>
                    </div>
                  </div>

                  <h5 className="font-bold text-[var(--color-text)] text-xs pt-1">🎯 Best Practice & Studi Kasus: Konfirmasi Breakout vs Fakeout</h5>
                  <ul className="list-disc pl-5 space-y-1 text-xs text-[var(--color-text-muted)]">
                    <li><strong>Breakout Valid:</strong> Rentetan bubble besar terus bermunculan searah dengan pergerakan harga menembus dinding (Liquidity Wall) hingga level tersebut rata (likuiditas habis).</li>
                    <li><strong>Fakeout / Absorption:</strong> Bubble berukuran masif menghantam dinding likuiditas (ditandai braket berlian kuning), tetapi harga tertahan dan dinding tidak runtuh. Ini menandakan <em>Smart Money</em> sedang mengabsorpsi <em>market order</em> yang masuk. Siapkan posisi reversal.</li>
                    <li><strong>Arahkan Crosshair:</strong> Sentuh atau arahkan kursor ke bubble whale untuk memunculkan HUD Inspector: VWAP, Net Delta, Buy/Sell Ratio, Z-Score, dan nilai Notional USD.</li>
                  </ul>
                </div>
              </div>

              {/* 13. Liquidation Cascade Radar */}
              <div className="space-y-3">
                <h4 className="text-base font-bold text-amber-400 flex items-center gap-2">
                  <Zap size={16} /> 13. Real-Time Liquidation Cascade & Stop-Hunt Predictive Radar
                </h4>
                <p className="text-[var(--color-text-muted)]">
                  Memetakan klaster likuidasi pasar derivatif (leverage 100x, 50x, 25x, 10x) yang terkonsentrasi di atas dan di bawah harga pasar. Level likuidasi ini bertindak sebagai bahan bakar (fuel) momentum instan saat tersentuh.
                </p>
                <div className="bg-[var(--color-panel-header)]/80 p-4 rounded-lg border border-[var(--color-border)]">
                  <h5 className="font-bold text-[var(--color-text)] text-xs mb-2">🎯 Best Practice & Studi Kasus: Stop-Run Flush & Squeeze Entry</h5>
                  <ul className="list-disc pl-5 space-y-1 text-xs text-[var(--color-text-muted)]">
                    <li><strong>Kasus:</strong> Radar menunjukkan klaster likuidasi masif 100x / 50x Short Liquidation Pool berjarak 0.5% di atas resistensi swing.</li>
                    <li><strong>Aksi:</strong> Antisipasi "Short Squeeze Flush". Saat harga menembus klaster, volume spike ekstrem akan terpicu secara otomatis. Ambil take-profit tepat saat likuidasi terisi penuh, atau siapkan fade entry jika terjadi penolakan instan.</li>
                  </ul>
                </div>
              </div>

              {/* 14. Sub-Tick Micro Price Vector */}
              <div className="space-y-3">
                <h4 className="text-base font-bold text-cyan-400 flex items-center gap-2">
                  <Crosshair size={16} /> 14. High-Frequency Sub-Tick Micro Price Action Vector
                </h4>
                <p className="text-[var(--color-text-muted)]">
                  Melacak dinamika pergerakan harga intra-bar secara sub-tick dengan vektor gradien dan glowing trajectory pointer. Memungkinkan trader membaca arah momentum mikro sebelum bar candlestick selesai ditutup. <strong>Menampilkan garis solid pada wick candle yang menggambarkan jejak fluktuasi harga mikroskopis (High-Frequency Action). Sangat berguna untuk mendeteksi <em>micro-volatility</em>.</strong>
                </p>
                <div className="bg-[var(--color-panel-header)]/80 p-4 rounded-lg border border-[var(--color-border)]">
                  <h5 className="font-bold text-[var(--color-text)] text-xs mb-2">🎯 Best Practice: Precision Tick-Level Execution</h5>
                  <ul className="list-disc pl-5 space-y-1 text-xs text-[var(--color-text-muted)]">
                    <li><strong>Kasus:</strong> Terlihat vektor harga mikro berbelok tajam ke atas dengan pulsa neon kuning di dekat resting bid wall.</li>
                    <li><strong>Aksi:</strong> Konfirmasi langsung untuk entry posisi beli tanpa perlu menunggu penutupan candle 1m/5m, meminimalkan slippage dan memaksimalkan rasio Risk/Reward.</li>
                  </ul>
                </div>
              </div>

              {/* 15. CVD Divergence Trajectory Beams */}
              <div className="space-y-3">
                <h4 className="text-base font-bold text-cyan-400 flex items-center gap-2">
                  <TrendingUp size={16} /> 15. Cumulative Volume Delta (CVD) Divergence Trajectory Beams
                </h4>
                <p className="text-[var(--color-text-muted)]">
                  Menampilkan garis putus-putus diagonal yang menghubungkan titik <em>swing high/low</em> untuk melacak divergensi antara pergerakan harga dan Cumulative Volume Delta (CVD) secara <em>real-time</em>.
                </p>
                <div className="bg-[var(--color-panel-header)]/80 p-4 rounded-lg border border-[var(--color-border)]">
                  <h5 className="font-bold text-[var(--color-text)] text-xs mb-2">🎯 Best Practice & Studi Kasus: Deteksi Absorption dan Exhaustion</h5>
                  <ul className="list-disc pl-5 space-y-1 text-xs text-[var(--color-text-muted)]">
                    <li><strong>Absorption (Penyerapan):</strong> Jika harga mencetak *Lower Low* (LL) namun CVD mencetak *Higher Low* (HL), ini mengindikasikan tekanan jual diserap oleh *limit order* pembeli (Bullish Divergence). Bersiap mencari peluang Long.</li>
                    <li><strong>Exhaustion (Kelelahan):</strong> Jika harga mencetak *Higher High* (HH) namun CVD mencetak *Lower High* (LH), momentum *market buy* kehabisan tenaga (Bearish Divergence). Waspada terhadap potensi pembalikan arah (Short).</li>
                  </ul>
                </div>
              </div>

              {/* 16. Left Volume Profile (VPVR) & POC Confluence */}
              <div className="space-y-3">
                <h4 className="text-base font-bold text-amber-400 flex items-center gap-2">
                  <BarChart3 size={16} /> 16. Left Volume Profile (VPVR Horizontal Nodes, POC & 70% Value Area)
                </h4>
                <p className="text-[var(--color-text-muted)]">
                  Mengintegrasikan mesin <strong>Volume Profile Visible Range (VPVR)</strong> langsung di sisi kiri panel heatmap. Menampilkan distribusi volume yang sudah tereksekusi pada tiap level harga secara horizontal bersama garis ray emas POC (*Point of Control*) dan batas 70% *Value Area* (VAH/VAL).
                </p>
                <div className="bg-[var(--color-panel-header)]/80 p-4 rounded-lg border border-[var(--color-border)]">
                  <h5 className="font-bold text-[var(--color-text)] text-xs mb-2">🎯 Best Practice: Institutional Golden Confluence</h5>
                  <ul className="list-disc pl-5 space-y-1 text-xs text-[var(--color-text-muted)]">
                    <li><strong>Confluence Level:</strong> Ketika *Resting Limit Wall* tebal pada Heatmap berada sejajar dengan garis ray *Point of Control (POC)* atau *VAH/VAL* pada Left Volume Profile, level ini memiliki validitas tertinggi di pasar karena memadukan niat modal pasif aktif saat ini dengan volume transaksi riil terbesar di masa lalu.</li>
                    <li><strong>Rotasi Value Area:</strong> Manfaatkan penolakan harga di luar VAH/VAL untuk menargetkan mean-reversion kembali menuju POC emas.</li>
                  </ul>
                </div>
              </div>
            </section>

            {/* General Best Practices */}
            <section className="bg-emerald-950/20 border border-emerald-900/30 p-5 rounded-xl">
              <h3 className="text-lg font-bold text-emerald-400 mb-3 flex items-center gap-2">
                <TrendingUp size={18} /> Strategi Kombinasi Lanjutan
              </h3>
              <ul className="list-decimal pl-5 space-y-3 text-emerald-100">
                <li>
                  <strong>Konfluensi dengan Footprint:</strong> Gunakan Heatmap untuk menemukan <em>Level of Interest</em>, kemudian zoom in ke Footprint Chart (Imbalance & Delta) saat harga mencapai level tersebut untuk mengonfirmasi titik masuk (entry) dengan presisi tick-level.
                </li>
                <li>
                  <strong>Perhatikan Usia Likuiditas (Aging):</strong> Limit order yang sudah ada di sana selama beberapa jam (garis panjang tak terputus) jauh lebih valid daripada likuiditas yang baru saja muncul (potensi spoofing).
                </li>
                <li>
                  <strong>CVD Divergence:</strong> Jika Cumulative Volume Delta (CVD) naik secara signifikan tetapi harga tertahan oleh dinding likuiditas pada heatmap, ini merupakan sinyal kuat bahwa <em>Smart Money</em> sedang mendistribusikan aset secara pasif (Absorption).
                </li>
              </ul>
            </section>
          </div>
        </div>

        {/* Footer */}
        <div className="relative p-4 border-t border-[var(--color-border)]/30 bg-[var(--color-panel)]/40 backdrop-blur-xl flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 rounded-lg font-bold text-white shadow-[0_0_15px_rgba(8,145,178,0.4)] bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 transition-all hover:scale-105 active:scale-95 cursor-pointer border border-cyan-400/30"
          >
            Mengerti & Tutup
          </button>
        </div>
      </div>
    </div>
  );
}
