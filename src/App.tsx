import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Shield, Zap, Target, Trophy, Play, Pause, RotateCcw, 
  Settings, ArrowUpCircle, Coins, Cpu, Crosshair, Atom,
  FlaskConical, Lock, Unlock, Check
} from 'lucide-react';
import { GameState, CoreStats, ChallengeModeId } from './types';
import { INITIAL_GAME_STATE, CORE_TEMPLATES, CANVAS_SIZE, UPGRADES, MODULES, GLOBAL_UPGRADES, ARTIFACTS_LIST, GLOBAL_ARTIFACTS, CHALLENGE_MODES, RISK_OPTIONS, TITLE_DEFS, HIDDEN_CLUES, HIDDEN_MYSTERIES, TITLE_EFFECTS, MASTERY_DEFS, PRESTIGE_UPGRADES, MISSION_DEFS } from './constants';

function generateRandomModules() {
   const shuffled = [...MODULES].sort(() => 0.5 - Math.random());
   return shuffled.slice(0, 3).map(m => m.id);
}
import { GameEngine } from './game/GameEngine';

const EVOLUTION_REQUIREMENTS: Record<string, (ctx: { gameState: GameState; core: CoreStats }) => boolean> = {
  'supernova-core': ({ gameState }) => (gameState.achievements.boss_kills || 0) >= 1,
  'singularity-evo-core': ({ gameState }) => gameState.globalArtifacts.includes('ga_3'),
  'paradox-evo-core': ({ gameState }) => gameState.globalArtifacts.includes('ga_4'),
  'void-evo-core': ({ gameState }) => gameState.globalArtifacts.includes('ga_6'),
  'satellite-army': ({ gameState, core }) => core.id === 'orbital-core' && gameState.wave >= 50,
};

const HIDDEN_CORE_REQUIREMENTS: Record<string, (state: GameState) => boolean> = {
  'singularity-core': (state) => state.globalArtifacts.includes('ga_3'),
  'void-core': (state) => state.globalArtifacts.includes('ga_6'),
  'paradox-core': (state) => state.globalArtifacts.includes('ga_4'),
  'eclipse-core': (state) => state.unlockedCores.includes('photon-core') && state.unlockedCores.includes('void-core'),
  'genesis-core': (state) => state.globalArtifacts.includes('ga_20'),
  'abyss-core': (state) => (state.achievements.best_wave || 0) >= 40,
  'nameless-core': (state) => (state.achievements.evo_selects || 0) >= 5,
  'omega-core': (state) => state.unlockedCores.filter(id => CORE_TEMPLATES[id]?.type === 'HIDDEN').length >= 4,
  'collapse-core': (state) => state.globalArtifacts.includes('ga_19'),
  'mirror-core': (state) => state.globalArtifacts.includes('ga_18'),
  'judgment-core': (state) => state.unlockedCores.includes('execution-core') && state.globalArtifacts.includes('ga_6'),
  'eternity-core': (state) => (state.achievements.best_wave || 0) >= 60,
};

export default function App() {
  const [gameState, setGameState] = useState<GameState>(INITIAL_GAME_STATE);
  const [core, setCore] = useState<CoreStats>(CORE_TEMPLATES[INITIAL_GAME_STATE.activeCoreId]);
  const [engineState, setEngineState] = useState<{enemies: number, ultActive: boolean, activeUltName: string | null}>({ enemies: 0, ultActive: false, activeUltName: null });
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<GameEngine>(new GameEngine());
  const requestRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);
  const previousSummonCountRef = useRef<number>(0);

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
          achievements: parsed.achievements || {},
          selectedChallenge: parsed.selectedChallenge || 'NORMAL',
          missionClaims: parsed.missionClaims || [],
          title: parsed.title || '첫 방어자',
          unlockedTitles: parsed.unlockedTitles || ['첫 방어자'],
          prestigeCount: parsed.prestigeCount || 0,
          transcendencePoints: parsed.transcendencePoints || 0,
          missionSeedDate: parsed.missionSeedDate || new Date().toISOString().slice(0, 10),
          hiddenClues: parsed.hiddenClues || [],
          solvedMysteries: parsed.solvedMysteries || [],
          masteryXp: parsed.masteryXp || {},
          masteryLevels: parsed.masteryLevels || {},
          prestigeUpgrades: parsed.prestigeUpgrades || {},
          coreMemories: parsed.coreMemories || {},
          missionChainStep: parsed.missionChainStep || 0,
          missionLastRefresh: parsed.missionLastRefresh || new Date().toISOString().slice(0, 10),
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
        achievements: gameState.achievements,
        selectedChallenge: gameState.selectedChallenge,
        missionClaims: gameState.missionClaims,
        title: gameState.title,
        unlockedTitles: gameState.unlockedTitles,
        prestigeCount: gameState.prestigeCount,
        transcendencePoints: gameState.transcendencePoints,
        missionSeedDate: gameState.missionSeedDate,
        hiddenClues: gameState.hiddenClues,
        solvedMysteries: gameState.solvedMysteries,
        masteryXp: gameState.masteryXp,
        masteryLevels: gameState.masteryLevels,
        prestigeUpgrades: gameState.prestigeUpgrades,
        coreMemories: gameState.coreMemories,
        missionChainStep: gameState.missionChainStep,
        missionLastRefresh: gameState.missionLastRefresh,
      }));
    }
  }, [gameState.credits, gameState.permanentUpgrades, gameState.globalUpgrades, gameState.unlockedCores, gameState.globalArtifacts, gameState.achievements, gameState.gameStatus, gameState.selectedChallenge, gameState.missionClaims, gameState.title, gameState.unlockedTitles, gameState.prestigeCount, gameState.transcendencePoints, gameState.missionSeedDate, gameState.hiddenClues, gameState.solvedMysteries, gameState.masteryXp, gameState.masteryLevels, gameState.prestigeUpgrades, gameState.coreMemories, gameState.missionChainStep, gameState.missionLastRefresh]);

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
     if (gameState.globalArtifacts.includes('ga_5')) newCore.attackDamage *= 1.05;
     if (gameState.globalArtifacts.includes('ga_14')) newCore.defense += 5;
     if (gameState.globalArtifacts.includes('ga_14')) {
       newCore.maxShield = (newCore.maxShield || 0) + 25;
       newCore.shield = (newCore.shield || 0) + 25;
     }
     if (gameState.globalArtifacts.includes('ga_15')) newCore.attackDamage *= 1.15;
     if (gameState.globalArtifacts.includes('ga_16') && (newCore.id.includes('prism') || newCore.id.includes('photon'))) {
       newCore.attackDamage *= 1.15;
     }
     if (gameState.globalArtifacts.includes('ga_19') && newCore.hp <= newCore.maxHp * 0.2) newCore.attackDamage *= 1.3;
     if (gameState.globalArtifacts.includes('ga_20') && newCore.type === 'SUMMON') newCore.attackSpeed *= 0.9;
     
     return newCore;
  };

  const evaluateArtifactUnlocks = (state: GameState) => {
    const unlocks: string[] = [];
    const a = state.achievements;
    const has = (id: string) => state.globalArtifacts.includes(id);
    if (!has('ga_1') && (a.boss_kills || 0) >= 1) unlocks.push('ga_1');
    if (!has('ga_2') && (a.near_death_survive || 0) >= 1) unlocks.push('ga_2');
    if (!has('ga_3') && (a.blackhole_kills || 0) >= 100) unlocks.push('ga_3');
    if (!has('ga_4') && (a.time_stop_boss_kills || 0) >= 1) unlocks.push('ga_4');
    if (!has('ga_5') && (a.econ_upgrades_purchased || 0) >= 50) unlocks.push('ga_5');
    if (!has('ga_6') && (a.void_watcher_kills || 0) >= 1) unlocks.push('ga_6');
    if (!has('ga_7') && (a.omega_trial_clear || 0) >= 1) unlocks.push('ga_7');
    if (!has('ga_8') && (a.frozen_kills || 0) >= 500) unlocks.push('ga_8');
    if (!has('ga_9') && (a.fire_damage_total || 0) >= 10000) unlocks.push('ga_9');
    if (!has('ga_10') && (a.reflect_damage_total || 0) >= 5000) unlocks.push('ga_10');
    if (!has('ga_11') && (a.drone_damage_total || 0) >= 200) unlocks.push('ga_11');
    if (!has('ga_12') && (a.gold_enemy_kills || 0) >= 10) unlocks.push('ga_12');
    if (!has('ga_13') && (a.debuffed_kills || 0) >= 300) unlocks.push('ga_13');
    if (!has('ga_14') && (a.defense_highwave_clear || 0) >= 1) unlocks.push('ga_14');
    if (!has('ga_15') && (a.no_ult_boss_kills || 0) >= 1) unlocks.push('ga_15');
    if (!has('ga_16') && (a.prism_usage || 0) >= 1) unlocks.push('ga_16');
    if (!has('ga_17') && (a.abyss_trial_clear || 0) >= 1) unlocks.push('ga_17');
    if (!has('ga_18') && (a.clone_kills || 0) >= 100) unlocks.push('ga_18');
    if (!has('ga_19') && (a.low_hp_seconds || 0) >= 180) unlocks.push('ga_19');
    if (!has('ga_20') && (a.summons_created_total || 0) >= 500) unlocks.push('ga_20');
    return unlocks;
  };

  const dailyMissions = React.useMemo(() => MISSION_DEFS.filter(m => m.category === 'DAILY').map(m => ({
    ...m,
    progress: gameState.achievements[m.metric] || 0
  })), [gameState.achievements]);

  const weeklyMissions = React.useMemo(() => MISSION_DEFS.filter(m => m.category === 'WEEKLY').map(m => ({
    ...m,
    progress: gameState.achievements[m.metric] || 0
  })), [gameState.achievements]);

  const metaMissions = React.useMemo(() => MISSION_DEFS.filter(m => !['DAILY', 'WEEKLY'].includes(m.category)).map(m => ({
    ...m,
    progress: m.category === 'CHAIN'
      ? (m.id === 'chain_1' ? (gameState.achievements.total_kills || 0) : m.id === 'chain_2' ? (gameState.achievements.boss_kills || 0) : (gameState.achievements.best_wave || 0))
      : m.category === 'MASTERY'
        ? Object.values(gameState.masteryLevels).reduce((a, b) => Number(a) + Number(b), 0)
        : gameState.achievements[m.metric] || 0
  })), [gameState.achievements, gameState.masteryLevels]);

  const claimMission = (missionId: string, reward: number, rewardType: string) => {
    setGameState(prev => {
      if (prev.missionClaims.includes(missionId)) return prev;
      const rewardBonus = 1 + ((prev.prestigeUpgrades.global_reward || 0) * 0.03);
      const convertedReward = rewardType === 'CREDIT' ? reward : Math.floor(reward * 0.8);
      const next: GameState = { ...prev, credits: prev.credits + convertedReward * rewardBonus, missionClaims: [...prev.missionClaims, missionId] };
      if (missionId.startsWith('chain_')) {
        next.missionChainStep = Math.max(prev.missionChainStep, Number(missionId.split('_')[1]));
      }
      return next;
    });
  };

  const getMasteryLevel = (xp: number) => Math.floor(Math.sqrt(Math.max(0, xp) / 60));
  const masteryById = (id: string) => ({
    xp: gameState.masteryXp[id] || 0,
    lv: getMasteryLevel(gameState.masteryXp[id] || 0),
  });

  const applyRunPreset = (baseCore: CoreStats, challenge: ChallengeModeId) => {
    const next = { ...baseCore };
    const challengeDef = CHALLENGE_MODES.find(c => c.id === challenge);
    const prestigeBonus = 1 + gameState.transcendencePoints * 0.02;
    const titleFx = TITLE_EFFECTS[gameState.title] || { desc: '' };
    const barrageLv = masteryById('barrage').lv;
    const barrierLv = masteryById('barrier').lv;
    const greedLv = masteryById('greed').lv;
    const automationLv = gameState.prestigeUpgrades.automation || 0;
    const coreMemoryLv = gameState.coreMemories[next.id] || 0;
    next.attackDamage *= prestigeBonus;
    next.maxHp *= prestigeBonus;
    next.hp = next.maxHp;
    next.attackSpeed *= Math.max(0.55, 1 - barrageLv * 0.015);
    next.shieldRegen = (next.shieldRegen || 0) + barrierLv * 0.25;
    next.attackDamage *= 1 + coreMemoryLv * 0.01;
    next.maxHp *= 1 + coreMemoryLv * 0.01;
    next.hp = next.maxHp;
    if (titleFx.attack) next.attackDamage *= titleFx.attack;
    if (titleFx.hp) { next.maxHp *= titleFx.hp; next.hp = next.maxHp; }
    if (titleFx.shield && next.maxShield) {
      next.maxShield *= titleFx.shield;
      next.shield = next.maxShield;
    }
    if (automationLv > 0) next.regen += automationLv * 0.05;
    if (greedLv > 0 && next.type === 'ECONOMIC') next.attackDamage *= 1 + greedLv * 0.01;
    if (challenge === 'SILENCE_NIGHT') next.ultMax = 999999;
    if (challenge === 'OVERHEAT_FIELD') {
      next.attackDamage *= 1.25;
      next.regen -= 0.25;
    }
    if (challenge === 'GREED_TRIAL') {
      next.attackDamage *= 0.85;
      next.maxHp *= 0.85;
      next.hp = next.maxHp;
    }
    if (challengeDef?.id === 'ELITE_INVASION') {
      next.attackSpeed *= 0.92;
    }
    return next;
  };

  const startGame = (coreId?: string) => {
    const selectedCoreId = coreId || gameState.activeCoreId;
    const autoLv = gameState.prestigeUpgrades.automation || 0;
    const startFunds = (gameState.globalUpgrades['start_funds'] || 0) * 25 + autoLv * 40;
    
    if (!gameState.unlockedCores.includes(selectedCoreId)) return;

    setGameState(prev => ({ 
      ...prev, gameStatus: 'PLAYING', 
      runCoins: startFunds, 
      wave: 1, 
      activeCoreId: selectedCoreId, 
      ultCharge: 0,
      availableModules: generateRandomModules(),
      artifacts: [],
      pendingArtifact: false,
      pendingRiskChoice: false,
      activeRiskIds: [],
      permanentUpgrades: {} 
    }));
    
    setCore(applyRunPreset(applyGlobalUpgrades(CORE_TEMPLATES[selectedCoreId]), gameState.selectedChallenge));
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

  const canEvolveTo = (evoCore: CoreStats) => {
    if (!evoCore.baseCoreId || evoCore.baseCoreId !== core.id) return false;
    const requirement = EVOLUTION_REQUIREMENTS[evoCore.id];
    if (requirement) return requirement({ gameState, core });
    return gameState.wave >= 15;
  };

  useEffect(() => {
    setGameState(prev => {
      const hiddenToUnlock = Object.values(CORE_TEMPLATES)
        .filter(c => c.type === 'HIDDEN')
        .filter(c => !prev.unlockedCores.includes(c.id))
        .filter(c => HIDDEN_CORE_REQUIREMENTS[c.id]?.(prev));
      if ((prev.prestigeUpgrades.omega_research || 0) > 0 && !prev.unlockedCores.includes('omega-core')) {
        hiddenToUnlock.push(CORE_TEMPLATES['omega-core']);
      }

      if (hiddenToUnlock.length === 0) return prev;
      const uniqueUnlocks = Array.from(new Set(hiddenToUnlock.map(c => c.id)));

      return {
        ...prev,
        unlockedCores: [...prev.unlockedCores, ...uniqueUnlocks]
      };
    });
  }, [gameState.globalArtifacts, gameState.achievements, gameState.unlockedCores]);

  useEffect(() => {
    setGameState(prev => {
      const newUnlocks = evaluateArtifactUnlocks(prev);
      if (newUnlocks.length === 0) return prev;
      return { ...prev, globalArtifacts: [...prev.globalArtifacts, ...newUnlocks] };
    });
  }, [gameState.achievements, gameState.globalArtifacts]);

  useEffect(() => {
    setGameState(prev => {
      const unlocked = new Set(prev.unlockedTitles);
      if ((prev.achievements.boss_kills || 0) >= 1) unlocked.add('첫 방어자');
      if ((prev.achievements.near_death_survive || 0) >= 1) unlocked.add('불굴의 핵');
      if ((prev.achievements.risk_choices || 0) >= 3) unlocked.add('탐욕의 생존자');
      if ((prev.achievements.no_ult_boss_kills || 0) >= 1) unlocked.add('침묵의 수호자');
      if ((prev.achievements.blackhole_kills || 0) >= 120) unlocked.add('블랙홀의 주인');
      if ((prev.achievements.drone_damage_total || 0) >= 300) unlocked.add('드론 지휘관');
      if ((prev.achievements.defense_highwave_clear || 0) >= 1) unlocked.add('성채의 심장');
      if ((prev.achievements.omega_trial_clear || 0) >= 1) unlocked.add('오메가 도전자');
      if ((prev.achievements.void_watcher_kills || 0) >= 1) unlocked.add('공허를 본 자');
      const hiddenCount = prev.unlockedCores.filter(id => CORE_TEMPLATES[id]?.type === 'HIDDEN').length;
      if (hiddenCount >= 3) unlocked.add('히든 사냥꾼');
      if (unlocked.size === prev.unlockedTitles.length) return prev;
      const unlockedTitles = Array.from(unlocked);
      return { ...prev, unlockedTitles, title: unlockedTitles[unlockedTitles.length - 1] };
    });
  }, [gameState.achievements, gameState.unlockedCores]);

  useEffect(() => {
    setGameState(prev => {
      const next = new Set(prev.hiddenClues);
      const a = prev.achievements;
      const clueBoost = prev.prestigeUpgrades.clue_boost || 0;
      const reqMult = Math.max(0.5, 1 - clueBoost * 0.05);
      if ((a.blackhole_kills || 0) >= 80 * reqMult) next.add('clue_gravity');
      if ((a.no_ult_boss_kills || 0) >= 1) next.add('clue_silence');
      if ((a.econ_upgrades_purchased || 0) >= 20 * reqMult || (a.risk_choices || 0) >= 2) next.add('clue_gold');
      if ((a.time_stop_boss_kills || 0) >= 1) next.add('clue_rewind');
      if ((a.clone_kills || 0) >= 40 * reqMult) next.add('clue_mirror');
      if ((a.low_hp_seconds || 0) >= 90 * reqMult) next.add('clue_collapse');
      if (next.size === prev.hiddenClues.length) return prev;
      return { ...prev, hiddenClues: Array.from(next) };
    });
  }, [gameState.achievements]);

  useEffect(() => {
    const today = new Date().toISOString().slice(0, 10);
    if (gameState.missionLastRefresh === today) return;
    setGameState(prev => {
      const dailyIds = new Set(MISSION_DEFS.filter(m => m.category === 'DAILY').map(m => m.id));
      return {
        ...prev,
        missionLastRefresh: today,
        missionClaims: prev.missionClaims.filter(id => !dailyIds.has(id))
      };
    });
  }, [gameState.missionLastRefresh]);

  const solveMystery = (mysteryId: string) => {
    const mystery = HIDDEN_MYSTERIES.find(m => m.id === mysteryId);
    if (!mystery) return;
    setGameState(prev => {
      if (prev.solvedMysteries.includes(mysteryId)) return prev;
      const canSolve = mystery.requires.every(req => prev.hiddenClues.includes(req));
      if (!canSolve) return prev;
      return {
        ...prev,
        solvedMysteries: [...prev.solvedMysteries, mysteryId],
        credits: prev.credits + 250,
        achievements: {
          ...prev.achievements,
          mystery_solves: (prev.achievements.mystery_solves || 0) + 1
        }
      };
    });
  };

  const gainMastery = (id: string, amount: number) => {
    setGameState(prev => {
      const nextXp = (prev.masteryXp[id] || 0) + amount;
      const nextLv = getMasteryLevel(nextXp);
      const prevLv = prev.masteryLevels[id] || 0;
      return {
        ...prev,
        masteryXp: { ...prev.masteryXp, [id]: nextXp },
        masteryLevels: { ...prev.masteryLevels, [id]: Math.max(prevLv, nextLv) }
      };
    });
  };

  const handleWaveComplete = () => {
    setGameState(prev => {
      const nextWave = prev.wave + 1;
      const isMilestone = nextWave > 1 && nextWave % 5 === 0;
      const isRiskWave = nextWave > 1 && nextWave % 7 === 0;
      
      const printerCount = engineRef.current.modules.filter(m => m.type === 'REWARD_PRINTER').length;
      const globalRewardMult = 1 + ((prev.prestigeUpgrades.global_reward || 0) * 0.05);
      const titleArtifactBonus = TITLE_EFFECTS[prev.title]?.artifact || 1;
      const greedMasteryBonus = 1 + ((prev.masteryLevels.greed || 0) * 0.02);
      
      let nextState = { 
        ...prev, 
        wave: nextWave, 
        credits: prev.credits + (prev.wave * 2 + printerCount * 5) * globalRewardMult * titleArtifactBonus * greedMasteryBonus,
        runCoins: prev.runCoins + printerCount * 20,
        availableModules: generateRandomModules(),
        pendingRiskChoice: isRiskWave,
        achievements: {
          ...prev.achievements,
          best_wave: Math.max(prev.achievements.best_wave || 0, nextWave),
        },
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
        nextState.achievements.defense_highwave_clear = 1;
      }
      if (core.id.includes('omega') && nextWave >= 30) nextState.achievements.omega_trial_clear = 1;
      if (core.id.includes('abyss') && nextWave >= 30) nextState.achievements.abyss_trial_clear = 1;
      nextState.masteryLevels = {
        ...prev.masteryLevels,
        [core.id]: (prev.masteryLevels[core.id] || 0) + 1
      };

      return nextState;
    });

    if (gameState.artifacts.includes('art_3')) {
       setCore(p => ({ ...p, hp: Math.min(p.maxHp, p.hp + p.maxHp * 0.2) }));
    }
  };

  const artifactOptions = React.useMemo(() => {
    if (!gameState.pendingArtifact) return [];
    const extra = Math.min(2, gameState.prestigeUpgrades.artifact_slot || 0);
    return [...ARTIFACTS_LIST]
      .filter(a => !gameState.artifacts.includes(a.id))
      .sort(() => Math.random() - 0.5)
      .slice(0, 3 + extra);
  }, [gameState.pendingArtifact, gameState.artifacts, gameState.prestigeUpgrades.artifact_slot]);

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
    const base = Object.values(CORE_TEMPLATES).filter(c => c.baseCoreId === core.id && canEvolveTo(c));
    const extraSlots = Math.min(2, gameState.prestigeUpgrades.evolution_slot || 0);
    if (extraSlots === 0) return base;
    const extra = Object.values(CORE_TEMPLATES)
      .filter(c => c.type === core.type && c.evolutionLevel >= 2 && !base.some(b => b.id === c.id))
      .slice(0, extraSlots);
    return [...base, ...extra];
  }, [gameState.pendingEvolution, core.id, core.type, gameState.wave, gameState.globalArtifacts, gameState.achievements, gameState.prestigeUpgrades.evolution_slot]);

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
     setGameState(prev => ({
       ...prev,
       achievements: {
         ...prev.achievements,
         evo_selects: (prev.achievements.evo_selects || 0) + 1
       }
     }));
  };

  const selectRiskOption = (riskId: string) => {
    const risk = RISK_OPTIONS.find(r => r.id === riskId);
    if (!risk) return;
    const apply = risk.apply as Partial<Record<'coreHp' | 'coreDamage' | 'reward' | 'ultCharge', number>>;
    setGameState(prev => ({
      ...prev,
      pendingRiskChoice: false,
      activeRiskIds: [...prev.activeRiskIds, risk.id],
      achievements: {
        ...prev.achievements,
        risk_choices: (prev.achievements.risk_choices || 0) + 1,
      }
    }));
    if (apply.coreHp) {
      setCore(prev => ({ ...prev, maxHp: prev.maxHp * apply.coreHp!, hp: Math.min(prev.hp, prev.maxHp * apply.coreHp!) }));
    }
    if (apply.coreDamage) {
      setCore(prev => ({ ...prev, attackDamage: prev.attackDamage * apply.coreDamage! }));
    }
  };

  const handleEnemyKill = (reward: number, isBoss: boolean = false, byUlt: boolean = false, enemy?: any, method?: string) => {
    const coinMult = gameState.artifacts.includes('art_5') ? 1.3 : 1;
    const harvesterCount = engineRef.current.modules.filter(m => m.type === 'HARVESTER').length;
    const gaRewardMult = gameState.globalArtifacts.includes('ga_12') ? 1.2 : 1;
    const challengeMult = CHALLENGE_MODES.find(c => c.id === gameState.selectedChallenge)?.rewardMult || 1;
    const riskRewardMult = gameState.activeRiskIds.reduce((acc, id) => {
      const risk = RISK_OPTIONS.find(r => r.id === id);
      const apply = (risk?.apply || {}) as Partial<Record<'reward', number>>;
      return acc * (apply.reward || 1);
    }, 1);
    const titleCoin = TITLE_EFFECTS[gameState.title]?.coin || 1;
    const greedMasteryBonus = 1 + (masteryById('greed').lv * 0.02);
    const finalCoinMult = coinMult * (1 + 0.5 * harvesterCount) * gaRewardMult * challengeMult * riskRewardMult * titleCoin * greedMasteryBonus;
    const ultMult = gameState.artifacts.includes('art_8') ? 1.3 : 1;
    
    setGameState(prev => {
      const next = { 
        ...prev, 
        runCoins: prev.runCoins + (reward * finalCoinMult),
        ultCharge: Math.min(core.ultMax || 100, prev.ultCharge + (reward * 0.5 * ultMult)),
        achievements: {
          ...prev.achievements,
          total_kills: (prev.achievements.total_kills || 0) + 1,
          frozen_kills: (prev.achievements.frozen_kills || 0) + ((enemy?.freezeTimer || 0) > 0 ? 1 : 0),
          gold_enemy_kills: (prev.achievements.gold_enemy_kills || 0) + (enemy?.type === 'GOLD_SLIME' ? 1 : 0),
          clone_kills: (prev.achievements.clone_kills || 0) + (String(enemy?.type || '').includes('CLONE') ? 1 : 0),
          debuffed_kills: (prev.achievements.debuffed_kills || 0) + (((enemy?.freezeTimer || 0) > 0 || (enemy?.slowTimer || 0) > 0 || (enemy?.burnTimer || 0) > 0 || (enemy?.vulnTimer || 0) > 0) ? 1 : 0),
          blackhole_kills: (prev.achievements.blackhole_kills || 0) + ((byUlt && (engineRef.current.activeUltName || '').includes('BLACK')) ? 1 : 0),
          fire_damage_total: (prev.achievements.fire_damage_total || 0) + ((method === 'BURN' || (enemy?.burnTimer || 0) > 0) ? Math.max(1, enemy?.maxHp || 1) : 0),
          reflect_damage_total: (prev.achievements.reflect_damage_total || 0) + (method === 'REFLECT' ? Math.max(1, enemy?.maxHp || 1) : 0),
          drone_damage_total: (prev.achievements.drone_damage_total || 0) + (method === 'SUMMON' ? Math.max(1, enemy?.maxHp || 1) : 0),
        }
      };
      next.masteryLevels = {
        ...prev.masteryLevels,
        [core.id]: (prev.masteryLevels[core.id] || 0) + 0.2
      };

      if (isBoss) {
        next.achievements.boss_kills = (next.achievements.boss_kills || 0) + 1;
        if (core.id.includes('void')) next.achievements.void_watcher_kills = (next.achievements.void_watcher_kills || 0) + 1;
        if (engineRef.current.isUltActive && /TIME|STASIS|REWIND/.test(engineRef.current.activeUltName || '')) {
          next.achievements.time_stop_boss_kills = (next.achievements.time_stop_boss_kills || 0) + 1;
        }
        // If not 'byUlt' (궁극기 없이 10웨이브 보스 처치)... simplified logic:
        if (!engineRef.current.usedUltThisWave) {
           next.achievements.no_ult_boss_kills = (next.achievements.no_ult_boss_kills || 0) + 1;
        }
      }

      return next;
    });

    gainMastery('barrage', method === 'PROJECTILE' ? 2 : 0.5);
    gainMastery('explosion', method === 'BURN' || method === 'ULT' ? 1.5 : 0.3);
    gainMastery('drone', method === 'SUMMON' ? 2 : 0.2);
    gainMastery('flame', method === 'BURN' ? 2 : 0.1);
    gainMastery('summon', method === 'SUMMON' ? 1.4 : 0.1);
    gainMastery('void', byUlt ? 0.6 : 0.2);
    gainMastery('greed', reward * 0.05);
    if (enemy?.freezeTimer && enemy.freezeTimer > 0) gainMastery('frost', 1.2);
    if ((enemy?.slowTimer || 0) > 0) gainMastery('gravity', 0.8);
  };

  const handleCoreDamage = (dmg: number) => {
    setCore(prev => {
      const challengeIncomingMult = gameState.selectedChallenge === 'ELITE_INVASION' ? 1.25 : 1;
      let remainingDmg = dmg * challengeIncomingMult;
      let nextShield = prev.shield ?? 0;
      const originalShield = nextShield;
      
      if (nextShield > 0) {
         if (nextShield >= remainingDmg) {
            nextShield -= remainingDmg;
            remainingDmg = 0;
         } else {
            remainingDmg -= nextShield;
            nextShield = 0;
         }
      }

      const nextHp = Math.max(0, prev.hp - remainingDmg);
      
      // artifact ga_2: 체력 1% 이하 생존
      if (nextHp > 0 && nextHp <= prev.maxHp * 0.01) {
         setGameState(gs => ({
           ...gs,
           achievements: {
             ...gs.achievements,
             near_death_survive: (gs.achievements.near_death_survive || 0) + 1
           }
         }));
      }

      if (nextHp <= 0) {
        setGameState(gs => ({ ...gs, gameStatus: 'GAMEOVER' }));
      }
      const absorbed = Math.max(0, originalShield - nextShield);
      if (absorbed > 0) gainMastery('barrier', absorbed * 0.2);
      if (engineRef.current.modules.some(m => m.type === 'REFLECTOR')) gainMastery('reflect', 0.4);
      return { ...prev, hp: nextHp, shield: nextShield };
    });
  };

  const activateUlt = () => {
    if (gameState.selectedChallenge === 'SILENCE_NIGHT') return;
    if (gameState.ultCharge >= (core.ultMax || 100)) {
       setGameState(prev => ({
         ...prev,
         ultCharge: 0,
         achievements: {
           ...prev.achievements,
           ult_uses: (prev.achievements.ult_uses || 0) + 1
         }
       }));
       gainMastery('time', 4);
       engineRef.current.triggerUltimate(core);
    }
  };

  const buyModule = (moduleId: string) => {
    const moduleDef = MODULES.find(m => m.id === moduleId);
    if (moduleDef && gameState.runCoins >= moduleDef.cost && engineRef.current.modules.length < 20) {
      setGameState(prev => ({ ...prev, runCoins: prev.runCoins - moduleDef.cost }));
      
      let color = '#00F0FF';
      if (moduleDef.type.includes('LASER')) color = '#FF4D00';
      if (moduleDef.type.includes('LENS')) color = '#A855F7';
      if (moduleDef.type.includes('SHIELD')) color = '#38BDF8';
      if (moduleDef.type.includes('DRONE') || moduleDef.type.includes('MISSILE')) color = '#8B5CF6';
      if (moduleDef.type.includes('FLAME')) color = '#EF4444';
      if (moduleDef.type.includes('COOLING')) color = '#60A5FA';
      // etc... default fallback

      let baseRotSpeed = (0.5 + Math.random() * 1.5) * (Math.random()>0.5?1:-1);
      if (gameState.artifacts.includes('art_2')) {
          baseRotSpeed *= 1.2;
      }

      engineRef.current.modules.push({
        id: Math.random().toString(36),
        type: moduleDef.type,
        angle: Math.random() * Math.PI * 2,
        distance: 80 + Math.random() * 100, // further out
        rotationSpeed: baseRotSpeed,
        damage: 10 + Math.random() * 20,
        color,
        lastActionTime: 0
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
        permanentUpgrades: { ...prev.permanentUpgrades, [upgradeId]: level + 1 },
        achievements: {
          ...prev.achievements,
          econ_upgrades_purchased: (prev.achievements.econ_upgrades_purchased || 0) + (core.type === 'ECONOMIC' ? 1 : 0)
        }
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

  const doPrestige = () => {
    setGameState(prev => {
      const gain = Math.max(1, Math.floor((prev.achievements.best_wave || 1) / 20));
      return {
        ...prev,
        credits: Math.floor(prev.credits * 0.25),
        globalUpgrades: Object.fromEntries(Object.entries(prev.globalUpgrades).map(([k, v]) => [k, Math.floor(Number(v) * 0.5)])),
        permanentUpgrades: {},
        prestigeCount: prev.prestigeCount + 1,
        transcendencePoints: prev.transcendencePoints + gain,
        achievements: { ...prev.achievements, prestige_uses: (prev.achievements.prestige_uses || 0) + 1 },
      };
    });
  };

  const buyPrestigeUpgrade = (upgradeId: string) => {
    const up = PRESTIGE_UPGRADES.find(u => u.id === upgradeId);
    if (!up) return;
    setGameState(prev => {
      const cur = prev.prestigeUpgrades[upgradeId] || 0;
      if (cur >= up.max || prev.transcendencePoints < up.cost) return prev;
      return {
        ...prev,
        transcendencePoints: prev.transcendencePoints - up.cost,
        prestigeUpgrades: { ...prev.prestigeUpgrades, [upgradeId]: cur + 1 }
      };
    });
  };

  const investCoreMemory = (coreId: string) => {
    setGameState(prev => {
      if ((prev.prestigeUpgrades.core_memory || 0) <= 0 || prev.transcendencePoints <= 0) return prev;
      return {
        ...prev,
        transcendencePoints: prev.transcendencePoints - 1,
        coreMemories: { ...prev.coreMemories, [coreId]: (prev.coreMemories[coreId] || 0) + 1 }
      };
    });
  };

  const animate = (time: number) => {
    if (lastTimeRef.current !== 0 && !gameState.isPaused && gameState.gameStatus === 'PLAYING' && !gameState.pendingArtifact && !gameState.pendingEvolution && !gameState.pendingRiskChoice) {
      const deltaTime = (time - lastTimeRef.current) / 1000;
      const ctx = canvasRef.current?.getContext('2d');
      if (ctx) {
        engineRef.current.update(core, Math.min(deltaTime, 0.1), gameState.wave, [...gameState.artifacts, ...gameState.globalArtifacts], handleEnemyKill, handleCoreDamage, handleWaveComplete);
        engineRef.current.render(ctx, core);
        if (core.hp > 0 && core.hp <= core.maxHp * 0.2) {
          setGameState(prev => ({
            ...prev,
            achievements: {
              ...prev.achievements,
              low_hp_seconds: (prev.achievements.low_hp_seconds || 0) + Math.min(deltaTime, 0.1)
            }
          }));
        }
        const summonCount = engineRef.current.summons.length;
        if (summonCount > previousSummonCountRef.current) {
          const created = summonCount - previousSummonCountRef.current;
          setGameState(prev => ({
            ...prev,
            achievements: {
              ...prev.achievements,
              summons_created_total: (prev.achievements.summons_created_total || 0) + created
            }
          }));
        }
        previousSummonCountRef.current = summonCount;
        setEngineState({ 
           enemies: engineRef.current.enemies.length, 
           ultActive: engineRef.current.isUltActive,
           activeUltName: engineRef.current.activeUltName
        });
      }
    }
    lastTimeRef.current = time;
    requestRef.current = requestAnimationFrame(animate);
  };

  useEffect(() => {
    requestRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(requestRef.current);
  }, [gameState.isPaused, gameState.gameStatus, gameState.pendingArtifact, gameState.pendingEvolution, gameState.pendingRiskChoice, core, gameState.ultCharge, gameState.artifacts]);

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
            <p className="text-[9px] text-[#6B7280] uppercase tracking-widest">Title</p>
            <p className="text-sm font-mono text-[#22C55E]">{gameState.title}</p>
          </div>
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
                  
                  {core.maxShield !== undefined && core.maxShield > 0 && (
                     <div>
                        <div className="flex justify-between text-[9px] text-[#6B7280] mb-1 font-mono uppercase tracking-widest">
                           <span>Shield (Regen {core.shieldRegen}/s)</span>
                           <span className="text-[#38BDF8]">{Math.ceil(core.shield || 0)} / {Math.ceil(core.maxShield)}</span>
                        </div>
                        <div className="w-full bg-[#1A1A1E] h-1.5 overflow-hidden">
                           <div style={{ width: `${((core.shield || 0) / core.maxShield) * 100}%` }} className="h-full bg-[#38BDF8] shadow-[0_0_10px_#38BDF8] transition-all" />
                        </div>
                     </div>
                  )}

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
            
            {/* ULTIMATE ACTIVE DISPLAY */}
            {engineState.ultActive && engineState.activeUltName && (
               <div className="absolute top-10 left-1/2 -translate-x-1/2 z-50 pointer-events-none flex flex-col items-center">
                  <motion.div initial={{ opacity: 0, y: -20, scale: 0.8 }} animate={{ opacity: 1, y: 0, scale: 1 }} className="text-3xl font-black text-white italic tracking-tighter mix-blend-screen text-center" style={{ textShadow: `0 0 20px ${core.color}` }}>
                     {engineState.activeUltName} <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-[#00F0FF]">ACTIVATED</span>
                  </motion.div>
                  <motion.div initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ duration: 0.3 }} className="h-1 w-full mt-2" style={{ backgroundColor: core.color }} />
               </div>
            )}

            {/* INITIAL MENU */}
            {gameState.gameStatus === 'MENU' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0 bg-black/90 backdrop-blur-md flex flex-col items-center justify-start z-30 p-10 pt-16 text-center rounded-[100%]">
                <div className="text-4xl md:text-5xl font-black text-white tracking-tighter mb-2 uppercase">ORBITAL <span className="text-[#00F0FF] font-light">CORE</span></div>
                <p className="text-[#6B7280] font-mono text-[9px] tracking-[0.4em] uppercase mb-6">Defense Engine Stabilized</p>
                
                <div className="flex gap-4 mb-6">
                  <button onClick={() => setGameState(p => ({...p, menuTab: 'DEPLOY'}))} className={`px-4 py-2 border-b-2 text-[10px] font-bold uppercase tracking-widest ${gameState.menuTab === 'DEPLOY' ? 'border-[#00F0FF] text-[#00F0FF]' : 'border-transparent text-[#6B7280] hover:text-white'}`}>Deploy</button>
                  <button onClick={() => setGameState(p => ({...p, menuTab: 'RESEARCH'}))} className={`px-4 py-2 border-b-2 text-[10px] font-bold uppercase tracking-widest ${gameState.menuTab === 'RESEARCH' ? 'border-[#EAB308] text-[#EAB308]' : 'border-transparent text-[#6B7280] hover:text-white'}`}>Research</button>
                  <button onClick={() => setGameState(p => ({...p, menuTab: 'ARTIFACTS'}))} className={`px-4 py-2 border-b-2 text-[10px] font-bold uppercase tracking-widest ${gameState.menuTab === 'ARTIFACTS' ? 'border-[#A855F7] text-[#A855F7]' : 'border-transparent text-[#6B7280] hover:text-white'}`}>Artifacts</button>
                  <button onClick={() => setGameState(p => ({...p, menuTab: 'META'}))} className={`px-4 py-2 border-b-2 text-[10px] font-bold uppercase tracking-widest ${gameState.menuTab === 'META' ? 'border-[#22C55E] text-[#22C55E]' : 'border-transparent text-[#6B7280] hover:text-white'}`}>Meta</button>
                </div>

                {gameState.menuTab === 'DEPLOY' && (
                  <div className="flex flex-col gap-4 max-w-2xl w-full px-6 overflow-y-auto pb-8 relative z-20 max-h-[60vh]">
                     <div className="p-3 border border-[#2D2D33] bg-[#0A0A0C]">
                       <p className="text-[9px] text-[#22C55E] font-mono tracking-widest uppercase mb-2">Challenge Mode</p>
                       <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                         {CHALLENGE_MODES.map(mode => (
                           <button
                             key={mode.id}
                             onClick={() => setGameState(p => ({ ...p, selectedChallenge: mode.id }))}
                             className={`p-2 text-left border text-[10px] ${gameState.selectedChallenge === mode.id ? 'border-[#22C55E] text-white bg-[#131316]' : 'border-[#2D2D33] text-[#9CA3AF]'}`}
                           >
                             <div className="font-bold uppercase">{mode.name}</div>
                             <div className="text-[9px]">{mode.description} x{mode.rewardMult.toFixed(1)}</div>
                           </button>
                         ))}
                       </div>
                     </div>
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
                               const isHidden = tpl.type === 'HIDDEN';
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
                                       {isHidden ? (
                                         <>
                                            <Lock className="w-4 h-4 text-[#A855F7] mb-1" />
                                            <p className="text-[8px] text-[#D1D5DB] text-center px-2 font-mono">HIDDEN CORE</p>
                                         </>
                                       ) : isEvo ? (
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

                {gameState.menuTab === 'META' && (
                  <div className="flex flex-col gap-3 w-full max-w-2xl px-8 overflow-y-auto pb-8 relative z-20 max-h-[60vh] text-left">
                    <div className="p-3 border border-[#2D2D33] bg-[#0A0A0C]">
                      <p className="text-[9px] text-[#22C55E] font-mono tracking-widest uppercase mb-2">Prestige</p>
                      <p className="text-[11px] text-white">초월 횟수: {gameState.prestigeCount} / 초월 포인트: {gameState.transcendencePoints}</p>
                      <p className="text-[9px] text-[#9CA3AF] mb-2">최고 웨이브 기반으로 포인트를 획득하고 글로벌 연구를 초기화합니다.</p>
                      <button onClick={doPrestige} className="px-3 py-2 border border-[#22C55E] text-[#22C55E] text-[10px] uppercase tracking-widest">프레스티지 실행</button>
                      <div className="mt-3 space-y-2">
                        {PRESTIGE_UPGRADES.map(up => {
                          const lv = gameState.prestigeUpgrades[up.id] || 0;
                          return (
                            <div key={up.id} className="p-2 border border-[#2D2D33]">
                              <div className="flex items-center justify-between">
                                <span className="text-[10px] text-white">{up.name} Lv.{lv}/{up.max}</span>
                                <button disabled={lv >= up.max || gameState.transcendencePoints < up.cost} onClick={() => buyPrestigeUpgrade(up.id)} className="text-[9px] border px-2 py-1 border-[#22C55E] text-[#22C55E] disabled:opacity-30">-{up.cost} TP</button>
                              </div>
                              <div className="text-[9px] text-[#9CA3AF]">{up.desc}</div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    <div className="p-3 border border-[#2D2D33] bg-[#0A0A0C]">
                      <p className="text-[9px] text-[#22C55E] font-mono tracking-widest uppercase mb-2">Core Memory</p>
                      <div className="grid grid-cols-2 gap-2">
                        {gameState.unlockedCores.slice(0, 10).map(id => (
                          <button key={id} onClick={() => investCoreMemory(id)} className="p-2 border border-[#2D2D33] text-left">
                            <div className="text-[10px] text-white">{CORE_TEMPLATES[id]?.name || id}</div>
                            <div className="text-[9px] text-[#9CA3AF]">기억 Lv.{gameState.coreMemories[id] || 0}</div>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="p-3 border border-[#2D2D33] bg-[#0A0A0C]">
                      <p className="text-[9px] text-[#00F0FF] font-mono tracking-widest uppercase mb-2">Daily / Weekly Missions</p>
                      <div className="text-[9px] text-[#9CA3AF] mb-2">리프레시: {gameState.missionLastRefresh}</div>
                      {[...dailyMissions, ...weeklyMissions, ...metaMissions].map(m => {
                        const done = m.progress >= m.target;
                        const claimed = gameState.missionClaims.includes(m.id);
                        const lockedByChain = m.category === 'CHAIN' && Number(m.id.split('_')[1]) > (gameState.missionChainStep + 1);
                        return (
                          <div key={m.id} className="mb-2 p-2 border border-[#2D2D33]">
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] text-white">[{m.category}] {m.label}</span>
                              <span className="text-[9px] text-[#EAB308]">{Math.min(m.progress, m.target)}/{m.target}</span>
                            </div>
                            {m.recommendedBuild && <div className="text-[8px] text-[#A855F7]">권장 빌드: {m.recommendedBuild}</div>}
                            <button
                              disabled={!done || claimed || lockedByChain}
                              onClick={() => claimMission(m.id, m.reward, m.rewardType)}
                              className="mt-1 text-[9px] border px-2 py-1 border-[#00F0FF] text-[#00F0FF] disabled:opacity-30"
                            >
                              보상 {m.reward} {m.rewardType} {claimed ? '(수령완료)' : lockedByChain ? '(연속 단계 잠김)' : ''}
                            </button>
                          </div>
                        );
                      })}
                    </div>

                    <div className="p-3 border border-[#2D2D33] bg-[#0A0A0C]">
                      <p className="text-[9px] text-[#A855F7] font-mono tracking-widest uppercase mb-2">Titles</p>
                      <p className="text-[10px] mb-2">현재 칭호: <span className="text-white">{gameState.title}</span></p>
                      {TITLE_DEFS.map(t => (
                        <div key={t.id} className="text-[9px] text-[#9CA3AF] mb-1">
                          {gameState.unlockedTitles.includes(t.id) ? <Check className="w-3 h-3 inline mr-1 text-[#22C55E]" /> : <Lock className="w-3 h-3 inline mr-1" />}
                          {t.id} - {t.condition}
                          {gameState.unlockedTitles.includes(t.id) && (
                            <button onClick={() => setGameState(p => ({ ...p, title: t.id }))} className="ml-2 text-[8px] border px-1 border-[#A855F7] text-[#A855F7]">장착</button>
                          )}
                        </div>
                      ))}
                      <div className="text-[9px] text-[#D1D5DB] mt-2">효과: {TITLE_EFFECTS[gameState.title]?.desc}</div>
                    </div>

                    <div className="p-3 border border-[#2D2D33] bg-[#0A0A0C]">
                      <p className="text-[9px] text-[#38BDF8] font-mono tracking-widest uppercase mb-2">Mastery</p>
                      {MASTERY_DEFS.map(m => {
                        const xp = gameState.masteryXp[m.id] || 0;
                        const lv = gameState.masteryLevels[m.id] || 0;
                        const nextReq = Math.pow(lv + 1, 2) * 60;
                        return (
                          <div key={m.id} className="mb-2 p-2 border border-[#2D2D33]">
                            <div className="flex items-center justify-between text-[10px]">
                              <span className="text-white">{m.name}</span>
                              <span className="text-[#38BDF8]">Lv.{lv}</span>
                            </div>
                            <div className="text-[9px] text-[#9CA3AF]">{m.bonus}</div>
                            <div className="text-[9px] text-[#6B7280]">XP {Math.floor(xp)} / {Math.floor(nextReq)}</div>
                          </div>
                        );
                      })}
                    </div>

                    <div className="p-3 border border-[#2D2D33] bg-[#0A0A0C]">
                      <p className="text-[9px] text-[#F59E0B] font-mono tracking-widest uppercase mb-2">Hidden Clue Deduction</p>
                      <div className="space-y-2 mb-3">
                        {HIDDEN_CLUES.map(clue => {
                          const found = gameState.hiddenClues.includes(clue.id);
                          return (
                            <div key={clue.id} className="p-2 border border-[#2D2D33]">
                              <div className="text-[10px] text-white">{clue.name} {found ? <span className="text-[#22C55E]">(발견)</span> : <span className="text-[#6B7280]">(미발견)</span>}</div>
                              <div className="text-[9px] text-[#9CA3AF]">{found ? clue.hint : '전투 로그가 부족합니다. 더 많은 실험이 필요합니다.'}</div>
                            </div>
                          );
                        })}
                      </div>
                      <div className="space-y-2">
                        {HIDDEN_MYSTERIES.map(myst => {
                          const solved = gameState.solvedMysteries.includes(myst.id);
                          const canSolve = myst.requires.every(req => gameState.hiddenClues.includes(req));
                          return (
                            <div key={myst.id} className="p-2 border border-[#2D2D33]">
                              <div className="flex items-center justify-between">
                                <span className="text-[10px] text-white">{myst.name}</span>
                                <button
                                  onClick={() => solveMystery(myst.id)}
                                  disabled={!canSolve || solved}
                                  className="text-[9px] border px-2 py-1 border-[#F59E0B] text-[#F59E0B] disabled:opacity-30"
                                >
                                  {solved ? '해독 완료' : '해독 시도'}
                                </button>
                              </div>
                              <div className="text-[9px] text-[#9CA3AF]">요구 단서: {myst.requires.join(', ')}</div>
                              <div className="text-[9px] text-[#D1D5DB]">보상: {myst.reward}</div>
                            </div>
                          );
                        })}
                      </div>
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

            {gameState.pendingRiskChoice && (
              <div className="absolute inset-0 bg-[#050506]/95 backdrop-blur-lg flex flex-col items-center justify-center z-50 text-center px-8 border-[8px] border-[#EAB308]/30 rounded-[100%]">
                <h2 className="text-3xl font-black text-white tracking-tighter mb-2 uppercase">RISK / REWARD</h2>
                <p className="text-[#EAB308] font-mono text-[10px] uppercase tracking-[0.4em] mb-8">고위험 선택</p>
                <div className="flex flex-col gap-3 w-full max-w-lg">
                  {[...RISK_OPTIONS].sort(() => Math.random() - 0.5).slice(0, 3).map(opt => (
                    <button key={opt.id} onClick={() => selectRiskOption(opt.id)} className="p-3 border border-[#2D2D33] bg-[#0A0A0C] hover:border-[#EAB308] text-left">
                      <div className="text-[11px] text-white">{opt.name}</div>
                      <div className="text-[9px] text-[#9CA3AF]">{opt.description}</div>
                    </button>
                  ))}
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
                   {gameState.availableModules?.map(moduleId => {
                      const moduleDef = MODULES.find(m => m.id === moduleId);
                      if (!moduleDef) return null;
                      const Icon = moduleDef.type.includes('LASER') ? Crosshair : Target;
                      return (
                        <div key={moduleDef.id} className="relative group">
                          <button onClick={() => buyModule(moduleDef.id)} disabled={gameState.runCoins < moduleDef.cost} className={`flex flex-col items-center py-2 px-6 border transition-all ${gameState.runCoins >= moduleDef.cost ? 'bg-[#1A1A1E] border-[#2D2D33] hover:border-white' : 'bg-transparent border-transparent opacity-30'} rounded-sm`}>
                             <Icon className="w-4 h-4 mb-1 text-white" />
                             <span className="text-[8px] font-mono tracking-widest">{moduleDef.name}</span>
                             <span className="text-[10px] text-[#EAB308] font-bold font-mono">{moduleDef.cost}</span>
                          </button>
                          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 bg-black border border-[#2D2D33] hidden group-hover:block z-50 pointer-events-none text-center rounded-sm">
                            <div className="text-[#38BDF8] text-[10px] font-bold mb-1">{moduleDef.name}</div>
                            <div className="text-[#9CA3AF] text-[9px] leading-tight">{moduleDef.description}</div>
                          </div>
                        </div>
                      );
                   })}
                </div>

                <button 
                  onClick={() => {
                     if (ultPercent >= 100 && !engineRef.current.usedUltThisWave && gameState.selectedChallenge !== 'SILENCE_NIGHT') {
                        engineRef.current.triggerUltimate(core);
                        setGameState(p => ({
                          ...p,
                          ultCharge: 0,
                          achievements: {
                            ...p.achievements,
                            ult_uses: (p.achievements.ult_uses || 0) + 1
                          }
                        }));
                     }
                  }} 
                  disabled={ultPercent < 100 || engineRef.current.usedUltThisWave || gameState.selectedChallenge === 'SILENCE_NIGHT'}
                  className={`px-6 py-2 border flex flex-col items-center justify-center font-mono transition-colors shadow-xl ${ultPercent >= 100 && !engineRef.current.usedUltThisWave ? 'bg-[#1A1A1E] border-white text-white hover:bg-white hover:text-black cursor-pointer' : 'bg-[#0A0A0C]/90 border-[#2D2D33] text-[#4B5563] cursor-not-allowed opacity-50'}`}
                >
                   <span className="text-[14px] font-bold uppercase">{core.ultName || 'ULT'}</span>
                   {engineRef.current.usedUltThisWave ? (
                     <span className="text-[8px] tracking-widest text-[#FF4D00]">USED</span>
                   ) : (
                     <span className="text-[8px] tracking-widest">{Math.floor(ultPercent)}% READY</span>
                   )}
                </button>

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
                <div className="bg-transparent border-none px-0 py-0 font-mono">
                  <h3 className="text-[11px] font-bold text-[#6B7280] uppercase tracking-widest mb-2">RISK EFFECTS</h3>
                  <div className="text-[9px] text-[#EAB308] space-y-1">
                    {gameState.activeRiskIds.length === 0 ? <div className="text-[#4B5563]">None</div> : gameState.activeRiskIds.map(id => <div key={id}>{RISK_OPTIONS.find(r => r.id === id)?.name || id}</div>)}
                  </div>
                </div>
             </>
          )}
        </div>

      </div>
    </div>
  );
}
