import React, { useState, useEffect } from 'react';
import logoSrc from '../assets/images/logo.png';

interface MountAlgoLogoProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'custom';
  className?: string;
  customSizePx?: number;
  showGlow?: boolean;
}

// Module-level cache for the transparent logo data URL to avoid reprocessing
let cachedTransparentLogoUrl: string | null = null;
let processingPromise: Promise<string> | null = null;

function getTransparentLogo(): Promise<string> {
  if (cachedTransparentLogoUrl) {
    return Promise.resolve(cachedTransparentLogoUrl);
  }
  if (processingPromise) {
    return processingPromise;
  }

  processingPromise = new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth || img.width || 512;
        canvas.height = img.naturalHeight || img.height || 512;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(logoSrc);
          return;
        }

        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imgData.data;

        // Process pixels: convert black background to transparent alpha channel with smooth antialiasing
        for (let i = 0; i < data.length; i += 4) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          // Calculate brightness / max channel
          const brightness = Math.max(r, g, b);

          if (brightness < 20) {
            // Pure black background -> fully transparent
            data[i + 3] = 0;
          } else {
            // Anti-aliased white edge -> preserve smooth gradient alpha
            const alphaRatio = Math.min(1, (brightness - 10) / 200);
            data[i] = 255;
            data[i + 1] = 255;
            data[i + 2] = 255;
            data[i + 3] = Math.round(255 * alphaRatio);
          }
        }

        ctx.putImageData(imgData, 0, 0);
        const transparentUrl = canvas.toDataURL('image/png');
        cachedTransparentLogoUrl = transparentUrl;
        resolve(transparentUrl);
      } catch {
        resolve(logoSrc);
      }
    };
    img.onerror = () => resolve(logoSrc);
    img.src = logoSrc;
  });

  return processingPromise;
}

export const MountAlgoLogo: React.FC<MountAlgoLogoProps> = ({
  size = 'md',
  className = '',
  customSizePx,
  showGlow = false,
}) => {
  const [logoImage, setLogoImage] = useState<string>(() => cachedTransparentLogoUrl || logoSrc);

  useEffect(() => {
    if (!cachedTransparentLogoUrl) {
      getTransparentLogo().then((url) => {
        setLogoImage(url);
      });
    }
  }, []);

  const sizeClasses = {
    xs: 'w-4 h-4',
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
    xl: 'w-20 h-20',
    custom: '',
  };

  const style: React.CSSProperties = customSizePx
    ? { width: `${customSizePx}px`, height: `${customSizePx}px` }
    : {};

  return (
    <div
      className={`relative inline-flex items-center justify-center shrink-0 overflow-hidden bg-transparent select-none ${
        size !== 'custom' ? sizeClasses[size] : ''
      } ${className}`}
      style={style}
    >
      <img
        src={logoImage}
        alt="MountAlgo Official Logo"
        referrerPolicy="no-referrer"
        className={`w-full h-full object-contain block bg-transparent ${
          logoImage === logoSrc ? 'mix-blend-screen' : ''
        } ${
          showGlow ? 'drop-shadow-[0_0_12px_rgba(255,255,255,0.45)]' : ''
        }`}
      />
    </div>
  );
};

export default MountAlgoLogo;

