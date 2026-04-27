export type MenuTab = 'DEPLOY' | 'RESEARCH' | 'ARTIFACTS';

export interface GameState {
  credits: number; // Persistent currency
  runCoins: number; // In-run currency
  wave: number;
  isPaused: boolean;
  gameStatus: 'MENU' | 'PLAYING' | 'GAMEOVER';
  menuTab: MenuTab;
  activeCoreId: string;
  unlockedCores: string[];
  permanentUpgrades: Record<string, number>;
  globalUpgrades: Record<string, number>;
  masteryLevels: Record<string, number>;
  globalArtifacts: string[];
  achievements: Record<string, number>;
  ultCharge: number;
  availableModules: string[];
  artifacts: string[]; // run tacticals
  pendingArtifact: boolean;
  pendingEvolution: boolean;
}

export type CoreType = 'BASIC' | 'ATTACK' | 'DEFENSE' | 'CONTROL' | 'SUMMON' | 'ECONOMIC' | 'SPECIAL' | 'HIDDEN';

export interface CoreStats {
  id: string;
  name: string;
  type: CoreType;
  hp: number;
  maxHp: number;
  attackDamage: number;
  attackSpeed: number; // interval in ms
  range: number;
  defense: number;
  regen: number;
  shield?: number;
  maxShield?: number;
  shieldRegen?: number;
  evolutionLevel: number;
  color: string;
  ultName?: string;
  ultMax?: number;
  unlockCost?: number;
  baseCoreId?: string;
  evolutionCondition?: string;
  description?: string;
}

export interface Summon {
  id: string;
  type: 'DRONE' | 'TURRET' | 'BLACKHOLE' | 'NANOBOT' | 'SATELLITE' | 'CLONE' | 'ORBITAL_LASER';
  x: number;
  y: number;
  targetId?: string;
  damage: number;
  lifeTime: number;
  maxLifeTime: number;
  speed: number;
  radius: number;
  color: string;
  lastAttackTime: number;
  angle?: number;
  distance?: number;
}

export type EnemyType = 'RUNNER' | 'TANKER' | 'SHOOTER' | 'SWARM' | 'BOSS';

export interface Enemy {
  id: string;
  type: EnemyType;
  x: number;
  y: number;
  hp: number;
  maxHp: number;
  speed: number;
  damage: number;
  reward: number;
  angle: number;
  radius: number;
  lastAttackTime?: number;
  freezeTimer?: number;
  burnTimer?: number;
  burnDamage?: number;
  slowTimer?: number;
  slowAmount?: number;
  stunTimer?: number;
  vulnTimer?: number;
}

export interface Projectile {
  id: string;
  x: number;
  y: number;
  targetId: string;
  damage: number;
  speed: number;
  color: string;
  type: 'NORMAL' | 'PIERCE' | 'EXPLOSIVE' | 'ENEMY' | 'CHAIN' | 'FRAG' | 'SNIPER' | 'LASER_BEAM' | 'BOUNCE' | 'MISSILE';
  chainCount?: number;
  explosionRadius?: number;
  hitSet?: Set<string>;
}

export type ModuleType = 'LASER_SAT' | 'SHIELD_SAT' | 'GRAVITY_LENS' | 'COOLING_COIL' | 'LIGHTNING_AMP' | 'HARVESTER' | 'DRONE_NEST' | 'MISSILE_POD' | 'REFLECTOR' | 'RIFT_LENS' | 'FLAME_NOZZLE' | 'NANO_SPRAYER' | 'PHOTON_AMP' | 'ABSORPTION_RING' | 'EXECUTION_LENS' | 'TIME_PENDULUM' | 'BALLISTIC_AMP' | 'REWARD_PRINTER' | 'PURIFY_COIL' | 'OMEGA_RING';

export interface OrbitalModule {
  id: string;
  type: ModuleType;
  angle: number;
  distance: number;
  rotationSpeed: number;
  damage: number;
  color: string;
  lastActionTime?: number;
}

export interface UpgradeOption {
  id: string;
  name: string;
  description: string;
  baseCost: number;
  costMult: number;
}

export interface RunUpgrade {
  id: string;
  name: string;
  type: 'STAT' | 'MODULE' | 'SPECIAL';
  description: string;
  baseCost: number;
  costMult: number;
  effect: string;
  maxLevel?: number;
}
