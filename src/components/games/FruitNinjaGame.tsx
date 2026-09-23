import React, { useState, useEffect, useRef } from 'react';
import { StatusBar } from '../iphone/StatusBar';
import { sound } from '../../audio/soundEffects';
import { triggerHaptic } from '../../utils/storage';
import { RotateCcw, Award } from 'lucide-react';

interface FruitNinjaProps {
  highScore: number;
  onUpdateScore: (newScore: number) => void;
  onUnlockAchievement: (id: string) => void;
  onExit: () => void;
}

interface Point {
  x: number;
  y: number;
  time: number;
}

interface Fruit {
  id: number;
  type: 'watermelon' | 'orange' | 'strawberry' | 'banana' | 'coconut' | 'bomb';
  x: number;
  y: number;
  vx: number;
  vy: number;
  rotation: number;
  vRot: number;
  radius: number;
  sliced: boolean;
  sliceAngle?: number;
  half1?: { x: number; y: number; vx: number; vy: number; rot: number; vRot: number };
  half2?: { x: number; y: number; vx: number; vy: number; rot: number; vRot: number };
  color: string;
  emoji: string;
}

interface Splatter {
  x: number;
  y: number;
  color: string;
  radius: number;
  alpha: number;
}

interface FloatingText {
  id: number;
  text: string;
  x: number;
  y: number;
  color: string;
  alpha: number;
  scale: number;
}

export const FruitNinjaGame: React.FC<FruitNinjaProps> = ({
  highScore,
  onUpdateScore,
  onUnlockAchievement,
  onExit,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [score, setScore] = useState(0);
  const [strikes, setStrikes] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [gameMode, setGameMode] = useState<'classic' | 'zen'>('classic');
  const [zenTimeLeft, setZenTimeLeft] = useState(60);

  // References to keep requestAnimationFrame 60FPS fluid
  const gameStateRef = useRef({
    score: 0,
    strikes: 0,
    gameOver: false,
    gameMode: 'classic' as 'classic' | 'zen',
    zenTimeLeft: 60,
    fruits: [] as Fruit[],
    splatters: [] as Splatter[],
    floatingTexts: [] as FloatingText[],
    trail: [] as Point[],
    isSlashing: false,
    lastSpawn: 0,
    spawnInterval: 1400,
    comboFruits: 0,
    lastSliceTime: 0,
  });

  const nextFruitId = useRef(1);
  const textId = useRef(1);

  // Sync state
  useEffect(() => {
    gameStateRef.current.score = score;
    gameStateRef.current.strikes = strikes;
    gameStateRef.current.gameOver = gameOver;
    gameStateRef.current.gameMode = gameMode;
    gameStateRef.current.zenTimeLeft = zenTimeLeft;
  }, [score, strikes, gameOver, gameMode, zenTimeLeft]);

  // Zen mode countdown timer
  useEffect(() => {
    if (gameMode !== 'zen' || gameOver) return;
    const timer = setInterval(() => {
      setZenTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          triggerGameOver('Time up!');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [gameMode, gameOver]);

  const triggerGameOver = (reason: string) => {
    setGameOver(true);
    gameStateRef.current.gameOver = true;
    sound.playExplosion();
    triggerHaptic('heavy');
    if (gameStateRef.current.score > highScore) {
      onUpdateScore(gameStateRef.current.score);
    }
  };

  const restartGame = () => {
    sound.playClick(800, 0.03);
    setScore(0);
    setStrikes(0);
    setGameOver(false);
    setZenTimeLeft(60);
    gameStateRef.current.score = 0;
    gameStateRef.current.strikes = 0;
    gameStateRef.current.gameOver = false;
    gameStateRef.current.zenTimeLeft = 60;
    gameStateRef.current.fruits = [];
    gameStateRef.current.floatingTexts = [];
    gameStateRef.current.lastSpawn = performance.now();
  };

  const spawnFruit = (width: number, height: number) => {
    const types: Fruit['type'][] = ['watermelon', 'orange', 'strawberry', 'banana', 'coconut'];
    // In classic mode, 20% chance for a bomb
    const isBomb = gameStateRef.current.gameMode === 'classic' && Math.random() < 0.22;
    const type: Fruit['type'] = isBomb
      ? 'bomb'
      : types[Math.floor(Math.random() * types.length)];

    const x = Math.random() * (width - 80) + 40;
    const y = height + 30;
    // Aim trajectory slightly towards center
    const targetX = width * 0.5 + (Math.random() * 100 - 50);
    const vx = (targetX - x) * 0.02 + (Math.random() * 1.5 - 0.75);
    // Vertical velocity to reach top 60% of screen
    const vy = -(Math.random() * 3.5 + 11.5);

    const emojiMap = {
      watermelon: '🍉',
      orange: '🍊',
      strawberry: '🍓',
      banana: '🍌',
      coconut: '🥥',
      bomb: '💣',
    };

    const colorMap = {
      watermelon: '#e11d48',
      orange: '#f97316',
      strawberry: '#f43f5e',
      banana: '#eab308',
      coconut: '#f5f5f4',
      bomb: '#171717',
    };

    const newFruit: Fruit = {
      id: nextFruitId.current++,
      type,
      x,
      y,
      vx,
      vy,
      rotation: Math.random() * Math.PI * 2,
      vRot: (Math.random() - 0.5) * 0.08,
      radius: type === 'watermelon' ? 24 : type === 'strawberry' ? 18 : 22,
      sliced: false,
      color: colorMap[type],
      emoji: emojiMap[type],
    };

    gameStateRef.current.fruits.push(newFruit);
  };

  // Line segment distance to point for slice collision
  const distToSegment = (
    p: { x: number; y: number },
    v: { x: number; y: number },
    w: { x: number; y: number }
  ) => {
    const l2 = (v.x - w.x) ** 2 + (v.y - w.y) ** 2;
    if (l2 === 0) return Math.hypot(p.x - v.x, p.y - v.y);
    let t = ((p.x - v.x) * (w.x - v.x) + (p.y - v.y) * (w.y - v.y)) / l2;
    t = Math.max(0, Math.min(1, t));
    return Math.hypot(p.x - (v.x + t * (w.x - v.x)), p.y - (v.y + t * (w.y - v.y)));
  };

  const handleSlice = (p1: Point, p2: Point) => {
    if (gameStateRef.current.gameOver) return;
    const now = performance.now();
    const g = gameStateRef.current;

    // Reset combo if gap too long
    if (now - g.lastSliceTime > 350) {
      g.comboFruits = 0;
    }

    let slicedCountThisSwipe = 0;

    for (const fruit of g.fruits) {
      if (fruit.sliced) continue;

      const dist = distToSegment(fruit, p1, p2);
      if (dist < fruit.radius + 8) {
        // Hit!
        fruit.sliced = true;
        const sliceAngle = Math.atan2(p2.y - p1.y, p2.x - p1.x);
        fruit.sliceAngle = sliceAngle;

        if (fruit.type === 'bomb') {
          triggerGameOver('Hit a bomb!');
          return;
        }

        // Fruit sliced
        slicedCountThisSwipe++;
        g.comboFruits++;
        g.lastSliceTime = now;

        sound.playSplat();
        triggerHaptic('light');
        onUnlockAchievement('first_slice');

        // Split into halves
        const perpX = Math.cos(sliceAngle + Math.PI / 2);
        const perpY = Math.sin(sliceAngle + Math.PI / 2);

        fruit.half1 = {
          x: fruit.x - perpX * 8,
          y: fruit.y - perpY * 8,
          vx: fruit.vx - perpX * 3.5,
          vy: fruit.vy - 1,
          rot: fruit.rotation,
          vRot: -0.1,
        };

        fruit.half2 = {
          x: fruit.x + perpX * 8,
          y: fruit.y + perpY * 8,
          vx: fruit.vx + perpX * 3.5,
          vy: fruit.vy - 1,
          rot: fruit.rotation,
          vRot: 0.1,
        };

        // Add splatters on dojo wood
        for (let i = 0; i < 4; i++) {
          g.splatters.push({
            x: fruit.x + (Math.random() * 40 - 20),
            y: fruit.y + (Math.random() * 40 - 20),
            color: fruit.color,
            radius: Math.random() * 12 + 6,
            alpha: 0.65,
          });
        }
        if (g.splatters.length > 35) {
          g.splatters.shift();
        }

        // Add score
        let points = 1;
        setScore((prev) => {
          const next = prev + points;
          if (next > highScore) onUpdateScore(next);
          return next;
        });

        // Floating score
        g.floatingTexts.push({
          id: textId.current++,
          text: `+${points}`,
          x: fruit.x,
          y: fruit.y - 10,
          color: '#ffffff',
          alpha: 1,
          scale: 1,
        });
      }
    }

    if (g.comboFruits >= 3) {
      sound.playCombo(g.comboFruits);
      onUnlockAchievement('combo_master');
      const bonus = g.comboFruits;
      setScore((prev) => {
        const next = prev + bonus;
        if (next > highScore) onUpdateScore(next);
        return next;
      });

      g.floatingTexts.push({
        id: textId.current++,
        text: `COMBO x${g.comboFruits} +${bonus}!`,
        x: p2.x,
        y: p2.y - 30,
        color: '#facc15',
        alpha: 1,
        scale: 1.3,
      });
      g.comboFruits = 0;
    }
  };

  // Main Canvas Render and Game Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;

    const loop = (timestamp: number) => {
      const width = canvas.width;
      const height = canvas.height;
      const g = gameStateRef.current;

      // 1. Clear & Draw Dojo Background
      ctx.fillStyle = '#3c2010';
      ctx.fillRect(0, 0, width, height);

      // Wood plank vertical seams
      ctx.strokeStyle = 'rgba(0,0,0,0.3)';
      ctx.lineWidth = 2;
      for (let x = 40; x < width; x += 45) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }

      // Draw persistent juice splatters
      for (const splat of g.splatters) {
        ctx.save();
        ctx.globalAlpha = splat.alpha;
        ctx.fillStyle = splat.color;
        ctx.beginPath();
        ctx.arc(splat.x, splat.y, splat.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      // 2. Spawn Fruits
      if (!g.gameOver && timestamp - g.lastSpawn > g.spawnInterval) {
        g.lastSpawn = timestamp;
        const count = Math.random() < 0.4 ? 2 : 1;
        for (let i = 0; i < count; i++) {
          spawnFruit(width, height);
        }
        // Slightly increase spawn rate
        g.spawnInterval = Math.max(850, 1400 - g.score * 12);
      }

      // 3. Update and Render Fruits
      const gravity = 0.28;
      for (let i = g.fruits.length - 1; i >= 0; i--) {
        const fruit = g.fruits[i];

        if (!fruit.sliced) {
          fruit.x += fruit.vx;
          fruit.y += fruit.vy;
          fruit.vy += gravity;
          fruit.rotation += fruit.vRot;

          // Check if missed fruit dropped below screen
          if (fruit.y > height + 40 && fruit.vy > 0) {
            if (fruit.type !== 'bomb' && g.gameMode === 'classic' && !g.gameOver) {
              setStrikes((prev) => {
                const next = prev + 1;
                if (next >= 3) {
                  triggerGameOver('3 Fruits Missed!');
                }
                return next;
              });
              sound.playClick(300, 0.1);
              triggerHaptic('medium');
            }
            g.fruits.splice(i, 1);
            continue;
          }

          // Draw uncut fruit
          ctx.save();
          ctx.translate(fruit.x, fruit.y);
          ctx.rotate(fruit.rotation);

          if (fruit.type === 'bomb') {
            // Shiny black bomb with sparkling fuse
            ctx.fillStyle = '#171717';
            ctx.beginPath();
            ctx.arc(0, 0, fruit.radius, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = 'rgba(255,255,255,0.3)';
            ctx.beginPath();
            ctx.arc(-fruit.radius * 0.3, -fruit.radius * 0.3, fruit.radius * 0.35, 0, Math.PI * 2);
            ctx.fill();
            // Sparking wick
            ctx.fillStyle = '#f59e0b';
            ctx.fillRect(-2, -fruit.radius - 8, 4, 8);
            ctx.fillStyle = Math.random() < 0.5 ? '#ef4444' : '#fbbf24';
            ctx.beginPath();
            ctx.arc(0, -fruit.radius - 9, 3.5, 0, Math.PI * 2);
            ctx.fill();
          } else {
            // Draw fruit emoji with shadow
            ctx.font = `${fruit.radius * 2}px sans-serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(fruit.emoji, 0, 0);
          }
          ctx.restore();
        } else {
          // Draw sliced halves
          if (fruit.half1 && fruit.half2) {
            fruit.half1.x += fruit.half1.vx;
            fruit.half1.y += fruit.half1.vy;
            fruit.half1.vy += gravity * 1.2;
            fruit.half1.rot += fruit.half1.vRot;

            fruit.half2.x += fruit.half2.vx;
            fruit.half2.y += fruit.half2.vy;
            fruit.half2.vy += gravity * 1.2;
            fruit.half2.rot += fruit.half2.vRot;

            // Half 1
            ctx.save();
            ctx.translate(fruit.half1.x, fruit.half1.y);
            ctx.rotate(fruit.half1.rot);
            ctx.beginPath();
            ctx.arc(0, 0, fruit.radius, 0, Math.PI);
            ctx.fillStyle = fruit.color;
            ctx.fill();
            ctx.restore();

            // Half 2
            ctx.save();
            ctx.translate(fruit.half2.x, fruit.half2.y);
            ctx.rotate(fruit.half2.rot);
            ctx.beginPath();
            ctx.arc(0, 0, fruit.radius, Math.PI, Math.PI * 2);
            ctx.fillStyle = fruit.color;
            ctx.fill();
            ctx.restore();

            if (fruit.half1.y > height + 60 && fruit.half2.y > height + 60) {
              g.fruits.splice(i, 1);
            }
          }
        }
      }

      // 4. Draw Blade Slash Trail
      const now = performance.now();
      // Remove points older than 180ms
      g.trail = g.trail.filter((pt) => now - pt.time < 180);

      if (g.trail.length > 1) {
        ctx.beginPath();
        ctx.moveTo(g.trail[0].x, g.trail[0].y);
        for (let i = 1; i < g.trail.length; i++) {
          ctx.lineTo(g.trail[i].x, g.trail[i].y);
        }
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        // Outer glow
        ctx.strokeStyle = 'rgba(56, 189, 248, 0.45)';
        ctx.lineWidth = 9;
        ctx.stroke();

        // Inner sharp blade
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 3.5;
        ctx.stroke();
      }

      // 5. Draw Floating Texts (Scores & Combos)
      for (let i = g.floatingTexts.length - 1; i >= 0; i--) {
        const ft = g.floatingTexts[i];
        ft.y -= 1.2;
        ft.alpha -= 0.025;
        if (ft.alpha <= 0) {
          g.floatingTexts.splice(i, 1);
          continue;
        }

        ctx.save();
        ctx.globalAlpha = ft.alpha;
        ctx.font = `bold ${16 * ft.scale}px sans-serif`;
        ctx.fillStyle = ft.color;
        ctx.textAlign = 'center';
        ctx.shadowColor = 'rgba(0,0,0,0.8)';
        ctx.shadowBlur = 4;
        ctx.fillText(ft.text, ft.x, ft.y);
        ctx.restore();
      }

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, []);

  // Pointer / Touch Event Handlers
  const getCoordinates = (e: React.TouchEvent | React.MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    let clientX = 0;
    let clientY = 0;
    if ('touches' in e && e.touches.length > 0) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else if ('clientX' in e) {
      clientX = (e as React.MouseEvent).clientX;
      clientY = (e as React.MouseEvent).clientY;
    }

    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY,
    };
  };

  const handlePointerDown = (e: React.TouchEvent | React.MouseEvent) => {
    const coords = getCoordinates(e);
    if (!coords) return;
    gameStateRef.current.isSlashing = true;
    const pt = { x: coords.x, y: coords.y, time: performance.now() };
    gameStateRef.current.trail = [pt];
    sound.playSwipe();
  };

  const handlePointerMove = (e: React.TouchEvent | React.MouseEvent) => {
    if (!gameStateRef.current.isSlashing) return;
    const coords = getCoordinates(e);
    if (!coords) return;
    const now = performance.now();
    const newPt = { x: coords.x, y: coords.y, time: now };
    const trail = gameStateRef.current.trail;

    if (trail.length > 0) {
      const lastPt = trail[trail.length - 1];
      const dist = Math.hypot(newPt.x - lastPt.x, newPt.y - lastPt.y);
      // If moved sufficient distance, trigger slice
      if (dist > 8) {
        handleSlice(lastPt, newPt);
      }
    }
    trail.push(newPt);
  };

  const handlePointerUp = () => {
    gameStateRef.current.isSlashing = false;
  };

  return (
    <div className="relative w-full h-full flex flex-col justify-between select-none overflow-hidden bg-neutral-900">
      {/* Top Bar with score, strikes/time */}
      <div className="relative z-20 w-full flex flex-col">
        <StatusBar theme="black" />
        
        {/* Game HUD Bar */}
        <div className="flex items-center justify-between px-3 py-1.5 bg-black/70 backdrop-blur-xs border-b border-white/10 text-white">
          {/* Score */}
          <div className="flex items-baseline gap-1.5">
            <span className="text-[10px] uppercase font-bold text-amber-400">Score</span>
            <span className="text-xl font-black tracking-tight">{score}</span>
          </div>

          {/* Mode-specific status */}
          {gameMode === 'classic' ? (
            <div className="flex items-center gap-1">
              <span className="text-[10px] text-neutral-400 mr-1">STRIKES:</span>
              {[1, 2, 3].map((i) => (
                <span
                  key={i}
                  className={`text-sm font-black transition-colors ${
                    i <= strikes ? 'text-red-500' : 'text-neutral-700'
                  }`}
                >
                  ✕
                </span>
              ))}
            </div>
          ) : (
            <div className="flex items-center gap-1">
              <span className="text-[10px] text-neutral-400">TIME:</span>
              <span className="text-sm font-bold text-yellow-400">{zenTimeLeft}s</span>
            </div>
          )}

          {/* Mode Switcher */}
          <div className="flex items-center gap-1 bg-neutral-800/80 p-0.5 rounded-md text-[10px]">
            <button
              onClick={() => {
                setGameMode('classic');
                restartGame();
              }}
              className={`px-2 py-0.5 rounded-sm transition-colors ${
                gameMode === 'classic' ? 'bg-amber-600 text-white font-bold' : 'text-neutral-400'
              }`}
            >
              Classic
            </button>
            <button
              onClick={() => {
                setGameMode('zen');
                restartGame();
              }}
              className={`px-2 py-0.5 rounded-sm transition-colors ${
                gameMode === 'zen' ? 'bg-emerald-600 text-white font-bold' : 'text-neutral-400'
              }`}
            >
              Zen
            </button>
          </div>
        </div>
      </div>

      {/* Main Game Canvas (320 x 380 approx active area) */}
      <div className="relative flex-1 w-full h-full touch-none overflow-hidden flex items-center justify-center">
        <canvas
          ref={canvasRef}
          width={320}
          height={410}
          onMouseDown={handlePointerDown}
          onMouseMove={handlePointerMove}
          onMouseUp={handlePointerUp}
          onTouchStart={handlePointerDown}
          onTouchMove={handlePointerMove}
          onTouchEnd={handlePointerUp}
          className="w-full h-full object-cover cursor-crosshair"
        />

        {/* Game Over Modal Screen */}
        {gameOver && (
          <div className="absolute inset-0 z-30 bg-black/85 backdrop-blur-xs flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-200">
            <div className="w-14 h-14 rounded-full bg-red-600/20 border-2 border-red-500 flex items-center justify-center text-2xl mb-2 shadow-lg">
              🍉
            </div>
            <h2 className="text-2xl font-black text-white tracking-wide uppercase">
              Game Over
            </h2>
            <p className="text-xs text-neutral-400 mt-0.5">Dojo Session Complete</p>

            <div className="my-4 bg-neutral-900/90 border border-neutral-800 rounded-xl p-3 w-52 shadow-inner">
              <div className="flex justify-between items-center text-xs text-neutral-400 mb-1">
                <span>FINAL SCORE</span>
                <span className="text-lg font-black text-white">{score}</span>
              </div>
              <div className="flex justify-between items-center text-xs text-neutral-400 border-t border-neutral-800 pt-1">
                <span>BEST RECORD</span>
                <span className="font-bold text-amber-400 flex items-center gap-1">
                  <Award className="w-3 h-3" />
                  {Math.max(score, highScore)}
                </span>
              </div>
            </div>

            <div className="flex gap-2 w-52">
              <button
                onClick={restartGame}
                className="flex-1 py-2 rounded-lg bg-gradient-to-b from-amber-500 to-amber-600 text-white text-xs font-bold shadow-md hover:from-amber-400 hover:to-amber-500 active:scale-95 flex items-center justify-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Play Again
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

      {/* Footer Exit hint */}
      <div className="relative z-20 w-full py-1.5 px-3 bg-black/90 flex justify-between items-center text-[10px] text-neutral-400 border-t border-white/10">
        <span>Swipe screen to slice</span>
        <button
          onClick={onExit}
          className="text-neutral-300 hover:text-white underline font-medium"
        >
          Exit to Home
        </button>
      </div>
    </div>
  );
};
