import React, { useState, useRef, useEffect } from 'react';
import { ChevronRight, Camera, X } from 'lucide-react';
import { StatusBar } from './StatusBar';
import { sound } from '../../audio/soundEffects';
import { triggerHaptic } from '../../utils/storage';

interface LockScreenProps {
  onUnlock: () => void;
  wallpaper: 'droplets' | 'linen' | 'gradient';
}

export const LockScreen: React.FC<LockScreenProps> = ({ onUnlock, wallpaper }) => {
  const [dragX, setDragX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const trackRef = useRef<HTMLDivElement>(null);
  const startXRef = useRef(0);

  const [dateStr, setDateStr] = useState('');
  const [timeStr, setTimeStr] = useState('');
  const [showCamera, setShowCamera] = useState(false);
  const [cameraFlash, setCameraFlash] = useState(false);

  useEffect(() => {
    const update = () => {
      const now = new Date();
      let hours = now.getHours();
      const mins = now.getMinutes().toString().padStart(2, '0');
      hours = hours % 12 || 12;
      setTimeStr(`${hours}:${mins}`);

      const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
      setDateStr(`${days[now.getDay()]}, ${months[now.getMonth()]} ${now.getDate()}`);
    };
    update();
    const timer = setInterval(update, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleTouchStart = (e: React.TouchEvent | React.MouseEvent) => {
    setIsDragging(true);
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    startXRef.current = clientX - dragX;
    sound.playClick(900, 0.02);
  };

  const handleTouchMove = (e: TouchEvent | MouseEvent) => {
    if (!isDragging || !trackRef.current) return;
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const maxDrag = trackRef.current.clientWidth - 56;
    const nextX = Math.max(0, Math.min(clientX - startXRef.current, maxDrag));
    setDragX(nextX);

    if (nextX >= maxDrag * 0.85) {
      setIsDragging(false);
      setDragX(maxDrag);
      sound.playUnlock();
      triggerHaptic('medium');
      setTimeout(onUnlock, 150);
    }
  };

  const handleTouchEnd = () => {
    if (!isDragging) return;
    setIsDragging(false);
    // Snap back
    setDragX(0);
  };

  const handleSnapPhoto = () => {
    sound.playCameraShutter();
    triggerHaptic('medium');
    setCameraFlash(true);
    setTimeout(() => setCameraFlash(false), 200);
  };

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleTouchMove);
      window.addEventListener('mouseup', handleTouchEnd);
      window.addEventListener('touchmove', handleTouchMove, { passive: false });
      window.addEventListener('touchend', handleTouchEnd);
    }
    return () => {
      window.removeEventListener('mousemove', handleTouchMove);
      window.removeEventListener('mouseup', handleTouchEnd);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isDragging]);

  return (
    <div className="relative w-full h-full flex flex-col justify-between select-none overflow-hidden">
      {/* Background Wallpaper */}
      <div className="absolute inset-0 z-0">
        {wallpaper === 'droplets' ? (
          <div className="w-full h-full bg-gradient-to-b from-[#1b2b34] via-[#0d171d] to-[#05090b] relative">
            {/* Water droplet skeuomorphism dots */}
            <div
              className="absolute inset-0 opacity-45"
              style={{
                backgroundImage: `radial-gradient(circle at 50% 40%, rgba(255,255,255,0.4) 0%, rgba(255,255,255,0.1) 40%, transparent 70%),
                  radial-gradient(circle at 20% 70%, rgba(255,255,255,0.3) 0%, transparent 50%),
                  radial-gradient(circle at 80% 80%, rgba(255,255,255,0.25) 0%, transparent 60%)`,
                filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.8))',
              }}
            />
          </div>
        ) : wallpaper === 'linen' ? (
          <div className="w-full h-full ios-linen" />
        ) : (
          <div className="w-full h-full bg-gradient-to-b from-indigo-900 via-slate-900 to-black" />
        )}
      </div>

      {/* Top Bar & Clock Container */}
      <div className="relative z-10 w-full flex flex-col items-center">
        <StatusBar theme="translucent" />
        
        {/* iOS 6 Header Frosted Glass Box */}
        <div className="w-[92%] mt-2 py-2 px-3 rounded-lg bg-black/45 backdrop-blur-md border border-white/20 shadow-xl flex flex-col items-center">
          <div
            className="text-white text-5xl font-light tracking-tight"
            style={{
              textShadow: '0 2px 8px rgba(0,0,0,0.8), 0 0 2px rgba(0,0,0,0.9)',
              fontFamily: '-apple-system, BlinkMacSystemFont, "Helvetica Neue", sans-serif',
            }}
          >
            {timeStr}
          </div>
          <div
            className="text-neutral-200 text-xs font-medium tracking-wide mt-0.5"
            style={{ textShadow: '0 1px 3px rgba(0,0,0,0.9)' }}
          >
            {dateStr}
          </div>
        </div>
      </div>

      {/* Center Subtle Vintage Hint */}
      <div className="relative z-10 text-center px-4">
        <p className="text-[11px] text-white/60 font-medium tracking-wider uppercase">
          iPhone 4 · iOS 6.1.6
        </p>
      </div>

      {/* Bottom Slider Rail + iOS 6 Camera Grabber */}
      <div className="relative z-10 w-full px-3 pb-5 flex items-center justify-between gap-2">
        <div
          ref={trackRef}
          className="relative flex-1 h-[52px] rounded-2xl bg-black/75 border border-white/25 shadow-2xl p-1 flex items-center overflow-hidden"
          style={{
            boxShadow: 'inset 0 2px 6px rgba(0,0,0,0.9), 0 2px 4px rgba(0,0,0,0.6)',
          }}
        >
          {/* Shimmering unlock text */}
          <div className="absolute inset-0 flex items-center justify-center pl-8 pointer-events-none">
            <span className="shimmer-text text-[14px] font-semibold tracking-wider select-none">
              slide to unlock
            </span>
          </div>

          {/* Draggable Slider Knob */}
          <div
            onMouseDown={handleTouchStart}
            onTouchStart={handleTouchStart}
            style={{ transform: `translateX(${dragX}px)` }}
            className={`w-[48px] h-[44px] rounded-xl cursor-grab active:cursor-grabbing z-20 flex items-center justify-center shadow-lg transition-transform ${
              isDragging ? 'duration-0' : 'duration-300'
            }`}
          >
            {/* Metallic Gloss Knob */}
            <div
              className="w-full h-full rounded-xl bg-gradient-to-b from-neutral-200 via-neutral-300 to-neutral-400 border border-white/60 flex items-center justify-center relative overflow-hidden"
              style={{
                boxShadow: '0 2px 5px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.9)',
              }}
            >
              {/* Gloss highlight */}
              <div className="absolute inset-x-0 top-0 h-1/2 glossy-sheen" />
              <ChevronRight className="w-5 h-5 text-neutral-600 drop-shadow-[0_1px_0_rgba(255,255,255,0.9)]" />
            </div>
          </div>
        </div>

        {/* Famous iOS 6 Lock Screen Camera Grabber */}
        <button
          onClick={() => {
            sound.playCameraShutter();
            triggerHaptic('light');
            setShowCamera(true);
          }}
          title="Slide or tap to open Camera (iOS 6 signature feature)"
          className="w-[46px] h-[52px] rounded-xl bg-black/60 border border-white/20 hover:bg-black/75 active:scale-95 transition-all flex flex-col items-center justify-center cursor-pointer shadow-md text-white/80 hover:text-white"
        >
          <Camera className="w-5 h-5 drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]" />
          <span className="text-[7px] font-bold text-neutral-300 uppercase tracking-tighter mt-0.5">
            Camera
          </span>
        </button>
      </div>

      {/* iOS 6 Quick Camera Viewfinder Overlay */}
      {showCamera && (
        <div className="absolute inset-0 z-50 bg-black flex flex-col justify-between animate-in fade-in zoom-in-95 duration-200">
          <StatusBar theme="black" />
          
          {/* Top Camera Controls */}
          <div className="px-3 py-2 bg-gradient-to-b from-black/80 to-transparent flex items-center justify-between text-white text-xs">
            <button
              onClick={() => {
                sound.playClick(600, 0.02);
                setShowCamera(false);
              }}
              className="px-2 py-1 rounded-md bg-white/20 hover:bg-white/30 flex items-center gap-1 font-semibold"
            >
              <X className="w-3.5 h-3.5" /> Close
            </button>
            <div className="font-mono text-[10px] text-amber-300">RETINA 5MP SENSOR</div>
            <div className="w-12" />
          </div>

          {/* Viewfinder Preview */}
          <div className="relative flex-1 bg-gradient-to-br from-neutral-900 via-neutral-800 to-black flex items-center justify-center overflow-hidden">
            {/* Viewfinder grid lines */}
            <div className="absolute inset-4 border border-white/20 grid grid-cols-3 grid-rows-3 pointer-events-none">
              <div className="border-r border-b border-white/10" />
              <div className="border-r border-b border-white/10" />
              <div className="border-b border-white/10" />
              <div className="border-r border-b border-white/10" />
              <div className="border-r border-b border-white/10" />
              <div className="border-b border-white/10" />
            </div>

            {/* Vintage Camera Autofocus Box */}
            <div className="w-16 h-16 border-2 border-emerald-400 rounded-sm relative flex items-center justify-center animate-pulse">
              <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full" />
            </div>

            <div className="absolute bottom-2 text-center text-[10px] text-white/50">
              iPhone 4 5MP iSight Camera with LED Flash
            </div>

            {/* Flash Effect */}
            {cameraFlash && (
              <div className="absolute inset-0 bg-white pointer-events-none animate-out fade-out duration-200" />
            )}
          </div>

          {/* Bottom Shutter Button Bar */}
          <div className="py-3 px-4 bg-gradient-to-t from-neutral-950 via-neutral-900 to-neutral-800 border-t border-neutral-700 flex items-center justify-around">
            <div className="w-10 h-10 rounded-md bg-neutral-800 border border-neutral-600 flex items-center justify-center text-xs">
              🖼️
            </div>
            
            {/* Silver Shutter Button */}
            <button
              onClick={handleSnapPhoto}
              className="w-14 h-14 rounded-full bg-gradient-to-b from-neutral-100 to-neutral-400 border-2 border-white shadow-xl active:scale-95 transition-transform flex items-center justify-center cursor-pointer"
            >
              <div className="w-11 h-11 rounded-full bg-gradient-to-b from-neutral-300 to-neutral-100 border border-neutral-400 flex items-center justify-center shadow-inner">
                <Camera className="w-5 h-5 text-neutral-700" />
              </div>
            </button>

            <button
              onClick={() => {
                setShowCamera(false);
                onUnlock();
              }}
              className="text-[11px] font-semibold text-white/80 hover:text-white"
            >
              Unlock
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

