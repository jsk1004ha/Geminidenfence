/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Shield, 
  Zap, 
  Target, 
  Trophy, 
  Play, 
  Pause, 
  RotateCcw, 
  Settings,
  ArrowUpCircle,
  Coins,
  Cpu
} from 'lucide-react';
import { GameState, CoreStats } from './types';
import { INITIAL_GAME_STATE, CORE_TEMPLATES, CANVAS_SIZE, UPGRADES } from './constants';
import { GameEngine } from './game/GameEngine';

export default function App() {
  const [gameState, setGameState] = useState<GameState>(INITIAL_GAME_STATE);
  const [core, setCore] = useState<CoreStats>(CORE_TEMPLATES[INITIAL_GAME_STATE.activeCoreId]);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<GameEngine>(new GameEngine());
  const requestRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);

  useEffect(() => {
    const saved = localStorage.getItem('orbital_core_save');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setGameState(prev => ({
          ...prev,
          credits: parsed.credits || 0,
          permanentUpgrades: parsed.permanentUpgrades || {}
        }));
      } catch (e) { console.error('Save corrupted'); }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('orbital_core_save', JSON.stringify({
      credits: gameState.credits,
      permanentUpgrades: gameState.permanentUpgrades
    }));
  }, [gameState.credits, gameState.permanentUpgrades]);

  const startGame = (coreId?: string) => {
    const selectedCoreId = coreId || gameState.activeCoreId;
    setGameState(prev => ({ ...prev, gameStatus: 'PLAYING', runCoins: 0, wave: 1, activeCoreId: selectedCoreId }));
    setCore({ ...CORE_TEMPLATES[selectedCoreId], hp: CORE_TEMPLATES[selectedCoreId].maxHp });
    engineRef.current = new GameEngine();
  };

  const handleWaveComplete = () => {
    setGameState(prev => ({ ...prev, wave: prev.wave + 1 }));
  };

  const handleEnemyKill = (reward: number) => {
    setGameState(prev => ({ ...prev, runCoins: prev.runCoins + reward }));
  };

  const handleCoreDamage = (dmg: number) => {
    setCore(prev => {
      const nextHp = Math.max(0, prev.hp - dmg);
      if (nextHp <= 0) {
        setGameState(gs => ({ ...gs, gameStatus: 'GAMEOVER' }));
      }
      return { ...prev, hp: nextHp };
    });
  };

  const buyModule = () => {
    if (gameState.runCoins >= 100) {
      setGameState(prev => ({ ...prev, runCoins: prev.runCoins - 100 }));
      engineRef.current.modules.push({
        id: Math.random().toString(36),
        type: 'ORBITER',
        angle: Math.random() * Math.PI * 2,
        distance: 80 + Math.random() * 40,
        rotationSpeed: 0.05 + Math.random() * 0.05,
        damage: 15
      });
    }
  };

  const animate = (time: number) => {
    if (lastTimeRef.current !== 0 && !gameState.isPaused && gameState.gameStatus === 'PLAYING') {
      const deltaTime = (time - lastTimeRef.current) / 1000;
      const ctx = canvasRef.current?.getContext('2d');
      if (ctx) {
        engineRef.current.update(core, deltaTime, gameState.wave, handleEnemyKill, handleCoreDamage, handleWaveComplete);
        engineRef.current.render(ctx, core);
      }
    }
    lastTimeRef.current = time;
    requestRef.current = requestAnimationFrame(animate);
  };

  useEffect(() => {
    requestRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(requestRef.current);
  }, [gameState.isPaused, gameState.gameStatus, core]);

  const buyUpgrade = (upgradeId: string) => {
    const upgrade = UPGRADES.RUN.find(u => u.id === upgradeId);
    if (!upgrade) return;

    const level = (gameState.permanentUpgrades[upgradeId] || 0);
    const cost = Math.floor(upgrade.baseCost * Math.pow(upgrade.costMult, level));

    if (gameState.runCoins >= cost) {
      setGameState(prev => ({
        ...prev,
        runCoins: prev.runCoins - cost,
        permanentUpgrades: { ...prev.permanentUpgrades, [upgradeId]: level + 1 }
      }));

      // Apply effect
      setCore(prev => {
        switch (upgradeId) {
          case 'dmg': return { ...prev, attackDamage: prev.attackDamage + 5 };
          case 'aspd': return { ...prev, attackSpeed: Math.max(200, prev.attackSpeed - 50) };
          case 'hp': return { ...prev, maxHp: prev.maxHp + 20, hp: prev.hp + 20 };
          case 'regen': return { ...prev, regen: prev.regen + 0.5 };
          default: return prev;
        }
      });
    }
  };

  return (
    <div className="relative w-full h-screen bg-[#050506] text-[#D1D5DB] flex flex-col items-center justify-center overflow-hidden select-none font-sans">
      
      {/* Background Decor */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(0,240,255,0.05)_0%,_transparent_70%)] pointer-events-none" />

      {/* Main Game Stage */}
      <div className="relative z-10 flex flex-col md:flex-row gap-6 p-4 w-full max-w-7xl justify-center items-center">
        
        {/* Left Panel: HUD & Controls */}
        <div className="flex flex-col gap-4 w-full md:w-[320px]">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="tech-card"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-[11px] font-bold text-[#6B7280] uppercase tracking-widest flex items-center gap-2">
                <Cpu className="w-4 h-4" /> CORE STATUS
              </h2>
              <div className="bg-[#1A1A1E] px-2 py-1 border border-[#2D2D33] rounded-sm text-[10px] text-[#00F0FF] font-mono uppercase tracking-widest">
                Stage {core.evolutionLevel}
              </div>
            </div>
            
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-[10px] text-[#6B7280] mb-1 font-mono uppercase tracking-widest">
                  <span>System Integrity</span>
                  <span className="text-[#D1D5DB]">{Math.ceil(core.hp)} / {core.maxHp}</span>
                </div>
                <div className="w-full bg-[#1A1A1E] h-1 overflow-hidden">
                  <motion.div 
                    initial={false}
                    animate={{ width: `${(core.hp / core.maxHp) * 100}%` }}
                    className="h-full bg-[#22C55E] shadow-[0_0_10px_#22C55E]"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-2 text-[10px] font-mono uppercase tracking-widest text-[#6B7280]">
                <div className="bg-[#131316] p-2 rounded-sm border border-[#2D2D33] flex justify-between items-center text-[#D1D5DB]">
                  <span>Score</span>
                  <span className="text-[#00F0FF]">{core.attackDamage}</span>
                </div>
                <div className="bg-[#131316] p-2 rounded-sm border border-[#2D2D33] flex justify-between items-center text-[#D1D5DB]">
                  <span>Spd</span>
                  <span className="text-[#A855F7]">{core.attackSpeed}ms</span>
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="tech-card flex-1 flex flex-col min-h-[300px]"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-[11px] font-bold text-[#6B7280] uppercase tracking-widest flex items-center gap-2">
                <ArrowUpCircle className="w-4 h-4" /> Sub-Systems
              </h2>
              <div className="text-[#EAB308] font-mono text-xs flex items-center gap-1">
                <Coins className="w-3 h-3" /> {gameState.runCoins}
              </div>
            </div>

            <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2">
              {UPGRADES.RUN.map((u) => {
                const level = (gameState.permanentUpgrades[u.id] || 0);
                const cost = Math.floor(u.baseCost * Math.pow(u.costMult, level));
                const canAfford = gameState.runCoins >= cost;

                return (
                  <button
                    key={u.id}
                    onClick={() => buyUpgrade(u.id)}
                    disabled={!canAfford}
                    className={`w-full text-left p-3 border-l-2 transition-all flex justify-between items-center group mb-1 ${
                      canAfford 
                      ? 'bg-[#1A1A1E] border-[#00F0FF] hover:bg-black cursor-pointer' 
                      : 'bg-[#1A1A1E]/40 border-transparent opacity-50 cursor-not-allowed'
                    }`}
                  >
                    <div className="flex-1">
                      <div className="text-xs font-bold text-white mb-0.5 uppercase tracking-widest">{u.name} <span className="text-[10px] text-[#6B7280] font-mono ml-1">Lv.{level}</span></div>
                      <div className="text-[10px] text-[#4B5563] line-clamp-1">{u.description}</div>
                    </div>
                    <div className="text-[#00F0FF] font-mono font-bold text-xs opacity-70 group-hover:opacity-100">
                      {cost}
                    </div>
                  </button>
                );
              })}
            </div>
          </motion.div>
        </div>

        {/* Center Canvas */}
        <div className="relative flex-1 w-full flex flex-col items-center justify-center">
          <div className="absolute top-4 z-20 bg-[#1A1A1E]/80 backdrop-blur-md border border-[#2D2D33] py-2 px-8 flex gap-12 font-mono shadow-2xl rounded-sm">
            <div className="text-center">
              <div className="text-[9px] text-[#6B7280] uppercase tracking-[0.2em] mb-1">Sector Wave</div>
              <div className="text-2xl font-black text-white tracking-tighter">{String(gameState.wave).padStart(3, '0')}</div>
            </div>
            <div className="text-center">
              <div className="text-[9px] text-[#6B7280] uppercase tracking-[0.2em] mb-1">Hostiles</div>
              <div className="text-2xl font-black text-[#FF4D00] tracking-tighter">{engineRef.current.enemies.length}</div>
            </div>
          </div>

          <div className="aspect-square w-full max-w-[600px] bg-black rounded-[100%] border-[1px] border-dashed border-[#2D2D33] relative overflow-hidden flex items-center justify-center shadow-[0_0_50px_rgba(0,0,0,0.8)]">
            <canvas 
              ref={canvasRef} 
              width={CANVAS_SIZE} 
              height={CANVAS_SIZE} 
              className="w-full h-full object-contain"
            />
            
            {gameState.gameStatus === 'MENU' && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="absolute inset-0 bg-[#050506]/95 backdrop-blur-md flex flex-col items-center justify-center z-30 px-4 text-center"
              >
                <div className="text-4xl md:text-5xl font-black text-white tracking-tighter mb-2 uppercase">
                  ORBITAL <span className="text-[#00F0FF] font-light">CORE</span>
                </div>
                <p className="text-[#6B7280] font-mono text-[10px] tracking-[0.4em] uppercase mb-12">Defense Engine Stabilized</p>
                
                <div className="grid grid-cols-3 gap-6 mb-12 max-w-lg w-full">
                   {Object.values(CORE_TEMPLATES).map(tpl => (
                     <button 
                       key={tpl.id}
                       onClick={() => startGame(tpl.id)}
                       className="group relative flex flex-col items-center p-5 border border-[#2D2D33] bg-[#0A0A0C] hover:border-[#00F0FF] transition-all hover:bg-[#131316]"
                     >
                        <div className="w-10 h-10 rounded-full mb-4 shadow-[0_0_20px_var(--tw-shadow-color)] border border-[#2D2D33]" style={{ color: tpl.color, backgroundColor: tpl.color, '--tw-shadow-color': tpl.color } as React.CSSProperties} />
                        <span className="text-[11px] font-bold text-white uppercase tracking-wider">{tpl.name}</span>
                        <span className="text-[9px] text-[#6B7280] mt-1 tracking-widest">{tpl.type}</span>
                     </button>
                   ))}
                </div>

                <div className="text-[#4B5563] text-[9px] uppercase tracking-widest font-mono">Select Core Template to Initialize</div>
              </motion.div>
            )}

            {gameState.gameStatus === 'GAMEOVER' && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="absolute inset-0 bg-[#050506]/95 backdrop-blur-md flex flex-col items-center justify-center z-40 text-center px-4 border-[8px] border-[#FF4D00]/20"
              >
                <h2 className="text-4xl md:text-5xl font-black text-[#FF4D00] tracking-tighter mb-2 uppercase">SYSTEM FAILURE</h2>
                <p className="text-[#6B7280] font-mono text-[10px] uppercase tracking-[0.4em] mb-12">CORE INTEGRITY COMPROMISED AT WAVE {gameState.wave}</p>
                <button 
                  onClick={() => setGameState(p => ({ ...p, gameStatus: 'MENU' }))}
                  className="px-10 py-4 bg-[#0A0A0C] border border-[#FF4D00] text-[#FF4D00] font-bold rounded-sm hover:bg-[#FF4D00] hover:text-black transition-all flex items-center gap-3 uppercase tracking-widest text-[11px]"
                >
                  <RotateCcw className="w-4 h-4" /> REBOOT SEQUENCE
                </button>
              </motion.div>
            )}
          </div>

          <div className="mt-8 flex gap-4 w-full max-w-[600px]">
            <button 
              onClick={buyModule}
              disabled={gameState.runCoins < 100}
              className={`flex-1 py-3 rounded-sm border font-bold font-mono text-[10px] uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${
                gameState.runCoins >= 100 
                ? 'bg-[#1A1A1E] border-[#00F0FF] text-[#00F0FF] hover:bg-[#00F0FF] hover:text-black' 
                : 'bg-[#0A0A0C] border-[#2D2D33] text-[#4B5563]'
              }`}
            >
              <Zap className="w-3 h-3" /> ADD ORBITER [100₵]
            </button>
            <button 
              onClick={() => setGameState(p => ({ ...p, isPaused: !p.isPaused }))}
              className="px-6 bg-[#0A0A0C] border border-[#2D2D33] text-[#D1D5DB] rounded-sm hover:bg-[#1A1A1E] transition-colors"
            >
              {gameState.isPaused ? <Play className="w-4 h-4 fill-current" /> : <Pause className="w-4 h-4 fill-current" />}
            </button>
          </div>
        </div>

        {/* Right Panel: Artifacts/History (Placeholder) */}
        <div className="hidden lg:flex flex-col gap-6 w-[280px]">
          <div className="tech-card border-l-2 border-l-[#A855F7] bg-[#0A0A0C]">
            <h3 className="text-[11px] font-bold text-[#6B7280] uppercase tracking-widest mb-4 flex items-center gap-2">
              <Trophy className="w-3 h-3" /> Core Sub-Routines
            </h3>
            <div className="space-y-4">
              {['Barrage Analysis', 'Plasma Containment', 'Gravity Well'].map(m => (
                <div key={m} className="space-y-2">
                  <div className="flex justify-between text-[9px] text-[#6B7280] font-mono tracking-widest uppercase">
                    <span>{m}</span>
                    <span className="text-[#A855F7]">0.0%</span>
                  </div>
                  <div className="w-full bg-[#1A1A1E] h-[2px] overflow-hidden">
                    <div className="bg-[#A855F7] h-full w-[2%]" />
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <div className="tech-card border-none bg-transparent shadow-none px-0 py-0">
             <h3 className="text-[11px] font-bold text-[#6B7280] uppercase tracking-widest mb-4 flex items-center gap-2">
               SYSTEM LOGS
             </h3>
             <div className="text-[10px] space-y-3 font-mono text-[#4B5563]">
               <div className="flex gap-3">
                 <span className="text-[#00F0FF] w-8">INFO</span> 
                 <span className="flex-1">Initialization sequence complete.</span>
               </div>
               <div className="flex gap-3">
                 <span className="text-[#00F0FF] w-8">INFO</span> 
                 <span className="flex-1">Core output stable at 100%.</span>
               </div>
               <div className="flex gap-3">
                 <span className="text-[#FF4D00] w-8">WARN</span> 
                 <span className="flex-1">Hostile signatures detected.</span>
               </div>
             </div>
          </div>
        </div>

      </div>
    </div>
  );
}
