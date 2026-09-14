import html2canvas from 'html2canvas';

/**
 * Automatically captures the current trading chart & layout state
 * as a high-resolution base64 PNG data URL when a position order
 * is executed (Entry/Open, TP, SL, Partial Close, or Reverse).
 */
export async function captureLayoutSnapshot(): Promise<string | null> {
  try {
    // 1. Try targeting the app layout or main chart area
    const appLayout = document.getElementById('app-layout');
    const chartContainer = document.querySelector('.chart-container') as HTMLElement;
    const targetEl = appLayout || chartContainer || document.body;

    if (!targetEl) return getCanvasFallbackSnapshot();

    const canvas = await html2canvas(targetEl, {
      useCORS: true,
      allowTaint: true,
      logging: false,
      scale: 0.8,
      backgroundColor: '#070a14',
      ignoreElements: (el) => {
        // Skip modal dialogs, popups, or toast overlays so the chart layout is clean
        return (
          el.classList?.contains('no-snapshot') ||
          el.classList?.contains('z-[9999]') ||
          el.getAttribute('role') === 'dialog'
        );
      }
    });

    const dataUrl = canvas.toDataURL('image/png', 0.85);
    if (dataUrl && dataUrl.length > 200) {
      return dataUrl;
    }
  } catch (err) {
    console.warn('[Snapshot Utility] html2canvas error, using fallback:', err);
  }

  return getCanvasFallbackSnapshot();
}

/**
 * Direct fallback extracting dataURL from HTML5 chart canvas elements
 */
function getCanvasFallbackSnapshot(): string | null {
  try {
    const canvases = Array.from(document.querySelectorAll('canvas'));
    if (canvases.length > 0) {
      // Find the largest canvas (main chart canvas)
      let bestCanvas = canvases[0];
      let maxArea = bestCanvas.width * bestCanvas.height;

      for (const c of canvases) {
        const area = c.width * c.height;
        if (area > maxArea) {
          maxArea = area;
          bestCanvas = c;
        }
      }

      if (bestCanvas) {
        return bestCanvas.toDataURL('image/png');
      }
    }
  } catch (e) {
    console.warn('[Snapshot Utility] Canvas fallback failed:', e);
  }
  return null;
}
