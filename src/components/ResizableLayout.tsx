import React from 'react';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import { motion, AnimatePresence, LayoutGroup } from 'motion/react';
import { Lock } from 'lucide-react';

const ResizeHandle = ({ 
  direction = 'horizontal', 
  isWorkspaceLocked = false 
}: { 
  direction?: 'horizontal' | 'vertical'; 
  isWorkspaceLocked?: boolean;
}) => {
  const isHorizontal = direction === 'horizontal';
  return (
    <PanelResizeHandle 
      disabled={isWorkspaceLocked}
      className={`group relative flex items-center justify-center z-10 transition-colors ${
        isHorizontal 
          ? (isWorkspaceLocked ? 'w-2 sm:w-3 h-full cursor-not-allowed select-none' : 'w-3 h-full cursor-col-resize') 
          : (isWorkspaceLocked ? 'w-full h-2 sm:h-3 cursor-not-allowed select-none' : 'w-full h-3 cursor-row-resize')
      }`}
      title={isWorkspaceLocked ? "Workspace Terkunci (Pergeseran Pembagi Dinonaktifkan)" : "Geser untuk mengubah ukuran panel"}
    >
      {/* Garis pemisah tipis panjang penuh dengan tema gradasi solid */}
      <div className={`absolute transition-all duration-300 ${
        isHorizontal ? 'w-[1.5px] h-full left-1/2 -translate-x-1/2 bg-gradient-to-b' : 'w-full h-[1.5px] top-1/2 -translate-y-1/2 bg-gradient-to-r'
      } ${isWorkspaceLocked ? 'from-amber-500/40 to-amber-600/40' : 'from-[var(--color-bull)] to-[var(--color-bear)] group-hover:shadow-[0_0_8px_var(--color-bull)]'}`} />
      
      {/* Masking gelap di area gagang agar garis memudar */}
      <div className={`absolute pointer-events-none z-10 ${
        isHorizontal ? 'w-full h-24 bg-gradient-to-b left-1/2 -translate-x-1/2' : 'w-24 h-full bg-gradient-to-r top-1/2 -translate-y-1/2'
      } from-transparent via-[var(--color-bg)] to-transparent`} />
      
      {/* Pegangan tengah dengan warna dark dan border gradient tipis */}
      <div 
        className={`relative flex items-center justify-center rounded-full p-[1px] transition-all duration-300 z-20 ${
          isWorkspaceLocked 
            ? 'bg-amber-500/40 opacity-80' 
            : 'bg-gradient-to-br from-[var(--color-bull)] to-[var(--color-bear)] group-hover:scale-110 group-hover:shadow-[0_0_8px_var(--color-bull)] group-active:scale-95'
        } ${
          isHorizontal 
            ? 'w-2.5 h-12' 
            : 'w-12 h-2.5'
        }`}
      >
         <div className={`w-full h-full bg-[var(--color-card)] rounded-full flex justify-around items-center ${isHorizontal ? 'flex-col py-1.5' : 'flex-row px-1.5'}`}>
            {isWorkspaceLocked ? (
              <Lock size={8} className="text-amber-400" />
            ) : (
              <>
                <div className={`bg-[var(--color-bull)] shadow-[0_0_3px_var(--color-bull)] rounded-full w-[2px] h-[2px]`} />
                <div className={`bg-[var(--color-poc)] shadow-[0_0_3px_var(--color-poc)] rounded-full w-[2px] h-[2px]`} />
                <div className={`bg-[var(--color-bear)] shadow-[0_0_3px_var(--color-bear)] rounded-full w-[2px] h-[2px]`} />
              </>
            )}
         </div>
      </div>
    </PanelResizeHandle>
  );
};

interface ResizableLayoutProps {
  widgetOrder: string[];
  renderWidget: (id: string) => React.ReactNode;
  effectiveOrientation: 'portrait' | 'landscape';
  fullscreenWidget: string | null;
  isWorkspaceLocked?: boolean;
}

export default function ResizableLayout({
  widgetOrder,
  renderWidget,
  effectiveOrientation,
  fullscreenWidget,
  isWorkspaceLocked = false,
}: ResizableLayoutProps) {
  const count = widgetOrder.length;

  if (count === 0) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center text-gray-500 gap-4">
        <p>Tidak ada panel aktif.</p>
        <button 
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-blue-900/50 hover:bg-blue-800 text-blue-200 rounded border border-blue-700/50 transition-colors"
        >
          Muat Ulang Halaman
        </button>
      </div>
    );
  }

  const renderPanels = (widgets: string[], direction: 'horizontal' | 'vertical'): React.ReactNode => {
    if (widgets.length === 1) {
      const widgetId = widgets[0];
      return (
        <motion.div 
          key={widgetId}
          layoutId={`panel-card-${widgetId}`}
          layout
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.97 }}
          transition={{ 
            duration: 0.28, 
            ease: [0.22, 1, 0.36, 1],
            layout: { duration: 0.32, ease: [0.22, 1, 0.36, 1] } 
          }}
          className="w-full h-full relative rounded-xl flex-shrink-0 min-h-0 p-[1px] bg-gradient-to-b from-white/15 via-white/5 to-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.5)] transition-all duration-300"
        >
          <div className="w-full h-full bg-[#03050c]/90 rounded-xl overflow-hidden relative backdrop-blur-xl">
            {renderWidget(widgetId)}
          </div>
        </motion.div>
      );
    }
    
    const mid = Math.ceil(widgets.length / 2);
    const left = widgets.slice(0, mid);
    const right = widgets.slice(mid);
    const nextDirection = direction === 'horizontal' ? 'vertical' : 'horizontal';

    return (
      <PanelGroup direction={direction}>
        <Panel minSize={10}>
          {renderPanels(left, nextDirection)}
        </Panel>
        <ResizeHandle direction={direction} isWorkspaceLocked={isWorkspaceLocked} />
        <Panel minSize={10}>
          {renderPanels(right, nextDirection)}
        </Panel>
      </PanelGroup>
    );
  };

  const initialDirection = effectiveOrientation === 'landscape' ? 'horizontal' : 'vertical';    return (
    <LayoutGroup id="mountalgo-chart-layout-group">
      <div className="w-full h-full p-px sm:p-0.5 md:p-1 overflow-hidden relative">
        <AnimatePresence mode="wait">
          {fullscreenWidget ? (
            <motion.div 
              key={`fullscreen-${fullscreenWidget}`}
              layoutId={`panel-card-${fullscreenWidget}`}
              layout
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ 
                duration: 0.3, 
                ease: [0.22, 1, 0.36, 1],
                layout: { duration: 0.32, ease: [0.22, 1, 0.36, 1] } 
              }}
              className="w-full h-full p-1 bg-[var(--color-bg)]"
            >
              <div 
                className="w-full h-full relative rounded-xl flex-shrink-0 min-h-0 p-[1px] bg-gradient-to-b from-white/20 via-white/5 to-white/10 shadow-[0_12px_40px_rgba(0,0,0,0.6)] transition-all duration-300"
              >
                <div className="w-full h-full bg-[#03050c]/95 rounded-xl overflow-hidden relative backdrop-blur-2xl">
                  {renderWidget(fullscreenWidget)}
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div 
              key="grid-layout-view"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.22, ease: 'easeOut' }}
              className="w-full h-full"
            >
              {renderPanels(widgetOrder, initialDirection)}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </LayoutGroup>
  );
}
