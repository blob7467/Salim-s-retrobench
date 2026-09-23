/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { AppId, GameScore, Achievement, SystemSettings } from './types';
import {
  loadScores,
  saveScores,
  loadAchievements,
  saveAchievements,
  loadSettings,
  saveSettings,
  triggerHaptic,
} from './utils/storage';
import { sound } from './audio/soundEffects';
import { IPhoneFrame } from './components/iphone/IPhoneFrame';
import { LockScreen } from './components/iphone/LockScreen';
import { HomeScreen } from './components/iphone/HomeScreen';
import { FruitNinjaGame } from './components/games/FruitNinjaGame';
import { DoodleJumpGame } from './components/games/DoodleJumpGame';
import { LabyrinthGame } from './components/games/LabyrinthGame';
import { GameCenterApp } from './components/apps/GameCenterApp';
import { SettingsApp } from './components/apps/SettingsApp';
import { IpaExportModal } from './components/modals/IpaExportModal';
import { Smartphone, Lock, Unlock, Volume2, VolumeX, Sparkles, Package } from 'lucide-react';

export default function App() {
  const [isLocked, setIsLocked] = useState(false);
  const [currentApp, setCurrentApp] = useState<AppId>('home');
  const [showIpaModal, setShowIpaModal] = useState(false);
  const [scores, setScores] = useState<GameScore>(loadScores);
  const [achievements, setAchievements] = useState<Achievement[]>(loadAchievements);
  const [settings, setSettings] = useState<SystemSettings>(loadSettings);
  const [recentAchievement, setRecentAchievement] = useState<Achievement | null>(null);

  // Sync sound system with settings
  useEffect(() => {
    sound.enabled = settings.soundEnabled;
  }, [settings.soundEnabled]);

  // Persist scores
  const handleUpdateFruitScore = (score: number) => {
    setScores((prev) => {
      const next = { ...prev, fruitSlash: Math.max(prev.fruitSlash, score) };
      saveScores(next);
      return next;
    });
  };

  const handleUpdateDoodleScore = (score: number) => {
    setScores((prev) => {
      const next = { ...prev, doodleLeap: Math.max(prev.doodleLeap, score) };
      saveScores(next);
      return next;
    });
  };

  const handleUpdateLabyrinthStars = (stars: number) => {
    setScores((prev) => {
      const next = { ...prev, labyrinthStars: Math.max(prev.labyrinthStars, stars) };
      saveScores(next);
      return next;
    });
  };

  const handleUnlockAchievement = (id: string) => {
    setAchievements((prev) => {
      const item = prev.find((a) => a.id === id);
      if (item && !item.unlocked) {
        const next = prev.map((a) => (a.id === id ? { ...a, unlocked: true } : a));
        saveAchievements(next);
        sound.playCombo(4);
        triggerHaptic('medium');
        setRecentAchievement(item);
        setTimeout(() => setRecentAchievement(null), 3500);
        return next;
      }
      return prev;
    });
  };

  const handleUpdateSettings = (newSettings: SystemSettings) => {
    setSettings(newSettings);
    saveSettings(newSettings);
  };

  const handleHomeClick = () => {
    if (isLocked) return;
    setCurrentApp('home');
  };

  const handlePowerClick = () => {
    setIsLocked((prev) => !prev);
  };

  const handleToggleMute = () => {
    const next = !settings.soundEnabled;
    handleUpdateSettings({ ...settings, soundEnabled: next });
  };

  return (
    <div className="min-h-screen w-full bg-[#121316] text-neutral-200 flex flex-col items-center justify-between overflow-x-hidden font-sans relative selection:bg-blue-500 selection:text-white">
      {/* Top Desktop Helper Toolbar */}
      <header className="w-full max-w-4xl px-4 py-3 flex flex-wrap items-center justify-between gap-3 text-xs border-b border-white/5 bg-neutral-900/60 backdrop-blur-md z-40">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-neutral-200 via-neutral-300 to-neutral-500 border border-white/40 flex items-center justify-center text-xs font-bold text-black shadow-xs">
            4
          </div>
          <div>
            <h1 className="font-bold text-sm tracking-tight text-white flex items-center gap-1.5">
              <span>iPhone 4 Retro Arcade</span>
              <span className="text-[10px] text-blue-300 bg-blue-950/80 px-1.5 py-0.5 rounded-sm border border-blue-500/40 font-mono">
                {settings.osVersion === 'ios6' ? 'iOS 6.1.6' : 'iOS 4.3'}
              </span>
            </h1>
            <p className="text-[11px] text-neutral-400 hidden sm:block">
              Peak Skeuomorphism · Blade Fruit, Doodle Leap & Labyrinth 3D
            </p>
          </div>
        </div>

        {/* Quick Simulator Controls */}
        <div className="flex items-center gap-2">
          {/* Export IPA Button */}
          <button
            onClick={() => {
              sound.playClick(900, 0.03);
              setShowIpaModal(true);
            }}
            className="px-3 py-1.5 rounded-lg bg-gradient-to-b from-blue-600 via-blue-700 to-indigo-800 hover:brightness-110 active:scale-95 border border-blue-400/50 text-white flex items-center gap-1.5 cursor-pointer font-bold shadow-md text-xs transition-all"
            title="Export iOS 6 .IPA for iPhone 4"
          >
            <Package className="w-3.5 h-3.5" />
            <span>Export .IPA</span>
          </button>

          {/* Shell Toggle */}
          <button
            onClick={() => handleUpdateSettings({ ...settings, showDeviceFrame: !settings.showDeviceFrame })}
            className={`px-3 py-1.5 rounded-lg border flex items-center gap-1.5 transition-all cursor-pointer font-medium ${
              settings.showDeviceFrame
                ? 'bg-neutral-800 text-white border-neutral-600'
                : 'bg-blue-600/30 text-blue-200 border-blue-500'
            }`}
            title="Toggle between iPhone 4 Bezel and Fullscreen Canvas"
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>{settings.showDeviceFrame ? 'Frame: ON' : 'Fullscreen'}</span>
          </button>

          {/* Lock / Sleep Toggle */}
          <button
            onClick={handlePowerClick}
            className="px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 active:scale-95 border border-neutral-700 text-neutral-200 flex items-center gap-1.5 cursor-pointer font-medium"
            title="Lock or Wake Screen"
          >
            {isLocked ? <Lock className="w-3.5 h-3.5 text-amber-400" /> : <Unlock className="w-3.5 h-3.5 text-emerald-400" />}
            <span className="hidden sm:inline">{isLocked ? 'Locked' : 'Unlocked'}</span>
          </button>

          {/* Sound Toggle */}
          <button
            onClick={handleToggleMute}
            className={`p-2 rounded-lg border transition-colors cursor-pointer ${
              settings.soundEnabled
                ? 'bg-neutral-800 hover:bg-neutral-700 border-neutral-700 text-neutral-200'
                : 'bg-red-950/40 border-red-800 text-red-400'
            }`}
            title={settings.soundEnabled ? 'Mute Audio' : 'Unmute Audio'}
          >
            {settings.soundEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
          </button>
        </div>
      </header>

      {/* Center iPhone 4 Device Stage */}
      <main className="flex-1 w-full flex items-center justify-center p-1 sm:p-4 relative">
        <IPhoneFrame
          color={settings.iphoneColor}
          showFrame={settings.showDeviceFrame}
          onHomeClick={handleHomeClick}
          onPowerClick={handlePowerClick}
          onMuteToggle={handleToggleMute}
          isMuted={!settings.soundEnabled}
        >
          {/* iOS Push Notification Banner for Achievements */}
          {recentAchievement && (
            <div className="absolute top-6 inset-x-2 z-50 animate-in slide-in-from-top-4 duration-300">
              <div className="bg-neutral-900/95 border border-white/20 rounded-xl p-2.5 shadow-2xl flex items-center gap-2 text-white">
                <span className="text-xl">{recentAchievement.icon}</span>
                <div className="flex-1">
                  <div className="text-[10px] text-amber-300 uppercase font-bold flex items-center gap-1">
                    <Sparkles className="w-2.5 h-2.5" />
                    <span>Achievement Unlocked!</span>
                  </div>
                  <div className="text-xs font-bold">{recentAchievement.title}</div>
                  <div className="text-[9px] text-neutral-300 leading-tight">
                    +{recentAchievement.points} Game Center Points
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Screen Content Dispatcher */}
          {isLocked ? (
            <LockScreen
              wallpaper={settings.wallpaper}
              onUnlock={() => setIsLocked(false)}
            />
          ) : currentApp === 'home' ? (
            <HomeScreen
              wallpaper={settings.wallpaper}
              scores={scores}
              onOpenApp={(appId) => {
                if (appId === 'ipa_export') {
                  setShowIpaModal(true);
                } else {
                  setCurrentApp(appId);
                }
              }}
            />
          ) : currentApp === 'fruit_slash' ? (
            <FruitNinjaGame
              highScore={scores.fruitSlash}
              onUpdateScore={handleUpdateFruitScore}
              onUnlockAchievement={handleUnlockAchievement}
              onExit={() => setCurrentApp('home')}
            />
          ) : currentApp === 'doodle_leap' ? (
            <DoodleJumpGame
              highScore={scores.doodleLeap}
              onUpdateScore={handleUpdateDoodleScore}
              onUnlockAchievement={handleUnlockAchievement}
              onExit={() => setCurrentApp('home')}
              tiltSensitivity={settings.tiltSensitivity}
            />
          ) : currentApp === 'labyrinth' ? (
            <LabyrinthGame
              onUnlockAchievement={handleUnlockAchievement}
              onUpdateStars={handleUpdateLabyrinthStars}
              onExit={() => setCurrentApp('home')}
              tiltSensitivity={settings.tiltSensitivity}
            />
          ) : currentApp === 'game_center' ? (
            <GameCenterApp
              scores={scores}
              achievements={achievements}
              onExit={() => setCurrentApp('home')}
            />
          ) : currentApp === 'settings' ? (
            <SettingsApp
              settings={settings}
              onUpdateSettings={handleUpdateSettings}
              onExit={() => setCurrentApp('home')}
              onOpenIpaModal={() => setShowIpaModal(true)}
            />
          ) : null}
        </IPhoneFrame>
      </main>

      {/* Bottom Footer Info */}
      <footer className="w-full max-w-4xl px-4 py-2.5 text-center text-xs text-neutral-500 border-t border-white/5 bg-neutral-900/40">
        <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1">
          <span>iPhone 4 (A1332) · iOS 6.1.6</span>
          <span>·</span>
          <span>3.5" Retina Display (960×640)</span>
          <span>·</span>
          <span>Hardware 3-Axis Gyroscope</span>
          <span>·</span>
          <button
            onClick={() => handleUpdateSettings({ ...settings, iphoneColor: settings.iphoneColor === 'black' ? 'white' : 'black' })}
            className="hover:text-neutral-300 underline cursor-pointer"
          >
            Switch to {settings.iphoneColor === 'black' ? 'White' : 'Black'} Glass
          </button>
        </div>
      </footer>

      {/* iOS 6 .IPA Export & iPhone 4 Sideloading Center Modal */}
      <IpaExportModal
        isOpen={showIpaModal}
        onClose={() => setShowIpaModal(false)}
      />
    </div>
  );
}
