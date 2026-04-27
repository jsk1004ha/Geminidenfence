import { CoreStats, GameState, RunUpgrade } from './types';

export const INITIAL_GAME_STATE: GameState = {
  credits: 0,
  runCoins: 0,
  wave: 1,
  isPaused: false,
  gameStatus: 'MENU',
  menuTab: 'DEPLOY',
  activeCoreId: 'circle-core',
  unlockedCores: ['circle-core'],
  permanentUpgrades: {},
  globalUpgrades: {},
  masteryLevels: {},
  globalArtifacts: [],
  achievements: {},
  ultCharge: 0,
  artifacts: [],
  pendingArtifact: false,
  pendingEvolution: false,
};

export interface GlobalArtifactDef {
  id: string;
  name: string;
  condition: string;
  description: string;
}

export const GLOBAL_ARTIFACTS: GlobalArtifactDef[] = [
  { id: 'ga_1', name: '첫 번째 별의 파편', condition: '첫 보스 처치', description: '기본 공격력 10% 증가' },
  { id: 'ga_2', name: '녹슨 방패핵', condition: '체력 1% 이하 생존', description: '최대 체력 20% 증가' },
  { id: 'ga_3', name: '블랙홀 잔재', condition: '블랙홀로 적 100마리 처치', description: '블랙홀 흡입력 20% 증가' },
  { id: 'ga_4', name: '시간의 균열', condition: '시간 정지 중 보스 처치', description: '궁극기 쿨다운 10% 감소' },
  { id: 'ga_5', name: '탐욕의 금속판', condition: '경제 업그레이드 누적 50회', description: '코인 획득량 15% 증가' },
  { id: 'ga_6', name: '공허한 왕관', condition: '공허 감시자 처치', description: '보스에게 가하는 피해 15% 증가' },
  { id: 'ga_7', name: '오메가 결정', condition: '오메가 시험 클리어', description: '마스터리 경험치 획득량 증가' },
  { id: 'ga_8', name: '빙결 심장', condition: '얼어붙은 적 500마리 처치', description: '감속 효과 10% 증가' },
  { id: 'ga_9', name: '화산의 씨앗', condition: '화염 피해 누적 10,000', description: '지속 피해량 20% 증가' },
  { id: 'ga_10', name: '반사 거울', condition: '반사 피해 누적 5,000', description: '반사 피해량 30% 증가' },
  { id: 'ga_11', name: '드론 코어 조각', condition: '드론으로 적 200마리 처치', description: '드론 생성/공격 속도 15% 증가' },
  { id: 'ga_12', name: '황금 주화', condition: '황금 적 10마리 처치', description: '웨이브 보상 20% 증가' },
  { id: 'ga_13', name: '저주의 파편', condition: '디버프 걸린 적 300마리 처치', description: '상태이상 지속시간 20% 증가' },
  { id: 'ga_14', name: '성채의 문장', condition: '방어형 코어로 30웨이브 달성', description: '방어력 5 추가' },
  { id: 'ga_15', name: '침묵한 별', condition: '궁극기 없이 10웨이브 보스 처치', description: '기본 공격력 15% 증가' },
  { id: 'ga_16', name: '분열된 렌즈', condition: '프리즘 계열 위성 사용', description: '속성 피해 15% 증가' },
  { id: 'ga_17', name: '심연의 눈동자', condition: '심연 도전 모드 클리어', description: '적 강화에 비례하여 보너스 획득' },
  { id: 'ga_18', name: '거울 조각', condition: '복제된 적 100마리 처치', description: '복제 코어 효과 20% 강화' },
  { id: 'ga_19', name: '붕괴 결정', condition: '체력 20% 미만 상태 3분 유지', description: '체력 낮을수록 공격력 최대 30% 증가' },
  { id: 'ga_20', name: '창세의 씨앗', condition: '소환체 500개 누적 생성', description: '소환체 체력 및 피해량 20% 증가' },
];

export const GLOBAL_UPGRADES = [
  { id: 'start_funds', name: '초기 지원금', description: '시작 시 자본 보유', maxLv: 10, baseCost: 10, costMult: 1.5, valuePerLevel: 25 },
  { id: 'base_hp', name: '장갑판 압축', description: '체력 상한 증가', maxLv: 20, baseCost: 15, costMult: 1.4, valuePerLevel: 10 },
  { id: 'base_dmg', name: '플라즈마 정제', description: '공격 데미지 증폭', maxLv: 20, baseCost: 20, costMult: 1.6, valuePerLevel: 1 },
  { id: 'base_regen', name: '나노 수복기', description: '초당 회복력 향상', maxLv: 10, baseCost: 30, costMult: 1.8, valuePerLevel: 0.2 },
];

export const CORE_TEMPLATES: Record<string, CoreStats> = {
  // === BASIC CATEGORY ===
  'circle-core': {
    id: 'circle-core', name: '원형 코어', type: 'BASIC', hp: 100, maxHp: 100, attackDamage: 10, attackSpeed: 1000, range: 300, defense: 0, regen: 0.1, evolutionLevel: 1, color: '#00F0FF', ultName: 'OVERDRIVE', ultMax: 100, unlockCost: 0,
    description: '모든 능력이 평균적이다. 처음 시작하기 좋은 코어.'
  },
  'early-core': {
    id: 'early-core', name: '초기형 코어', type: 'BASIC', hp: 80, maxHp: 80, attackDamage: 8, attackSpeed: 1100, range: 300, defense: 0, regen: 0.1, evolutionLevel: 1, color: '#D1D5DB', ultName: 'BASIC MODE', ultMax: 80, unlockCost: 50,
    description: '특수 능력은 약하지만 기본 업그레이드 효율이 좋다.'
  },
  'amp-core': {
    id: 'amp-core', name: '증폭 코어', type: 'BASIC', hp: 90, maxHp: 90, attackDamage: 9, attackSpeed: 1000, range: 300, defense: 0, regen: 0.1, evolutionLevel: 1, color: '#4ADE80', ultName: 'RESOURCE BOOST', ultMax: 120, unlockCost: 150,
    description: '성장 입문: 코인, 경험치, 연구 보너스가 있다.'
  },
  'balance-core': {
    id: 'balance-core', name: '균형 코어', type: 'BASIC', hp: 110, maxHp: 110, attackDamage: 11, attackSpeed: 950, range: 320, defense: 2, regen: 0.2, evolutionLevel: 1, color: '#9CA3AF', ultName: 'EQUILIBRIUM', ultMax: 100, unlockCost: 200,
    description: '안정형: 공격, 방어, 경제가 모두 무난하다.'
  },

  // === ATTACK CATEGORY ===
  'battle-core': {
    id: 'battle-core', name: '전투 코어', type: 'ATTACK', hp: 80, maxHp: 80, attackDamage: 18, attackSpeed: 800, range: 350, defense: 2, regen: 0.05, evolutionLevel: 1, color: '#FF4D00', ultName: 'PLASMA BURST', ultMax: 150, unlockCost: 100,
    description: '공격력과 공격속도가 높다.'
  },
  'plasma-core': {
    id: 'plasma-core', name: '플라즈마 코어', type: 'ATTACK', hp: 70, maxHp: 70, attackDamage: 25, attackSpeed: 1200, range: 320, defense: 1, regen: 0, evolutionLevel: 1, color: '#F59E0B', ultName: 'PLASMA FIELD', ultMax: 180, unlockCost: 200,
    description: '광역 폭발: 적중 시 작은 폭발 발생'
  },
  'sniper-core': {
    id: 'sniper-core', name: '저격 코어', type: 'ATTACK', hp: 60, maxHp: 60, attackDamage: 60, attackSpeed: 2000, range: 600, defense: 0, regen: 0, evolutionLevel: 1, color: '#10B981', ultName: 'HEADSHOT', ultMax: 120, unlockCost: 250,
    description: '보스딜: 느리지만 강력한 단일 공격'
  },
  'ballistic-core': {
    id: 'ballistic-core', name: '탄도 코어', type: 'ATTACK', hp: 80, maxHp: 80, attackDamage: 15, attackSpeed: 500, range: 400, defense: 1, regen: 0.1, evolutionLevel: 1, color: '#64748B', ultName: 'BULLET HELL', ultMax: 200, unlockCost: 300,
    description: '탄막, 관통: 다중 탄환과 관통 공격'
  },
  'laser-core': {
    id: 'laser-core', name: '레이저 코어', type: 'ATTACK', hp: 85, maxHp: 85, attackDamage: 10, attackSpeed: 50, range: 500, defense: 2, regen: 0.1, evolutionLevel: 1, color: '#EF4444', ultName: 'DEATH RAY', ultMax: 200, unlockCost: 350,
    description: '지속 고화력: 한 대상을 오래 때릴수록 피해 증가'
  },
  'lightning-core': {
    id: 'lightning-core', name: '번개 코어', type: 'ATTACK', hp: 75, maxHp: 75, attackDamage: 20, attackSpeed: 900, range: 350, defense: 0, regen: 0.2, evolutionLevel: 1, color: '#FCD34D', ultName: 'CHAIN LIGHTNING', ultMax: 180, unlockCost: 350,
    description: '연쇄 공격: 공격이 주변 적에게 튕김'
  },
  'furnace-core': {
    id: 'furnace-core', name: '화염로 코어', type: 'ATTACK', hp: 100, maxHp: 100, attackDamage: 12, attackSpeed: 800, range: 250, defense: 5, regen: 0.1, evolutionLevel: 1, color: '#DC2626', ultName: 'ERUPTION', ultMax: 150, unlockCost: 400,
    description: '지속 피해: 적에게 과열 중첩 부여'
  },
  'shrapnel-core': {
    id: 'shrapnel-core', name: '파편 코어', type: 'ATTACK', hp: 70, maxHp: 70, attackDamage: 18, attackSpeed: 1000, range: 350, defense: 0, regen: 0, evolutionLevel: 1, color: '#94A3B8', ultName: 'SHATTER', ultMax: 180, unlockCost: 400,
    description: '분열탄: 적 처치 시 파편 탄환 생성'
  },
  'photon-core': {
    id: 'photon-core', name: '광자 코어', type: 'ATTACK', hp: 80, maxHp: 80, attackDamage: 22, attackSpeed: 800, range: 400, defense: 2, regen: 0.2, evolutionLevel: 1, color: '#FDE047', ultName: 'SUPERNOVA', ultMax: 220, unlockCost: 450,
    description: '빛 속성: 방어막과 암흑 적에게 강함'
  },
  'crusher-core': {
    id: 'crusher-core', name: '분쇄 코어', type: 'ATTACK', hp: 110, maxHp: 110, attackDamage: 30, attackSpeed: 1500, range: 200, defense: 5, regen: 0.1, evolutionLevel: 1, color: '#78350F', ultName: 'EARTHQUAKE', ultMax: 200, unlockCost: 500,
    description: '장갑 파괴: 방어형 적을 잘 처리함'
  },

  // === CONTROL CATEGORY ===
  'gravity-core': {
    id: 'gravity-core', name: '중력 코어', type: 'CONTROL', hp: 120, maxHp: 120, attackDamage: 6, attackSpeed: 1500, range: 250, defense: 5, regen: 0.2, evolutionLevel: 1, color: '#A855F7', ultName: 'BLACK HOLE', ultMax: 200, unlockCost: 200,
    description: '흡입: 적을 중앙으로 끌어당김'
  },
  'frost-core': {
    id: 'frost-core', name: '냉각 코어', type: 'CONTROL', hp: 100, maxHp: 100, attackDamage: 8, attackSpeed: 1200, range: 350, defense: 8, regen: 0.1, evolutionLevel: 1, color: '#3B82F6', ultName: 'BLIZZARD', ultMax: 180, unlockCost: 300,
    description: '감속, 빙결: 적 이동속도 감소'
  },
  'time-core': {
    id: 'time-core', name: '시간 코어', type: 'CONTROL', hp: 90, maxHp: 90, attackDamage: 10, attackSpeed: 1000, range: 300, defense: 2, regen: 0.1, evolutionLevel: 1, color: '#6EE7B7', ultName: 'TIME STOP', ultMax: 300, unlockCost: 350,
    description: '정지, 지연: 일정 확률로 적의 시간을 늦춤'
  },
  'resonance-core': {
    id: 'resonance-core', name: '공명 코어', type: 'CONTROL', hp: 110, maxHp: 110, attackDamage: 15, attackSpeed: 2000, range: 250, defense: 5, regen: 0.1, evolutionLevel: 1, color: '#818CF8', ultName: 'SHOCKWAVE', ultMax: 150, unlockCost: 350,
    description: '넉백: 주기적으로 충격파 발생'
  },
  'magnetic-core': {
    id: 'magnetic-core', name: '자기장 코어', type: 'CONTROL', hp: 100, maxHp: 100, attackDamage: 5, attackSpeed: 800, range: 350, defense: 8, regen: 0.1, evolutionLevel: 1, color: '#4F46E5', ultName: 'MAGNETIC FIELD', ultMax: 180, unlockCost: 400,
    description: '경로 방해: 적 탄환과 이동을 왜곡'
  },
  'rift-core': {
    id: 'rift-core', name: '균열 코어', type: 'CONTROL', hp: 80, maxHp: 80, attackDamage: 12, attackSpeed: 1100, range: 400, defense: 0, regen: 0, evolutionLevel: 1, color: '#C084FC', ultName: 'DIMENSIONAL RIFT', ultMax: 200, unlockCost: 450,
    description: '공간 왜곡: 적의 이동 경로를 비틀음'
  },
  'heavy-core': {
    id: 'heavy-core', name: '중압 코어', type: 'CONTROL', hp: 130, maxHp: 130, attackDamage: 15, attackSpeed: 1800, range: 200, defense: 10, regen: 0.2, evolutionLevel: 1, color: '#4B5563', ultName: 'CRUSHING WGHT', ultMax: 180, unlockCost: 450,
    description: '무게 증가: 빠른 적을 느리게 만들고 돌진을 약화'
  },
  'wave-core': {
    id: 'wave-core', name: '파동 코어', type: 'CONTROL', hp: 95, maxHp: 95, attackDamage: 8, attackSpeed: 1500, range: 300, defense: 4, regen: 0.1, evolutionLevel: 1, color: '#67E8F9', ultName: 'PULSE', ultMax: 160, unlockCost: 500,
    description: '주기 제어: 리듬처럼 충격파를 발생'
  },
  'sonic-core': {
    id: 'sonic-core', name: '음파 코어', type: 'CONTROL', hp: 85, maxHp: 85, attackDamage: 7, attackSpeed: 900, range: 350, defense: 2, regen: 0.1, evolutionLevel: 1, color: '#FCA5A5', ultName: 'SONIC BOOM', ultMax: 180, unlockCost: 500,
    description: '스턴: 일정 확률로 적을 기절'
  },
  'blockade-core': {
    id: 'blockade-core', name: '봉쇄 코어', type: 'CONTROL', hp: 150, maxHp: 150, attackDamage: 5, attackSpeed: 1200, range: 200, defense: 15, regen: 0.3, evolutionLevel: 1, color: '#374151', ultName: 'LOCKDOWN', ultMax: 250, unlockCost: 550,
    description: '접근 차단: 적이 코어에 가까워질수록 느려짐'
  },

  // === DEFENSE CATEGORY ===
  'guardian-core': {
    id: 'guardian-core', name: '수호 코어', type: 'DEFENSE', hp: 200, maxHp: 200, attackDamage: 8, attackSpeed: 1200, range: 250, defense: 10, regen: 0.5, evolutionLevel: 1, color: '#22C55E', ultName: 'ABSOLUTE SHIELD', ultMax: 200, unlockCost: 150,
    description: '방어 입문: 체력, 보호막, 회복 능력이 좋다.'
  },
  'barrier-core': {
    id: 'barrier-core', name: '방벽 코어', type: 'DEFENSE', hp: 250, maxHp: 250, attackDamage: 5, attackSpeed: 1500, range: 200, defense: 15, regen: 0.2, evolutionLevel: 1, color: '#14B8A6', ultName: 'AEGIS', ultMax: 250, unlockCost: 350,
    description: '보호막: 주기적으로 보호막 생성'
  },
  'reflect-core': {
    id: 'reflect-core', name: '반사 코어', type: 'DEFENSE', hp: 180, maxHp: 180, attackDamage: 3, attackSpeed: 1000, range: 200, defense: 8, regen: 0.3, evolutionLevel: 1, color: '#A3E635', ultName: 'THORNS', ultMax: 150, unlockCost: 300,
    description: '반격: 받은 피해 일부를 적에게 반사'
  },
  'armor-core': {
    id: 'armor-core', name: '장갑 코어', type: 'DEFENSE', hp: 220, maxHp: 220, attackDamage: 6, attackSpeed: 1500, range: 250, defense: 20, regen: 0.1, evolutionLevel: 1, color: '#64748B', ultName: 'FORTIFY', ultMax: 180, unlockCost: 400,
    description: '피해 감소: 일정 이하 피해 무시'
  },
  'regen-core': {
    id: 'regen-core', name: '재생 코어', type: 'DEFENSE', hp: 150, maxHp: 150, attackDamage: 5, attackSpeed: 1200, range: 250, defense: 2, regen: 2.0, evolutionLevel: 1, color: '#10B981', ultName: 'HEALING AURA', ultMax: 200, unlockCost: 400,
    description: '회복: 시간이 지날수록 체력 회복'
  },
  'citadel-core': {
    id: 'citadel-core', name: '성채 코어', type: 'DEFENSE', hp: 300, maxHp: 300, attackDamage: 4, attackSpeed: 2000, range: 300, defense: 12, regen: 0.1, evolutionLevel: 1, color: '#FCD34D', ultName: 'CITADEL', ultMax: 300, unlockCost: 450,
    description: '장기전: 웨이브가 길어질수록 방어력 증가'
  },
  'absorb-core': {
    id: 'absorb-core', name: '흡수 코어', type: 'DEFENSE', hp: 120, maxHp: 120, attackDamage: 7, attackSpeed: 1000, range: 250, defense: 5, regen: 0, evolutionLevel: 1, color: '#8B5CF6', ultName: 'ENERGY CONVERSION', ultMax: 150, unlockCost: 500,
    description: '피해 전환: 받은 피해를 궁극기 에너지로 변환'
  },
  'crystal-core': {
    id: 'crystal-core', name: '수정 코어', type: 'DEFENSE', hp: 160, maxHp: 160, attackDamage: 10, attackSpeed: 1200, range: 300, defense: 8, regen: 0, evolutionLevel: 1, color: '#6EE7B7', ultName: 'CRYSTAL BURST', ultMax: 220, unlockCost: 500,
    description: '보호막 폭발: 보호막이 깨질 때 광역 피해'
  },
  'ironwall-core': {
    id: 'ironwall-core', name: '철벽 코어', type: 'DEFENSE', hp: 280, maxHp: 280, attackDamage: 2, attackSpeed: 2000, range: 150, defense: 25, regen: 0.2, evolutionLevel: 1, color: '#374151', ultName: 'IRON WALL', ultMax: 250, unlockCost: 550,
    description: '접근 저지: 코어 근처 적에게 피해 감소 디버프'
  },
  'life-core': {
    id: 'life-core', name: '생명 코어', type: 'DEFENSE', hp: 130, maxHp: 130, attackDamage: 8, attackSpeed: 1000, range: 300, defense: 3, regen: 0.5, evolutionLevel: 1, color: '#F43F5E', ultName: 'LIFE BLOOM', ultMax: 180, unlockCost: 600,
    description: '회복 특화: 적 처치 시 체력 회복'
  },
  'indomitable-core': {
    id: 'indomitable-core', name: '불굴 코어', type: 'DEFENSE', hp: 180, maxHp: 180, attackDamage: 12, attackSpeed: 1500, range: 250, defense: 5, regen: 0.1, evolutionLevel: 1, color: '#9F1239', ultName: 'LAST STAND', ultMax: 200, unlockCost: 650,
    description: '위기 생존: 체력이 낮을수록 방어력 증가'
  },

  // === SUMMON CATEGORY ===
  'orbital-core': {
    id: 'orbital-core', name: '오비탈 코어', type: 'SUMMON', hp: 90, maxHp: 90, attackDamage: 4, attackSpeed: 800, range: 400, defense: 2, regen: 0.1, evolutionLevel: 1, color: '#EC4899', ultName: 'ORBITAL STRIKE', ultMax: 180, unlockCost: 300,
    description: '위성 강화: 궤도 모듈 회전속도 증가'
  },
  'drone-core': {
    id: 'drone-core', name: '드론 코어', type: 'SUMMON', hp: 80, maxHp: 80, attackDamage: 6, attackSpeed: 1000, range: 450, defense: 1, regen: 0.1, evolutionLevel: 1, color: '#8B5CF6', ultName: 'DRONE SWARM', ultMax: 200, unlockCost: 400,
    description: '자동 추적: 드론이 적을 추적 공격'
  },
  'nano-core': {
    id: 'nano-core', name: '나노 코어', type: 'SUMMON', hp: 70, maxHp: 70, attackDamage: 2, attackSpeed: 500, range: 200, defense: 0, regen: 0.2, evolutionLevel: 1, color: '#34D399', ultName: 'NANO SWARM', ultMax: 150, unlockCost: 450,
    description: '미세 유닛: 나노봇이 적을 갉아먹음'
  },
  'turret-core': {
    id: 'turret-core', name: '포탑 매트릭스 코어', type: 'SUMMON', hp: 100, maxHp: 100, attackDamage: 5, attackSpeed: 1500, range: 350, defense: 5, regen: 0, evolutionLevel: 1, color: '#F97316', ultName: 'TURRET DEPLOY', ultMax: 250, unlockCost: 500,
    description: '임시 포탑: 일정 시간마다 소형 포탑 생성'
  },
  'swarm-core': {
    id: 'swarm-core', name: '군집 코어', type: 'SUMMON', hp: 85, maxHp: 85, attackDamage: 3, attackSpeed: 900, range: 400, defense: 0, regen: 0.1, evolutionLevel: 1, color: '#D946EF', ultName: 'SWARM TACTIC', ultMax: 180, unlockCost: 500,
    description: '소환체 대량화: 처치 시 작은 드론 생성'
  },
  'watcher-core': {
    id: 'watcher-core', name: '감시자 코어', type: 'SUMMON', hp: 95, maxHp: 95, attackDamage: 12, attackSpeed: 1200, range: 500, defense: 2, regen: 0.1, evolutionLevel: 1, color: '#38BDF8', ultName: 'TARGET LOCK', ultMax: 200, unlockCost: 550,
    description: '정밀 타격: 드론이 엘리트와 보스를 우선 공격'
  },
  'satellite-core': {
    id: 'satellite-core', name: '위성 코어', type: 'SUMMON', hp: 110, maxHp: 110, attackDamage: 2, attackSpeed: 2000, range: 300, defense: 10, regen: 0.1, evolutionLevel: 1, color: '#93C5FD', ultName: 'SATELLITE BEAM', ultMax: 220, unlockCost: 600,
    description: '궤도 무기: 코어 주변 무기가 주력 피해원'
  },
  'hive-core': {
    id: 'hive-core', name: '벌집 코어', type: 'SUMMON', hp: 120, maxHp: 120, attackDamage: 2, attackSpeed: 600, range: 450, defense: 2, regen: 0.3, evolutionLevel: 1, color: '#FDE047', ultName: 'HIVE MIND', ultMax: 300, unlockCost: 650,
    description: '물량 소환: 작은 유닛을 끊임없이 생성'
  },
  'machine-core': {
    id: 'machine-core', name: '기계 코어', type: 'SUMMON', hp: 130, maxHp: 130, attackDamage: 8, attackSpeed: 1000, range: 300, defense: 5, regen: 0.1, evolutionLevel: 1, color: '#9CA3AF', ultName: 'MECHANIZE', ultMax: 250, unlockCost: 650,
    description: '장치 중심: 자동 장치와 포탑 효율 증가'
  },
  'replica-core': {
    id: 'replica-core', name: '복제체 코어', type: 'SUMMON', hp: 100, maxHp: 100, attackDamage: 10, attackSpeed: 1200, range: 350, defense: 2, regen: 0, evolutionLevel: 1, color: '#C084FC', ultName: 'CLONE JUTSU', ultMax: 300, unlockCost: 700,
    description: '분신 생성: 일정 시간마다 단기 복제체 생성'
  },

  // === ECONOMIC CATEGORY ===
  'greed-core': {
    id: 'greed-core', name: '탐욕 코어', type: 'ECONOMIC', hp: 80, maxHp: 80, attackDamage: 12, attackSpeed: 900, range: 300, defense: 0, regen: 0, evolutionLevel: 1, color: '#EAB308', ultName: 'GOLDEN SHOWER', ultMax: 150, unlockCost: 200,
    description: '코인 획득: 보상이 크지만 적도 강해짐'
  },
  'merchant-core': {
    id: 'merchant-core', name: '상인 코어', type: 'ECONOMIC', hp: 90, maxHp: 90, attackDamage: 10, attackSpeed: 1000, range: 300, defense: 0, regen: 0, evolutionLevel: 1, color: '#FCD34D', ultName: 'BLACK MARKET', ultMax: 200, unlockCost: 350,
    description: '선택지 강화: 업그레이드 선택지 수 증가'
  },
  'harvest-core': {
    id: 'harvest-core', name: '수확 코어', type: 'ECONOMIC', hp: 85, maxHp: 85, attackDamage: 12, attackSpeed: 1100, range: 320, defense: 2, regen: 0.1, evolutionLevel: 1, color: '#84CC16', ultName: 'BOUNTY', ultMax: 180, unlockCost: 400,
    description: '보스 보상: 엘리트와 보스 처치 보상 증가'
  },
  'alchemy-core': {
    id: 'alchemy-core', name: '연금 코어', type: 'ECONOMIC', hp: 100, maxHp: 100, attackDamage: 8, attackSpeed: 1200, range: 250, defense: 2, regen: 0.2, evolutionLevel: 1, color: '#D946EF', ultName: 'TRANSMUTATION', ultMax: 220, unlockCost: 450,
    description: '자원 교환: 체력, 보호막, 코인을 전환'
  },
  'contract-core': {
    id: 'contract-core', name: '계약 코어', type: 'ECONOMIC', hp: 70, maxHp: 70, attackDamage: 15, attackSpeed: 900, range: 350, defense: 0, regen: 0, evolutionLevel: 1, color: '#1F2937', ultName: 'BLOOD CONTRACT', ultMax: 200, unlockCost: 500,
    description: '조건부: 스스로 페널티를 걸고 보상 획득'
  },
  'gamble-core': {
    id: 'gamble-core', name: '도박 코어', type: 'ECONOMIC', hp: 90, maxHp: 90, attackDamage: 10, attackSpeed: 1000, range: 300, defense: 0, regen: 0.1, evolutionLevel: 1, color: '#F43F5E', ultName: 'JACKPOT', ultMax: 250, unlockCost: 500,
    description: '운빨: 웨이브마다 랜덤 보너스 또는 페널티'
  },
  'mining-core': {
    id: 'mining-core', name: '채굴 코어', type: 'ECONOMIC', hp: 120, maxHp: 120, attackDamage: 6, attackSpeed: 1500, range: 200, defense: 8, regen: 0.1, evolutionLevel: 1, color: '#B45309', ultName: 'DEEP DRILL', ultMax: 200, unlockCost: 550,
    description: '시간 비례: 오래 살아남을수록 보상 증가'
  },
  'golden-core': {
    id: 'golden-core', name: '황금 코어', type: 'ECONOMIC', hp: 50, maxHp: 50, attackDamage: 5, attackSpeed: 2000, range: 200, defense: 0, regen: 0, evolutionLevel: 1, color: '#FEF08A', ultName: 'MIDAS TOUCH', ultMax: 300, unlockCost: 600,
    description: '순수 재화: 전투력은 낮지만 재화 획득량 폭발'
  },
  'tax-core': {
    id: 'tax-core', name: '세금 코어', type: 'ECONOMIC', hp: 100, maxHp: 100, attackDamage: 9, attackSpeed: 1000, range: 300, defense: 5, regen: 0.1, evolutionLevel: 1, color: '#3B82F6', ultName: 'TAX EVASION', ultMax: 250, unlockCost: 600,
    description: '저축: 일정 웨이브마다 대량 보상'
  },
  'tribute-core': {
    id: 'tribute-core', name: '공물 코어', type: 'ECONOMIC', hp: 80, maxHp: 80, attackDamage: 10, attackSpeed: 1100, range: 350, defense: 0, regen: 0, evolutionLevel: 1, color: '#991B1B', ultName: 'SACRIFICE', ultMax: 180, unlockCost: 650,
    description: '희생 보상: 일부 능력을 희생해 특수 재화 획득'
  },

  // === SPECIAL CATEGORY ===
  'overheat-core': {
    id: 'overheat-core', name: '과열 코어', type: 'SPECIAL', hp: 150, maxHp: 150, attackDamage: 20, attackSpeed: 500, range: 300, defense: 0, regen: -0.5, evolutionLevel: 1, color: '#EF4444', ultName: 'MELTDOWN', ultMax: 200, unlockCost: 500,
    description: '과열: 시간이 지날수록 공격력 증가, 체력 감소'
  },
  'bloodstone-core': {
    id: 'bloodstone-core', name: '혈석 코어', type: 'SPECIAL', hp: 100, maxHp: 100, attackDamage: 15, attackSpeed: 1000, range: 300, defense: 0, regen: 0, evolutionLevel: 1, color: '#991B1B', ultName: 'BLOOD DRAIN', ultMax: 200, unlockCost: 600,
    description: '흡혈: 피해 일부를 체력으로 회복'
  },
  'berserker-core': {
    id: 'berserker-core', name: '광전 코어', type: 'SPECIAL', hp: 200, maxHp: 200, attackDamage: 10, attackSpeed: 1000, range: 250, defense: 0, regen: 0, evolutionLevel: 1, color: '#BE123C', ultName: 'BERSERK', ultMax: 150, unlockCost: 650,
    description: '저체력 폭딜: 체력이 낮을수록 강해짐'
  },
  'silence-core': {
    id: 'silence-core', name: '침묵 코어', type: 'SPECIAL', hp: 120, maxHp: 120, attackDamage: 25, attackSpeed: 800, range: 350, defense: 5, regen: 0.1, evolutionLevel: 1, color: '#9CA3AF', ultName: 'SILENCE CAUGHT', ultMax: 10000, unlockCost: 700,
    description: '궁극기 불가: 매력적인 기본 능력을 가짐'
  },
  'curse-core': {
    id: 'curse-core', name: '저주 코어', type: 'SPECIAL', hp: 90, maxHp: 90, attackDamage: 8, attackSpeed: 1000, range: 400, defense: 0, regen: 0.1, evolutionLevel: 1, color: '#6B21A8', ultName: 'DOOM', ultMax: 200, unlockCost: 750,
    description: '디버프: 적에게 약화, 부식, 취약 부여'
  },
  'prism-core': {
    id: 'prism-core', name: '프리즘 코어', type: 'SPECIAL', hp: 100, maxHp: 100, attackDamage: 10, attackSpeed: 1000, range: 300, defense: 2, regen: 0.1, evolutionLevel: 1, color: '#38BDF8', ultName: 'PRISM BURST', ultMax: 180, unlockCost: 800,
    description: '속성 변화: 공격 속성이 무작위로 계속 바뀜'
  },
  'copy-core': {
    id: 'copy-core', name: '복제 코어', type: 'SPECIAL', hp: 85, maxHp: 85, attackDamage: 9, attackSpeed: 1000, range: 320, defense: 1, regen: 0.1, evolutionLevel: 1, color: '#A78BFA', ultName: 'MIMIC', ultMax: 250, unlockCost: 850,
    description: '효과 복제: 발동된 효과를 일정 확률로 한 번 더 발동'
  },
  'chaos-core': {
    id: 'chaos-core', name: '혼돈 코어', type: 'SPECIAL', hp: 100, maxHp: 100, attackDamage: 10, attackSpeed: 1000, range: 300, defense: 0, regen: 0, evolutionLevel: 1, color: '#F43F5E', ultName: 'CHAOS', ultMax: 200, unlockCost: 900,
    description: '무작위: 매 웨이브마다 스탯이 변함'
  },
  'order-core': {
    id: 'order-core', name: '질서 코어', type: 'SPECIAL', hp: 110, maxHp: 110, attackDamage: 12, attackSpeed: 1000, range: 300, defense: 5, regen: 0.1, evolutionLevel: 1, color: '#0EA5E9', ultName: 'ABSOLUTE ORDER', ultMax: 200, unlockCost: 900,
    description: '안정화: 무작위 효과를 제거하고 고정 수치 얻음'
  },
  'forbidden-core': {
    id: 'forbidden-core', name: '금단 코어', type: 'SPECIAL', hp: 50, maxHp: 50, attackDamage: 30, attackSpeed: 500, range: 400, defense: -10, regen: -1.0, evolutionLevel: 1, color: '#4C1D95', ultName: 'FORBIDDEN ART', ultMax: 300, unlockCost: 999,
    description: '하이 리스크: 강한 페널티와 엄청난 파괴력'
  },

  // === HIDDEN CATEGORY ===
  'singularity-core': {
    id: 'singularity-core', name: '특이점 코어', type: 'HIDDEN', hp: 1000, maxHp: 1000, attackDamage: 50, attackSpeed: 1000, range: 400, defense: 20, regen: 1.0, evolutionLevel: 1, color: '#000000', ultName: 'EVENT HORIZON', ultMax: 400, unlockCost: 9999, baseCoreId: 'gravity-core', evolutionCondition: '블랙홀 잔재 유물 보유',
    description: '블랙홀, 중력, 시간: 적 처치 시 소형 블랙홀 생성'
  },
  'void-core': {
    id: 'void-core', name: '공허 코어', type: 'HIDDEN', hp: 500, maxHp: 500, attackDamage: 20, attackSpeed: 800, range: 350, defense: 0, regen: 0, evolutionLevel: 1, color: '#171717', ultName: 'VOID EAT', ultMax: 300, unlockCost: 9999,
    description: '즉사: 보스를 제외한 적을 일정 확률로 즉시 체력 소멸'
  },
  'paradox-core': {
    id: 'paradox-core', name: '역설 코어', type: 'HIDDEN', hp: 600, maxHp: 600, attackDamage: 25, attackSpeed: 1000, range: 400, defense: 10, regen: 0.5, evolutionLevel: 1, color: '#A21CAF', ultName: 'TIME REWIND', ultMax: 500, unlockCost: 9999,
    description: '시간 역행: 사망 시 1회 시간을 되돌려 부활'
  },
  'eclipse-core': {
    id: 'eclipse-core', name: '식월 코어', type: 'HIDDEN', hp: 800, maxHp: 800, attackDamage: 35, attackSpeed: 1200, range: 300, defense: 15, regen: 0.1, evolutionLevel: 1, color: '#F1F5F9', ultName: 'ECLIPSE', ultMax: 350, unlockCost: 9999,
    description: '순환: 주기적으로 공격태세와 방어태세가 바뀜'
  },
  'genesis-core': {
    id: 'genesis-core', name: '창세 코어', type: 'HIDDEN', hp: 700, maxHp: 700, attackDamage: 15, attackSpeed: 1500, range: 450, defense: 20, regen: 1.0, evolutionLevel: 1, color: '#FEF08A', ultName: 'CREATION', ultMax: 400, unlockCost: 9999,
    description: '창조: 웨이브마다 무작위 위성을 영구적으로 하나 얻음'
  },
  'abyss-core': {
    id: 'abyss-core', name: '심연 코어', type: 'HIDDEN', hp: 900, maxHp: 900, attackDamage: 40, attackSpeed: 900, range: 350, defense: 30, regen: -0.2, evolutionLevel: 1, color: '#111827', ultName: 'ABYSSAL GAZE', ultMax: 300, unlockCost: 9999,
    description: '적응: 적이 강해질수록 자신의 스탯도 비례해 증가'
  },
  'nameless-core': {
    id: 'nameless-core', name: '무명 코어', type: 'HIDDEN', hp: 300, maxHp: 300, attackDamage: 10, attackSpeed: 1000, range: 300, defense: 0, regen: 0, evolutionLevel: 1, color: '#D4D4D8', ultName: 'ADAPTION', ultMax: 200, unlockCost: 9999,
    description: '변환: 장착한 모듈의 속성에 따라 기본 능력 형태가 변형'
  },
  'omega-core': {
    id: 'omega-core', name: '오메가 코어', type: 'HIDDEN', hp: 888, maxHp: 888, attackDamage: 22, attackSpeed: 1111, range: 444, defense: 11, regen: 0.8, evolutionLevel: 1, color: '#B91C1C', ultName: 'OMEGA BEAM', ultMax: 444, unlockCost: 9999,
    description: '통합: 다른 모든 코어의 능력을 매우 약한 상태로 한 번에 가짐'
  },
  'collapse-core': {
    id: 'collapse-core', name: '붕괴 코어', type: 'HIDDEN', hp: 500, maxHp: 500, attackDamage: 100, attackSpeed: 2000, range: 500, defense: 0, regen: -2.0, evolutionLevel: 1, color: '#B91C1C', ultName: 'TOTAL COLLAPSE', ultMax: 500, unlockCost: 9999,
    description: '시한부 폭광: 극도의 대미지를 가하지만 체력이 매우 빠르게 소모됨'
  },
  'mirror-core': {
    id: 'mirror-core', name: '거울 코어', type: 'HIDDEN', hp: 600, maxHp: 600, attackDamage: 20, attackSpeed: 1000, range: 300, defense: 10, regen: 0.2, evolutionLevel: 1, color: '#E0F2FE', ultName: 'REFLECTION', ultMax: 250, unlockCost: 9999,
    description: '반사 투영: 적의 패턴이나 엘리트 능력을 복사해 되돌림'
  },
  'judgment-core': {
    id: 'judgment-core', name: '심판 코어', type: 'HIDDEN', hp: 777, maxHp: 777, attackDamage: 33, attackSpeed: 800, range: 400, defense: 15, regen: 0.5, evolutionLevel: 1, color: '#FCD34D', ultName: 'EXECUTION', ultMax: 300, unlockCost: 9999,
    description: '절대 처형: 체력이 일정 비율 이하인 엘리트를 즉사'
  },
  'eternity-core': {
    id: 'eternity-core', name: '영겁 코어', type: 'HIDDEN', hp: 1200, maxHp: 1200, attackDamage: 10, attackSpeed: 1500, range: 350, defense: 50, regen: 5.0, evolutionLevel: 1, color: '#047857', ultName: 'TIMESTOP', ultMax: 600, unlockCost: 9999,
    description: '불멸: 웨이브가 지날수록 최대체력과 방어력이 기하급수적으로 증가'
  },
  
  // === EVOLUTION CORES ===
  // ATTACK
  'explosion-core': {
    id: 'explosion-core', name: '폭열 코어', type: 'ATTACK', hp: 120, maxHp: 120, attackDamage: 30, attackSpeed: 1000, range: 350, defense: 2, regen: 0.1, evolutionLevel: 2, color: '#F97316', ultName: 'EXPLOSION', ultMax: 200, unlockCost: 1000, baseCoreId: 'plasma-core', evolutionCondition: '...',
    description: '폭발 범위 증가 (진화 코어)'
  },
  'fusion-core': {
    id: 'fusion-core', name: '핵융합 코어', type: 'ATTACK', hp: 130, maxHp: 130, attackDamage: 35, attackSpeed: 1100, range: 350, defense: 3, regen: 0, evolutionLevel: 2, color: '#EF4444', ultName: 'FUSION', ultMax: 250, unlockCost: 1000, baseCoreId: 'plasma-core', evolutionCondition: '...',
    description: '적중할수록 열 중첩 (진화 코어)'
  },
  'supernova-core': {
    id: 'supernova-core', name: '초신성 코어', type: 'ATTACK', hp: 150, maxHp: 150, attackDamage: 40, attackSpeed: 1000, range: 350, defense: 5, regen: 0, evolutionLevel: 2, color: '#FCD34D', ultName: 'SUPERNOVA EXTREME', ultMax: 300, unlockCost: 1000, baseCoreId: 'plasma-core', evolutionCondition: 'Lv10 플라즈마 코어 & 보스 처치',
    description: '일정 처치마다 화면 전체 폭발 (진화 코어)'
  },
  'piercing-core': {
    id: 'piercing-core', name: '관통포 코어', type: 'ATTACK', hp: 100, maxHp: 100, attackDamage: 25, attackSpeed: 600, range: 450, defense: 2, regen: 0.1, evolutionLevel: 2, color: '#475569', ultName: 'PIERCING SHOT', ultMax: 200, unlockCost: 1000, baseCoreId: 'ballistic-core', evolutionCondition: '...',
    description: '탄환이 여러 적 관통 (진화 코어)'
  },
  'shotgun-core': {
    id: 'shotgun-core', name: '산탄 코어', type: 'ATTACK', hp: 110, maxHp: 110, attackDamage: 15, attackSpeed: 800, range: 250, defense: 3, regen: 0.1, evolutionLevel: 2, color: '#64748B', ultName: 'SHOTGUN', ultMax: 180, unlockCost: 1000, baseCoreId: 'ballistic-core', evolutionCondition: '...',
    description: '가까운 적에게 다중 탄환 (진화 코어)'
  },
  'sniper-evo-core': {
    id: 'sniper-evo-core', name: '저격 코어', type: 'ATTACK', hp: 80, maxHp: 80, attackDamage: 100, attackSpeed: 2500, range: 700, defense: 1, regen: 0, evolutionLevel: 2, color: '#059669', ultName: 'ASSASSINATION', ultMax: 150, unlockCost: 1000, baseCoreId: 'ballistic-core', evolutionCondition: '...',
    description: '보스와 엘리트에게 큰 피해 (진화 코어)'
  },
  'cutting-core': {
    id: 'cutting-core', name: '절단광 코어', type: 'ATTACK', hp: 90, maxHp: 90, attackDamage: 15, attackSpeed: 50, range: 550, defense: 2, regen: 0.1, evolutionLevel: 2, color: '#B91C1C', ultName: 'CUTTING BEAM', ultMax: 220, unlockCost: 1000, baseCoreId: 'laser-core', evolutionCondition: '...',
    description: '레이저가 방어력 일부 무시 (진화 코어)'
  },
  'prism-evo-core': {
    id: 'prism-evo-core', name: '프리즘 코어', type: 'ATTACK', hp: 95, maxHp: 95, attackDamage: 12, attackSpeed: 50, range: 500, defense: 2, regen: 0.1, evolutionLevel: 2, color: '#7DD3FC', ultName: 'PRISM SPLIT', ultMax: 220, unlockCost: 1000, baseCoreId: 'laser-core', evolutionCondition: '...',
    description: '레이저가 여러 갈래로 분산 (진화 코어)'
  },
  'sun-spear-core': {
    id: 'sun-spear-core', name: '태양창 코어', type: 'ATTACK', hp: 100, maxHp: 100, attackDamage: 150, attackSpeed: 3000, range: 600, defense: 3, regen: 0.1, evolutionLevel: 2, color: '#FEF08A', ultName: 'SUN SPEAR', ultMax: 300, unlockCost: 1000, baseCoreId: 'laser-core', evolutionCondition: '...',
    description: '긴 충전 후 초고화력 일격 (진화 코어)'
  },
  'chain-storm-core': {
    id: 'chain-storm-core', name: '연쇄폭풍 코어', type: 'ATTACK', hp: 90, maxHp: 90, attackDamage: 25, attackSpeed: 900, range: 400, defense: 1, regen: 0.2, evolutionLevel: 2, color: '#FDE047', ultName: 'CHAIN STORM', ultMax: 200, unlockCost: 1000, baseCoreId: 'lightning-core', evolutionCondition: '...',
    description: '번개 전이 횟수 증가 (진화 코어)'
  },
  'ion-core': {
    id: 'ion-core', name: '이온 코어', type: 'ATTACK', hp: 95, maxHp: 95, attackDamage: 22, attackSpeed: 800, range: 350, defense: 2, regen: 0.2, evolutionLevel: 2, color: '#38BDF8', ultName: 'ION BLAST', ultMax: 200, unlockCost: 1000, baseCoreId: 'lightning-core', evolutionCondition: '...',
    description: '보호막과 방어력 제거 (진화 코어)'
  },
  'smite-core': {
    id: 'smite-core', name: '천벌 코어', type: 'ATTACK', hp: 100, maxHp: 100, attackDamage: 30, attackSpeed: 1000, range: 400, defense: 3, regen: 0.2, evolutionLevel: 2, color: '#F59E0B', ultName: 'DIVINE SMITE', ultMax: 250, unlockCost: 1000, baseCoreId: 'lightning-core', evolutionCondition: '...',
    description: '체력 낮은 적에게 추가 번개 (진화 코어)'
  },
  'volcano-core': {
    id: 'volcano-core', name: '화산 코어', type: 'ATTACK', hp: 120, maxHp: 120, attackDamage: 18, attackSpeed: 800, range: 300, defense: 6, regen: 0.1, evolutionLevel: 2, color: '#991B1B', ultName: 'VOLCANIC ASH', ultMax: 180, unlockCost: 1000, baseCoreId: 'furnace-core', evolutionCondition: '...',
    description: '화염 장판 생성 (진화 코어)'
  },
  'furnace-evo-core': {
    id: 'furnace-evo-core', name: '용광로 코어', type: 'ATTACK', hp: 130, maxHp: 130, attackDamage: 15, attackSpeed: 700, range: 250, defense: 8, regen: 0.1, evolutionLevel: 2, color: '#B91C1C', ultName: 'MELTDOWN', ultMax: 200, unlockCost: 1000, baseCoreId: 'furnace-core', evolutionCondition: '...',
    description: '적을 녹여 방어력 감소 (진화 코어)'
  },
  'blaze-core': {
    id: 'blaze-core', name: '홍염 코어', type: 'ATTACK', hp: 110, maxHp: 110, attackDamage: 22, attackSpeed: 900, range: 350, defense: 4, regen: 0.1, evolutionLevel: 2, color: '#EF4444', ultName: 'CRIMSON BLAZE', ultMax: 220, unlockCost: 1000, baseCoreId: 'furnace-core', evolutionCondition: '...',
    description: '처치 시 화염 폭발 전파 (진화 코어)'
  },

  // CONTROL
  'compress-core': {
    id: 'compress-core', name: '압축 코어', type: 'CONTROL', hp: 140, maxHp: 140, attackDamage: 8, attackSpeed: 1500, range: 300, defense: 8, regen: 0.2, evolutionLevel: 2, color: '#9333EA', ultName: 'COMPRESS', ultMax: 220, unlockCost: 1000, baseCoreId: 'gravity-core', evolutionCondition: '...',
    description: '적을 좁은 범위로 강하게 모음 (진화 코어)'
  },
  'orbital-collapse-core': {
    id: 'orbital-collapse-core', name: '궤도붕괴 코어', type: 'CONTROL', hp: 200, maxHp: 200, attackDamage: 10, attackSpeed: 1200, range: 400, defense: 10, regen: 0.5, evolutionLevel: 2, color: '#60A5FA', ultName: 'ORBITAL COLLAPSE', ultMax: 250, unlockCost: 1000, baseCoreId: 'gravity-core', evolutionCondition: '특정 웨이브 도달',
    description: '위성 모듈과 중력 효과 시너지 (진화 코어)'
  },
  'singularity-evo-core': {
    id: 'singularity-evo-core', name: '특이점 코어', type: 'CONTROL', hp: 150, maxHp: 150, attackDamage: 12, attackSpeed: 1200, range: 350, defense: 10, regen: 0.3, evolutionLevel: 2, color: '#000000', ultName: 'EVENT HORIZON', ultMax: 280, unlockCost: 1000, baseCoreId: 'gravity-core', evolutionCondition: '히든 진화, 블랙홀 생성',
    description: '블랙홀 생성 (히든 진화 코어)'
  },
  'freeze-core': {
    id: 'freeze-core', name: '빙결 코어', type: 'CONTROL', hp: 120, maxHp: 120, attackDamage: 10, attackSpeed: 1200, range: 400, defense: 10, regen: 0.1, evolutionLevel: 2, color: '#60A5FA', ultName: 'DEEP FREEZE', ultMax: 200, unlockCost: 1000, baseCoreId: 'frost-core', evolutionCondition: '...',
    description: '적을 완전히 정지 (진화 코어)'
  },
  'absolute-zero-core': {
    id: 'absolute-zero-core', name: '절대영도 코어', type: 'CONTROL', hp: 110, maxHp: 110, attackDamage: 8, attackSpeed: 1500, range: 500, defense: 12, regen: 0.1, evolutionLevel: 2, color: '#93C5FD', ultName: 'ABSOLUTE ZERO', ultMax: 250, unlockCost: 1000, baseCoreId: 'frost-core', evolutionCondition: '...',
    description: '화면 전체 감속장 (진화 코어)'
  },
  'shatter-core': {
    id: 'shatter-core', name: '파쇄 코어', type: 'CONTROL', hp: 130, maxHp: 130, attackDamage: 15, attackSpeed: 1000, range: 350, defense: 8, regen: 0.1, evolutionLevel: 2, color: '#38BDF8', ultName: 'SHATTER STORM', ultMax: 220, unlockCost: 1000, baseCoreId: 'frost-core', evolutionCondition: '...',
    description: '얼어붙은 적 추가 폭발 (진화 코어)'
  },
  'stasis-core': {
    id: 'stasis-core', name: '정지장 코어', type: 'CONTROL', hp: 110, maxHp: 110, attackDamage: 12, attackSpeed: 1000, range: 350, defense: 4, regen: 0.1, evolutionLevel: 2, color: '#34D399', ultName: 'STASIS FIELD', ultMax: 250, unlockCost: 1000, baseCoreId: 'time-core', evolutionCondition: '...',
    description: '적을 일정 시간 완전 정지 (진화 코어)'
  },
  'accel-core': {
    id: 'accel-core', name: '가속 코어', type: 'CONTROL', hp: 100, maxHp: 100, attackDamage: 15, attackSpeed: 500, range: 350, defense: 3, regen: 0.1, evolutionLevel: 2, color: '#10B981', ultName: 'ACCELERATION', ultMax: 200, unlockCost: 1000, baseCoreId: 'time-core', evolutionCondition: '...',
    description: '내 공격과 쿨다운 가속 (진화 코어)'
  },
  'paradox-evo-core': {
    id: 'paradox-evo-core', name: '역설 코어', type: 'CONTROL', hp: 120, maxHp: 120, attackDamage: 14, attackSpeed: 1000, range: 350, defense: 5, regen: 0.2, evolutionLevel: 2, color: '#A21CAF', ultName: 'REWIND', ultMax: 300, unlockCost: 1000, baseCoreId: 'time-core', evolutionCondition: '히든 진화, 사망 시 되감기',
    description: '사망 시 되감기 (히든 진화 코어)'
  },
  'shockwave-core': {
    id: 'shockwave-core', name: '충격파 코어', type: 'CONTROL', hp: 130, maxHp: 130, attackDamage: 20, attackSpeed: 1800, range: 300, defense: 6, regen: 0.1, evolutionLevel: 2, color: '#6366F1', ultName: 'MASSIVE SHOCKWAVE', ultMax: 180, unlockCost: 1000, baseCoreId: 'resonance-core', evolutionCondition: '...',
    description: '주기적으로 적 밀어냄 (진화 코어)'
  },
  'vibration-core': {
    id: 'vibration-core', name: '진동 코어', type: 'CONTROL', hp: 120, maxHp: 120, attackDamage: 18, attackSpeed: 900, range: 350, defense: 5, regen: 0.1, evolutionLevel: 2, color: '#818CF8', ultName: 'VIBRATION', ultMax: 200, unlockCost: 1000, baseCoreId: 'resonance-core', evolutionCondition: '...',
    description: '같은 적을 연속 타격할수록 피해 증가 (진화 코어)'
  },
  'blockade-evo-core': {
    id: 'blockade-evo-core', name: '봉쇄 코어', type: 'CONTROL', hp: 180, maxHp: 180, attackDamage: 10, attackSpeed: 1200, range: 250, defense: 20, regen: 0.4, evolutionLevel: 2, color: '#4B5563', ultName: 'ABSOLUTE LOCKDOWN', ultMax: 280, unlockCost: 1000, baseCoreId: 'blockade-core', evolutionCondition: '...',
    description: '코어 근처 적 이동속도 급감 (진화 코어)'
  },
  'distort-core': {
    id: 'distort-core', name: '왜곡 코어', type: 'CONTROL', hp: 100, maxHp: 100, attackDamage: 15, attackSpeed: 1100, range: 450, defense: 2, regen: 0, evolutionLevel: 2, color: '#A855F7', ultName: 'DISTORTION', ultMax: 220, unlockCost: 1000, baseCoreId: 'rift-core', evolutionCondition: '...',
    description: '적 이동 경로를 강제로 비틀기 (진화 코어)'
  },
  'portal-core': {
    id: 'portal-core', name: '차원문 코어', type: 'CONTROL', hp: 110, maxHp: 110, attackDamage: 12, attackSpeed: 1000, range: 400, defense: 3, regen: 0.1, evolutionLevel: 2, color: '#C084FC', ultName: 'PORTAL', ultMax: 250, unlockCost: 1000, baseCoreId: 'rift-core', evolutionCondition: '...',
    description: '일부 적을 뒤로 되돌림 (진화 코어)'
  },
  'heavy-evo-core': {
    id: 'heavy-evo-core', name: '중압 코어', type: 'CONTROL', hp: 160, maxHp: 160, attackDamage: 20, attackSpeed: 1600, range: 250, defense: 15, regen: 0.3, evolutionLevel: 2, color: '#374151', ultName: 'CRUSHING GRAVITY', ultMax: 220, unlockCost: 1000, baseCoreId: 'heavy-core', evolutionCondition: '...',
    description: '빠른 적과 돌진 적 억제 (진화 코어)'
  },

  // DEFENSE
  'citadel-evo-core': {
    id: 'citadel-evo-core', name: '성채 코어', type: 'DEFENSE', hp: 350, maxHp: 350, attackDamage: 6, attackSpeed: 1500, range: 250, defense: 25, regen: 0.4, evolutionLevel: 2, color: '#14B8A6', ultName: 'GRAND CITADEL', ultMax: 300, unlockCost: 1000, baseCoreId: 'barrier-core', evolutionCondition: '...',
    description: '체력과 보호막 대폭 증가 (진화 코어)'
  },
  'mirror-evo-core': {
    id: 'mirror-evo-core', name: '반사거울 코어', type: 'DEFENSE', hp: 250, maxHp: 250, attackDamage: 5, attackSpeed: 1200, range: 250, defense: 12, regen: 0.5, evolutionLevel: 2, color: '#2DD4BF', ultName: 'MIRROR SHIELD', ultMax: 200, unlockCost: 1000, baseCoreId: 'barrier-core', evolutionCondition: '...',
    description: '받은 피해를 적에게 되돌림 (진화 코어)'
  },
  'immortal-core': {
    id: 'immortal-core', name: '불멸 코어', type: 'DEFENSE', hp: 300, maxHp: 300, attackDamage: 8, attackSpeed: 1400, range: 200, defense: 18, regen: 0.2, evolutionLevel: 2, color: '#0D9488', ultName: 'IMMORTALITY', ultMax: 350, unlockCost: 1000, baseCoreId: 'barrier-core', evolutionCondition: '...',
    description: '치명타 피해를 주기적으로 무효화 (진화 코어)'
  },
  'iron-star-core': {
    id: 'iron-star-core', name: '철성 코어', type: 'DEFENSE', hp: 280, maxHp: 280, attackDamage: 10, attackSpeed: 1500, range: 300, defense: 30, regen: 0.2, evolutionLevel: 2, color: '#475569', ultName: 'IRON STAR', ultMax: 250, unlockCost: 1000, baseCoreId: 'armor-core', evolutionCondition: '...',
    description: '일정 이하 피해 완전 무시 (진화 코어)'
  },
  'fortress-core': {
    id: 'fortress-core', name: '요새 코어', type: 'DEFENSE', hp: 320, maxHp: 320, attackDamage: 8, attackSpeed: 1600, range: 250, defense: 22, regen: 0.3, evolutionLevel: 2, color: '#64748B', ultName: 'FORTRESS', ultMax: 300, unlockCost: 1000, baseCoreId: 'armor-core', evolutionCondition: '...',
    description: '시간이 지날수록 방어력 증가 (진화 코어)'
  },
  'berserker-evo-core': {
    id: 'berserker-evo-core', name: '광전 코어', type: 'DEFENSE', hp: 250, maxHp: 250, attackDamage: 15, attackSpeed: 1200, range: 300, defense: 15, regen: 0.1, evolutionLevel: 2, color: '#94A3B8', ultName: 'BERSERK SHIELD', ultMax: 220, unlockCost: 1000, baseCoreId: 'armor-core', evolutionCondition: '...',
    description: '체력이 낮을수록 공격력 증가 (진화 코어)'
  },
  'convert-core': {
    id: 'convert-core', name: '전환 코어', type: 'DEFENSE', hp: 160, maxHp: 160, attackDamage: 10, attackSpeed: 1000, range: 300, defense: 8, regen: 0.1, evolutionLevel: 2, color: '#8B5CF6', ultName: 'MASS CONVERSION', ultMax: 200, unlockCost: 1000, baseCoreId: 'absorb-core', evolutionCondition: '...',
    description: '피해를 코인 또는 에너지로 전환 (진화 코어)'
  },
  'condense-core': {
    id: 'condense-core', name: '응축 코어', type: 'DEFENSE', hp: 180, maxHp: 180, attackDamage: 12, attackSpeed: 1100, range: 250, defense: 10, regen: 0.2, evolutionLevel: 2, color: '#7C3AED', ultName: 'CONDENSE BURST', ultMax: 250, unlockCost: 1000, baseCoreId: 'absorb-core', evolutionCondition: '...',
    description: '받은 피해를 저장 후 폭발 (진화 코어)'
  },
  'void-evo-core': {
    id: 'void-evo-core', name: '공허 코어', type: 'DEFENSE', hp: 150, maxHp: 150, attackDamage: 9, attackSpeed: 1000, range: 350, defense: 5, regen: 0.1, evolutionLevel: 2, color: '#4C1D95', ultName: 'VOID SHIFT', ultMax: 280, unlockCost: 1000, baseCoreId: 'absorb-core', evolutionCondition: '히든 진화, 피해 일부 소멸',
    description: '피해 일부 소멸 (히든 진화 코어)'
  },
  'resurrection-core': {
    id: 'resurrection-core', name: '재림 코어', type: 'DEFENSE', hp: 200, maxHp: 200, attackDamage: 8, attackSpeed: 1200, range: 300, defense: 5, regen: 3.0, evolutionLevel: 2, color: '#10B981', ultName: 'RESURRECTION', ultMax: 350, unlockCost: 1000, baseCoreId: 'regen-core', evolutionCondition: '...',
    description: '사망 직전 대량 회복 (진화 코어)'
  },
  'tree-of-life-core': {
    id: 'tree-of-life-core', name: '생명수 코어', type: 'DEFENSE', hp: 220, maxHp: 220, attackDamage: 10, attackSpeed: 1100, range: 350, defense: 4, regen: 2.5, evolutionLevel: 2, color: '#059669', ultName: 'TREE OF LIFE', ultMax: 250, unlockCost: 1000, baseCoreId: 'regen-core', evolutionCondition: '...',
    description: '적 처치 시 체력 회복 (진화 코어)'
  },
  'indomitable-evo-core': {
    id: 'indomitable-evo-core', name: '불굴 코어', type: 'DEFENSE', hp: 280, maxHp: 280, attackDamage: 12, attackSpeed: 1300, range: 250, defense: 18, regen: 0.5, evolutionLevel: 2, color: '#22C55E', ultName: 'FINAL STAND', ultMax: 280, unlockCost: 1000, baseCoreId: 'guardian-core', evolutionCondition: '...',
    description: '체력이 낮을수록 피해 감소 (진화 코어)'
  },
  'crystal-shield-core': {
    id: 'crystal-shield-core', name: '수정방패 코어', type: 'DEFENSE', hp: 200, maxHp: 200, attackDamage: 14, attackSpeed: 1200, range: 300, defense: 10, regen: 0.2, evolutionLevel: 2, color: '#6EE7B7', ultName: 'CRYSTAL SHIELD', ultMax: 220, unlockCost: 1000, baseCoreId: 'crystal-core', evolutionCondition: '...',
    description: '보호막 파괴 시 광역 폭발 (진화 코어)'
  },
  'sanctuary-core': {
    id: 'sanctuary-core', name: '성역 코어', type: 'DEFENSE', hp: 350, maxHp: 350, attackDamage: 5, attackSpeed: 1800, range: 350, defense: 20, regen: 1.0, evolutionLevel: 2, color: '#34D399', ultName: 'SANCTUARY', ultMax: 300, unlockCost: 1000, baseCoreId: 'guardian-core', evolutionCondition: '...',
    description: '일정 범위 안 적 공격력 감소 (진화 코어)'
  },
  'cycle-core': {
    id: 'cycle-core', name: '순환 코어', type: 'DEFENSE', hp: 240, maxHp: 240, attackDamage: 10, attackSpeed: 1100, range: 300, defense: 8, regen: 2.0, evolutionLevel: 2, color: '#10B981', ultName: 'VITAL CYCLE', ultMax: 250, unlockCost: 1000, baseCoreId: 'regen-core', evolutionCondition: '...',
    description: '보호막과 체력이 번갈아 회복 (진화 코어)'
  },

  // SUMMON
  'satellite-army': {
    id: 'satellite-army', name: '위성군단 코어', type: 'SUMMON', hp: 150, maxHp: 150, attackDamage: 8, attackSpeed: 600, range: 500, defense: 5, regen: 0.5, evolutionLevel: 2, color: '#F472B6', ultName: 'SATELLITE SWARM', ultMax: 200, unlockCost: 1000, baseCoreId: 'orbital-core', evolutionCondition: '오비탈 코어로 50웨이브 생존',
    description: '위성 개수 대폭 증가 (진화 코어)'
  },
  'planetary-ring-core': {
    id: 'planetary-ring-core', name: '행성고리 코어', type: 'SUMMON', hp: 160, maxHp: 160, attackDamage: 6, attackSpeed: 700, range: 550, defense: 6, regen: 0.4, evolutionLevel: 2, color: '#DB2777', ultName: 'PLANETARY RING', ultMax: 220, unlockCost: 1000, baseCoreId: 'orbital-core', evolutionCondition: '...',
    description: '궤도가 여러 겹으로 확장 (진화 코어)'
  },
  'orbital-cutter-core': {
    id: 'orbital-cutter-core', name: '궤도절단 코어', type: 'SUMMON', hp: 140, maxHp: 140, attackDamage: 12, attackSpeed: 500, range: 450, defense: 4, regen: 0.3, evolutionLevel: 2, color: '#BE185D', ultName: 'ORBITAL CUTTER', ultMax: 250, unlockCost: 1000, baseCoreId: 'orbital-core', evolutionCondition: '...',
    description: '위성이 칼날처럼 적 절단 (진화 코어)'
  },
  'hive-evo-core': {
    id: 'hive-evo-core', name: '하이브 코어', type: 'SUMMON', hp: 130, maxHp: 130, attackDamage: 10, attackSpeed: 900, range: 500, defense: 3, regen: 0.2, evolutionLevel: 2, color: '#8B5CF6', ultName: 'DRONE HIVE', ultMax: 200, unlockCost: 1000, baseCoreId: 'drone-core', evolutionCondition: '...',
    description: '드론 수 증가 (진화 코어)'
  },
  'watcher-evo-core': {
    id: 'watcher-evo-core', name: '감시자 코어', type: 'SUMMON', hp: 140, maxHp: 140, attackDamage: 18, attackSpeed: 1100, range: 600, defense: 4, regen: 0.2, evolutionLevel: 2, color: '#7C3AED', ultName: 'WATCHER BOTS', ultMax: 220, unlockCost: 1000, baseCoreId: 'drone-core', evolutionCondition: '...',
    description: '엘리트와 보스 우선 공격 (진화 코어)'
  },
  'suicide-bee-core': {
    id: 'suicide-bee-core', name: '자폭벌 코어', type: 'SUMMON', hp: 120, maxHp: 120, attackDamage: 15, attackSpeed: 800, range: 450, defense: 2, regen: 0.1, evolutionLevel: 2, color: '#6D28D9', ultName: 'SUICIDE SWARM', ultMax: 180, unlockCost: 1000, baseCoreId: 'drone-core', evolutionCondition: '...',
    description: '드론 만료 시 폭발 (진화 코어)'
  },
  'repair-swarm-core': {
    id: 'repair-swarm-core', name: '수리군 코어', type: 'SUMMON', hp: 110, maxHp: 110, attackDamage: 4, attackSpeed: 400, range: 300, defense: 2, regen: 0.5, evolutionLevel: 2, color: '#34D399', ultName: 'REPAIR NANOBOTS', ultMax: 160, unlockCost: 1000, baseCoreId: 'nano-core', evolutionCondition: '...',
    description: '나노봇이 코어 회복 (진화 코어)'
  },
  'deconstruct-swarm-core': {
    id: 'deconstruct-swarm-core', name: '분해군 코어', type: 'SUMMON', hp: 100, maxHp: 100, attackDamage: 6, attackSpeed: 500, range: 350, defense: 1, regen: 0.2, evolutionLevel: 2, color: '#10B981', ultName: 'DECONSTRUCT', ultMax: 200, unlockCost: 1000, baseCoreId: 'nano-core', evolutionCondition: '...',
    description: '적 방어력 감소 (진화 코어)'
  },
  'infect-swarm-core': {
    id: 'infect-swarm-core', name: '감염군 코어', type: 'SUMMON', hp: 95, maxHp: 95, attackDamage: 8, attackSpeed: 450, range: 400, defense: 0, regen: 0.1, evolutionLevel: 2, color: '#059669', ultName: 'INFECTION', ultMax: 220, unlockCost: 1000, baseCoreId: 'nano-core', evolutionCondition: '...',
    description: '처치된 적이 감염 전파 (진화 코어)'
  },
  'machine-army-core': {
    id: 'machine-army-core', name: '기계군단 코어', type: 'SUMMON', hp: 160, maxHp: 160, attackDamage: 8, attackSpeed: 1200, range: 450, defense: 8, regen: 0.1, evolutionLevel: 2, color: '#F97316', ultName: 'MACHINE ARMY', ultMax: 280, unlockCost: 1000, baseCoreId: 'turret-core', evolutionCondition: '...',
    description: '임시 포탑 다수 생성 (진화 코어)'
  },
  'artillery-net-core': {
    id: 'artillery-net-core', name: '포격망 코어', type: 'SUMMON', hp: 150, maxHp: 150, attackDamage: 15, attackSpeed: 1800, range: 500, defense: 6, regen: 0.1, evolutionLevel: 2, color: '#EA580C', ultName: 'ARTILLERY FIRE', ultMax: 300, unlockCost: 1000, baseCoreId: 'turret-core', evolutionCondition: '...',
    description: '포탑이 광역 포격 (진화 코어)'
  },
  'auto-fortress-core': {
    id: 'auto-fortress-core', name: '자동요새 코어', type: 'SUMMON', hp: 200, maxHp: 200, attackDamage: 6, attackSpeed: 1500, range: 400, defense: 15, regen: 0.3, evolutionLevel: 2, color: '#C2410C', ultName: 'AUTO FORTRESS', ultMax: 350, unlockCost: 1000, baseCoreId: 'turret-core', evolutionCondition: '...',
    description: '방어형 포탑과 공격형 포탑 동시 생성 (진화 코어)'
  },
  'replica-army-core': {
    id: 'replica-army-core', name: '복제군 코어', type: 'SUMMON', hp: 140, maxHp: 140, attackDamage: 15, attackSpeed: 1100, range: 450, defense: 4, regen: 0.1, evolutionLevel: 2, color: '#D946EF', ultName: 'MASS REPLICA', ultMax: 350, unlockCost: 1000, baseCoreId: 'replica-core', evolutionCondition: '...',
    description: '코어 복제체 생성 (진화 코어)'
  },
  'bee-swarm-core': {
    id: 'bee-swarm-core', name: '벌떼 코어', type: 'SUMMON', hp: 125, maxHp: 125, attackDamage: 5, attackSpeed: 800, range: 500, defense: 2, regen: 0.2, evolutionLevel: 2, color: '#C084FC', ultName: 'BEE SWARM', ultMax: 220, unlockCost: 1000, baseCoreId: 'swarm-core', evolutionCondition: '...',
    description: '작은 소환체 대량 생산 (진화 코어)'
  },
  'commander-core': {
    id: 'commander-core', name: '지휘관 코어', type: 'SUMMON', hp: 170, maxHp: 170, attackDamage: 10, attackSpeed: 1000, range: 400, defense: 10, regen: 0.4, evolutionLevel: 2, color: '#A855F7', ultName: 'COMMANDER AURA', ultMax: 280, unlockCost: 1000, baseCoreId: 'machine-core', evolutionCondition: '...',
    description: '모든 소환체 효율 증가 (진화 코어)'
  },

  // ECONOMIC
  'gold-evo-core': {
    id: 'gold-evo-core', name: '황금 코어', type: 'ECONOMIC', hp: 100, maxHp: 100, attackDamage: 15, attackSpeed: 1000, range: 350, defense: 0, regen: 0.1, evolutionLevel: 2, color: '#F59E0B', ultName: 'GOLD RUSH', ultMax: 200, unlockCost: 1000, baseCoreId: 'greed-core', evolutionCondition: '...',
    description: '코인 획득량 대폭 증가 (진화 코어)'
  },
  'gambler-core': {
    id: 'gambler-core', name: '도박사 코어', type: 'ECONOMIC', hp: 110, maxHp: 110, attackDamage: 18, attackSpeed: 900, range: 350, defense: 2, regen: 0.1, evolutionLevel: 2, color: '#D97706', ultName: 'HIGH ROLLER', ultMax: 250, unlockCost: 1000, baseCoreId: 'greed-core', evolutionCondition: '...',
    description: '랜덤 보상과 페널티 발생 (진화 코어)'
  },
  'crown-core': {
    id: 'crown-core', name: '왕관 코어', type: 'ECONOMIC', hp: 140, maxHp: 140, attackDamage: 20, attackSpeed: 1000, range: 400, defense: 5, regen: 0.2, evolutionLevel: 2, color: '#B45309', ultName: 'ROYAL CROWN', ultMax: 300, unlockCost: 1000, baseCoreId: 'greed-core', evolutionCondition: '...',
    description: '위험 선택지를 많이 고를수록 보상 증가 (진화 코어)'
  },
  'execution-core': {
    id: 'execution-core', name: '처형 코어', type: 'ECONOMIC', hp: 120, maxHp: 120, attackDamage: 22, attackSpeed: 1100, range: 400, defense: 3, regen: 0.1, evolutionLevel: 2, color: '#84CC16', ultName: 'EXECUTE ORDER', ultMax: 220, unlockCost: 1000, baseCoreId: 'harvest-core', evolutionCondition: '...',
    description: '체력이 낮은 적 즉시 처치 (진화 코어)'
  },
  'extractor-core': {
    id: 'extractor-core', name: '추출 코어', type: 'ECONOMIC', hp: 110, maxHp: 110, attackDamage: 15, attackSpeed: 1000, range: 350, defense: 4, regen: 0.2, evolutionLevel: 2, color: '#65A30D', ultName: 'MASS EXTRACTION', ultMax: 200, unlockCost: 1000, baseCoreId: 'harvest-core', evolutionCondition: '...',
    description: '엘리트와 보스 추가 자원 (진화 코어)'
  },
  'hunter-core': {
    id: 'hunter-core', name: '사냥꾼 코어', type: 'ECONOMIC', hp: 130, maxHp: 130, attackDamage: 25, attackSpeed: 900, range: 450, defense: 5, regen: 0.1, evolutionLevel: 2, color: '#4D7C0F', ultName: 'HUNTER MARK', ultMax: 250, unlockCost: 1000, baseCoreId: 'harvest-core', evolutionCondition: '...',
    description: '특정 적 표식 후 집중 공격 (진화 코어)'
  },
  'transmute-core': {
    id: 'transmute-core', name: '연성 코어', type: 'ECONOMIC', hp: 140, maxHp: 140, attackDamage: 12, attackSpeed: 1100, range: 300, defense: 4, regen: 0.3, evolutionLevel: 2, color: '#D946EF', ultName: 'GRAND TRANSMUTE', ultMax: 250, unlockCost: 1000, baseCoreId: 'alchemy-core', evolutionCondition: '...',
    description: '자원을 다른 자원으로 변환 (진화 코어)'
  },
  'multiply-core': {
    id: 'multiply-core', name: '증식 코어', type: 'ECONOMIC', hp: 120, maxHp: 120, attackDamage: 14, attackSpeed: 1000, range: 350, defense: 2, regen: 0.2, evolutionLevel: 2, color: '#C084FC', ultName: 'MULTIPLICATION', ultMax: 220, unlockCost: 1000, baseCoreId: 'alchemy-core', evolutionCondition: '...',
    description: '보상을 확률적으로 복제 (진화 코어)'
  },
  'tribute-evo-core': {
    id: 'tribute-evo-core', name: '공물 코어', type: 'ECONOMIC', hp: 100, maxHp: 100, attackDamage: 25, attackSpeed: 800, range: 400, defense: 0, regen: 0, evolutionLevel: 2, color: '#1F2937', ultName: 'GRAND TRIBUTE', ultMax: 250, unlockCost: 1000, baseCoreId: 'contract-core', evolutionCondition: '...',
    description: '능력 일부를 희생해 보상 증가 (진화 코어)'
  },
  'blood-contract-core': {
    id: 'blood-contract-core', name: '피의 계약 코어', type: 'ECONOMIC', hp: 80, maxHp: 80, attackDamage: 35, attackSpeed: 900, range: 350, defense: 0, regen: -0.5, evolutionLevel: 2, color: '#374151', ultName: 'BLOOD PACT', ultMax: 220, unlockCost: 1000, baseCoreId: 'contract-core', evolutionCondition: '...',
    description: '체력을 희생해 공격력 증가 (진화 코어)'
  },
  'silent-contract-core': {
    id: 'silent-contract-core', name: '침묵 계약 코어', type: 'ECONOMIC', hp: 130, maxHp: 130, attackDamage: 30, attackSpeed: 1000, range: 400, defense: 5, regen: 0.2, evolutionLevel: 2, color: '#4B5563', ultName: 'SILENCE PACT', ultMax: 10000, unlockCost: 1000, baseCoreId: 'contract-core', evolutionCondition: '...',
    description: '궁극기 봉인 대신 보상 증가 (진화 코어)'
  },
  'final-contract-core': {
    id: 'final-contract-core', name: '최후 계약 코어', type: 'ECONOMIC', hp: 150, maxHp: 150, attackDamage: 15, attackSpeed: 1200, range: 300, defense: 10, regen: 0, evolutionLevel: 2, color: '#111827', ultName: 'FINAL PACT', ultMax: 300, unlockCost: 1000, baseCoreId: 'contract-core', evolutionCondition: '...',
    description: '죽음에 가까울수록 보상 증가 (진화 코어)'
  },

  // SPECIAL
  'rampage-core': {
    id: 'rampage-core', name: '폭주 코어', type: 'SPECIAL', hp: 200, maxHp: 200, attackDamage: 30, attackSpeed: 400, range: 350, defense: 0, regen: -1.0, evolutionLevel: 2, color: '#EF4444', ultName: 'RAMPAGE', ultMax: 250, unlockCost: 1000, baseCoreId: 'overheat-core', evolutionCondition: '...',
    description: '시간이 지날수록 공격력 급상승 (진화 코어)'
  },
  'collapse-evo-core': {
    id: 'collapse-evo-core', name: '붕괴 코어', type: 'SPECIAL', hp: 180, maxHp: 180, attackDamage: 40, attackSpeed: 500, range: 400, defense: 2, regen: -0.5, evolutionLevel: 2, color: '#DC2626', ultName: 'FINAL COLLAPSE', ultMax: 280, unlockCost: 1000, baseCoreId: 'overheat-core', evolutionCondition: '...',
    description: '강력하지만 붕괴 게이지 관리 필요 (진화 코어)'
  },
  'vampire-core': {
    id: 'vampire-core', name: '흡혈 코어', type: 'SPECIAL', hp: 140, maxHp: 140, attackDamage: 25, attackSpeed: 900, range: 350, defense: 2, regen: 0, evolutionLevel: 2, color: '#991B1B', ultName: 'VAMPIRE LORD', ultMax: 250, unlockCost: 1000, baseCoreId: 'bloodstone-core', evolutionCondition: '...',
    description: '공격 피해 일부 회복 (진화 코어)'
  },
  'blood-throne-core': {
    id: 'blood-throne-core', name: '피의 왕좌 코어', type: 'SPECIAL', hp: 300, maxHp: 300, attackDamage: 20, attackSpeed: 1200, range: 400, defense: 10, regen: 1.0, evolutionLevel: 2, color: '#7F1D1D', ultName: 'BLOOD STORM', ultMax: 300, unlockCost: 1000, baseCoreId: 'bloodstone-core', evolutionCondition: '...',
    description: '체력을 소모해 광역 공격 (진화 코어)'
  },
  'silent-heart-core': {
    id: 'silent-heart-core', name: '침묵 심장 코어', type: 'SPECIAL', hp: 180, maxHp: 180, attackDamage: 45, attackSpeed: 700, range: 450, defense: 10, regen: 0.3, evolutionLevel: 2, color: '#9CA3AF', ultName: 'SILENT HEART', ultMax: 10000, unlockCost: 1000, baseCoreId: 'silence-core', evolutionCondition: '...',
    description: '궁극기 없이 기본 공격 극대화 (진화 코어)'
  },
  'forbidden-evo-core': {
    id: 'forbidden-evo-core', name: '금단 코어', type: 'SPECIAL', hp: 80, maxHp: 80, attackDamage: 60, attackSpeed: 400, range: 500, defense: -20, regen: -2.0, evolutionLevel: 2, color: '#4C1D95', ultName: 'FORBIDDEN TRUTH', ultMax: 400, unlockCost: 1000, baseCoreId: 'forbidden-core', evolutionCondition: '...',
    description: '강한 페널티와 강한 보상 (진화 코어)'
  },
  'chaos-evo-core': {
    id: 'chaos-evo-core', name: '혼돈 코어', type: 'SPECIAL', hp: 150, maxHp: 150, attackDamage: 15, attackSpeed: 1000, range: 350, defense: 0, regen: 0, evolutionLevel: 2, color: '#F43F5E', ultName: 'TRUE CHAOS', ultMax: 250, unlockCost: 1000, baseCoreId: 'chaos-core', evolutionCondition: '...',
    description: '매 웨이브 능력 변화 (진화 코어)'
  },
  'order-evo-core': {
    id: 'order-evo-core', name: '질서 코어', type: 'SPECIAL', hp: 160, maxHp: 160, attackDamage: 18, attackSpeed: 1000, range: 350, defense: 8, regen: 0.2, evolutionLevel: 2, color: '#0EA5E9', ultName: 'ABSOLUTE ORDER', ultMax: 250, unlockCost: 1000, baseCoreId: 'order-core', evolutionCondition: '...',
    description: '랜덤 제거, 안정적인 고정 배율 (진화 코어)'
  },
  'mirror-evo-special-core': {
    id: 'mirror-evo-special-core', name: '거울 코어', type: 'SPECIAL', hp: 130, maxHp: 130, attackDamage: 14, attackSpeed: 1000, range: 350, defense: 3, regen: 0.2, evolutionLevel: 2, color: '#A78BFA', ultName: 'MIRROR WORLD', ultMax: 300, unlockCost: 1000, baseCoreId: 'copy-core', evolutionCondition: '...',
    description: '적 능력 일부 복사 (진화 코어)'
  },
  'nameless-evo-core': {
    id: 'nameless-evo-core', name: '무명 코어', type: 'SPECIAL', hp: 140, maxHp: 140, attackDamage: 15, attackSpeed: 1000, range: 350, defense: 0, regen: 0, evolutionLevel: 2, color: '#D4D4D8', ultName: 'TRUE NAME', ultMax: 250, unlockCost: 1000, baseCoreId: 'nameless-core', evolutionCondition: '...',
    description: '장착 모듈에 따라 능력 변화 (진화 코어)'
  }
};

export const UPGRADES: { RUN: RunUpgrade[] } = {
  RUN: [
    { id: 'dmg', name: '공격력', type: 'STAT', description: '기본 데미지 +5', baseCost: 10, costMult: 1.5, effect: 'dmg' },
    { id: 'aspd', name: '공격속도', type: 'STAT', description: '발사 간격 -5% 감소', baseCost: 15, costMult: 1.6, effect: 'aspd' },
    { id: 'hp', name: '내구도', type: 'STAT', description: '최대 체력 +20', baseCost: 12, costMult: 1.4, effect: 'hp' },
    { id: 'regen', name: '자가수복', type: 'STAT', description: '초당 체력 회복 +0.5', baseCost: 20, costMult: 1.8, effect: 'regen' },
    { id: 'range', name: '탐지 범위', type: 'STAT', description: '공격 사거리 +20', baseCost: 25, costMult: 1.5, effect: 'range' },
    { id: 'def', name: '장갑', type: 'STAT', description: '수행 데미지 감소 +1', baseCost: 30, costMult: 1.7, effect: 'def' },
  ]
};

export const ARTIFACTS_LIST = [
  { id: 'art_1', name: '과부하 릴레이', description: '공격속도 +30%, 최대 체력 -20%' },
  { id: 'art_2', name: '초전도 합금', description: '방어력 +5, 위성 모듈 회전 속도 20% 증가' },
  { id: 'art_3', name: '나노 입자 재생기', description: '웨이브 클리어 시 체력 20% 회복' },
  { id: 'art_4', name: '파멸의 렌즈', description: '투사체 피해량 +50%, 발사 속도 20% 감소' },
  { id: 'art_5', name: '에너지 추출기', description: '적 처치 시 획득 코인 30% 증가' },
  { id: 'art_6', name: '모듈 집중 코일', description: '위성 모듈의 피해량 +50%' },
  { id: 'art_7', name: '중력 억제장', description: '모든 적의 이동속도 15% 감소' },
  { id: 'art_8', name: '오버클럭 칩', description: '궁극기 충전 속도 30% 증가' },
];

export const MODULE_PRICES = {
  LASER: 100,
  DRONE: 250,
  LENS: 150,
};

export const CANVAS_SIZE = 800;
export const CORE_X = CANVAS_SIZE / 2;
export const CORE_Y = CANVAS_SIZE / 2;
