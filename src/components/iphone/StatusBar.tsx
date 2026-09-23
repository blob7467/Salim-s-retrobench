import React, { useState, useEffect } from 'react';
import { VolumeX, Wifi } from 'lucide-react';

interface StatusBarProps {
  darkText?: boolean;
  theme?: 'translucent' | 'silver' | 'felt' | 'black';
  soundMuted?: boolean;
  onToggleSound?: () => void;
}

export const StatusBar: React.FC<StatusBarProps> = ({
  darkText = false,
  theme = 'translucent',
  soundMuted = false,
  onToggleSound,
}) => {
  const [timeStr, setTimeStr] = useState('9:41 AM');

  useEffect(() => {
    const update = () => {
      const now = new Date();
      let hours = now.getHours();
      const mins = now.getMinutes().toString().padStart(2, '0');
      const ampm = hours >= 12 ? 'PM' : 'AM';
      hours = hours % 12 || 12;
      setTimeStr(`${hours}:${mins} ${ampm}`);
    };
    update();
    const interval = setInterval(update, 10000);
    return () => clearInterval(interval);
  }, []);

  // iOS 6 Adaptive Status Bar Tinting
  const isSilver = theme === 'silver' || darkText;
  const isFelt = theme === 'felt';
  const isBlack = theme === 'black';

  let bgClass = 'bg-transparent';
  let textColor = 'text-white';
  let shadowStyle = '0 1px 1px rgba(0, 0, 0, 0.8)';
  let borderClass = '';

  if (isSilver) {
    // iOS 6 Silver Slate bar
    bgClass = 'bg-gradient-to-b from-[#e7ecf2] via-[#d3dbe5] to-[#c2ccda]';
    textColor = 'text-neutral-800';
    shadowStyle = '0 1px 0 rgba(255, 255, 255, 0.7)';
    borderClass = 'border-b border-[#a1adbd]';
  } else if (isFelt) {
    // iOS 6 Game Center forest green bar
    bgClass = 'bg-gradient-to-b from-[#1b3d22] to-[#142d19]';
    textColor = 'text-emerald-100';
    shadowStyle = '0 1px 1px rgba(0, 0, 0, 0.9)';
    borderClass = 'border-b border-[#0d1d10]';
  } else if (isBlack) {
    bgClass = 'bg-black';
    textColor = 'text-neutral-100';
    shadowStyle = '0 1px 1px rgba(0, 0, 0, 0.8)';
  } else {
    // Default translucent lock / home
    bgClass = 'bg-black/30 backdrop-blur-xs';
    textColor = 'text-white';
    shadowStyle = '0 1px 2px rgba(0, 0, 0, 0.9)';
  }

  return (
    <div
      className={`h-5 w-full flex items-center justify-between px-2 text-[11px] font-sans tracking-tight z-50 select-none ${bgClass} ${textColor} ${borderClass}`}
      style={{
        textShadow: shadowStyle,
      }}
    >
      {/* Left: Signal Bars & Carrier & 3G */}
      <div className="flex items-center gap-1.5 font-medium">
        <div className="flex items-end gap-[1.5px] h-2.5 pb-[1px]">
          <span className="w-[2.5px] h-1 bg-current rounded-xs" />
          <span className="w-[2.5px] h-1.5 bg-current rounded-xs" />
          <span className="w-[2.5px] h-2 bg-current rounded-xs" />
          <span className="w-[2.5px] h-2.5 bg-current rounded-xs" />
          <span className="w-[2.5px] h-2.5 bg-current rounded-xs" />
        </div>
        <span className="font-semibold text-[10px] tracking-wide">AT&T</span>
        <span className="text-[9px] font-bold px-0.5 border border-current rounded-[2px] leading-tight">
          3G
        </span>
        <Wifi className="w-2.5 h-2.5 ml-0.5 opacity-90" />
      </div>

      {/* Center: Clock */}
      <div className="font-bold text-[11px] tracking-normal">{timeStr}</div>

      {/* Right: Sound icon & Battery */}
      <div className="flex items-center gap-1.5 font-semibold">
        {soundMuted && (
          <button
            onClick={onToggleSound}
            title="Sound is muted"
            className="hover:opacity-80 transition-opacity"
          >
            <VolumeX className="w-3 h-3 text-red-400" />
          </button>
        )}
        <span className="text-[10px]">96%</span>
        {/* iOS 4 Battery Icon */}
        <div className="flex items-center">
          <div className="w-4 h-2 rounded-[1.5px] border border-current p-[1px] flex items-center">
            <div className="h-full w-[85%] bg-emerald-500 rounded-[0.5px]" />
          </div>
          <div className="w-[1.5px] h-1 bg-current rounded-r-[0.5px] -ml-[0.5px]" />
        </div>
      </div>
    </div>
  );
};
