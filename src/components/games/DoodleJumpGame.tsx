import React, { useState, useEffect, useRef } from 'react';
import { StatusBar } from '../iphone/StatusBar';
import { sound } from '../../audio/soundEffects';
import { triggerHaptic } from '../../utils/storage';
import { RotateCcw, Award } from 'lucide-react';

interface DoodleJumpProps {
  highScore: number;
  onUpdateScore: (newScore: number) => void;
  onUnlockAchievement: (id: string) => void;
  onExit: () => void;
  tiltSensitivity?: number;
}

interface Platform {
  id: number;
  x: number;
  y: number;
  width: number;
  height: number;
  type: 'standard' | 'moving' | 'cracked' | 'spring' | 'jetpack';
  vx?: number;
  broken?: boolean;
}

interface Monster {
  id: number;
  x: number;
  y: number;
  radius: number;
  alive: boolean;
  vx: number;
}

interface Bullet {
  id: number;
  x: number;
  y: number;
  vy: number;
}

export const DoodleJumpGame: React.FC<DoodleJumpProps> = ({
  highScore,
  onUpdateScore,
  onUnlockAchievement,
  onExit,
  tiltSensitivity = 1.2,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [tiltSource, setTiltSource] = useState<'sensor' | 'manual'>('manual');

  const gameStateRef = useRef({
    score: 0,
    cameraY: 0,
    gameOver: false,
    player: {
      x: 160,
      y: 320,
      vx: 0,
      vy: -9,
      radius: 14,
      facingLeft: false,
      jetpackTime: 0,
    },
    platforms: [] as Platform[],
    monsters: [] as Monster[],
    bullets: [] as Bullet[],
    tiltX: 0,
    keys: { left: false, right: false },
    touchHold: 0, // -1 left, 1 right
  });

  const nextId = useRef(1);

  // Setup device orientation accelerometer (real iPhone 4 hardware feature!)
  useEffect(() => {
    const handleOrientation = (e: DeviceOrientationEvent) => {
      if (e.gamma !== null) {
        setTiltSource('sensor');
        // Gamma is left/right tilt in degrees (-90 to 90)
        gameStateRef.current.tiltX = Math.max(-1, Math.min(1, (e.gamma / 20) * tiltSensitivity));
      }
    };

    if (typeof window !== 'undefined' && window.DeviceOrientationEvent) {
      window.addEventListener('deviceorientation', handleOrientation);
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' || e.key === 'a') gameStateRef.current.keys.left = true;
      if (e.key === 'ArrowRight' || e.key === 'd') gameStateRef.current.keys.right = true;
      if (e.key === ' ' || e.key === 'ArrowUp') shootBullet();
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' || e.key === 'a') gameStateRef.current.keys.left = false;
      if (e.key === 'ArrowRight' || e.key === 'd') gameStateRef.current.keys.right = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('deviceorientation', handleOrientation);
      }
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [tiltSensitivity]);

  const shootBullet = () => {
    if (gameStateRef.current.gameOver) return;
    const p = gameStateRef.current.player;
    sound.playShoot();
    triggerHaptic('light');
    gameStateRef.current.bullets.push({
      id: nextId.current++,
      x: p.x,
      y: p.y - 15,
      vy: -14,
    });
  };

  const restartGame = () => {
    sound.playClick(800, 0.03);
    setScore(0);
    setGameOver(false);

    const g = gameStateRef.current;
    g.score = 0;
    g.cameraY = 0;
    g.gameOver = false;
    g.player = {
      x: 160,
      y: 320,
      vx: 0,
      vy: -9,
      radius: 14,
      facingLeft: false,
      jetpackTime: 0,
    };
    g.bullets = [];
    g.monsters = [];
    initPlatforms();
  };

  const initPlatforms = () => {
    const plats: Platform[] = [];
    // Starting platform under doodle
    plats.push({
      id: nextId.current++,
      x: 130,
      y: 350,
      width: 60,
      height: 12,
      type: 'standard',
    });

    // Seed initial platforms going up
    let y = 310;
    while (y > -600) {
      y -= Math.floor(Math.random() * 35 + 45);
      const x = Math.random() * 240 + 10;
      const rand = Math.random();
      let type: Platform['type'] = 'standard';
      if (rand < 0.15) type = 'moving';
      else if (rand < 0.28) type = 'cracked';
      else if (rand < 0.35) type = 'spring';
      else if (rand < 0.38) type = 'jetpack';

      plats.push({
        id: nextId.current++,
        x,
        y,
        width: 55,
        height: 12,
        type,
        vx: type === 'moving' ? (Math.random() < 0.5 ? 1.5 : -1.5) : 0,
      });
    }
    gameStateRef.current.platforms = plats;
  };

  useEffect(() => {
    initPlatforms();
  }, []);

  // Main Game Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;

    const loop = () => {
      const width = canvas.width;
      const height = canvas.height;
      const g = gameStateRef.current;
      const p = g.player;

      // 1. Input Processing
      let horiz = g.tiltX;
      if (g.keys.left || g.touchHold < 0) horiz = -1;
      if (g.keys.right || g.touchHold > 0) horiz = 1;

      // Accelerate horizontal speed
      p.vx = p.vx * 0.85 + horiz * 5.5 * 0.15;
      p.x += p.vx;

      if (p.vx < -0.3) p.facingLeft = true;
      if (p.vx > 0.3) p.facingLeft = false;

      // Screen wrapping
      if (p.x < -p.radius) p.x = width + p.radius;
      if (p.x > width + p.radius) p.x = -p.radius;

      // 2. Vertical Physics & Jetpack
      if (p.jetpackTime > 0) {
        p.jetpackTime--;
        p.vy = -12;
      } else {
        p.vy += 0.32; // Gravity
      }
      p.y += p.vy;

      // 3. Platform Collisions (only when falling downwards)
      if (p.vy > 0 && p.jetpackTime <= 0) {
        for (const plat of g.platforms) {
          if (plat.broken) continue;

          // Check if doodle feet hit top of platform
          const feetY = p.y + p.radius;
          if (
            feetY >= plat.y &&
            feetY <= plat.y + 12 &&
            p.x + p.radius > plat.x &&
            p.x - p.radius < plat.x + plat.width
          ) {
            if (plat.type === 'cracked') {
              plat.broken = true;
              sound.playClick(400, 0.05);
            } else if (plat.type === 'spring') {
              p.vy = -17; // Big launch
              sound.playSpring();
              triggerHaptic('medium');
            } else if (plat.type === 'jetpack') {
              p.jetpackTime = 120; // 2 seconds rocket boost
              plat.type = 'standard';
              sound.playJetpack();
              triggerHaptic('heavy');
            } else {
              // Standard bounce
              p.vy = -9.5;
              sound.playJump();
              triggerHaptic('light');
            }
            break;
          }
        }
      }

      // 4. Bullets Update
      for (let i = g.bullets.length - 1; i >= 0; i--) {
        const b = g.bullets[i];
        b.y += b.vy;
        if (b.y < g.cameraY - 50) {
          g.bullets.splice(i, 1);
          continue;
        }

        // Bullet vs Monster
        for (const m of g.monsters) {
          if (m.alive && Math.hypot(b.x - m.x, b.y - m.y) < m.radius + 6) {
            m.alive = false;
            sound.playSplat();
            triggerHaptic('medium');
            g.bullets.splice(i, 1);
            break;
          }
        }
      }

      // 5. Camera & Scoring
      // Keep doodle around the middle or top third of screen
      const targetCamY = p.y - height * 0.55;
      if (targetCamY < g.cameraY) {
        g.cameraY = targetCamY;
      }

      const currentAltitude = Math.max(0, Math.floor(-g.cameraY));
      if (currentAltitude > g.score) {
        g.score = currentAltitude;
        setScore(currentAltitude);

        if (currentAltitude >= 500) onUnlockAchievement('doodle_500');
        if (currentAltitude >= 1500) onUnlockAchievement('doodle_1500');
        if (currentAltitude > highScore) onUpdateScore(currentAltitude);
      }

      // 6. Platform Regeneration above camera
      let highestY = g.platforms.reduce((min, pl) => Math.min(min, pl.y), 0);
      while (highestY > g.cameraY - 100) {
        highestY -= Math.floor(Math.random() * 40 + 45);
        const x = Math.random() * 240 + 10;
        const rand = Math.random();
        let type: Platform['type'] = 'standard';
        if (rand < 0.2) type = 'moving';
        else if (rand < 0.35) type = 'cracked';
        else if (rand < 0.42) type = 'spring';
        else if (rand < 0.45) type = 'jetpack';

        g.platforms.push({
          id: nextId.current++,
          x,
          y: highestY,
          width: 55,
          height: 12,
          type,
          vx: type === 'moving' ? (Math.random() < 0.5 ? 1.5 : -1.5) : 0,
        });

        // Chance to spawn a monster
        if (Math.random() < 0.12 && highestY < -200) {
          g.monsters.push({
            id: nextId.current++,
            x: Math.random() * 220 + 30,
            y: highestY - 45,
            radius: 16,
            alive: true,
            vx: Math.random() < 0.5 ? 0.8 : -0.8,
          });
        }
      }

      // Remove platforms far below camera
      g.platforms = g.platforms.filter((pl) => pl.y < g.cameraY + height + 60);
      g.monsters = g.monsters.filter((m) => m.y < g.cameraY + height + 60 && m.alive);

      // Update moving platforms & monsters
      for (const pl of g.platforms) {
        if (pl.type === 'moving' && pl.vx) {
          pl.x += pl.vx;
          if (pl.x < 5 || pl.x > width - pl.width - 5) pl.vx *= -1;
        }
      }
      for (const m of g.monsters) {
        if (m.alive) {
          m.x += m.vx;
          if (m.x < 20 || m.x > width - 20) m.vx *= -1;

          // Check player collision with monster
          const dist = Math.hypot(p.x - m.x, p.y - m.y);
          if (dist < p.radius + m.radius) {
            if (p.vy > 0 && p.y < m.y) {
              // Jump on top of monster
              m.alive = false;
              p.vy = -12;
              sound.playSplat();
              triggerHaptic('medium');
            } else if (p.jetpackTime <= 0 && !g.gameOver) {
              // Hit monster -> Game Over!
              g.gameOver = true;
              setGameOver(true);
              sound.playExplosion();
              triggerHaptic('heavy');
            }
          }
        }
      }

      // 7. Check Fall Game Over
      if (p.y > g.cameraY + height + 40 && !g.gameOver) {
        g.gameOver = true;
        setGameOver(true);
        sound.playExplosion();
        triggerHaptic('heavy');
      }

      // ================= DRAWING =================
      ctx.save();
      // Translate by camera
      ctx.translate(0, -g.cameraY);

      // Draw Grid Paper background pattern
      ctx.fillStyle = '#fbf9f1';
      ctx.fillRect(0, g.cameraY, width, height);

      // Grid lines
      ctx.strokeStyle = '#e6e3d5';
      ctx.lineWidth = 1;
      const startGridY = Math.floor(g.cameraY / 20) * 20;
      for (let gy = startGridY; gy < g.cameraY + height; gy += 20) {
        ctx.beginPath();
        ctx.moveTo(0, gy);
        ctx.lineTo(width, gy);
        ctx.stroke();
      }
      for (let gx = 0; gx < width; gx += 20) {
        ctx.beginPath();
        ctx.moveTo(gx, g.cameraY);
        ctx.lineTo(gx, g.cameraY + height);
        ctx.stroke();
      }

      // Draw High Score Line
      if (highScore > 0) {
        const lineY = -highScore;
        if (lineY > g.cameraY - 20 && lineY < g.cameraY + height) {
          ctx.strokeStyle = '#ef4444';
          ctx.setLineDash([4, 4]);
          ctx.beginPath();
          ctx.moveTo(0, lineY);
          ctx.lineTo(width, lineY);
          ctx.stroke();
          ctx.setLineDash([]);
          ctx.fillStyle = '#ef4444';
          ctx.font = 'bold 10px sans-serif';
          ctx.fillText(`BEST: ${highScore}m`, 8, lineY - 3);
        }
      }

      // Draw Platforms
      for (const pl of g.platforms) {
        if (pl.broken) continue;
        ctx.save();
        if (pl.type === 'standard') {
          // Classic green doodle platform
          ctx.fillStyle = '#84cc16';
          ctx.strokeStyle = '#4d7c0f';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.roundRect(pl.x, pl.y, pl.width, pl.height, 6);
          ctx.fill();
          ctx.stroke();
        } else if (pl.type === 'moving') {
          // Blue moving platform
          ctx.fillStyle = '#38bdf8';
          ctx.strokeStyle = '#0284c7';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.roundRect(pl.x, pl.y, pl.width, pl.height, 6);
          ctx.fill();
          ctx.stroke();
        } else if (pl.type === 'cracked') {
          // Cracked brown wood
          ctx.fillStyle = '#b45309';
          ctx.strokeStyle = '#78350f';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.roundRect(pl.x, pl.y, pl.width, pl.height, 4);
          ctx.fill();
          ctx.stroke();
          // Crack mark
          ctx.strokeStyle = '#fef08a';
          ctx.beginPath();
          ctx.moveTo(pl.x + 15, pl.y + 2);
          ctx.lineTo(pl.x + 28, pl.y + 10);
          ctx.lineTo(pl.x + 40, pl.y + 3);
          ctx.stroke();
        } else if (pl.type === 'spring') {
          // Green platform with silver coiled spring
          ctx.fillStyle = '#84cc16';
          ctx.strokeStyle = '#4d7c0f';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.roundRect(pl.x, pl.y, pl.width, pl.height, 6);
          ctx.fill();
          ctx.stroke();

          // Spring on top
          ctx.fillStyle = '#94a3b8';
          ctx.strokeStyle = '#475569';
          ctx.beginPath();
          ctx.rect(pl.x + pl.width / 2 - 5, pl.y - 8, 10, 8);
          ctx.fill();
          ctx.stroke();
        } else if (pl.type === 'jetpack') {
          // Green platform with rocket
          ctx.fillStyle = '#84cc16';
          ctx.strokeStyle = '#4d7c0f';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.roundRect(pl.x, pl.y, pl.width, pl.height, 6);
          ctx.fill();
          ctx.stroke();

          // Jetpack icon
          ctx.font = '14px sans-serif';
          ctx.fillText('🚀', pl.x + pl.width / 2 - 7, pl.y - 4);
        }
        ctx.restore();
      }

      // Draw Monsters
      for (const m of g.monsters) {
        if (!m.alive) continue;
        ctx.save();
        ctx.translate(m.x, m.y);
        // Purple blob monster
        ctx.fillStyle = '#a855f7';
        ctx.strokeStyle = '#6b21a8';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, 0, m.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Eye
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(0, -2, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#000000';
        ctx.beginPath();
        ctx.arc(0, -2, 2.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      // Draw Bullets
      for (const b of g.bullets) {
        ctx.fillStyle = '#f59e0b';
        ctx.beginPath();
        ctx.arc(b.x, b.y, 4, 0, Math.PI * 2);
        ctx.fill();
      }

      // Draw Doodle Jumper
      ctx.save();
      ctx.translate(p.x, p.y);
      if (p.facingLeft) ctx.scale(-1, 1);

      // Jetpack flame
      if (p.jetpackTime > 0) {
        ctx.fillStyle = Math.random() < 0.5 ? '#f97316' : '#ef4444';
        ctx.beginPath();
        ctx.moveTo(-10, 10);
        ctx.lineTo(-15, 26 + Math.random() * 8);
        ctx.lineTo(-5, 10);
        ctx.fill();
      }

      // Green body
      ctx.fillStyle = '#a3e635';
      ctx.strokeStyle = '#4d7c0f';
      ctx.lineWidth = 2.5;

      // Legs
      ctx.beginPath();
      ctx.roundRect(-10, 10, 6, 8, 3);
      ctx.roundRect(4, 10, 6, 8, 3);
      ctx.fill();
      ctx.stroke();

      // Main head/body
      ctx.beginPath();
      ctx.ellipse(0, 0, 14, 16, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Cute round Snout / Nose (facing right)
      ctx.beginPath();
      ctx.roundRect(8, -4, 10, 7, 3);
      ctx.fill();
      ctx.stroke();

      // Eyes
      ctx.fillStyle = '#000000';
      ctx.beginPath();
      ctx.arc(2, -6, 2, 0, Math.PI * 2);
      ctx.arc(8, -6, 2, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();

      ctx.restore(); // Undo camera translation

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, []);

  return (
    <div className="relative w-full h-full flex flex-col justify-between select-none overflow-hidden bg-[#fbf9f1]">
      {/* Top Status & HUD */}
      <div className="relative z-20 w-full flex flex-col">
        <StatusBar darkText />

        {/* Doodle HUD Bar */}
        <div className="flex items-center justify-between px-3 py-1.5 bg-white/85 backdrop-blur-xs border-b border-neutral-300 text-neutral-900 shadow-xs">
          <div className="flex items-baseline gap-1.5">
            <span className="text-[10px] uppercase font-bold text-neutral-500">Altitude</span>
            <span className="text-xl font-black text-lime-700 tracking-tight">{score}m</span>
          </div>

          <div className="flex items-center gap-1">
            <span className="text-[10px] text-neutral-400">BEST:</span>
            <span className="text-sm font-bold text-neutral-700">{highScore}m</span>
          </div>

          <button
            onClick={shootBullet}
            className="px-2.5 py-1 rounded-md bg-amber-500 hover:bg-amber-600 active:scale-95 text-white text-[11px] font-bold shadow-xs flex items-center gap-1"
          >
            <span>🎯</span>
            <span>Shoot</span>
          </button>
        </div>
      </div>

      {/* Main Doodle Canvas */}
      <div className="relative flex-1 w-full h-full overflow-hidden touch-none flex items-center justify-center">
        <canvas
          ref={canvasRef}
          width={320}
          height={400}
          onClick={shootBullet}
          className="w-full h-full object-cover cursor-pointer"
        />

        {/* Game Over Screen */}
        {gameOver && (
          <div className="absolute inset-0 z-30 bg-black/85 backdrop-blur-xs flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-200">
            <div className="w-14 h-14 rounded-full bg-lime-500/20 border-2 border-lime-500 flex items-center justify-center text-3xl mb-2 shadow-lg">
              🐸
            </div>
            <h2 className="text-2xl font-black text-white tracking-wide uppercase">
              Fell Down!
            </h2>
            <p className="text-xs text-neutral-400 mt-0.5">Doodle Leap Adventure</p>

            <div className="my-4 bg-neutral-900/90 border border-neutral-800 rounded-xl p-3 w-52 shadow-inner">
              <div className="flex justify-between items-center text-xs text-neutral-400 mb-1">
                <span>FINAL ALTITUDE</span>
                <span className="text-lg font-black text-white">{score}m</span>
              </div>
              <div className="flex justify-between items-center text-xs text-neutral-400 border-t border-neutral-800 pt-1">
                <span>BEST HEIGHT</span>
                <span className="font-bold text-amber-400 flex items-center gap-1">
                  <Award className="w-3 h-3" />
                  {Math.max(score, highScore)}m
                </span>
              </div>
            </div>

            <div className="flex gap-2 w-52">
              <button
                onClick={restartGame}
                className="flex-1 py-2 rounded-lg bg-gradient-to-b from-lime-500 to-lime-600 text-white text-xs font-bold shadow-md hover:from-lime-400 hover:to-lime-500 active:scale-95 flex items-center justify-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Jump Again
              </button>
              <button
                onClick={onExit}
                className="px-3 py-2 rounded-lg bg-neutral-800 text-neutral-300 text-xs font-medium border border-neutral-700 hover:bg-neutral-700"
              >
                Quit
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Tilt & Touch Controls Footer for mobile / desktop */}
      <div className="relative z-20 w-full p-2 bg-neutral-900 border-t border-neutral-800 flex items-center justify-between text-[11px] text-neutral-300">
        {/* Left touch button */}
        <button
          onMouseDown={() => (gameStateRef.current.touchHold = -1)}
          onMouseUp={() => (gameStateRef.current.touchHold = 0)}
          onTouchStart={() => (gameStateRef.current.touchHold = -1)}
          onTouchEnd={() => (gameStateRef.current.touchHold = 0)}
          className="px-4 py-1.5 rounded-lg bg-neutral-800 border border-neutral-700 active:bg-neutral-700 font-bold select-none text-white text-sm"
        >
          ◀ Tilt Left
        </button>

        <span className="text-[10px] text-neutral-400 text-center leading-tight">
          {tiltSource === 'sensor' ? 'iPhone Gyro Active' : 'Tap sides or tilt'}
        </span>

        {/* Right touch button */}
        <button
          onMouseDown={() => (gameStateRef.current.touchHold = 1)}
          onMouseUp={() => (gameStateRef.current.touchHold = 0)}
          onTouchStart={() => (gameStateRef.current.touchHold = 1)}
          onTouchEnd={() => (gameStateRef.current.touchHold = 0)}
          className="px-4 py-1.5 rounded-lg bg-neutral-800 border border-neutral-700 active:bg-neutral-700 font-bold select-none text-white text-sm"
        >
          Tilt Right ▶
        </button>
      </div>
    </div>
  );
};
