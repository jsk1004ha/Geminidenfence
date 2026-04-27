export interface GameState {
  credits: number; // Persistent currency
  runCoins: number; // In-run currency
  wave: number;
  isPaused: boolean;
  gameStatus: 'MENU' | 'PLAYING' | 'GAMEOVER';
  activeCoreId: string;
  unlockedCores: string[];
  permanentUpgrades: Record<string, number>;
  masteryLevels: Record<string, number>;
}

export interface CoreStats {
  id: string;
  name: string;
  type: 'BASIC' | 'ATTACK' | 'DEFENSE' | 'CONTROL' | 'SUMMON' | 'ECONOMIC' | 'SPECIAL' | 'HIDDEN';
  hp: number;
  maxHp: number;
  attackDamage: number;
  attackSpeed: number; // interval in ms
  range: number;
  defense: number;
  regen: number;
  evolutionLevel: number;
  color: string;
}

export interface Enemy {
  id: string;
  type: string;
  x: number;
  y: number;
  hp: number;
  maxHp: number;
  speed: number;
  damage: number;
  reward: number;
  angle: number;
  radius: number; // distance from core
}

export interface Projectile {
  id: string;
  x: number;
  y: number;
  targetId: string;
  damage: number;
  speed: number;
  color: string;
  type: 'NORMAL' | 'PIERCE' | 'EXPLOSIVE';
}

export interface OrbitalModule {
  id: string;
  type: string;
  angle: number;
  distance: number;
  rotationSpeed: number;
  damage: number;
}

export interface UpgradeOption {
  id: string;
  name: string;
  description: string;
  cost: number;
  icon: string;
  effect: (stats: any) => any;
}
