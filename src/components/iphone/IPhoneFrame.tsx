import React from 'react';
import { IPhoneColor } from '../../types';
import { sound } from '../../audio/soundEffects';
import { triggerHaptic } from '../../utils/storage';

interface IPhoneFrameProps {
  children: React.ReactNode;
  color: IPhoneColor;
  showFrame: boolean;
  onHomeClick: () => void;
  onPowerClick: () => void;
  onMuteToggle: () => void;
  isMuted: boolean;
}

export const IPhoneFrame: React.FC<IPhoneFrameProps> = ({
  children,
  color,
  showFrame,
  onHomeClick,
  onPowerClick,
  onMuteToggle,
  isMuted,
}) => {
  const handleHome = () => {
    sound.playClick(650, 0.04);
    triggerHaptic('medium');
    onHomeClick();
  };

  const handlePower = () => {
    sound.playClick(750, 0.03);
    triggerHaptic('light');
    onPowerClick();
  };

  const handleMute = () => {
    sound.playClick(850, 0.03);
    triggerHaptic('light');
    onMuteToggle();
  };

  // If user is on an actual iPhone 4 or has chosen fullscreen mode:
  if (!showFrame) {
    return (
      <div className="w-full h-full max-w-[480px] max-h-[720px] aspect-[2/3] mx-auto overflow-hidden bg-black flex flex-col relative shadow-2xl">
        {children}
      </div>
    );
  }

  const isWhite = color === 'white';
  const glassBg = isWhite ? 'bg-[#f4f4f4]' : 'bg-[#0a0a0a]';
  const textContrast = isWhite ? 'text-neutral-700' : 'text-neutral-400';
  const homeIconColor = isWhite ? 'border-neutral-400' : 'border-neutral-400';

  return (
    <div className="relative flex items-center justify-center p-2 sm:p-6 select-none max-w-full">
      {/* Outer Stainless Steel Antenna Band */}
      <div
        className="relative rounded-[50px] p-[3px] shadow-[0_25px_60px_rgba(0,0,0,0.85),0_10px_20px_rgba(0,0,0,0.6)]"
        style={{
          background: 'linear-gradient(135deg, #e2e8f0 0%, #94a3b8 25%, #cbd5e1 50%, #64748b 75%, #cbd5e1 100%)',
          boxShadow: '0 0 0 1px #475569, inset 0 1px 2px rgba(255,255,255,0.9), inset 0 -1px 2px rgba(0,0,0,0.6)',
        }}
      >
        {/* Antenna break lines (Antennagate tribute) */}
        <div className="absolute top-[85px] -left-[3px] w-[3px] h-[3.5px] bg-[#1e293b]" />
        <div className="absolute top-[85px] -right-[3px] w-[3px] h-[3.5px] bg-[#1e293b]" />
        <div className="absolute top-[2px] right-[75px] w-[3.5px] h-[3px] bg-[#1e293b]" />

        {/* Hardware Buttons on Band */}
        {/* Top: Power / Sleep button */}
        <button
          onClick={handlePower}
          title="Sleep / Wake (Power)"
          className="absolute -top-[5px] right-[65px] w-[46px] h-[4px] bg-gradient-to-r from-neutral-300 via-neutral-100 to-neutral-400 rounded-t-xs border-t border-neutral-100 hover:brightness-110 active:translate-y-[1px] transition-all cursor-pointer shadow-xs"
        />

        {/* Top: 3.5mm Headphone Jack */}
        <div className="absolute -top-[2px] left-[75px] w-[11px] h-[3px] bg-[#0f172a] rounded-t-xs shadow-inner" />

        {/* Left: Ring / Silent Switch */}
        <button
          onClick={handleMute}
          title={isMuted ? 'Muted (Click to Unmute)' : 'Ringer On (Click to Mute)'}
          className={`absolute top-[98px] -left-[6px] w-[5px] h-[22px] rounded-l-xs border-l border-neutral-200 cursor-pointer shadow-md transition-all ${
            isMuted ? 'bg-amber-700 translate-x-[1px]' : 'bg-neutral-300'
          }`}
        >
          {isMuted && <span className="block w-full h-[2px] bg-orange-500 mt-1" />}
        </button>

        {/* Left: Volume + Button */}
        <button
          onClick={() => sound.playClick(900, 0.02)}
          title="Volume +"
          className="absolute top-[140px] -left-[6px] w-[5px] h-[18px] bg-neutral-300 hover:bg-white rounded-l-full border-l border-neutral-200 active:translate-x-[1px] cursor-pointer shadow-xs flex items-center justify-center text-[8px] text-neutral-600 font-bold"
        >
          +
        </button>

        {/* Left: Volume - Button */}
        <button
          onClick={() => sound.playClick(700, 0.02)}
          title="Volume -"
          className="absolute top-[175px] -left-[6px] w-[5px] h-[18px] bg-neutral-300 hover:bg-white rounded-l-full border-l border-neutral-200 active:translate-x-[1px] cursor-pointer shadow-xs flex items-center justify-center text-[9px] text-neutral-600 font-bold"
        >
          -
        </button>

        {/* Front Glass Surface (Aluminosilicate glass) */}
        <div
          className={`relative w-[350px] h-[670px] rounded-[46px] ${glassBg} p-3 flex flex-col items-center justify-between border border-black/40 overflow-hidden shadow-inner`}
        >
          {/* Diagonal Glass Sheen Reflection */}
          <div
            className="absolute -top-[100px] -left-[100px] w-[550px] h-[400px] bg-gradient-to-br from-white/12 via-white/5 to-transparent rotate-[-35deg] pointer-events-none z-30"
          />

          {/* Top Forehead: Camera, Speaker, Sensor */}
          <div className="relative w-full pt-4 pb-2 flex flex-col items-center">
            {/* FaceTime Camera */}
            <div className="absolute left-[85px] top-[26px] w-[9px] h-[9px] rounded-full bg-[#050b14] border border-neutral-600/50 shadow-inner flex items-center justify-center">
              {/* Blue antireflective coating dot */}
              <div className="w-[3px] h-[3px] rounded-full bg-cyan-700/60" />
            </div>

            {/* Receiver Ear Speaker Grill */}
            <div className="w-[52px] h-[5.5px] rounded-full bg-[#111827] border border-neutral-500/40 shadow-[inset_0_1px_2px_rgba(0,0,0,0.9)] flex items-center justify-center">
              {/* Mesh dots */}
              <div className="w-10 h-[1.5px] bg-neutral-600/80 rounded-full" />
            </div>

            {/* Proximity / Ambient Sensor */}
            <div className="w-[6px] h-[6px] rounded-full bg-neutral-900 mt-1 opacity-70" />
          </div>

          {/* Retina Screen: 3.5-inch 3:2 Display (320 x 480 points) */}
          <div
            className="relative w-[320px] h-[480px] bg-black rounded-xs overflow-hidden border border-black/80 shadow-[0_0_12px_rgba(0,0,0,0.95)] z-10 flex flex-col"
            style={{
              boxShadow: 'inset 0 0 4px rgba(0,0,0,0.8), 0 0 1px rgba(255,255,255,0.1)',
            }}
          >
            {children}
          </div>

          {/* Bottom Chin: The Iconic Concave Home Button */}
          <div className="relative w-full py-3 flex items-center justify-center">
            <button
              onClick={handleHome}
              title="Home Button (Exit to Home Screen)"
              className="relative w-[60px] h-[60px] rounded-full cursor-pointer focus:outline-hidden active:scale-95 transition-transform flex items-center justify-center"
              style={{
                background: isWhite
                  ? 'radial-gradient(circle at 45% 45%, #ffffff 0%, #e2e8f0 75%, #cbd5e1 100%)'
                  : 'radial-gradient(circle at 45% 45%, #262626 0%, #141414 75%, #050505 100%)',
                boxShadow: isWhite
                  ? 'inset 0 2px 4px rgba(0,0,0,0.35), 0 1px 1px rgba(255,255,255,0.8)'
                  : 'inset 0 2px 5px rgba(0,0,0,0.9), 0 1px 1px rgba(255,255,255,0.15)',
              }}
            >
              {/* Concave rim */}
              <div className="absolute inset-[2px] rounded-full border border-black/25 pointer-events-none" />

              {/* The iconic rounded square icon */}
              <div
                className={`w-[20px] h-[20px] rounded-[6px] border-[2px] ${homeIconColor} opacity-75 shadow-xs`}
              />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
