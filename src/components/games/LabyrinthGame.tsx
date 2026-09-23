import React, { useState, useEffect, useRef } from 'react';
import { StatusBar } from '../iphone/StatusBar';
import { sound } from '../../audio/soundEffects';
import { triggerHaptic } from '../../utils/storage';
import { RotateCcw, Award, ChevronRight } from 'lucide-react';

interface LabyrinthProps {
  onUnlockAchievement: (id: string) => void;
  onUpdateStars: (stars: number) => void;
  onExit: () => void;
  tiltSensitivity?: number;
}

interface Wall {
  x: number;
  y: number;
  w: number;
  h: number;
}

interface Hole {
  x: number;
  y: number;
  radius: number;
}

interface Star {
  id: number;
  x: number;
  y: number;
  collected: boolean;
}

interface Level {
  name: string;
  start: { x: number; y: number };
  goal: { x: number; y: number; radius: number };
  walls: Wall[];
  holes: Hole[];
  stars: { x: number; y: number }[];
}

const LEVELS: Level[] = [
  {
    name: 'Stage 1: The Wooden Path',
    start: { x: 35, y: 35 },
    goal: { x: 280, y: 360, radius: 18 },
    walls: [
      { x: 10, y: 10, w: 300, h: 8 }, // Top
      { x: 10, y: 390, w: 300, h: 8 }, // Bottom
      { x: 10, y: 10, w: 8, h: 388 }, // Left
      { x: 302, y: 10, w: 8, h: 388 }, // Right
      // Partitions
      { x: 18, y: 80, w: 220, h: 8 },
      { x: 80, y: 160, w: 222, h: 8 },
      { x: 18, y: 240, w: 200, h: 8 },
      { x: 90, y: 320, w: 212, h: 8 },
    ],
    holes: [
      { x: 260, y: 50, radius: 13 },
      { x: 50, y: 130, radius: 13 },
      { x: 260, y: 200, radius: 13 },
      { x: 60, y: 280, radius: 13 },
    ],
    stars: [
      { x: 140, y: 50 },
      { x: 180, y: 200 },
      { x: 140, y: 280 },
    ],
  },
  {
    name: 'Stage 2: The S-Curves',
    start: { x: 40, y: 40 },
    goal: { x: 160, y: 200, radius: 18 },
    walls: [
      { x: 10, y: 10, w: 300, h: 8 },
      { x: 10, y: 390, w: 300, h: 8 },
      { x: 10, y: 10, w: 8, h: 388 },
      { x: 302, y: 10, w: 8, h: 388 },
      // Spiral walls
      { x: 18, y: 90, w: 240, h: 8 },
      { x: 250, y: 90, w: 8, h: 220 },
      { x: 60, y: 310, w: 198, h: 8 },
      { x: 60, y: 150, w: 8, h: 168 },
      { x: 60, y: 150, w: 150, h: 8 },
      { x: 210, y: 150, w: 8, h: 100 },
      { x: 110, y: 250, w: 108, h: 8 },
    ],
    holes: [
      { x: 120, y: 55, radius: 13 },
      { x: 280, y: 180, radius: 13 },
      { x: 280, y: 260, radius: 13 },
      { x: 160, y: 340, radius: 13 },
      { x: 35, y: 240, radius: 13 },
      { x: 110, y: 190, radius: 12 },
    ],
    stars: [
      { x: 200, y: 55 },
      { x: 210, y: 290 },
      { x: 90, y: 210 },
    ],
  },
  {
    name: 'Stage 3: Perilous Gauntlet',
    start: { x: 35, y: 360 },
    goal: { x: 275, y: 45, radius: 18 },
    walls: [
      { x: 10, y: 10, w: 300, h: 8 },
      { x: 10, y: 390, w: 300, h: 8 },
      { x: 10, y: 10, w: 8, h: 388 },
      { x: 302, y: 10, w: 8, h: 388 },
      // Complex maze partitions
      { x: 80, y: 18, w: 8, h: 150 },
      { x: 160, y: 18, w: 8, h: 120 },
      { x: 230, y: 80, w: 8, h: 180 },
      { x: 80, y: 220, w: 100, h: 8 },
      { x: 18, y: 300, w: 160, h: 8 },
      { x: 170, y: 220, w: 8, h: 120 },
      { x: 170, y: 340, w: 80, h: 8 },
    ],
    holes: [
      { x: 45, y: 120, radius: 14 },
      { x: 120, y: 70, radius: 14 },
      { x: 120, y: 170, radius: 14 },
      { x: 200, y: 160, radius: 14 },
      { x: 270, y: 200, radius: 14 },
      { x: 130, y: 260, radius: 14 },
      { x: 120, y: 340, radius: 14 },
      { x: 220, y: 300, radius: 14 },
      { x: 270, y: 360, radius: 14 },
    ],
    stars: [
      { x: 45, y: 50 },
      { x: 200, y: 50 },
      { x: 210, y: 370 },
    ],
  },
];

export const LabyrinthGame: React.FC<LabyrinthProps> = ({
  onUnlockAchievement,
  onUpdateStars,
  onExit,
  tiltSensitivity = 1.2,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [currentLevelIdx, setCurrentLevelIdx] = useState(0);
  const [totalStars, setTotalStars] = useState(0);
  const [gameState, setGameState] = useState<'playing' | 'hole' | 'win'>('playing');
  const [elapsedTime, setElapsedTime] = useState(0);
  const [tiltSource, setTiltSource] = useState<'sensor' | 'drag'>('drag');

  const level = LEVELS[currentLevelIdx];

  const gameRef = useRef({
    ball: {
      x: level.start.x,
      y: level.start.y,
      vx: 0,
      vy: 0,
      radius: 9,
      falling: false,
      scale: 1,
    },
    tiltX: 0,
    tiltY: 0,
    stars: [] as Star[],
    startTime: Date.now(),
    levelState: 'playing' as 'playing' | 'hole' | 'win',
    lastBumpTime: 0,
  });

  // Reset ball on level switch
  useEffect(() => {
    resetLevel();
  }, [currentLevelIdx]);

  const resetLevel = () => {
    const lvl = LEVELS[currentLevelIdx];
    const g = gameRef.current;
    g.ball = {
      x: lvl.start.x,
      y: lvl.start.y,
      vx: 0,
      vy: 0,
      radius: 9,
      falling: false,
      scale: 1,
    };
    g.stars = lvl.stars.map((s, idx) => ({ id: idx, x: s.x, y: s.y, collected: false }));
    g.levelState = 'playing';
    g.startTime = Date.now();
    setGameState('playing');
  };

  // Setup Gyroscope & Accelerometer
  useEffect(() => {
    const handleOrientation = (e: DeviceOrientationEvent) => {
      if (e.gamma !== null && e.beta !== null) {
        setTiltSource('sensor');
        // Gamma: -90 to 90 (left / right)
        // Beta: -180 to 180 (front / back)
        // Normal handheld holding angle is ~35 deg tilt forward
        const normBeta = (e.beta - 35) / 25;
        const normGamma = e.gamma / 25;

        gameRef.current.tiltX = Math.max(-1, Math.min(1, normGamma * tiltSensitivity));
        gameRef.current.tiltY = Math.max(-1, Math.min(1, normBeta * tiltSensitivity));
      }
    };

    if (typeof window !== 'undefined' && window.DeviceOrientationEvent) {
      window.addEventListener('deviceorientation', handleOrientation);
    }

    // Keyboard controls for desktop
    const keys = { w: false, s: false, a: false, d: false };
    const handleKey = (e: KeyboardEvent, isDown: boolean) => {
      if (e.key === 'ArrowUp' || e.key === 'w') keys.w = isDown;
      if (e.key === 'ArrowDown' || e.key === 's') keys.s = isDown;
      if (e.key === 'ArrowLeft' || e.key === 'a') keys.a = isDown;
      if (e.key === 'ArrowRight' || e.key === 'd') keys.d = isDown;

      let tx = 0;
      let ty = 0;
      if (keys.a) tx -= 0.8;
      if (keys.d) tx += 0.8;
      if (keys.w) ty -= 0.8;
      if (keys.s) ty += 0.8;
      gameRef.current.tiltX = tx;
      gameRef.current.tiltY = ty;
    };

    const onKeyDown = (e: KeyboardEvent) => handleKey(e, true);
    const onKeyUp = (e: KeyboardEvent) => handleKey(e, false);

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);

    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('deviceorientation', handleOrientation);
      }
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, [tiltSensitivity]);

  // Timer update
  useEffect(() => {
    if (gameState !== 'playing') return;
    const interval = setInterval(() => {
      setElapsedTime(Math.floor((Date.now() - gameRef.current.startTime) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [gameState]);

  // Main Canvas & Physics Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;

    const loop = () => {
      const g = gameRef.current;
      const b = g.ball;
      const lvl = LEVELS[currentLevelIdx];
      const now = performance.now();

      if (g.levelState === 'playing') {
        // Physics update
        const accelX = g.tiltX * 0.35;
        const accelY = g.tiltY * 0.35;

        b.vx = (b.vx + accelX) * 0.96; // Rolling friction
        b.vy = (b.vy + accelY) * 0.96;

        let nextX = b.x + b.vx;
        let nextY = b.y + b.vy;

        // Collision with walls
        for (const wall of lvl.walls) {
          // Closest point on wall rectangle
          const clampX = Math.max(wall.x, Math.min(nextX, wall.x + wall.w));
          const clampY = Math.max(wall.y, Math.min(nextY, wall.y + wall.h));

          const dx = nextX - clampX;
          const dy = nextY - clampY;
          const dist = Math.hypot(dx, dy);

          if (dist < b.radius) {
            // Collision detected!
            const overlap = b.radius - dist;
            const nx = dist === 0 ? 1 : dx / dist;
            const ny = dist === 0 ? 0 : dy / dist;

            nextX += nx * overlap;
            nextY += ny * overlap;

            // Bounce deflection
            const dot = b.vx * nx + b.vy * ny;
            b.vx = (b.vx - 1.4 * dot * nx) * 0.6;
            b.vy = (b.vy - 1.4 * dot * ny) * 0.6;

            // Wall bump sound and haptics
            if (now - g.lastBumpTime > 90) {
              const speed = Math.hypot(b.vx, b.vy);
              if (speed > 0.4) {
                sound.playWallBump(speed);
                triggerHaptic('light');
                g.lastBumpTime = now;
              }
            }
          }
        }

        b.x = nextX;
        b.y = nextY;

        // Check Star collection
        for (const s of g.stars) {
          if (!s.collected && Math.hypot(b.x - s.x, b.y - s.y) < b.radius + 8) {
            s.collected = true;
            sound.playCombo(2);
            triggerHaptic('light');
            setTotalStars((prev) => {
              const next = prev + 1;
              onUpdateStars(next);
              return next;
            });
          }
        }

        // Check Holes collision & suction gravity
        for (const h of lvl.holes) {
          const distToHole = Math.hypot(b.x - h.x, b.y - h.y);

          // Suction gravity when near hole lip
          if (distToHole < h.radius + 6) {
            const pull = (h.radius + 6 - distToHole) * 0.12;
            b.vx += ((h.x - b.x) / distToHole) * pull;
            b.vy += ((h.y - b.y) / distToHole) * pull;
          }

          // In hole
          if (distToHole < h.radius * 0.65) {
            b.falling = true;
            g.levelState = 'hole';
            setGameState('hole');
            sound.playHoleFall();
            triggerHaptic('heavy');
            break;
          }
        }

        // Check Goal
        const distToGoal = Math.hypot(b.x - lvl.goal.x, b.y - lvl.goal.y);
        if (distToGoal < lvl.goal.radius * 0.7) {
          g.levelState = 'win';
          setGameState('win');
          sound.playLevelWin();
          triggerHaptic('medium');
          onUnlockAchievement('maze_novice');
        }
      } else if (g.levelState === 'hole') {
        // Shrink animation
        b.scale = Math.max(0, b.scale - 0.05);
      }

      // ================= DRAW CANVAS =================
      const width = canvas.width;
      const height = canvas.height;

      // 1. Walnut wood board
      ctx.fillStyle = '#673e23';
      ctx.fillRect(0, 0, width, height);

      // Wood grain lines
      ctx.strokeStyle = 'rgba(0,0,0,0.08)';
      ctx.lineWidth = 2;
      for (let y = 15; y < height; y += 18) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // Inner shadow of wooden box frame
      ctx.strokeStyle = 'rgba(0,0,0,0.5)';
      ctx.lineWidth = 6;
      ctx.strokeRect(3, 3, width - 6, height - 6);

      // 2. Draw Holes (Dark voids with beveled 3D rim)
      for (const h of lvl.holes) {
        // Outer wood rim highlight
        ctx.fillStyle = '#452613';
        ctx.beginPath();
        ctx.arc(h.x, h.y, h.radius + 2, 0, Math.PI * 2);
        ctx.fill();

        // Deep black hole
        ctx.fillStyle = '#0a0a0a';
        ctx.beginPath();
        ctx.arc(h.x, h.y, h.radius, 0, Math.PI * 2);
        ctx.fill();

        // Inner shadow rim
        ctx.strokeStyle = '#171717';
        ctx.lineWidth = 2;
        ctx.stroke();
      }

      // 3. Draw Goal Hole
      // Checkered circular ring around goal
      ctx.save();
      ctx.translate(lvl.goal.x, lvl.goal.y);
      ctx.fillStyle = '#166534';
      ctx.beginPath();
      ctx.arc(0, 0, lvl.goal.radius + 4, 0, Math.PI * 2);
      ctx.fill();

      // Deep green hole
      ctx.fillStyle = '#052e16';
      ctx.beginPath();
      ctx.arc(0, 0, lvl.goal.radius, 0, Math.PI * 2);
      ctx.fill();

      // Checkered pattern ring
      ctx.strokeStyle = '#ffffff';
      ctx.setLineDash([4, 4]);
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.restore();

      // 4. Draw Stars
      for (const s of g.stars) {
        if (!s.collected) {
          ctx.save();
          ctx.translate(s.x, s.y);
          ctx.font = '14px sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('⭐', 0, 0);
          ctx.restore();
        }
      }

      // 5. Draw Brass Partition Walls
      for (const wall of lvl.walls) {
        // Brass wall shadow
        ctx.fillStyle = 'rgba(0,0,0,0.45)';
        ctx.fillRect(wall.x + 3, wall.y + 3, wall.w, wall.h);

        // Brass base
        const grad = ctx.createLinearGradient(wall.x, wall.y, wall.x + wall.w, wall.y + wall.h);
        grad.addColorStop(0, '#eab308');
        grad.addColorStop(0.5, '#fde047');
        grad.addColorStop(1, '#ca8a04');
        ctx.fillStyle = grad;
        ctx.fillRect(wall.x, wall.y, wall.w, wall.h);

        // Brass bevel outline
        ctx.strokeStyle = '#854d0e';
        ctx.lineWidth = 1;
        ctx.strokeRect(wall.x, wall.y, wall.w, wall.h);
      }

      // 6. Draw Chrome Steel Marble with 3D Specular Highlight
      if (b.scale > 0.05) {
        ctx.save();
        ctx.translate(b.x, b.y);
        ctx.scale(b.scale, b.scale);

        // Ball drop shadow
        ctx.fillStyle = 'rgba(0,0,0,0.5)';
        ctx.beginPath();
        ctx.arc(2, 3, b.radius, 0, Math.PI * 2);
        ctx.fill();

        // Chrome ball metallic gradient
        const ballGrad = ctx.createRadialGradient(
          -b.radius * 0.35 + g.tiltX * 2,
          -b.radius * 0.35 + g.tiltY * 2,
          1,
          0,
          0,
          b.radius
        );
        ballGrad.addColorStop(0, '#ffffff');
        ballGrad.addColorStop(0.3, '#d4d4d8');
        ballGrad.addColorStop(0.7, '#71717a');
        ballGrad.addColorStop(1, '#27272a');

        ctx.fillStyle = ballGrad;
        ctx.beginPath();
        ctx.arc(0, 0, b.radius, 0, Math.PI * 2);
        ctx.fill();

        // Rim reflection
        ctx.strokeStyle = 'rgba(255,255,255,0.7)';
        ctx.lineWidth = 1;
        ctx.stroke();

        ctx.restore();
      }

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [currentLevelIdx]);

  // Touch / Mouse Drag Virtual Tilt Pad handler
  const handlePadMove = (clientX: number, clientY: number, target: HTMLElement) => {
    const rect = target.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dx = (clientX - cx) / (rect.width / 2);
    const dy = (clientY - cy) / (rect.height / 2);
    gameRef.current.tiltX = Math.max(-1, Math.min(1, dx * tiltSensitivity));
    gameRef.current.tiltY = Math.max(-1, Math.min(1, dy * tiltSensitivity));
  };

  const nextLevel = () => {
    sound.playClick(900, 0.03);
    if (currentLevelIdx < LEVELS.length - 1) {
      setCurrentLevelIdx((prev) => prev + 1);
    } else {
      setCurrentLevelIdx(0);
    }
  };

  return (
    <div className="relative w-full h-full flex flex-col justify-between select-none overflow-hidden bg-neutral-950">
      {/* Status Bar & Header */}
      <div className="relative z-20 w-full flex flex-col">
        <StatusBar theme="black" />
        {/* HUD */}
        <div className="flex items-center justify-between px-3 py-1.5 bg-black/80 backdrop-blur-xs border-b border-amber-900/40 text-neutral-200">
          <div className="flex flex-col">
            <span className="text-[11px] font-bold text-amber-300 truncate max-w-[130px]">
              {level.name}
            </span>
            <span className="text-[9px] text-neutral-400">
              {tiltSource === 'sensor' ? 'Gyro active' : 'Touch/keys to tilt'}
            </span>
          </div>

          <div className="flex items-center gap-3 text-xs">
            <span className="font-mono text-neutral-300">{elapsedTime}s</span>
            <span className="font-bold text-amber-400 flex items-center gap-0.5">
              ⭐ {totalStars}
            </span>
          </div>

          <button
            onClick={resetLevel}
            className="p-1 rounded-md bg-neutral-800 hover:bg-neutral-700 text-neutral-300"
            title="Restart Stage"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Main Wood Maze Viewport */}
      <div
        className="relative flex-1 w-full h-full overflow-hidden flex items-center justify-center touch-none"
        onMouseMove={(e) => handlePadMove(e.clientX, e.clientY, e.currentTarget)}
        onTouchMove={(e) => {
          if (e.touches.length > 0) {
            handlePadMove(e.touches[0].clientX, e.touches[0].clientY, e.currentTarget);
          }
        }}
        onTouchEnd={() => {
          if (tiltSource === 'drag') {
            gameRef.current.tiltX = 0;
            gameRef.current.tiltY = 0;
          }
        }}
      >
        <canvas
          ref={canvasRef}
          width={320}
          height={400}
          className="w-full h-full object-contain cursor-move"
        />

        {/* In Hole Modal */}
        {gameState === 'hole' && (
          <div className="absolute inset-0 z-30 bg-black/80 backdrop-blur-xs flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-150">
            <div className="w-14 h-14 rounded-full bg-black border-2 border-neutral-700 flex items-center justify-center text-2xl mb-2 shadow-2xl">
              🕳️
            </div>
            <h2 className="text-xl font-black text-white tracking-wide uppercase">
              Fell in a Hole!
            </h2>
            <p className="text-xs text-neutral-400 mt-0.5">The marble was swallowed</p>

            <button
              onClick={resetLevel}
              className="mt-4 px-6 py-2.5 rounded-xl bg-gradient-to-b from-amber-500 to-amber-600 text-white text-xs font-bold shadow-lg hover:from-amber-400 hover:to-amber-500 active:scale-95 flex items-center gap-1.5"
            >
              <RotateCcw className="w-4 h-4" />
              Try Again
            </button>
          </div>
        )}

        {/* Level Complete Win Modal */}
        {gameState === 'win' && (
          <div className="absolute inset-0 z-30 bg-black/85 backdrop-blur-xs flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-200">
            <div className="w-14 h-14 rounded-full bg-emerald-600/20 border-2 border-emerald-500 flex items-center justify-center text-3xl mb-2 shadow-lg">
              🏆
            </div>
            <h2 className="text-2xl font-black text-white tracking-wide uppercase">
              Stage Cleared!
            </h2>
            <p className="text-xs text-emerald-400 font-medium mt-0.5">
              Time: {elapsedTime} seconds
            </p>

            <div className="flex gap-2 mt-4 w-52">
              <button
                onClick={nextLevel}
                className="flex-1 py-2.5 rounded-xl bg-gradient-to-b from-emerald-500 to-emerald-600 text-white text-xs font-bold shadow-md hover:from-emerald-400 hover:to-emerald-500 active:scale-95 flex items-center justify-center gap-1"
              >
                <span>Next Stage</span>
                <ChevronRight className="w-4 h-4" />
              </button>
              <button
                onClick={resetLevel}
                className="px-3 py-2.5 rounded-xl bg-neutral-800 text-neutral-300 text-xs font-medium border border-neutral-700"
              >
                Replay
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Footer Navigation & Tilt Direction Indicator */}
      <div className="relative z-20 w-full px-3 py-1.5 bg-neutral-900 border-t border-neutral-800 flex justify-between items-center text-[10px] text-neutral-400">
        <button
          onClick={onExit}
          className="text-neutral-300 hover:text-white underline font-medium"
        >
          Exit to Home
        </button>

        <div className="flex items-center gap-1 text-[9px] text-amber-300/80">
          <span>Tilt device or drag finger on maze</span>
        </div>

        <button
          onClick={nextLevel}
          className="text-amber-400 hover:text-amber-300 font-bold"
        >
          Stage {currentLevelIdx + 1}/{LEVELS.length} →
        </button>
      </div>
    </div>
  );
};
