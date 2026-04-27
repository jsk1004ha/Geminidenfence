import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Shield, Zap, Target, Trophy, Play, Pause, RotateCcw, 
  Settings, ArrowUpCircle, Coins, Cpu, Crosshair, Atom,
  FlaskConical, Lock, Unlock, Check
} from 'lucide-react';
import { GameState, CoreStats, ModuleType } from './types';
import { INITIAL_GAME_STATE, CORE_TEMPLATES, CANVAS_SIZE, UPGRADES, MODULE_PRICES, GLOBAL_UPGRADES, ARTIFACTS_LIST, GLOBAL_ARTIFACTS } from './constants';
import { GameEngine } from './game/GameEngine';

export default function App() {
  const [gameState, setGameState] = useState<GameState>(INITIAL_GAME_STATE);
  const [core, setCore] = useState<CoreStats>(CORE_TEMPLATES[INITIAL_GAME_STATE.activeCoreId]);
  const [engineState, setEngineState] = useState({ enemies: 0, ultActive: false });
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
          permanentUpgrades: parsed.permanentUpgrades || {},
          globalUpgrades: parsed.globalUpgrades || {},
          unlockedCores: parsed.unlockedCores || ['circle-core'],
          globalArtifacts: parsed.globalArtifacts || [],
          achievements: parsed.achievements || {}
        }));
      } catch (e) { console.error('Save corrupted'); }
    }
  }, []);

  useEffect(() => {
    if (gameState.gameStatus !== 'PLAYING') {
      localStorage.setItem('orbital_core_save', JSON.stringify({
        credits: gameState.credits,
        permanentUpgrades: gameState.permanentUpgrades,
        globalUpgrades: gameState.globalUpgrades,
        unlockedCores: gameState.unlockedCores,
        globalArtifacts: gameState.globalArtifacts,
        achievements: gameState.achievements
      }));
    }
  }, [gameState.credits, gameState.permanentUpgrades, gameState.globalUpgrades, gameState.unlockedCores, gameState.globalArtifacts, gameState.achievements, gameState.gameStatus]);

  const applyGlobalUpgrades = (baseCore: CoreStats) => {
     let newCore = { ...baseCore };
     const gHp = gameState.globalUpgrades['base_hp'] || 0;
     const gDmg = gameState.globalUpgrades['base_dmg'] || 0;
     const gRegen = gameState.globalUpgrades['base_regen'] || 0;
     
     newCore.maxHp += (gHp * 10);
     newCore.hp = newCore.maxHp;
     newCore.attackDamage += (gDmg * 1);
     newCore.regen += (gRegen * 0.2);

     if (gameState.globalArtifacts.includes('ga_1')) newCore.attackDamage *= 1.1;
     if (gameState.globalArtifacts.includes('ga_2')) { newCore.maxHp *= 1.2; newCore.hp = newCore.maxHp; }
     if (gameState.globalArtifacts.includes('ga_14')) newCore.defense += 5;
     if (gameState.globalArtifacts.includes('ga_15')) newCore.attackDamage *= 1.15;
     
     return newCore;
  };

  const startGame = (coreId?: string) => {
    const selectedCoreId = coreId || gameState.activeCoreId;
    const startFunds = (gameState.globalUpgrades['start_funds'] || 0) * 25;
    
    if (!gameState.unlockedCores.includes(selectedCoreId)) return;

    setGameState(prev => ({ 
      ...prev, gameStatus: 'PLAYING', 
      runCoins: startFunds, 
      wave: 1, 
      activeCoreId: selectedCoreId, 
      ultCharge: 0,
      artifacts: [],
      pendingArtifact: false,
      permanentUpgrades: {} 
    }));
    
    setCore(applyGlobalUpgrades(CORE_TEMPLATES[selectedCoreId]));
    engineRef.current = new GameEngine();
  };

  const unlockArtifact = (artId: string) => {
    setGameState(prev => {
      if (!prev.globalArtifacts.includes(artId)) {
        return {
          ...prev,
          globalArtifacts: [...prev.globalArtifacts, artId]
        };
      }
      return prev;
    });
  };

  const handleWaveComplete = () => {
    setGameState(prev => {
      const nextWave = prev.wave + 1;
      const isMilestone = nextWave > 1 && nextWave % 5 === 0;
      
      let nextState = { 
        ...prev, 
        wave: nextWave, 
        credits: prev.credits + prev.wave * 2 
      };

      if (isMilestone) {
        nextState.pendingArtifact = true;
      }
      
      if (nextWave === 15 && core.evolutionLevel === 1) {
        // If there are evolving cores available for this base core
        const hasEvo = Object.values(CORE_TEMPLATES).some(c => c.baseCoreId === core.id);
        if (hasEvo) nextState.pendingEvolution = true;
      }
      
      // artifact logic: ga_14 (성채의 문장: 방어형 코어로 30웨이브 달성)
      if (core.type === 'DEFENSE' && nextWave > 30) {
        if (!nextState.globalArtifacts.includes('ga_14')) nextState.globalArtifacts.push('ga_14');
      }

      return nextState;
    });

    if (gameState.artifacts.includes('art_3')) {
       setCore(p => ({ ...p, hp: Math.min(p.maxHp, p.hp + p.maxHp * 0.2) }));
    }
  };

  const artifactOptions = React.useMemo(() => {
    if (!gameState.pendingArtifact) return [];
    return [...ARTIFACTS_LIST]
      .filter(a => !gameState.artifacts.includes(a.id))
      .sort(() => Math.random() - 0.5)
      .slice(0, 3);
  }, [gameState.pendingArtifact, gameState.artifacts]);

  const selectArtifact = (artifactId: string, effectId: string) => {
     setGameState(prev => ({
        ...prev,
        artifacts: [...prev.artifacts, effectId],
        pendingArtifact: false
     }));
     
     if (effectId === 'art_1') {
       setCore(p => ({ ...p, attackSpeed: p.attackSpeed * 0.7, maxHp: p.maxHp * 0.8, hp: Math.min(p.hp, p.maxHp * 0.8) }));
     } else if (effectId === 'art_2') {
       setCore(p => ({ ...p, defense: p.defense + 5 }));
       engineRef.current.modules.forEach(m => m.rotationSpeed *= 1.2);
     } else if (effectId === 'art_4') {
       setCore(p => ({ ...p, attackSpeed: p.attackSpeed * 1.2, attackDamage: p.attackDamage * 1.5 }));
     }
  };

  const evolutionOptions = React.useMemo(() => {
    if (!gameState.pendingEvolution) return [];
    return Object.values(CORE_TEMPLATES).filter(c => c.baseCoreId === core.id);
  }, [gameState.pendingEvolution, core.id]);

  const selectEvolution = (evoCoreId: string) => {
     setGameState(prev => ({
        ...prev,
        pendingEvolution: false
     }));
     const hpPercent = core.maxHp > 0 ? core.hp / core.maxHp : 1;
     const newCoreTemplate = applyGlobalUpgrades(CORE_TEMPLATES[evoCoreId]);
     setCore({
       ...newCoreTemplate,
       hp: newCoreTemplate.maxHp * hpPercent
     });
  };

  const handleEnemyKill = (reward: number, isBoss: boolean = false, byUlt: boolean = false) => {
    const coinMult = gameState.artifacts.includes('art_5') ? 1.3 : 1;
    const ultMult = gameState.artifacts.includes('art_8') ? 1.3 : 1;
    
    setGameState(prev => {
      const next = { 
        ...prev, 
        runCoins: prev.runCoins + (reward * coinMult),
        ultCharge: Math.min(core.ultMax || 100, prev.ultCharge + (reward * 0.5 * ultMult)) 
      };

      if (isBoss) {
        if (!next.globalArtifacts.includes('ga_1')) next.globalArtifacts.push('ga_1');
        // If not 'byUlt' (궁극기 없이 10웨이브 보스 처치)... simplified logic:
        if (!engineRef.current.usedUltThisWave && prev.wave === 10) {
           if (!next.globalArtifacts.includes('ga_15')) next.globalArtifacts.push('ga_15');
        }
      }

      return next;
    });
  };

  const handleCoreDamage = (dmg: number) => {
    setCore(prev => {
      const nextHp = Math.max(0, prev.hp - dmg);
      
      // artifact ga_2: 체력 1% 이하 생존
      if (nextHp > 0 && nextHp <= prev.maxHp * 0.01) {
         unlockArtifact('ga_2');
      }

      if (nextHp <= 0) {
        setGameState(gs => ({ ...gs, gameStatus: 'GAMEOVER' }));
      }
      return { ...prev, hp: nextHp };
    });
  };

  const activateUlt = () => {
    if (gameState.ultCharge >= (core.ultMax || 100)) {
       setGameState(prev => ({ ...prev, ultCharge: 0 }));
       engineRef.current.triggerUltimate();
    }
  };

  const buyModule = (type: ModuleType) => {
    const cost = MODULE_PRICES[type as keyof typeof MODULE_PRICES];
    if (gameState.runCoins >= cost && engineRef.current.modules.length < 10) {
      setGameState(prev => ({ ...prev, runCoins: prev.runCoins - cost }));
      
      let color = '#00F0FF';
      if (type === 'LASER') color = '#FF4D00';
      if (type === 'LENS') color = '#A855F7';

      let baseRotSpeed = (0.5 + Math.random() * 1.5) * (Math.random()>0.5?1:-1);
      if (gameState.artifacts.includes('art_2')) {
          baseRotSpeed *= 1.2;
      }

      engineRef.current.modules.push({
        id: Math.random().toString(36),
        type,
        angle: Math.random() * Math.PI * 2,
        distance: 60 + Math.random() * 60,
        rotationSpeed: baseRotSpeed,
        damage: 20,
        color
      });
    }
  };

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
        const next = { ...prev };
        if (upgrade.effect === 'dmg') next.attackDamage += 5;
        if (upgrade.effect === 'aspd') next.attackSpeed = Math.max(100, next.attackSpeed * 0.95);
        if (upgrade.effect === 'hp') { next.maxHp += 20; next.hp += 20; }
        if (upgrade.effect === 'regen') next.regen += 0.5;
        if (upgrade.effect === 'range') next.range += 20;
        if (upgrade.effect === 'def') next.defense += 1;
        return next;
      });
    }
  };

  const buyGlobalUpgrade = (upgradeId: string) => {
    const upgrade = GLOBAL_UPGRADES.find(u => u.id === upgradeId);
    if (!upgrade) return;

    const currentLv = gameState.globalUpgrades[upgradeId] || 0;
    if (currentLv >= upgrade.maxLv) return;

    const cost = Math.floor(upgrade.baseCost * Math.pow(upgrade.costMult, currentLv));
    if (gameState.credits >= cost) {
       setGameState(prev => ({
          ...prev,
          credits: prev.credits - cost,
          globalUpgrades: {
             ...prev.globalUpgrades,
             [upgradeId]: currentLv + 1
          }
       }));
    }
  };

  const purchaseCore = (coreId: string, cost: number) => {
     if (gameState.credits >= cost && !gameState.unlockedCores.includes(coreId)) {
       setGameState(prev => ({
          ...prev,
          credits: prev.credits - cost,
          unlockedCores: [...prev.unlockedCores, coreId]
       }));
     }
  };

  const animate = (time: number) => {
    if (lastTimeRef.current !== 0 && !gameState.isPaused && gameState.gameStatus === 'PLAYING' && !gameState.pendingArtifact && !gameState.pendingEvolution) {
      const deltaTime = (time - lastTimeRef.current) / 1000;
      const ctx = canvasRef.current?.getContext('2d');
      if (ctx) {
        engineRef.current.update(core, Math.min(deltaTime, 0.1), gameState.wave, gameState.artifacts, handleEnemyKill, handleCoreDamage, handleWaveComplete);
        engineRef.current.render(ctx, core);
        setEngineState({ 
           enemies: engineRef.current.enemies.length, 
           ultActive: engineRef.current.isUltActive 
        });
      }
    }
    lastTimeRef.current = time;
    requestRef.current = requestAnimationFrame(animate);
  };

  useEffect(() => {
    requestRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(requestRef.current);
  }, [gameState.isPaused, gameState.gameStatus, gameState.pendingArtifact, gameState.pendingEvolution, core, gameState.ultCharge, gameState.artifacts]);

  const ultPercent = Math.min(100, (gameState.ultCharge / (core.ultMax || 100)) * 100);

  return (
    <div className="relative w-full h-screen bg-[#050506] text-[#D1D5DB] flex flex-col items-center justify-center overflow-hidden font-sans border-8 border-[#1A1A1E]">
      
      {/* Background Decor */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(0,240,255,0.02)_0%,_transparent_70%)] pointer-events-none" />

      {/* Header */}
      <header className="absolute top-0 left-0 w-full flex items-center justify-between px-8 py-4 border-b border-[#2D2D33] z-20 bg-[#050506]/80 backdrop-blur">
        <div className="flex flex-col">
          <h1 className="text-2xl font-black tracking-tighter text-white">ORBITAL CORE <span className="text-[#00F0FF] font-light">IDLE DEFENSE</span></h1>
        </div>
        <div className="flex gap-6">
          <div className="text-right">
            <p className="text-[9px] text-[#6B7280] uppercase tracking-widest">Global Credits</p>
            <p className="text-sm font-mono text-[#00F0FF]">{gameState.credits}</p>
          </div>
        </div>
      </header>

      {/* Main Layout */}
      <div className="relative z-10 flex flex-col md:flex-row gap-0 w-full h-full pt-[73px]">
        
        {/* Left Sidebar (Upgrades & Core Status) */}
        <div className="flex flex-col w-full md:w-[320px] bg-[#0A0A0C] border-r border-[#2D2D33] p-4 gap-4 overflow-y-auto">
          {/* Core Status Block */}
          {gameState.gameStatus === 'PLAYING' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col gap-4">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <h2 className="text-[11px] font-bold text-[#6B7280] uppercase tracking-widest flex items-center gap-2">
                    <Cpu className="w-4 h-4" /> CORE STATUS
                  </h2>
                  <div className="bg-[#1A1A1E] px-2 py-1 border border-[#2D2D33] rounded-sm text-[10px] text-[#00F0FF] font-mono">
                    LV.{core.evolutionLevel}
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-[9px] text-[#6B7280] mb-1 font-mono uppercase tracking-widest">
                      <span>Integrity</span>
                      <span className="text-white">{Math.ceil(core.hp)} / {Math.ceil(core.maxHp)}</span>
                    </div>
                    <div className="w-full bg-[#1A1A1E] h-1.5 overflow-hidden">
                      <div style={{ width: `${(core.hp / core.maxHp) * 100}%`, backgroundColor: core.color }} className="h-full shadow-[0_0_10px_currentColor] transition-all" />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-[9px] text-[#6B7280] mb-1 font-mono uppercase tracking-widest">
                      <span>Ultimate: {core.ultName}</span>
                      <span className={ultPercent >= 100 ? "text-[#A855F7] animate-pulse" : "text-white"}>{Math.floor(ultPercent)}%</span>
                    </div>
                    <div className="w-full bg-[#1A1A1E] h-1.5 overflow-hidden rounded-sm cursor-pointer" onClick={activateUlt}>
                      <div style={{ width: `${ultPercent}%` }} className={`h-full transition-all ${ultPercent>=100 ? 'bg-[#A855F7] shadow-[0_0_10px_#A855F7]' : 'bg-[#4B5563]'}`} />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 text-[10px] font-mono tracking-widest text-[#6B7280]">
                    <div className="bg-[#131316] p-2 rounded-sm border border-[#2D2D33] flex flex-col justify-center text-center">
                      <span className="uppercase text-[8px] mb-1">Damage</span>
                      <span className="text-[#00F0FF]">{Math.floor(core.attackDamage)}</span>
                    </div>
                    <div className="bg-[#131316] p-2 rounded-sm border border-[#2D2D33] flex flex-col justify-center text-center">
                      <span className="uppercase text-[8px] mb-1">Speed / Range</span>
                      <span className="text-[#A855F7]">{Math.floor(core.attackSpeed)}ms / {Math.floor(core.range)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Upgrades List */}
              <div className="flex-1 flex flex-col min-h-[250px]">
                <div className="flex items-center justify-between mb-3 border-b border-[#2D2D33] pb-2">
                  <h2 className="text-[11px] font-bold text-[#6B7280] uppercase tracking-widest flex items-center gap-2">
                    <ArrowUpCircle className="w-4 h-4" /> UPGRADES
                  </h2>
                  <div className="text-[#EAB308] font-mono text-xs flex items-center gap-1">
                    <Coins className="w-3 h-3" /> {gameState.runCoins}
                  </div>
                </div>
                <div className="space-y-1 overflow-y-auto pr-1 pb-4">
                  {UPGRADES.RUN.map((u) => {
                    const level = (gameState.permanentUpgrades[u.id] || 0);
                    const cost = Math.floor(u.baseCost * Math.pow(u.costMult, level));
                    const canAfford = gameState.runCoins >= cost;

                    return (
                      <button
                        key={u.id} onClick={() => buyUpgrade(u.id)} disabled={!canAfford}
                        className={`w-full text-left p-2 border-l-2 transition-all flex justify-between items-center group ${
                          canAfford ? 'bg-[#1A1A1E] border-[#00F0FF] hover:bg-[#2D2D33]' : 'bg-[#1A1A1E]/30 border-transparent opacity-40 cursor-not-allowed'
                        }`}
                      >
                        <div>
                          <div className="text-[10px] font-bold text-white uppercase tracking-widest">{u.name} <span className="text-[9px] text-[#6B7280] ml-1">Lv.{level}</span></div>
                          <div className="text-[9px] text-[#9CA3AF] opacity-80">{u.description}</div>
                        </div>
                        <div className="text-[#00F0FF] font-mono font-bold text-[10px]">{cost}</div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          )}

          {gameState.gameStatus !== 'PLAYING' && (
             <div className="text-center p-8 opacity-50 flex flex-col items-center">
               <Shield className="w-12 h-12 text-[#6B7280] mb-4" />
               <p className="text-xs uppercase tracking-widest font-mono text-[#6B7280]">System Offline</p>
             </div>
          )}
        </div>

        {/* Center Canvas Area */}
        <div className="relative flex-1 bg-black flex items-center justify-center overflow-hidden border-r border-l border-[#1A1A1E]/30">
          
          {gameState.gameStatus === 'PLAYING' && (
            <div className="absolute top-6 z-20 flex flex-col gap-4 items-center">
              <div className="bg-[#1A1A1E]/80 backdrop-blur border border-[#2D2D33] py-2 px-8 flex gap-12 font-mono rounded-sm shadow-xl">
                <div className="text-center">
                  <div className="text-[9px] text-[#6B7280] uppercase tracking-[0.2em] mb-1">Sector Wave</div>
                  <div className="text-2xl font-black text-white tracking-tighter">{String(gameState.wave).padStart(3, '0')}</div>
                </div>
                <div className="text-center">
                  <div className="text-[9px] text-[#6B7280] uppercase tracking-[0.2em] mb-1">Hostiles</div>
                  <div className="text-2xl font-black text-[#FF4D00] tracking-tighter">{engineState.enemies}</div>
                </div>
              </div>
            </div>
          )}

          <div className={`aspect-square w-[700px] max-w-full rounded-[100%] border-[1px] border-dashed transition-colors duration-1000 ${engineState.ultActive ? 'border-[#A855F7]/40 shadow-[0_0_100px_rgba(168,85,247,0.2)]' : 'border-[#2D2D33]'} relative flex-shrink-0 flex items-center justify-center`}>
            <canvas ref={canvasRef} width={CANVAS_SIZE} height={CANVAS_SIZE} className="w-full h-full object-contain mix-blend-screen" />
            
            {/* INITIAL MENU */}
            {gameState.gameStatus === 'MENU' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0 bg-black/90 backdrop-blur-md flex flex-col items-center justify-start z-30 p-10 pt-16 text-center rounded-[100%]">
                <div className="text-4xl md:text-5xl font-black text-white tracking-tighter mb-2 uppercase">ORBITAL <span className="text-[#00F0FF] font-light">CORE</span></div>
                <p className="text-[#6B7280] font-mono text-[9px] tracking-[0.4em] uppercase mb-6">Defense Engine Stabilized</p>
                
                <div className="flex gap-4 mb-6">
                  <button onClick={() => setGameState(p => ({...p, menuTab: 'DEPLOY'}))} className={`px-4 py-2 border-b-2 text-[10px] font-bold uppercase tracking-widest ${gameState.menuTab === 'DEPLOY' ? 'border-[#00F0FF] text-[#00F0FF]' : 'border-transparent text-[#6B7280] hover:text-white'}`}>Deploy</button>
                  <button onClick={() => setGameState(p => ({...p, menuTab: 'RESEARCH'}))} className={`px-4 py-2 border-b-2 text-[10px] font-bold uppercase tracking-widest ${gameState.menuTab === 'RESEARCH' ? 'border-[#EAB308] text-[#EAB308]' : 'border-transparent text-[#6B7280] hover:text-white'}`}>Research</button>
                  <button onClick={() => setGameState(p => ({...p, menuTab: 'ARTIFACTS'}))} className={`px-4 py-2 border-b-2 text-[10px] font-bold uppercase tracking-widest ${gameState.menuTab === 'ARTIFACTS' ? 'border-[#A855F7] text-[#A855F7]' : 'border-transparent text-[#6B7280] hover:text-white'}`}>Artifacts</button>
                </div>

                {gameState.menuTab === 'DEPLOY' && (
                  <div className="flex flex-col gap-4 max-w-2xl w-full px-6 overflow-y-auto pb-8 relative z-20 max-h-[60vh]">
                     {['BASIC', 'ATTACK', 'DEFENSE', 'CONTROL', 'SUMMON', 'ECONOMIC', 'SPECIAL', 'HIDDEN'].map(category => {
                       const coresInCategory = Object.values(CORE_TEMPLATES).filter(c => c.type === category && !c.baseCoreId);
                       const evolutionCores = Object.values(CORE_TEMPLATES).filter(c => c.type === category && c.baseCoreId);
                       if (coresInCategory.length === 0 && evolutionCores.length === 0) return null;

                       return (
                         <div key={category} className="mb-4">
                           <p className="text-[10px] text-[#A855F7] font-mono tracking-widest uppercase mb-3 border-b border-[#2D2D33] pb-1">{category} TYPE CORES</p>
                           <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                             {[...coresInCategory, ...evolutionCores].map(tpl => {
                               const isUnlocked = gameState.unlockedCores.includes(tpl.id);
                               const isEvo = !!tpl.baseCoreId;
                               return (
                                 <div key={tpl.id} className="relative group">
                                   <button 
                                      onClick={() => isUnlocked && startGame(tpl.id)} 
                                      className={`w-full flex items-center p-3 border transition-all text-left ${isUnlocked ? 'border-[#2D2D33] bg-[#0A0A0C] hover:border-[#00F0FF] hover:bg-[#131316]' : 'border-[#1A1A1E] bg-[#050506] opacity-60'}`}
                                   >
                                      <div className="w-8 h-8 rounded-full shadow-[0_0_15px_var(--tw-shadow-color)] border border-white/20 transition-transform flex-shrink-0" style={{ backgroundColor: isUnlocked ? tpl.color : '#374151', '--tw-shadow-color': isUnlocked ? tpl.color : '#000' } as React.CSSProperties} />
                                      <div className="ml-3">
                                        <div className="flex items-center gap-2">
                                          <span className={`text-[11px] font-bold uppercase tracking-widest ${isUnlocked ? 'text-white' : 'text-[#6B7280]'}`}>{tpl.name}</span>
                                          {isEvo && <span className="text-[8px] bg-[#A855F7]/20 text-[#A855F7] px-1 py-0.5 rounded">EVO</span>}
                                        </div>
                                        <p className="text-[9px] text-[#4B5563] mt-1 leading-tight">{tpl.description}</p>
                                      </div>
                                   </button>
                                   {!isUnlocked && (
                                     <div className="absolute inset-0 bg-black/90 flex flex-col items-center justify-center backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity">
                                       {isEvo ? (
                                         <>
                                            <Lock className="w-4 h-4 text-[#A855F7] mb-1" />
                                            <p className="text-[8px] text-[#D1D5DB] text-center px-2 font-mono">UNLOCK COND: {tpl.evolutionCondition}</p>
                                         </>
                                       ) : (
                                         <>
                                            <Lock className="w-4 h-4 text-[#6B7280] mb-1" />
                                            <button onClick={() => purchaseCore(tpl.id, tpl.unlockCost || 999)} disabled={gameState.credits < (tpl.unlockCost||999)} className={`px-4 py-1 border text-[9px] font-mono transition-colors rounded-sm ${gameState.credits >= (tpl.unlockCost||999) ? 'bg-[#1A1A1E] border-[#00F0FF] text-[#00F0FF] hover:bg-[#00F0FF] hover:text-black' : 'bg-transparent border-[#2D2D33] text-[#4B5563] cursor-not-allowed'}`}>
                                              {tpl.unlockCost} CREDITS
                                            </button>
                                         </>
                                       )}
                                       
                                     </div>
                                   )}
                                 </div>
                               )
                             })}
                           </div>
                         </div>
                       );
                     })}
                  </div>
                )}

                {gameState.menuTab === 'RESEARCH' && (
                  <div className="flex flex-col gap-3 w-full max-w-lg px-8 overflow-y-auto pb-8 relative z-20">
                     <p className="text-[9px] text-[#EAB308] font-mono tracking-widest mb-2">GLOBAL TECH TREE - PERMANENT UPGRADES</p>
                     {GLOBAL_UPGRADES.map(u => {
                       const lv = gameState.globalUpgrades[u.id] || 0;
                       const cost = Math.floor(u.baseCost * Math.pow(u.costMult, lv));
                       const isMax = lv >= u.maxLv;
                       
                       return (
                         <div key={u.id} className="flex items-center justify-between p-3 bg-[#0A0A0C] border border-[#2D2D33] text-left">
                           <div>
                              <div className="text-[11px] font-bold text-white uppercase tracking-widest flex items-center gap-2">
                                {u.name} <span className="text-[#EAB308] text-[9px]">LVL {lv}/{u.maxLv}</span>
                              </div>
                              <div className="text-[9px] text-[#6B7280] mt-1">{u.description} (+{u.valuePerLevel} / Lv)</div>
                           </div>
                           <button 
                              onClick={() => buyGlobalUpgrade(u.id)}
                              disabled={isMax || gameState.credits < cost}
                              className={`px-4 py-2 font-mono text-[10px] border transition-colors ${
                                isMax ? 'bg-black text-emerald-500 border-emerald-500/50' 
                                : gameState.credits >= cost ? 'bg-[#1A1A1E] text-[#00F0FF] border-[#00F0FF] hover:bg-[#00F0FF] hover:text-black' 
                                : 'bg-[#050506] text-[#4B5563] border-[#1A1A1E] cursor-not-allowed'
                              }`}
                           >
                             {isMax ? 'MAX' : `${cost} CR`}
                           </button>
                         </div>
                       )
                     })}
                  </div>
                )}

                {gameState.menuTab === 'ARTIFACTS' && (
                  <div className="flex flex-col gap-3 w-full max-w-2xl px-8 overflow-y-auto pb-8 relative z-20 max-h-[60vh]">
                     <p className="text-[9px] text-[#A855F7] font-mono tracking-widest mb-4 uppercase">Global Artifacts - Permanent Passives</p>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-left">
                       {GLOBAL_ARTIFACTS.map(art => {
                         const isUnlocked = gameState.globalArtifacts.includes(art.id);
                         return (
                           <div key={art.id} className={`p-3 border flex flex-col gap-1 transition-colors ${isUnlocked ? 'bg-[#1A1A1E] border-[#A855F7] shadow-[0_0_15px_rgba(168,85,247,0.15)]' : 'bg-[#050506] border-[#2D2D33] opacity-60'}`}>
                             <div className="flex items-center justify-between">
                                <span className={`text-[11px] font-bold uppercase tracking-widest ${isUnlocked ? 'text-[#A855F7]' : 'text-[#6B7280]'}`}>{art.name}</span>
                                {isUnlocked ? <Unlock className="w-3 h-3 text-[#A855F7]" /> : <Lock className="w-3 h-3 text-[#4B5563]" />}
                             </div>
                             <p className={`text-[9px] uppercase tracking-widest ${isUnlocked ? 'text-white' : 'text-[#4B5563]'}`}>COND: {art.condition}</p>
                             <p className={`text-[10px] ${isUnlocked ? 'text-[#D1D5DB]' : 'text-[#4B5563]'}`}>{isUnlocked ? art.description : '???'}</p>
                           </div>
                         )
                       })}
                     </div>
                  </div>
                )}
              </motion.div>
            )}

            {/* EVOLUTION SELECTION */}
            {gameState.pendingEvolution && (
              <div className="absolute inset-0 bg-[#050506]/95 backdrop-blur-lg flex flex-col items-center justify-center z-50 text-center px-8 border-[8px] border-[#00F0FF]/30 rounded-[100%] shadow-[inset_0_0_100px_rgba(0,240,255,0.2)]">
                <Zap className="w-12 h-12 text-[#00F0FF] mb-4 animate-bounce" />
                <h2 className="text-4xl font-black text-white tracking-tighter mb-2 uppercase">CORE EVOLUTION READY</h2>
                <p className="text-[#00F0FF] font-mono text-[10px] uppercase tracking-[0.4em] mb-12">Select your next form</p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-2xl px-4">
                  {evolutionOptions.map(evo => (
                     <button 
                        key={evo.id}
                        onClick={() => selectEvolution(evo.id)}
                        className="p-5 border border-[#2D2D33] bg-[#0A0A0C] hover:border-[#00F0FF] hover:bg-[#131316] text-left transition-all group relative overflow-hidden flex flex-col items-start gap-2"
                     >
                        <div className="absolute top-0 left-0 w-1 h-full opacity-0 group-hover:opacity-100 transition-opacity" style={{ backgroundColor: evo.color }} />
                        <h3 className="text-[14px] font-bold text-white uppercase tracking-widest pl-2 mb-1" style={{ color: evo.color }}>{evo.name}</h3>
                        <p className="text-[10px] text-[#A855F7] font-mono pl-2">COND: {evo.evolutionCondition}</p>
                        <p className="text-[11px] text-[#D1D5DB] pl-2 leading-relaxed">{evo.description || '능력이 대폭 강화됩니다.'}</p>
                     </button>
                  ))}
                  {evolutionOptions.length === 0 && (
                     <button onClick={() => setGameState(p => ({...p, pendingEvolution: false}))} className="p-4 border border-[#00F0FF] text-[#00F0FF] uppercase tracking-widest text-[10px] col-span-1 md:col-span-2">
                       No evolution path available. Continue.
                     </button>
                  )}
                </div>
              </div>
            )}

            {/* ARTIFAC SELECTION */}
            {gameState.pendingArtifact && (
              <div className="absolute inset-0 bg-[#050506]/95 backdrop-blur-lg flex flex-col items-center justify-center z-50 text-center px-8 border-[8px] border-[#A855F7]/30 rounded-[100%] shadow-[inset_0_0_100px_rgba(168,85,247,0.2)]">
                <FlaskConical className="w-10 h-10 text-[#A855F7] mb-4 animate-pulse" />
                <h2 className="text-3xl font-black text-white tracking-tighter mb-2 uppercase">WAVE {gameState.wave} MILESTONE</h2>
                <p className="text-[#A855F7] font-mono text-[10px] uppercase tracking-[0.4em] mb-12">Select tactical advantage</p>
                
                <div className="flex flex-col gap-3 w-full max-w-sm">
                  {artifactOptions.map(art => (
                     <button 
                        key={art.id}
                        onClick={() => selectArtifact(art.name, art.id)}
                        className="p-4 border border-[#2D2D33] bg-[#0A0A0C] hover:border-[#A855F7] hover:bg-[#131316] text-left transition-all group relative overflow-hidden"
                     >
                        <div className="absolute top-0 left-0 w-1 h-full bg-[#A855F7] opacity-0 group-hover:opacity-100 transition-opacity" />
                        <h3 className="text-[12px] font-bold text-white uppercase tracking-widest pl-2 mb-1">{art.name}</h3>
                        <p className="text-[10px] text-[#6B7280] pl-2">{art.description}</p>
                     </button>
                  ))}
                  {artifactOptions.length === 0 && (
                     <button onClick={() => setGameState(p => ({...p, pendingArtifact: false}))} className="p-4 border border-[#00F0FF] text-[#00F0FF] uppercase tracking-widest text-[10px]">
                       No more artifacts available. Continue.
                     </button>
                  )}
                </div>
              </div>
            )}

            {/* GAME OVER */}
            {gameState.gameStatus === 'GAMEOVER' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0 bg-[#050506]/95 backdrop-blur-md flex flex-col items-center justify-center z-40 text-center px-4 border-[8px] border-[#FF4D00]/20 rounded-[100%]">
                <h2 className="text-4xl md:text-5xl font-black text-[#FF4D00] tracking-tighter mb-2 uppercase">SYSTEM FAILURE</h2>
                <p className="text-[#6B7280] font-mono text-[10px] uppercase tracking-[0.4em] mb-12">CORE INTEGRITY COMPROMISED AT WAVE {gameState.wave}</p>
                <button onClick={() => setGameState(p => ({ ...p, gameStatus: 'MENU' }))} className="px-10 py-4 bg-[#0A0A0C] border border-[#FF4D00] text-[#FF4D00] font-bold rounded-sm hover:bg-[#FF4D00] hover:text-black transition-all flex items-center gap-3 uppercase tracking-widest text-[11px]">
                  <RotateCcw className="w-4 h-4" /> REBOOT SEQUENCE
                </button>
              </motion.div>
            )}
          </div>

          {/* Bottom Control Bar in Game */}
          {gameState.gameStatus === 'PLAYING' && (
             <div className="absolute bottom-6 z-20 flex gap-4 w-full px-12 justify-center max-w-[800px]">
                {/* Modules Store */}
                <div className="flex gap-2 bg-[#0A0A0C]/90 backdrop-blur p-2 border border-[#2D2D33] rounded-sm shadow-xl flex-1 justify-center">
                   {[
                     { id: 'LASER', icon: Crosshair, color: '#FF4D00', price: MODULE_PRICES.LASER },
                     { id: 'LENS', icon: Target, color: '#A855F7', price: MODULE_PRICES.LENS },
                   ].map(mdl => (
                      <button key={mdl.id} onClick={() => buyModule(mdl.id as ModuleType)} disabled={gameState.runCoins < mdl.price} className={`flex flex-col items-center py-2 px-6 border transition-all ${gameState.runCoins >= mdl.price ? 'bg-[#1A1A1E] border-[#2D2D33] hover:border-white' : 'bg-transparent border-transparent opacity-30'} rounded-sm`}>
                         <mdl.icon className="w-4 h-4 mb-1" style={{ color: mdl.color }} />
                         <span className="text-[8px] font-mono tracking-widest">{mdl.id}</span>
                         <span className="text-[10px] text-[#EAB308] font-bold font-mono">{mdl.price}</span>
                      </button>
                   ))}
                </div>

                <button onClick={() => setGameState(p => ({ ...p, isPaused: !p.isPaused }))} className="px-6 bg-[#0A0A0C]/90 backdrop-blur border border-[#2D2D33] text-[#D1D5DB] rounded-sm hover:bg-[#1A1A1E] transition-colors shadow-xl">
                  {gameState.isPaused ? <Play className="w-4 h-4 fill-current" /> : <Pause className="w-4 h-4 fill-current" />}
                </button>
             </div>
          )}
        </div>

        {/* Right Sidebar (Logs & Meta) */}
        <div className="hidden lg:flex flex-col w-[280px] bg-[#0A0A0C] border-l border-[#2D2D33] p-4 gap-6 overflow-y-auto">
          {gameState.gameStatus === 'PLAYING' && (
             <>
                <div className="bg-transparent border-none px-0 py-0 pb-4 border-b border-[#2D2D33]">
                   <h3 className="text-[11px] font-bold text-[#6B7280] uppercase tracking-widest mb-4 flex items-center gap-2">
                     <Atom className="w-4 h-4" /> ARTIFACTS / EFFECTS
                   </h3>
                   <div className="space-y-2">
                     {gameState.artifacts.length === 0 ? (
                        <div className="text-[9px] text-[#4B5563] font-mono tracking-widest uppercase">No artifacts detected.</div>
                     ) : (
                        gameState.artifacts.map(a => {
                           const art = ARTIFACTS_LIST.find(x => x.id === a);
                           return (
                             <div key={a} title={art?.description} className="p-2 border border-[#2D2D33] text-[9px] uppercase tracking-widest text-[#00F0FF] font-mono">
                               {art?.name || a}
                             </div>
                           );
                        })
                     )}
                   </div>
                </div>

                <div className="bg-transparent border-none px-0 py-0 font-mono">
                   <h3 className="text-[11px] font-bold text-[#6B7280] uppercase tracking-widest mb-4 flex items-center gap-2">SYSTEM LOGS</h3>
                   <div className="text-[9px] space-y-3 text-[#4B5563] uppercase tracking-[0.1em]">
                     <div className="flex gap-3"><span className="text-[#00F0FF] w-8">INFO</span><span className="flex-1">Initialization sequence complete.</span></div>
                     {gameState.wave % 10 === 0 ? (
                        <div className="flex gap-3 text-rose-500 animate-pulse"><span className="w-8">WARN</span><span className="flex-1 text-[#FF4D00]">MASSIVE ENTITY DETECTED. BOSS WAVE.</span></div>
                     ) : (
                        <div className="flex gap-3"><span className="text-[#A855F7] w-8">SCAN</span><span className="flex-1">Wave {gameState.wave} incoming.</span></div>
                     )}
                   </div>
                </div>
             </>
          )}
        </div>

      </div>
    </div>
  );
}
