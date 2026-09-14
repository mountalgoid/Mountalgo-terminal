/**
 * Automatic Screen Resolution & Monitor DPI Scale Detector
 * Identifies 1080p, 2K QHD, 2K Ultra-Wide, 4K UHD, 4K Ultra-Wide, and High-DPI screens.
 * Computes optimal UI Zoom & Crisp Bubble Scaling for Liquidity Heatmaps.
 */

export interface ResolutionInfo {
  category: '1080p' | '2K' | '2K_UW' | '4K' | '4K_UW' | '720p' | 'RETINA_HIGH_DPI';
  label: string;               // e.g. "4K Ultra-Wide (3840x1600)" or "2K QHD (2560x1440)"
  shortLabel: string;          // e.g. "4K Ultra-Wide" or "2K QHD" or "1080p"
  icon: string;                // e.g. "🖥️" or "🖥️✨"
  screenWidth: number;         // Logical screen width
  screenHeight: number;        // Logical screen height
  physicalWidth: number;       // Physical pixel width
  physicalHeight: number;      // Physical pixel height
  devicePixelRatio: number;    // Window DPI scale
  aspectRatio: number;         // Width / Height
  isUltraWide: boolean;        // Ratio >= 2.0
  recommendedZoom: number;     // Recommended global UI zoom % (e.g. 100, 110, 125)
  recommendedBubbleScale: number; // Recommended bubble scale factor (1.0 - 1.35)
}

export function detectScreenResolution(): ResolutionInfo {
  if (typeof window === 'undefined') {
    return {
      category: '1080p',
      label: '1080p Full HD (1920x1080)',
      shortLabel: '1080p Full HD',
      icon: '💻',
      screenWidth: 1920,
      screenHeight: 1080,
      physicalWidth: 1920,
      physicalHeight: 1080,
      devicePixelRatio: 1,
      aspectRatio: 16 / 9,
      isUltraWide: false,
      recommendedZoom: 100,
      recommendedBubbleScale: 1.0,
    };
  }

  const dpr = Math.max(1, window.devicePixelRatio || 1);
  const sw = Math.max(window.screen?.width || 0, window.innerWidth || 1920);
  const sh = Math.max(window.screen?.height || 0, window.innerHeight || 1080);
  const physicalWidth = Math.round(sw * dpr);
  const physicalHeight = Math.round(sh * dpr);
  const aspectRatio = sw / Math.max(1, sh);
  const isUltraWide = aspectRatio >= 2.0;

  let category: ResolutionInfo['category'] = '1080p';
  let label = '';
  let shortLabel = '';
  let icon = '💻';
  let recommendedZoom = 100;
  let recommendedBubbleScale = 1.0;

  // 1. 4K Ultra-Wide (e.g., 5120x2160, 3840x1600, 3840x1440, 3440x1440 HiDPI)
  if ((physicalWidth >= 3400 || sw >= 2800) && isUltraWide) {
    category = '4K_UW';
    shortLabel = '4K Ultra-Wide';
    label = `4K Ultra-Wide (${sw}x${sh} @${dpr}x)`;
    icon = '🖥️✨';
    recommendedZoom = 125;
    recommendedBubbleScale = 1.3;
  }
  // 2. Standard 4K UHD / 5K (e.g. 3840x2160, 4096x2160)
  else if (physicalWidth >= 3200 || sw >= 2800 || (sw >= 1920 && dpr >= 2.0)) {
    category = '4K';
    shortLabel = '4K UHD';
    label = `4K UHD (${sw}x${sh} @${dpr}x)`;
    icon = '🖥️4K';
    recommendedZoom = 125;
    recommendedBubbleScale = 1.25;
  }
  // 3. 2K Ultra-Wide (e.g. 2560x1080, 3440x1440 standard)
  else if ((physicalWidth >= 2400 || sw >= 2200) && isUltraWide) {
    category = '2K_UW';
    shortLabel = '2K Ultra-Wide';
    label = `2K Ultra-Wide (${sw}x${sh} @${dpr}x)`;
    icon = '🖥️';
    recommendedZoom = 110;
    recommendedBubbleScale = 1.15;
  }
  // 4. 2K QHD (e.g. 2560x1440, 2304x1296)
  else if (physicalWidth >= 2400 || sw >= 2000) {
    category = '2K';
    shortLabel = '2K QHD';
    label = `2K QHD (${sw}x${sh} @${dpr}x)`;
    icon = '🖥️2K';
    recommendedZoom = 110;
    recommendedBubbleScale = 1.1;
  }
  // 5. 1080p Full HD (e.g. 1920x1080)
  else if (sw >= 1600 || physicalWidth >= 1800) {
    category = '1080p';
    shortLabel = '1080p Full HD';
    label = `1080p Full HD (${sw}x${sh} @${dpr}x)`;
    icon = '💻';
    recommendedZoom = 100;
    recommendedBubbleScale = 1.0;
  }
  // 6. Compact / HD / Mobile (e.g. 1366x768, 1280x720)
  else {
    category = '720p';
    shortLabel = 'HD Compact';
    label = `HD Compact (${sw}x${sh} @${dpr}x)`;
    icon = '📱';
    recommendedZoom = 95;
    recommendedBubbleScale = 0.95;
  }

  return {
    category,
    label,
    shortLabel,
    icon,
    screenWidth: sw,
    screenHeight: sh,
    physicalWidth,
    physicalHeight,
    devicePixelRatio: dpr,
    aspectRatio,
    isUltraWide,
    recommendedZoom,
    recommendedBubbleScale,
  };
}
