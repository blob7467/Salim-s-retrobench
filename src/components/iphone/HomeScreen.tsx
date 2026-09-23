import React from 'react';
import { AppId, GameScore } from '../../types';
import { StatusBar } from './StatusBar';
import { sound } from '../../audio/soundEffects';
import { triggerHaptic } from '../../utils/storage';

interface HomeScreenProps {
  onOpenApp: (appId: AppId) => void;
  scores: GameScore;
  wallpaper: 'droplets' | 'linen' | 'gradient';
}

interface AppIconConfig {
  id: AppId;
  label: string;
  badge?: string | number;
  renderIcon: () => React.ReactNode;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({ onOpenApp, scores, wallpaper }) => {
  const handleLaunch = (id: AppId) => {
    sound.playClick(950, 0.04);
    triggerHaptic('light');
    onOpenApp(id);
  };

  const mainApps: AppIconConfig[] = [
    {
      id: 'fruit_slash',
      label: 'Blade Fruit',
      badge: scores.fruitSlash > 0 ? `${scores.fruitSlash}` : undefined,
      renderIcon: () => (
        <div className="w-full h-full bg-gradient-to-br from-amber-800 to-amber-950 flex flex-col items-center justify-center relative overflow-hidden">
          {/* Wood plank texture */}
          <div className="absolute inset-0 opacity-40 bg-[repeating-linear-gradient(0deg,transparent,transparent_6px,rgba(0,0,0,0.3)_6px,rgba(0,0,0,0.3)_8px)]" />
          {/* Sliced Watermelon Icon */}
          <div className="relative text-2xl drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
            🍉
          </div>
          {/* Slash katana trail graphic */}
          <div className="absolute w-[120%] h-[3px] bg-cyan-200 shadow-[0_0_8px_#38bdf8] rotate-[-40deg] opacity-80" />
        </div>
      ),
    },
    {
      id: 'doodle_leap',
      label: 'Doodle Leap',
      badge: scores.doodleLeap > 0 ? `${scores.doodleLeap}m` : undefined,
      renderIcon: () => (
        <div className="w-full h-full doodle-grid flex flex-col items-center justify-center relative overflow-hidden border border-neutral-300">
          {/* Doodle alien character */}
          <div className="text-2xl transform -translate-y-0.5 drop-shadow-[0_2px_3px_rgba(0,0,0,0.4)]">
            🐸
          </div>
          {/* Small green platform below */}
          <div className="w-6 h-1.5 bg-lime-500 rounded-full border border-lime-700 shadow-sm mt-[-2px]" />
        </div>
      ),
    },
    {
      id: 'labyrinth',
      label: 'Labyrinth 3D',
      badge: scores.labyrinthStars > 0 ? `★ ${scores.labyrinthStars}` : undefined,
      renderIcon: () => (
        <div className="w-full h-full walnut-board flex items-center justify-center relative overflow-hidden border border-amber-900/60">
          {/* Maze brass walls */}
          <div className="absolute w-8 h-8 border-2 border-amber-400/80 rounded-sm" />
          <div className="absolute top-2 right-2 w-3.5 h-3.5 bg-black rounded-full shadow-[inset_0_2px_3px_rgba(0,0,0,0.9)]" />
          {/* Steel ball */}
          <div
            className="w-4 h-4 rounded-full bg-gradient-to-tr from-neutral-500 via-neutral-200 to-white shadow-[0_2px_4px_rgba(0,0,0,0.8)] relative"
            style={{
              boxShadow: '0 2px 5px rgba(0,0,0,0.9), inset -1px -1px 2px rgba(0,0,0,0.5)',
            }}
          />
        </div>
      ),
    },
    {
      id: 'ipa_export',
      label: 'Export IPA',
      badge: 'iOS 6',
      renderIcon: () => (
        <div className="w-full h-full bg-gradient-to-br from-[#1d4ed8] via-[#1e40af] to-[#172554] flex flex-col items-center justify-center relative overflow-hidden border border-blue-900">
          <div className="text-2xl drop-shadow-[0_2px_3px_rgba(0,0,0,0.6)]">📦</div>
          <span className="text-[7px] font-mono font-black text-blue-200 mt-0.5 tracking-wider">.IPA</span>
        </div>
      ),
    },
  ];

  const dockApps: AppIconConfig[] = [
    {
      id: 'game_center',
      label: 'Game Center',
      renderIcon: () => (
        <div className="w-full h-full ios-felt flex items-center justify-center relative overflow-hidden border border-emerald-950">
          {/* 4 Colored gloss spheres */}
          <div className="grid grid-cols-2 gap-1 p-2">
            <div className="w-3.5 h-3.5 rounded-full bg-gradient-to-b from-blue-400 to-blue-600 shadow-[0_1px_2px_rgba(0,0,0,0.6)]" />
            <div className="w-3.5 h-3.5 rounded-full bg-gradient-to-b from-green-400 to-green-600 shadow-[0_1px_2px_rgba(0,0,0,0.6)]" />
            <div className="w-3.5 h-3.5 rounded-full bg-gradient-to-b from-yellow-300 to-amber-500 shadow-[0_1px_2px_rgba(0,0,0,0.6)]" />
            <div className="w-3.5 h-3.5 rounded-full bg-gradient-to-b from-red-400 to-red-600 shadow-[0_1px_2px_rgba(0,0,0,0.6)]" />
          </div>
        </div>
      ),
    },
    {
      id: 'settings',
      label: 'Settings',
      renderIcon: () => (
        <div className="w-full h-full bg-gradient-to-b from-neutral-300 via-neutral-400 to-neutral-500 flex items-center justify-center relative overflow-hidden">
          <div className="text-2xl drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)]">⚙️</div>
        </div>
      ),
    },
  ];

  return (
    <div className="relative w-full h-full flex flex-col justify-between select-none overflow-hidden">
      {/* Wallpaper */}
      <div className="absolute inset-0 z-0">
        {wallpaper === 'droplets' ? (
          <div className="w-full h-full bg-gradient-to-b from-[#16252f] via-[#0e171d] to-[#060a0d] relative">
            <div
              className="absolute inset-0 opacity-40"
              style={{
                backgroundImage: `radial-gradient(circle at 40% 30%, rgba(255,255,255,0.35) 0%, transparent 40%),
                  radial-gradient(circle at 75% 65%, rgba(255,255,255,0.25) 0%, transparent 35%)`,
              }}
            />
          </div>
        ) : wallpaper === 'linen' ? (
          <div className="w-full h-full ios-linen" />
        ) : (
          <div className="w-full h-full bg-gradient-to-b from-slate-900 via-indigo-950 to-neutral-950" />
        )}
      </div>

      {/* Top Status Bar */}
      <div className="relative z-10 w-full">
        <StatusBar />
      </div>

      {/* Springboard App Grid */}
      <div className="relative z-10 flex-1 px-4 pt-4 pb-2 flex flex-col">
        {/* Header Title / Banner */}
        <div className="text-center mb-3">
          <div
            className="text-[13px] font-bold text-white tracking-wide"
            style={{ textShadow: '0 1px 3px rgba(0,0,0,0.9)' }}
          >
            RETINA ARCADE · iOS 6
          </div>
          <div
            className="text-[10px] text-white/75 font-medium"
            style={{ textShadow: '0 1px 2px rgba(0,0,0,0.8)' }}
          >
            Golden Skeuomorphic Era on iPhone 4
          </div>
        </div>

        {/* Apps Grid */}
        <div className="grid grid-cols-3 gap-y-4 gap-x-3 justify-items-center">
          {mainApps.map((app) => (
            <button
              key={app.id}
              onClick={() => handleLaunch(app.id)}
              className="group flex flex-col items-center focus:outline-hidden cursor-pointer transition-transform active:scale-95"
            >
              <div className="relative w-[60px] h-[60px] rounded-xl shadow-[0_4px_8px_rgba(0,0,0,0.7),inset_0_1px_1px_rgba(255,255,255,0.6)] overflow-hidden border border-white/20">
                {app.renderIcon()}
                {/* Skeuomorphic Glass Reflection Arc */}
                <div className="absolute inset-0 glossy-sheen pointer-events-none" />
                {/* Badge if present */}
                {app.badge && (
                  <div className="absolute -top-1 -right-1 bg-red-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full border border-white shadow-md">
                    {app.badge}
                  </div>
                )}
              </div>
              <span
                className="mt-1.5 text-[11px] font-medium text-white tracking-tight drop-shadow-[0_1px_2px_rgba(0,0,0,1)] text-center leading-tight max-w-[68px] truncate"
              >
                {app.label}
              </span>
            </button>
          ))}
        </div>

        {/* Quick Launch Instruction banner */}
        <div className="mt-auto mb-2 text-center">
          <div className="inline-block bg-black/40 backdrop-blur-xs border border-white/15 px-3 py-1 rounded-full text-[10px] text-neutral-300 shadow-sm">
            Tap an app to launch · Home button to exit
          </div>
        </div>
      </div>

      {/* Classic 3D Reflective Glass Dock */}
      <div className="relative z-10 w-full px-3 pb-3 pt-1">
        {/* Dock Glass Shelf */}
        <div className="relative w-full rounded-2xl bg-white/10 backdrop-blur-md border border-white/25 px-5 py-2.5 shadow-2xl flex items-center justify-around overflow-hidden">
          {/* Metallic reflective floor effect */}
          <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-white/20 to-transparent pointer-events-none" />

          {dockApps.map((app) => (
            <button
              key={app.id}
              onClick={() => handleLaunch(app.id)}
              className="flex flex-col items-center focus:outline-hidden cursor-pointer active:scale-95 transition-transform"
            >
              <div className="relative w-[56px] h-[56px] rounded-xl shadow-[0_4px_8px_rgba(0,0,0,0.8),inset_0_1px_1px_rgba(255,255,255,0.7)] overflow-hidden border border-white/25">
                {app.renderIcon()}
                {/* Gloss reflection */}
                <div className="absolute inset-0 glossy-sheen pointer-events-none" />
              </div>
              <span className="mt-1 text-[10px] font-semibold text-white tracking-tight drop-shadow-[0_1px_2px_rgba(0,0,0,1)] text-center">
                {app.label}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
