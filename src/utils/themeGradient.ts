import { ThemeColors } from './terminalPersistence';

/**
 * Converts a hex color string to an [R, G, B] numeric tuple.
 */
export function hexToRgbTuple(hex: string, fallback: [number, number, number] = [81, 52, 255]): [number, number, number] {
  if (!hex) return fallback;
  let c = hex.replace('#', '').trim();
  if (c.length === 3) c = c.split('').map(x => x + x).join('');
  if (c.length !== 6) return fallback;
  const num = parseInt(c, 16);
  if (isNaN(num)) return fallback;
  return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
}

/**
 * Converts a hex color string to rgba() CSS string.
 */
export function hexToRgba(hex: string, alpha: number, fallback: [number, number, number] = [81, 52, 255]): string {
  const [r, g, b] = hexToRgbTuple(hex, fallback);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/**
 * Generates a theme-matched modal backdrop / container gradient combining bull and bear colors.
 */
export function getThemeModalGradient(palette: ThemeColors, isLight = false): string {
  const [rBull, gBull, bBull] = hexToRgbTuple(palette.bull, [81, 52, 255]);
  const [rBear, gBear, bBear] = hexToRgbTuple(palette.bear, [23, 156, 116]);
  const [darkR, darkG, darkB] = hexToRgbTuple(
    palette.dark && palette.dark !== '#000000' && palette.dark !== '#ffffff' ? palette.dark : '#060913',
    [6, 9, 19]
  );

  if (isLight) {
    return `linear-gradient(145deg, rgba(${rBull}, ${gBull}, ${bBull}, 0.16) 0%, rgba(255, 255, 255, 0.95) 45%, rgba(${rBear}, ${gBear}, ${bBear}, 0.12) 100%)`;
  }

  return `linear-gradient(145deg, rgba(${rBull}, ${gBull}, ${bBull}, 0.22) 0%, rgba(${darkR + 4}, ${darkG + 6}, ${darkB + 10}, 0.92) 45%, rgba(${rBear}, ${gBear}, ${bBear}, 0.18) 100%)`;
}

/**
 * Generates a theme-matched card background gradient combining bull, dark tone, and bear color.
 */
export function getThemeCardGradient(palette: ThemeColors, isLight = false, isHighlighted = false): string {
  const [rBull, gBull, bBull] = hexToRgbTuple(palette.bull, [81, 52, 255]);
  const [rBear, gBear, bBear] = hexToRgbTuple(palette.bear, [23, 156, 116]);
  const [darkR, darkG, darkB] = hexToRgbTuple(
    palette.dark && palette.dark !== '#000000' && palette.dark !== '#ffffff' ? palette.dark : '#060913',
    [6, 9, 19]
  );

  if (isLight) {
    const alphaBull = isHighlighted ? 0.24 : 0.16;
    const alphaBear = isHighlighted ? 0.16 : 0.08;
    return `linear-gradient(135deg, rgba(${rBull}, ${gBull}, ${bBull}, ${alphaBull}) 0%, rgba(255, 255, 255, 0.88) 50%, rgba(${rBear}, ${gBear}, ${bBear}, ${alphaBear}) 100%)`;
  }

  const alphaBull = isHighlighted ? 0.30 : 0.20;
  const alphaBear = isHighlighted ? 0.22 : 0.12;
  return `linear-gradient(135deg, rgba(${rBull}, ${gBull}, ${bBull}, ${alphaBull}) 0%, rgba(${darkR + 6}, ${darkG + 8}, ${darkB + 14}, 0.82) 50%, rgba(${rBear}, ${gBear}, ${bBear}, ${alphaBear}) 100%)`;
}

/**
 * Generates an AI fundamental digest sub-card background gradient with bull and bear blend.
 */
export function getThemeAiDigestGradient(palette: ThemeColors, isLight = false): string {
  const [rBull, gBull, bBull] = hexToRgbTuple(palette.bull, [81, 52, 255]);
  const [rBear, gBear, bBear] = hexToRgbTuple(palette.bear, [23, 156, 116]);
  const [darkR, darkG, darkB] = hexToRgbTuple(
    palette.dark && palette.dark !== '#000000' && palette.dark !== '#ffffff' ? palette.dark : '#060913',
    [6, 9, 19]
  );

  if (isLight) {
    return `linear-gradient(135deg, rgba(${rBull}, ${gBull}, ${bBull}, 0.20) 0%, rgba(255, 255, 255, 0.92) 55%, rgba(${rBear}, ${gBear}, ${bBear}, 0.12) 100%)`;
  }

  return `linear-gradient(135deg, rgba(${rBull}, ${gBull}, ${bBull}, 0.24) 0%, rgba(${darkR + 2}, ${darkG + 4}, ${darkB + 8}, 0.88) 55%, rgba(${rBear}, ${gBear}, ${bBear}, 0.18) 100%)`;
}

/**
 * Generates a horizontal bar header gradient blending bull and bear colors across the bar.
 */
export function getThemeHeaderGradient(palette: ThemeColors, isLight = false): string {
  const [rBull, gBull, bBull] = hexToRgbTuple(palette.bull, [81, 52, 255]);
  const [rBear, gBear, bBear] = hexToRgbTuple(palette.bear, [23, 156, 116]);
  
  if (isLight) {
    return `linear-gradient(90deg, rgba(${rBull}, ${gBull}, ${bBull}, 0.16) 0%, rgba(255, 255, 255, 0.4) 50%, rgba(${rBear}, ${gBear}, ${bBear}, 0.14) 100%)`;
  }
  return `linear-gradient(90deg, rgba(${rBull}, ${gBull}, ${bBull}, 0.18) 0%, rgba(0, 0, 0, 0.2) 50%, rgba(${rBear}, ${gBear}, ${bBear}, 0.16) 100%)`;
}

/**
 * Generates a two-tone action button/pill gradient blending bull and bear colors.
 */
export function getThemeButtonGradient(palette: ThemeColors): string {
  return `linear-gradient(135deg, ${palette.bull} 0%, ${palette.bear} 100%)`;
}

/**
 * Generates card border color matching active theme.
 */
export function getThemeCardBorder(palette: ThemeColors, isHighlighted = false): string {
  return isHighlighted ? hexToRgba(palette.bull, 0.70) : hexToRgba(palette.bull, 0.30);
}

/**
 * Generates card box shadow matching active theme with bull and bear ambient glow.
 */
export function getThemeCardBoxShadow(palette: ThemeColors, isHighlighted = false): string {
  if (isHighlighted) {
    return `0 14px 40px -8px rgba(0,0,0,0.7), 0 0 20px ${hexToRgba(palette.bull, 0.25)}, 0 0 20px ${hexToRgba(palette.bear, 0.15)}`;
  }
  return `0 12px 32px -8px rgba(0,0,0,0.5), 0 0 14px ${hexToRgba(palette.bull, 0.12)}, 0 0 14px ${hexToRgba(palette.bear, 0.08)}`;
}

/**
 * Generates a theme-matched HUD Beacon background gradient combining bull and bear.
 */
export function getThemeBeaconGradient(palette: ThemeColors, isHighImpact: boolean, isLight = false): string {
  const [rBear, gBear, bBear] = hexToRgbTuple(palette.bear, [244, 63, 94]);
  if (isHighImpact) {
    return isLight
      ? `linear-gradient(135deg, rgba(${rBear}, ${gBear}, ${bBear}, 0.24) 0%, rgba(255, 255, 255, 0.92) 100%)`
      : `linear-gradient(135deg, rgba(${rBear}, ${gBear}, ${bBear}, 0.38) 0%, rgba(18, 5, 10, 0.94) 100%)`;
  }
  return getThemeCardGradient(palette, isLight, true);
}

/**
 * Generates a theme-matched Volatility Guard background gradient combining bear and bull.
 */
export function getThemeVolGuardGradient(palette: ThemeColors, isPaused: boolean, isLight = false): string {
  const [rBear, gBear, bBear] = hexToRgbTuple(palette.bear, [239, 68, 68]);
  const [rBull, gBull, bBull] = hexToRgbTuple(palette.bull, [81, 52, 255]);
  if (isPaused) {
    return isLight
      ? `linear-gradient(135deg, rgba(${rBear}, ${gBear}, ${bBear}, 0.26) 0%, rgba(255, 255, 255, 0.95) 60%, rgba(${rBull}, ${gBull}, ${bBull}, 0.10) 100%)`
      : `linear-gradient(135deg, rgba(${rBear}, ${gBear}, ${bBear}, 0.38) 0%, rgba(24, 6, 8, 0.95) 60%, rgba(${rBull}, ${gBull}, ${bBull}, 0.12) 100%)`;
  }
  return getThemeCardGradient(palette, isLight, false);
}

