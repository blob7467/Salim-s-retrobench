import React from 'react';
import { StatusBar } from '../iphone/StatusBar';
import { SystemSettings, OSVersion } from '../../types';
import { sound } from '../../audio/soundEffects';
import { ArrowLeft, Volume2, Smartphone, Sliders, Image as ImageIcon, Sparkles, Check, Package, Download, ChevronRight } from 'lucide-react';

interface SettingsAppProps {
  settings: SystemSettings;
  onUpdateSettings: (newSettings: SystemSettings) => void;
  onExit: () => void;
  onOpenIpaModal?: () => void;
}

// iOS 6 Skeuomorphic Toggle Switch
const IOS6Switch: React.FC<{
  checked: boolean;
  onChange: (val: boolean) => void;
}> = ({ checked, onChange }) => {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`relative w-[68px] h-[27px] rounded-full p-[2px] transition-colors cursor-pointer select-none border overflow-hidden ${
        checked
          ? 'bg-gradient-to-b from-[#1b6cdb] via-[#2d7ee8] to-[#155fc3] border-[#0e4896] shadow-[inset_0_2px_4px_rgba(0,0,0,0.5)]'
          : 'bg-gradient-to-b from-[#e3e3e3] via-[#f0f0f0] to-[#dedede] border-[#b0b0b0] shadow-[inset_0_1px_3px_rgba(0,0,0,0.3)]'
      }`}
    >
      {/* Background Label */}
      <div className="absolute inset-0 flex items-center justify-between px-2 text-[10px] font-black pointer-events-none">
        <span
          className={`transition-opacity tracking-wider ${
            checked ? 'opacity-100 text-white' : 'opacity-0'
          }`}
          style={{ textShadow: '0 -1px 1px rgba(0,0,0,0.6)' }}
        >
          ON
        </span>
        <span
          className={`transition-opacity tracking-wider ${
            !checked ? 'opacity-100 text-neutral-500' : 'opacity-0'
          }`}
          style={{ textShadow: '0 1px 0 rgba(255,255,255,0.8)' }}
        >
          OFF
        </span>
      </div>

      {/* Silver Embossed Knob */}
      <div
        className={`relative z-10 w-[23px] h-[23px] rounded-full bg-gradient-to-b from-[#ffffff] via-[#e6e8ea] to-[#cfd3d8] border border-[#9fa6b2] shadow-[0_1px_3px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.9)] transform transition-transform duration-200 flex items-center justify-center ${
          checked ? 'translate-x-[41px]' : 'translate-x-0'
        }`}
      >
        {/* Triple grip vertical micro-lines */}
        <div className="flex gap-[1.5px] items-center justify-center opacity-40">
          <span className="w-[1px] h-2.5 bg-neutral-700" />
          <span className="w-[1px] h-2.5 bg-neutral-700" />
          <span className="w-[1px] h-2.5 bg-neutral-700" />
        </div>
      </div>
    </button>
  );
};

export const SettingsApp: React.FC<SettingsAppProps> = ({
  settings,
  onUpdateSettings,
  onExit,
  onOpenIpaModal,
}) => {
  const update = (partial: Partial<SystemSettings>) => {
    sound.playClick(900, 0.02);
    const next = { ...settings, ...partial };
    if (partial.soundEnabled !== undefined) {
      sound.enabled = partial.soundEnabled;
    }
    onUpdateSettings(next);
  };

  const isIOS6 = settings.osVersion === 'ios6';

  return (
    <div className="relative w-full h-full flex flex-col justify-between select-none overflow-hidden bg-[#eef0f3] text-neutral-900">
      {/* Top Header with iOS 6 Silver Slate Navigation Bar */}
      <div className="relative z-20 w-full flex flex-col">
        <StatusBar theme="silver" />
        <div
          className={`flex items-center justify-between px-2.5 py-1.5 shadow-md border-b ${
            isIOS6
              ? 'bg-gradient-to-b from-[#b2b9c3] via-[#8e98a7] to-[#717e92] border-[#536173] text-white'
              : 'bg-gradient-to-b from-[#879bb1] via-[#6d84a2] to-[#557090] border-[#3b516b] text-white'
          }`}
          style={{ textShadow: '0 -1px 0 rgba(0,0,0,0.6)' }}
        >
          {/* iOS Chevron-style Back/Home button */}
          <button
            onClick={() => {
              sound.playClick(750, 0.03);
              onExit();
            }}
            className="px-2.5 py-1 rounded-md bg-gradient-to-b from-white/25 via-white/10 to-black/20 hover:brightness-110 active:scale-95 text-xs font-semibold flex items-center gap-1 border border-black/35 shadow-inner cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Home
          </button>

          <span className="text-[14px] font-bold tracking-tight">Settings</span>
          <div className="w-12 text-right">
            <span className="text-[9px] font-mono text-white/80 bg-black/20 px-1 py-0.5 rounded-sm">
              {isIOS6 ? 'iOS 6.1.6' : 'iOS 4.3'}
            </span>
          </div>
        </div>
      </div>

      {/* Settings Scrollable Group List */}
      <div className="relative z-10 flex-1 px-3 py-3 overflow-y-auto space-y-4">
        {/* Section: OS Version (Direct response to user) */}
        <div>
          <div className="text-[11px] font-bold text-neutral-500 uppercase px-2 mb-1 flex items-center justify-between">
            <span>Operating System Era</span>
            <span className="text-blue-600 font-semibold lowercase">tap to switch</span>
          </div>
          <div className="bg-white rounded-xl border border-neutral-300 shadow-xs divide-y divide-neutral-200 overflow-hidden text-xs">
            <button
              onClick={() => update({ osVersion: 'ios6' })}
              className={`w-full flex items-center justify-between p-2.5 text-left transition-colors cursor-pointer ${
                isIOS6 ? 'bg-blue-50/70' : 'hover:bg-neutral-50'
              }`}
            >
              <div>
                <div className="font-bold text-neutral-900 flex items-center gap-1.5">
                  <span>iOS 6.1.6</span>
                  <span className="text-[9px] bg-blue-600 text-white font-bold px-1.5 py-0.2 rounded-full">
                    Skeuomorphic Peak
                  </span>
                </div>
                <div className="text-[10px] text-neutral-500">
                  Silver slate bars, lock screen camera grabber, adaptive tints
                </div>
              </div>
              {isIOS6 && <Check className="w-4 h-4 text-blue-600 font-bold" />}
            </button>

            <button
              onClick={() => update({ osVersion: 'ios4' })}
              className={`w-full flex items-center justify-between p-2.5 text-left transition-colors cursor-pointer ${
                !isIOS6 ? 'bg-blue-50/70' : 'hover:bg-neutral-50'
              }`}
            >
              <div>
                <div className="font-bold text-neutral-900 flex items-center gap-1.5">
                  <span>iOS 4.3.5</span>
                  <span className="text-[9px] bg-neutral-600 text-white font-bold px-1.5 py-0.2 rounded-full">
                    2010 Launch
                  </span>
                </div>
                <div className="text-[10px] text-neutral-500">
                  Classic steel navy title bar, original launch firmware
                </div>
              </div>
              {!isIOS6 && <Check className="w-4 h-4 text-blue-600 font-bold" />}
            </button>
          </div>
        </div>

        {/* Section: iPhone 4 IPA & Installation */}
        <div>
          <div className="text-[11px] font-bold text-neutral-500 uppercase px-2 mb-1 flex items-center justify-between">
            <span>Install on Real iPhone 4</span>
            <span className="text-emerald-600 font-bold">.IPA Ready</span>
          </div>
          <div className="bg-white rounded-xl border border-neutral-300 shadow-xs divide-y divide-neutral-200 overflow-hidden text-xs">
            <button
              onClick={() => {
                sound.playClick(850, 0.03);
                onOpenIpaModal?.();
              }}
              className="w-full flex items-center justify-between p-2.5 text-left hover:bg-neutral-50 transition-colors cursor-pointer group"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-white text-sm shadow-xs group-hover:scale-105 transition-transform">
                  📦
                </div>
                <div>
                  <div className="font-bold text-neutral-900 flex items-center gap-1.5">
                    <span>Export RetinaArcade.ipa</span>
                    <span className="text-[9px] bg-blue-100 text-blue-800 font-bold px-1.5 py-0.2 rounded-full border border-blue-200">
                      armv7
                    </span>
                  </div>
                  <div className="text-[10px] text-neutral-500">
                    Sideloadly, 3uTools, AppSync, or direct WebClip
                  </div>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-neutral-400 group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>
        </div>

        {/* Section: Device & Display */}
        <div>
          <div className="text-[11px] font-bold text-neutral-500 uppercase px-2 mb-1">
            Display & Device Mode
          </div>
          <div className="bg-white rounded-xl border border-neutral-300 shadow-xs divide-y divide-neutral-200 overflow-hidden text-xs">
            {/* Show Frame Toggle */}
            <div className="flex items-center justify-between p-2.5">
              <div className="flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-neutral-600" />
                <div>
                  <div className="font-semibold text-neutral-900">iPhone 4 Device Shell</div>
                  <div className="text-[10px] text-neutral-400 leading-tight">
                    Turn off if playing directly in Safari on an actual iPhone
                  </div>
                </div>
              </div>
              <IOS6Switch
                checked={settings.showDeviceFrame}
                onChange={(val) => update({ showDeviceFrame: val })}
              />
            </div>

            {/* iPhone Color */}
            <div className="flex items-center justify-between p-2.5">
              <span className="font-semibold text-neutral-900">iPhone 4 Glass Finish</span>
              <div className="flex gap-1.5">
                <button
                  onClick={() => update({ iphoneColor: 'black' })}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-bold border transition-colors cursor-pointer ${
                    settings.iphoneColor === 'black'
                      ? 'bg-neutral-900 text-white border-neutral-900 shadow-xs'
                      : 'bg-neutral-100 text-neutral-700 border-neutral-300'
                  }`}
                >
                  Black Glass
                </button>
                <button
                  onClick={() => update({ iphoneColor: 'white' })}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-bold border transition-colors cursor-pointer ${
                    settings.iphoneColor === 'white'
                      ? 'bg-neutral-900 text-white border-neutral-900 shadow-xs'
                      : 'bg-white text-neutral-700 border-neutral-300'
                  }`}
                >
                  White Glass
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Section: Audio & Haptics */}
        <div>
          <div className="text-[11px] font-bold text-neutral-500 uppercase px-2 mb-1">
            Sounds & Haptics
          </div>
          <div className="bg-white rounded-xl border border-neutral-300 shadow-xs divide-y divide-neutral-200 overflow-hidden text-xs">
            {/* Sound Toggle */}
            <div className="flex items-center justify-between p-2.5">
              <div className="flex items-center gap-2">
                <Volume2 className="w-4 h-4 text-neutral-600" />
                <span className="font-semibold text-neutral-900">Sound Effects</span>
              </div>
              <IOS6Switch
                checked={settings.soundEnabled}
                onChange={(val) => update({ soundEnabled: val })}
              />
            </div>

            {/* Haptics Toggle */}
            <div className="flex items-center justify-between p-2.5">
              <span className="font-semibold text-neutral-900">Vibration Feedback</span>
              <IOS6Switch
                checked={settings.hapticsEnabled}
                onChange={(val) => update({ hapticsEnabled: val })}
              />
            </div>
          </div>
        </div>

        {/* Section: Gyroscope & Accelerometer */}
        <div>
          <div className="text-[11px] font-bold text-neutral-500 uppercase px-2 mb-1">
            Hardware 3-Axis Gyroscope
          </div>
          <div className="bg-white rounded-xl border border-neutral-300 shadow-xs p-2.5 text-xs">
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-neutral-600" />
                <span className="font-semibold text-neutral-900">Tilt Sensitivity</span>
              </div>
              <span className="font-mono text-neutral-600 font-bold">
                {settings.tiltSensitivity.toFixed(1)}x
              </span>
            </div>
            <input
              type="range"
              min={0.6}
              max={2.4}
              step={0.1}
              value={settings.tiltSensitivity}
              onChange={(e) => update({ tiltSensitivity: parseFloat(e.target.value) })}
              className="w-full accent-blue-600 cursor-pointer"
            />
          </div>
        </div>

        {/* Section: Wallpaper */}
        <div>
          <div className="text-[11px] font-bold text-neutral-500 uppercase px-2 mb-1">
            Skeuomorphic Wallpaper
          </div>
          <div className="bg-white rounded-xl border border-neutral-300 shadow-xs p-2.5 flex gap-2">
            {[
              { id: 'droplets', label: 'Water Droplets' },
              { id: 'linen', label: 'Classic Linen' },
              { id: 'gradient', label: 'Midnight Blue' },
            ].map((wp) => (
              <button
                key={wp.id}
                onClick={() => update({ wallpaper: wp.id as SystemSettings['wallpaper'] })}
                className={`flex-1 py-1.5 rounded-lg border text-xs font-semibold flex items-center justify-center gap-1 transition-all cursor-pointer ${
                  settings.wallpaper === wp.id
                    ? 'bg-neutral-900 text-white border-neutral-900 shadow-xs'
                    : 'bg-neutral-100 text-neutral-700 border-neutral-300 hover:bg-neutral-200'
                }`}
              >
                <ImageIcon className="w-3 h-3" />
                {wp.label}
              </button>
            ))}
          </div>
        </div>

        {/* Section: About iPhone 4 */}
        <div>
          <div className="text-[11px] font-bold text-neutral-500 uppercase px-2 mb-1">
            About iPhone 4
          </div>
          <div className="bg-white rounded-xl border border-neutral-300 shadow-xs divide-y divide-neutral-200 overflow-hidden text-xs">
            <div className="flex justify-between p-2.5">
              <span className="text-neutral-500">Model</span>
              <span className="font-semibold text-neutral-900">iPhone 4 (A1332)</span>
            </div>
            <div className="flex justify-between p-2.5">
              <span className="text-neutral-500">Version</span>
              <span className="font-semibold text-blue-700">
                {isIOS6 ? 'iOS 6.1.6 (10B500)' : 'iOS 4.3.5 (8L1)'}
              </span>
            </div>
            <div className="flex justify-between p-2.5">
              <span className="text-neutral-500">Carrier</span>
              <span className="font-semibold text-neutral-900">AT&T 14.1</span>
            </div>
            <div className="flex justify-between p-2.5">
              <span className="text-neutral-500">Capacity</span>
              <span className="font-semibold text-neutral-900">32 GB (28.4 GB Available)</span>
            </div>
            <div className="flex justify-between p-2.5">
              <span className="text-neutral-500">Retina Display</span>
              <span className="font-semibold text-neutral-900">3.5" · 640 × 960 (326 ppi)</span>
            </div>
            <div className="flex justify-between p-2.5">
              <span className="text-neutral-500">Processor</span>
              <span className="font-semibold text-neutral-900">Apple A4 1.0 GHz</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Footer */}
      <div className="relative z-20 py-2 px-3 bg-neutral-200 border-t border-neutral-300 text-center text-[10px] text-neutral-500">
        iPhone 4 with iOS 6 — The Golden Age of Skeuomorphic Design
      </div>
    </div>
  );
};
