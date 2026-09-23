import { Achievement, GameScore, SystemSettings } from '../types';

const SCORES_KEY = 'iphone4_arcade_scores_v1';
const ACHIEVEMENTS_KEY = 'iphone4_arcade_achievements_v1';
const SETTINGS_KEY = 'iphone4_arcade_settings_v1';

export const INITIAL_ACHIEVEMENTS: Achievement[] = [
  {
    id: 'first_slice',
    title: 'First Slice',
    description: 'Cut your very first piece of flying fruit in Blade Fruit.',
    unlocked: false,
    icon: '🍉',
    points: 10,
  },
  {
    id: 'combo_master',
    title: 'Combo Slasher',
    description: 'Score a 3x or higher combo slice in a single swipe.',
    unlocked: false,
    icon: '⚡',
    points: 25,
  },
  {
    id: 'doodle_500',
    title: 'Off The Ground',
    description: 'Reach 500m altitude in Doodle Leap.',
    unlocked: false,
    icon: '🚀',
    points: 15,
  },
  {
    id: 'doodle_1500',
    title: 'Stratosphere',
    description: 'Ascend to 1,500m altitude in Doodle Leap.',
    unlocked: false,
    icon: '⭐',
    points: 35,
  },
  {
    id: 'maze_novice',
    title: 'Labyrinth Pioneer',
    description: 'Successfully navigate marble to the goal on Stage 1.',
    unlocked: false,
    icon: '🏆',
    points: 20,
  },
  {
    id: 'retina_display',
    title: 'Steve\'s Retina Blessing',
    description: '326 pixels per inch of vintage 2010 perfection.',
    unlocked: true,
    icon: '📱',
    points: 50,
  },
];

export const INITIAL_SETTINGS: SystemSettings = {
  soundEnabled: true,
  hapticsEnabled: true,
  tiltSensitivity: 1.2,
  iphoneColor: 'black',
  showDeviceFrame: true,
  wallpaper: 'droplets',
  osVersion: 'ios6',
};

export const INITIAL_SCORES: GameScore = {
  fruitSlash: 0,
  doodleLeap: 0,
  labyrinthStars: 0,
  labyrinthBestTimes: {},
};

export function loadScores(): GameScore {
  try {
    const raw = localStorage.getItem(SCORES_KEY);
    return raw ? { ...INITIAL_SCORES, ...JSON.parse(raw) } : INITIAL_SCORES;
  } catch {
    return INITIAL_SCORES;
  }
}

export function saveScores(scores: GameScore): void {
  try {
    localStorage.setItem(SCORES_KEY, JSON.stringify(scores));
  } catch {}
}

export function loadAchievements(): Achievement[] {
  try {
    const raw = localStorage.getItem(ACHIEVEMENTS_KEY);
    if (!raw) return INITIAL_ACHIEVEMENTS;
    const parsed: Achievement[] = JSON.parse(raw);
    return INITIAL_ACHIEVEMENTS.map((item) => {
      const match = parsed.find((p) => p.id === item.id);
      return match ? { ...item, unlocked: match.unlocked } : item;
    });
  } catch {
    return INITIAL_ACHIEVEMENTS;
  }
}

export function saveAchievements(achievements: Achievement[]): void {
  try {
    localStorage.setItem(ACHIEVEMENTS_KEY, JSON.stringify(achievements));
  } catch {}
}

export function loadSettings(): SystemSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    return raw ? { ...INITIAL_SETTINGS, ...JSON.parse(raw) } : INITIAL_SETTINGS;
  } catch {
    return INITIAL_SETTINGS;
  }
}

export function saveSettings(settings: SystemSettings): void {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch {}
}

export function triggerHaptic(type: 'light' | 'medium' | 'heavy' = 'light') {
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    try {
      if (type === 'light') navigator.vibrate(15);
      else if (type === 'medium') navigator.vibrate([20, 20, 20]);
      else navigator.vibrate(50);
    } catch {}
  }
}
