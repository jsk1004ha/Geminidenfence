import { CoreStats } from './types';

export const INITIAL_GAME_STATE = {
  credits: 0,
  runCoins: 0,
  wave: 1,
  isPaused: false,
  gameStatus: 'MENU' as const,
  activeCoreId: 'circle-core',
  unlockedCores: ['circle-core'],
  permanentUpgrades: {},
  masteryLevels: {},
};

export const CORE_TEMPLATES: Record<string, CoreStats> = {
  'circle-core': {
    id: 'circle-core',
    name: '원형 코어',
    type: 'BASIC',
    hp: 100,
    maxHp: 100,
    attackDamage: 10,
    attackSpeed: 1000,
    range: 300,
    defense: 0,
    regen: 0.1,
    evolutionLevel: 1,
    color: '#00F0FF', // Cyan
  },
  'battle-core': {
    id: 'battle-core',
    name: '전투 코어',
    type: 'ATTACK',
    hp: 80,
    maxHp: 80,
    attackDamage: 18,
    attackSpeed: 800,
    range: 350,
    defense: 2,
    regen: 0.05,
    evolutionLevel: 1,
    color: '#FF4D00', // Orange
  },
  'guardian-core': {
    id: 'guardian-core',
    name: '수호 코어',
    type: 'DEFENSE',
    hp: 200,
    maxHp: 200,
    attackDamage: 8,
    attackSpeed: 1200,
    range: 250,
    defense: 10,
    regen: 0.5,
    evolutionLevel: 1,
    color: '#22C55E', // Green
  }
};

export const MODULE_TYPES = {
  LENSE: { name: '중력 렌즈', description: '적을 중앙으로 흡입', cost: 100 },
  LASER: { name: '레이저 위성', description: '회전하며 적을 절단', cost: 150 },
};

export const UPGRADES = {
  RUN: [
    { id: 'dmg', name: '공격력', description: '기본 데미지 증가', baseCost: 10, costMult: 1.5 },
    { id: 'aspd', name: '공격속도', description: '발사 간격 감소', baseCost: 15, costMult: 1.6 },
    { id: 'hp', name: '내구도', description: '최대 체력 증가', baseCost: 12, costMult: 1.4 },
    { id: 'regen', name: '자가수복', description: '초당 체력 회복량 증가', baseCost: 20, costMult: 1.8 },
  ]
};

export const CANVAS_SIZE = 800;
export const CORE_X = CANVAS_SIZE / 2;
export const CORE_Y = CANVAS_SIZE / 2;
