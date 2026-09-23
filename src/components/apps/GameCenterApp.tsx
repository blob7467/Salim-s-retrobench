import React, { useState } from 'react';
import { StatusBar } from '../iphone/StatusBar';
import { Achievement, GameScore } from '../../types';
import { sound } from '../../audio/soundEffects';
import { Trophy, Award, ArrowLeft, Star, Smartphone } from 'lucide-react';

interface GameCenterProps {
  scores: GameScore;
  achievements: Achievement[];
  onExit: () => void;
}

export const GameCenterApp: React.FC<GameCenterProps> = ({
  scores,
  achievements,
  onExit,
}) => {
  const [activeTab, setActiveTab] = useState<'games' | 'achievements'>('games');

  const totalPoints = achievements
    .filter((a) => a.unlocked)
    .reduce((sum, a) => sum + a.points, 0);

  const unlockedCount = achievements.filter((a) => a.unlocked).length;

  return (
    <div className="relative w-full h-full flex flex-col justify-between select-none overflow-hidden ios-felt text-white">
      {/* Status Bar */}
      <div className="relative z-20 w-full flex flex-col">
        <StatusBar theme="felt" />
        {/* iOS 6 Game Center Navigation Header */}
        <div className="flex items-center justify-between px-3 py-2 bg-black/40 backdrop-blur-xs border-b border-emerald-900/60 shadow-md">
          <button
            onClick={() => {
              sound.playClick(750, 0.03);
              onExit();
            }}
            className="px-2.5 py-1 rounded-md bg-white/10 hover:bg-white/20 active:scale-95 text-xs font-semibold flex items-center gap-1 border border-white/20 shadow-xs"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Home
          </button>

          <span
            className="text-sm font-bold tracking-wide"
            style={{ textShadow: '0 1px 2px rgba(0,0,0,0.8)' }}
          >
            Game Center
          </span>

          <div className="w-12 text-right">
            <span className="text-[10px] text-amber-300 font-bold">{totalPoints} pts</span>
          </div>
        </div>
      </div>

      {/* Profile Overview Card */}
      <div className="relative z-10 px-3 pt-3">
        <div className="bg-black/35 backdrop-blur-xs rounded-xl p-2.5 border border-white/15 flex items-center gap-3 shadow-md">
          {/* 4 Colored balls badge */}
          <div className="w-12 h-12 rounded-xl bg-gradient-to-b from-emerald-700 to-emerald-900 border border-white/25 flex items-center justify-center shadow-inner relative overflow-hidden">
            <div className="grid grid-cols-2 gap-1 p-1">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-400 shadow-xs" />
              <span className="w-2.5 h-2.5 rounded-full bg-green-400 shadow-xs" />
              <span className="w-2.5 h-2.5 rounded-full bg-yellow-300 shadow-xs" />
              <span className="w-2.5 h-2.5 rounded-full bg-red-400 shadow-xs" />
            </div>
            <div className="absolute inset-0 glossy-sheen pointer-events-none" />
          </div>

          <div className="flex-1">
            <div className="text-xs font-bold text-neutral-100 flex items-center gap-1">
              <span>iPhone 4 Player</span>
              <Smartphone className="w-3 h-3 text-emerald-400" />
            </div>
            <div className="text-[10px] text-neutral-300 mt-0.5">
              Achievements: <span className="text-amber-300 font-semibold">{unlockedCount}/{achievements.length}</span>
            </div>
            <div className="text-[10px] text-emerald-300 font-medium">
              Score: {totalPoints} / {achievements.reduce((s, a) => s + a.points, 0)} Points
            </div>
          </div>
        </div>
      </div>

      {/* Segmented Tab Controls (Classic iOS 4 style) */}
      <div className="relative z-10 px-3 pt-2">
        <div className="w-full flex bg-black/40 p-0.5 rounded-lg border border-white/15">
          <button
            onClick={() => {
              sound.playClick(850, 0.02);
              setActiveTab('games');
            }}
            className={`flex-1 py-1 text-center text-xs font-semibold rounded-md transition-colors ${
              activeTab === 'games'
                ? 'bg-white/25 text-white shadow-inner'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            Leaderboards
          </button>
          <button
            onClick={() => {
              sound.playClick(850, 0.02);
              setActiveTab('achievements');
            }}
            className={`flex-1 py-1 text-center text-xs font-semibold rounded-md transition-colors ${
              activeTab === 'achievements'
                ? 'bg-white/25 text-white shadow-inner'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            Achievements
          </button>
        </div>
      </div>

      {/* Tab Content List */}
      <div className="relative z-10 flex-1 px-3 py-2 overflow-y-auto">
        {activeTab === 'games' ? (
          <div className="space-y-2">
            {/* Blade Fruit */}
            <div className="bg-black/30 rounded-xl p-3 border border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="text-2xl">🍉</span>
                <div>
                  <div className="text-xs font-bold">Blade Fruit</div>
                  <div className="text-[10px] text-neutral-300">Dojo Slicing Highscore</div>
                </div>
              </div>
              <div className="text-right">
                <span className="text-base font-black text-amber-300">{scores.fruitSlash}</span>
                <span className="text-[9px] text-neutral-400 block">slices</span>
              </div>
            </div>

            {/* Doodle Leap */}
            <div className="bg-black/30 rounded-xl p-3 border border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="text-2xl">🐸</span>
                <div>
                  <div className="text-xs font-bold">Doodle Leap</div>
                  <div className="text-[10px] text-neutral-300">Max Altitude Ascended</div>
                </div>
              </div>
              <div className="text-right">
                <span className="text-base font-black text-lime-400">{scores.doodleLeap}m</span>
                <span className="text-[9px] text-neutral-400 block">height</span>
              </div>
            </div>

            {/* Labyrinth 3D */}
            <div className="bg-black/30 rounded-xl p-3 border border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="text-2xl">⭐</span>
                <div>
                  <div className="text-xs font-bold">Labyrinth 3D</div>
                  <div className="text-[10px] text-neutral-300">Stars Collected in Maze</div>
                </div>
              </div>
              <div className="text-right">
                <span className="text-base font-black text-yellow-300">★ {scores.labyrinthStars}</span>
                <span className="text-[9px] text-neutral-400 block">stars</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            {achievements.map((ach) => (
              <div
                key={ach.id}
                className={`rounded-xl p-2.5 border transition-all flex items-center gap-2.5 ${
                  ach.unlocked
                    ? 'bg-black/40 border-amber-400/40 text-white'
                    : 'bg-black/20 border-white/5 text-neutral-400 opacity-65'
                }`}
              >
                <div className="text-2xl w-8 text-center">{ach.icon}</div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className={`text-xs font-bold ${ach.unlocked ? 'text-amber-200' : 'text-neutral-400'}`}>
                      {ach.title}
                    </span>
                    <span className="text-[10px] font-bold text-amber-300 bg-amber-950/60 px-1.5 py-0.5 rounded-sm border border-amber-500/30">
                      {ach.points} pts
                    </span>
                  </div>
                  <p className="text-[10px] text-neutral-300 mt-0.5 leading-tight">
                    {ach.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Bottom info banner */}
      <div className="relative z-20 py-2 px-3 bg-black/50 border-t border-emerald-950 text-center text-[10px] text-neutral-400">
        iOS 4.0 Game Center · Retina Highscores
      </div>
    </div>
  );
};
