import React, { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';

interface Props {
  firstSeenAt: number;
  mode?: 'badge' | 'text' | 'compact' | 'full';
  className?: string;
}

export const formatListingAge = (firstSeenAt: number) => {
  const now = Date.now();
  const diffMs = Math.max(0, now - (firstSeenAt || now));
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHr = Math.floor(diffMin / 60);

  let shortAge = '';
  let fullAge = '';
  let badgeText = '';

  if (diffSec < 10) {
    shortAge = 'Just now';
    fullAge = 'Baru terdeteksi detik ini';
    badgeText = '⚡ DISCOVERED JUST NOW';
  } else if (diffSec < 60) {
    shortAge = `${diffSec}s ago`;
    fullAge = `Terdeteksi ${diffSec}s lalu`;
    badgeText = `⚡ DISCOVERED ${diffSec}s AGO`;
  } else if (diffMin < 60) {
    const remSec = diffSec % 60;
    if (diffMin < 5) {
      shortAge = `${diffMin}m ${remSec}s ago`;
      fullAge = `Terdeteksi ${diffMin}m ${remSec}s lalu`;
    } else {
      shortAge = `${diffMin}m ago`;
      fullAge = `Terdeteksi ${diffMin}m lalu`;
    }
    badgeText = `🚀 DISCOVERED ${diffMin}m AGO`;
  } else {
    const remMin = diffMin % 60;
    shortAge = `${diffHr}h ${remMin}m ago`;
    fullAge = `Terdeteksi ${diffHr}h ${remMin}m lalu`;
    badgeText = `DISCOVERED ${diffHr}h AGO`;
  }

  return {
    shortAge,
    fullAge,
    badgeText,
    diffSec,
    diffMin,
    isNew1m: diffMin < 1,
    isNew5m: diffMin < 5,
  };
};

export const DynamicListingTimer: React.FC<Props> = ({ firstSeenAt, mode = 'full', className = '' }) => {
  const [age, setAge] = useState(() => formatListingAge(firstSeenAt));

  useEffect(() => {
    setAge(formatListingAge(firstSeenAt));
    const interval = setInterval(() => {
      setAge(formatListingAge(firstSeenAt));
    }, 1000);
    return () => clearInterval(interval);
  }, [firstSeenAt]);

  if (mode === 'badge') {
    return <span className={className}>{age.badgeText}</span>;
  }

  if (mode === 'compact') {
    return (
      <span className={`font-mono text-emerald-300 font-bold ${className}`}>
        {age.shortAge}
      </span>
    );
  }

  if (mode === 'text') {
    return (
      <span className={`font-mono text-emerald-300 font-bold ${className}`}>
        {age.fullAge}
      </span>
    );
  }

  return (
    <span className={`inline-flex items-center gap-1 font-mono text-emerald-300 font-bold ${className}`}>
      <Clock size={11} className="text-emerald-400 animate-pulse shrink-0" />
      <span>{age.shortAge}</span>
    </span>
  );
};
