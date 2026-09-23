export type AppId = 'home' | 'fruit_slash' | 'doodle_leap' | 'labyrinth' | 'game_center' | 'settings' | 'ipa_export';

export type IPhoneColor = 'black' | 'white';

export type OSVersion = 'ios6' | 'ios4';

export interface GameScore {
  fruitSlash: number;
  doodleLeap: number;
  labyrinthStars: number;
  labyrinthBestTimes: Record<number, number>; // level index -> seconds
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  unlocked: boolean;
  icon: string;
  points: number;
}

export interface SystemSettings {
  soundEnabled: boolean;
  hapticsEnabled: boolean;
  tiltSensitivity: number; // 0.5 to 2.0
  iphoneColor: IPhoneColor;
  showDeviceFrame: boolean;
  wallpaper: 'droplets' | 'linen' | 'gradient';
  osVersion: OSVersion;
}
