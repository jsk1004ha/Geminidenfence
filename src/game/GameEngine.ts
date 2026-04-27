import { Enemy, Projectile, CoreStats, OrbitalModule, EnemyType, Summon } from '../types';
import { CORE_X, CORE_Y, CANVAS_SIZE } from '../constants';

export class GameEngine {
  enemies: Enemy[] = [];
  projectiles: Projectile[] = [];
  modules: OrbitalModule[] = [];
  summons: Summon[] = [];
  lastShotTime: number = 0;
  spawnedThisWave: number = 0;
  isUltActive: boolean = false;
  activeUltName: string | null = null;
  ultTimer: number = 0;
  usedUltThisWave: boolean = false;
  
  constructor() {}

  update(core: CoreStats, deltaTime: number, wave: number, artifacts: string[], onEnemyKill: (reward: number, isBoss: boolean, byUlt: boolean) => void, onCoreDamage: (dmg: number) => void, onWaveComplete: () => void) {
    if (this.isUltActive) {
      this.ultTimer -= deltaTime;
      if (this.ultTimer <= 0) {
        this.isUltActive = false;
        this.activeUltName = null;
      }
    }

    // Shield Regen Logic
    if (core.maxShield && core.maxShield > 0) {
      if (core.shield! < core.maxShield) {
         core.shield = Math.min(core.maxShield, core.shield! + (core.shieldRegen || 0) * deltaTime);
      }
    }

    // Artifact: art_7 (중력 억제장)
    const enemiesSpeedMult = artifacts.includes('art_7') ? 0.85 : 1;
    // Artifact: art_6 (모듈 집중 코일)
    const moduleDamageMult = artifacts.includes('art_6') ? 1.5 : 1;

    // 1. Wave & Spawn Logic
    const isBossWave = wave > 0 && wave % 10 === 0;
    const targetEnemyCount = isBossWave ? 1 : 10 + Math.floor(wave * 2) + Math.floor(wave ** 1.2);
    const totalSpawnedInWave = this.spawnedThisWave;
    
    if (this.enemies.length === 0 && totalSpawnedInWave >= targetEnemyCount) {
       onWaveComplete();
       this.spawnedThisWave = 0;
       this.usedUltThisWave = false;
       return;
    }

    if (totalSpawnedInWave < targetEnemyCount && this.enemies.length < 5 + Math.floor(wave)) {
      if (isBossWave && totalSpawnedInWave === 0) {
        this.spawnBoss(wave, core);
      } else if (!isBossWave) {
        this.spawnEnemy(wave, core);
      }
      this.spawnedThisWave++;
    }

    // 2. Update Modules
    this.modules.forEach(m => {
      m.angle += m.rotationSpeed * deltaTime;
      const mx = CORE_X + Math.cos(m.angle) * m.distance;
      const my = CORE_Y + Math.sin(m.angle) * m.distance;

      if (m.type === 'LASER_SAT' || m.type.includes('LASER')) {
        this.enemies.forEach(e => {
          const dx = mx - e.x;
          const dy = my - e.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 25) {
            e.hp -= (m.damage * moduleDamageMult) * deltaTime;
            if (e.hp <= 0 && e.maxHp > 0) {
              onEnemyKill(e.reward, e.type === 'BOSS', false);
              e.maxHp = -1; // Mark killed to prevent double rewards
            }
          }
        });
      } else if (m.type === 'GRAVITY_LENS' || m.type === 'RIFT_LENS' || m.type.includes('LENS')) {
        // Pull or slow aura
        this.enemies.forEach(e => {
           const dist = Math.sqrt((mx - e.x)**2 + (my - e.y)**2);
           if (dist < 100 && e.type !== 'BOSS') {
             e.x -= (e.x - mx) * 0.5 * deltaTime;
             e.y -= (e.y - my) * 0.5 * deltaTime;
           }
        });
      } else if (m.type === 'COOLING_COIL' || m.type === 'TIME_PENDULUM') {
         this.enemies.forEach(e => {
            const dist = Math.sqrt((mx - e.x)**2 + (my - e.y)**2);
            if (dist < 80) {
               e.slowTimer = 1.0;
            }
         });
      } else if (m.type === 'DRONE_NEST') {
         m.lastActionTime = (m.lastActionTime || 0) + deltaTime;
         if (m.lastActionTime > 3) {
            this.summons.push({
               id: Math.random().toString(36), type: 'DRONE',
               x: mx, y: my, damage: m.damage, speed: 2.0, radius: 0, lifeTime: 0, maxLifeTime: 10,
               color: m.color, lastAttackTime: 0
            });
            m.lastActionTime = 0;
         }
      } else if (m.type === 'FLAME_NOZZLE') {
         this.enemies.forEach(e => {
            const dist = Math.sqrt((mx - e.x)**2 + (my - e.y)**2);
            if (dist < 60) {
               e.burnTimer = 2.0;
               e.burnDamage = m.damage;
            }
         });
      } else if (m.type === 'SHIELD_SAT') {
          m.lastActionTime = (m.lastActionTime || 0) + deltaTime;
          if (m.lastActionTime > 2) {
             if (core.shield !== undefined && core.maxShield !== undefined && core.shield < core.maxShield) {
                core.shield = Math.min(core.maxShield, core.shield + 2);
             }
             m.lastActionTime = 0;
          }
      } else if (m.type === 'LIGHTNING_AMP') {
          m.lastActionTime = (m.lastActionTime || 0) + deltaTime;
          if (m.lastActionTime > 1.5) {
             // shock closest enemy
             const target = this.enemies.find(e => Math.sqrt((mx-e.x)**2 + (my-e.y)**2) < 250);
             if (target) {
                target.hp -= m.damage * moduleDamageMult * 2;
                if (target.hp <= 0 && target.maxHp > 0) {
                   onEnemyKill(target.reward, target.type === 'BOSS', false);
                   target.maxHp = -1;
                }
             }
             m.lastActionTime = 0;
          }
      } else if (m.type === 'MISSILE_POD') {
          m.lastActionTime = (m.lastActionTime || 0) + deltaTime;
          if (m.lastActionTime > 2.5) {
             const target = this.enemies.find(e => e.type === 'BOSS' || e.type === 'TANKER') || this.enemies[0];
             if (target) {
                this.projectiles.push({
                   id: Math.random().toString(36), x: mx, y: my, targetId: target.id,
                   damage: m.damage * moduleDamageMult * 4, speed: 3.0, color: '#EF4444', type: 'MISSILE'
                });
             }
             m.lastActionTime = 0;
          }
      } else if (m.type === 'NANO_SPRAYER') {
          m.lastActionTime = (m.lastActionTime || 0) + deltaTime;
          if (m.lastActionTime > 1.0) {
             const target = this.enemies.find(e => Math.sqrt((mx-e.x)**2 + (my-e.y)**2) < 150);
             if (target) {
                target.hp -= m.damage * moduleDamageMult;
             }
             m.lastActionTime = 0;
          }
      } else if (m.type === 'EXECUTION_LENS') {
         this.enemies.forEach(e => {
            const dist = Math.sqrt((mx - e.x)**2 + (my - e.y)**2);
            if (dist < 120 && e.hp > 0 && e.hp < e.maxHp * 0.15 && e.type !== 'BOSS') {
               e.hp = -1; // Execute
               onEnemyKill(e.reward, false, false);
            }
         });
      } else if (m.type === 'PURIFY_COIL') {
         this.enemies.forEach(e => {
            const dist = Math.sqrt((mx - e.x)**2 + (my - e.y)**2);
            if (dist < 100) {
               e.damage = Math.max(1, e.damage - 5 * deltaTime);
            }
         });
      } else if (m.type === 'OMEGA_RING') {
         m.lastActionTime = (m.lastActionTime || 0) + deltaTime;
         if (m.lastActionTime > 3.0) {
            this.enemies.forEach(e => {
               const dist = Math.sqrt((mx - e.x)**2 + (my - e.y)**2);
               if (dist < 150) { e.hp -= m.damage * moduleDamageMult; e.slowTimer = 1.0; e.burnTimer = 1.0; e.burnDamage = m.damage; }
            });
            m.lastActionTime = 0;
         }
      }
    });

    // 3. Update Enemies
    this.enemies.forEach(enemy => {
      // Status Effects
      if (enemy.freezeTimer && enemy.freezeTimer > 0) { enemy.freezeTimer -= deltaTime; }
      if (enemy.stunTimer && enemy.stunTimer > 0) { enemy.stunTimer -= deltaTime; }
      if (enemy.slowTimer && enemy.slowTimer > 0) { enemy.slowTimer -= deltaTime; }
      if (enemy.burnTimer && enemy.burnTimer > 0) {
        enemy.burnTimer -= deltaTime;
        enemy.hp -= (enemy.burnDamage || 0) * deltaTime;
      }

      const dx = CORE_X - enemy.x;
      const dy = CORE_Y - enemy.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      // Ult effect: Blackhole pulls everything
      if (this.isUltActive && core.type === 'CONTROL') {
         enemy.x += (dx / dist) * 150 * deltaTime;
         enemy.y += (dy / dist) * 150 * deltaTime;
         enemy.hp -= core.attackDamage * 5 * deltaTime;
      }
      
      if (dist > 35) {
        // Shooters stop and shoot
        if (enemy.type === 'SHOOTER' && dist < 200) {
           enemy.lastAttackTime = (enemy.lastAttackTime || 0) + deltaTime * 1000;
           if (enemy.lastAttackTime > 2000) {
              this.projectiles.push({
                id: Math.random().toString(36),
                x: enemy.x, y: enemy.y, targetId: 'CORE',
                damage: enemy.damage, speed: 0.3,
                color: '#FF4D00', type: 'ENEMY'
              });
              enemy.lastAttackTime = 0;
           }
        } else {
          // Move towards core
          let speedMult = this.isUltActive && core.type === 'DEFENSE' ? 0.2 : 1; 
          speedMult *= enemiesSpeedMult;
          if (enemy.slowTimer && enemy.slowTimer > 0) speedMult *= (1 - (enemy.slowAmount || 0));
          if ((enemy.freezeTimer && enemy.freezeTimer > 0) || (enemy.stunTimer && enemy.stunTimer > 0)) speedMult = 0;

          // Blockade Core specific feature
          if (core.id.includes('blockade')) {
             if (dist < 100) speedMult *= 0.2;
             else if (dist < 200) speedMult *= 0.5;
          }

          // Resonance Core pushback
          if (core.id.includes('resonance') && Math.random() < 0.005) {
             enemy.x -= (dx / dist) * 50;
             enemy.y -= (dy / dist) * 50;
          }

          enemy.x += (dx / dist) * enemy.speed * deltaTime * 60 * speedMult;
          enemy.y += (dy / dist) * enemy.speed * deltaTime * 60 * speedMult;
        }
      } else {
        // Hit Core
        const actualDmg = Math.max(1, enemy.damage - core.defense);
        onCoreDamage(actualDmg);
        
        // REFLECTOR Module
        const reflectorCount = this.modules.filter(m => m.type === 'REFLECTOR').length;
        if (reflectorCount > 0) {
           enemy.hp -= actualDmg * reflectorCount * 2;
        }

        // ABSORPTION_RING Module
        const absorbCount = this.modules.filter(m => m.type === 'ABSORPTION_RING').length;
        if (absorbCount > 0 && core.hp < core.maxHp) {
           core.hp = Math.min(core.maxHp, core.hp + absorbCount * 2);
        }

        if (enemy.type !== 'BOSS') {
          enemy.hp = 0;
        } else {
          // Boss just keeps dealing damage over time
          enemy.x -= (dx / dist) * 10;
          enemy.y -= (dy / dist) * 10;
        }
      }
    });

    // Clean up dead enemies, award points if ult killed them
    this.enemies = this.enemies.filter(e => {
       if (e.hp <= 0 && e.maxHp > 0) {
         // Fragment core spawn feature
         if (core.id.includes('frag-core')) {
           for (let i=0; i<3; i++) {
             this.projectiles.push({
               id: Math.random().toString(36),
               x: e.x, y: e.y, targetId: 'random',
               damage: core.attackDamage * 0.5, speed: 0.6,
               color: core.color, type: 'FRAG', hitSet: new Set()
             });
           }
         }
         // Heal core spawn feature
         if (core.id.includes('life-core') || core.id.includes('tree-of-life')) {
           core.hp = Math.min(core.maxHp, core.hp + 5);
         }
         // Supernova counter
         if (core.id.includes('supernova')) {
           // Not tracking fully, but let's give a chance for explosion
           if (Math.random() < 0.1) {
             this.enemies.forEach(en => en.hp -= core.attackDamage * 10);
           }
         }

         onEnemyKill(e.reward, e.type === 'BOSS', this.isUltActive);
         return false;
       }
       return e.hp > 0;
    });

    // Special Cores Passives
    if (core.id.includes('overheat') || core.id.includes('rampage') || core.id.includes('berserk')) {
       core.hp = Math.max(1, core.hp - 2 * deltaTime);
       if (core.attackDamage < 150) {
          core.attackDamage += 0.5 * deltaTime;
       }
    } else if (core.hp < core.maxHp) {
       core.hp = Math.min(core.maxHp, core.hp + core.regen * deltaTime);
    }

    // 4. Update Summons
    this.summons.forEach(s => {
       s.lifeTime += deltaTime;
       if (s.type === 'DRONE' || s.type === 'NANOBOT' || s.type === 'CLONE') {
          // Find target
          let target = this.enemies.find(e => e.id === s.targetId);
          if (!target || target.hp <= 0) {
             const potential = this.enemies.filter(e => e.hp > 0);
             if (potential.length > 0) {
                target = potential.sort((a,b) => (Math.sqrt((a.x-s.x)**2 + (a.y-s.y)**2) - Math.sqrt((b.x-s.x)**2 + (b.y-s.y)**2)))[0];
                s.targetId = target.id;
             }
          }
          if (target) {
            const dx = target.x - s.x;
            const dy = target.y - s.y;
            const dist = Math.sqrt(dx*dx + dy*dy);
            if (dist < 20) {
               s.lastAttackTime += deltaTime * 1000;
               if (s.lastAttackTime > (s.type === 'NANOBOT' ? 500 : 1000)) {
                  target.hp -= s.damage;
                  s.lastAttackTime = 0;
               }
            } else {
               const moveSpeed = s.speed * deltaTime * 60;
               s.x += (dx / dist) * moveSpeed;
               s.y += (dy / dist) * moveSpeed;
            }
          }
       } else if (s.type === 'TURRET') {
           s.lastAttackTime += deltaTime * 1000;
           if (s.lastAttackTime > 1000) {
              const target = this.enemies.find(e => Math.sqrt((e.x-s.x)**2 + (e.y-s.y)**2) < s.radius);
              if (target) {
                 this.projectiles.push({
                    id: Math.random().toString(36),
                    x: s.x, y: s.y, targetId: target.id, damage: s.damage, speed: 1.0, color: s.color, type: 'NORMAL'
                 });
                 s.lastAttackTime = 0;
              }
           }
       } else if (s.type === 'BLACKHOLE' || s.type === 'SATELLITE' || s.type === 'ORBITAL_LASER') {
           // Pull or damage
           const r = s.type === 'BLACKHOLE' ? s.radius : (s.type === 'ORBITAL_LASER' ? 60 : s.radius * 0.5);
           this.enemies.forEach(e => {
              const dist = Math.sqrt((e.x-s.x)**2 + (e.y-s.y)**2);
              if (s.type === 'ORBITAL_LASER') {
                  // Laser Sweep logic
                  if (Math.abs(e.x - s.x) < 40) { e.hp -= s.damage * deltaTime; }
              } else if (dist < r) {
                 if (s.type === 'BLACKHOLE') {
                    e.x -= (e.x - s.x) * 2 * deltaTime;
                    e.y -= (e.y - s.y) * 2 * deltaTime;
                 }
                 e.hp -= s.damage * deltaTime;
              }
           });
           if (s.type === 'SATELLITE') {
              s.angle = (s.angle || 0) + s.speed * deltaTime;
              s.x = CORE_X + Math.cos(s.angle) * s.distance!;
              s.y = CORE_Y + Math.sin(s.angle) * s.distance!;
           } else if (s.type === 'ORBITAL_LASER') {
              // sweep across the screen
              s.x = (s.lifeTime / s.maxLifeTime) * CANVAS_SIZE;
           }
       }
    });

    this.summons = this.summons.filter(s => s.lifeTime < s.maxLifeTime);

    // 5. Core Shooting
    const actualAttackSpeed = this.isUltActive && core.type === 'ATTACK' ? core.attackSpeed * 0.2 : core.attackSpeed;
    this.lastShotTime += deltaTime * 1000;
    
    if (this.lastShotTime >= actualAttackSpeed) {
      this.lastShotTime = 0;
      this.shootProjectiles(core);
    }

    // 5. Update Projectiles
    this.projectiles.forEach(p => {
      if (p.type === 'ENEMY') {
         const dx = CORE_X - p.x;
         const dy = CORE_Y - p.y;
         const dist = Math.sqrt(dx*dx + dy*dy);
         if (dist < 20) {
            onCoreDamage(Math.max(1, p.damage - core.defense));
            p.damage = 0;
         } else {
            p.x += (dx / dist) * p.speed * deltaTime * 1000;
            p.y += (dy / dist) * p.speed * deltaTime * 1000;
         }
         return;
      }

      let target = this.enemies.find(e => e.id === p.targetId);
      
      // If FRAG or BOUNCE types, target might be lost, find nearest
      if (!target && p.type !== 'NORMAL' && p.type !== 'PIERCE' && p.type !== 'LASER_BEAM') {
        const potentialTargets = this.enemies.filter(e => !p.hitSet || !p.hitSet.has(e.id));
        if (potentialTargets.length > 0) {
           target = potentialTargets.sort((a,b) => {
             const distA = Math.sqrt((a.x - p.x)**2 + (a.y - p.y)**2);
             const distB = Math.sqrt((b.x - p.x)**2 + (b.y - p.y)**2);
             return distA - distB;
           })[0];
           p.targetId = target.id;
        }
      }

      if (!target && p.type === 'NORMAL') {
        p.damage = 0; // Orphaned normal bullet
        return;
      }
      
      if (target) {
        const dx = target.x - p.x;
        const dy = target.y - p.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist < 15) {
          // On Hit Logic
          let actualDmg = p.damage;
          if (target.vulnTimer && target.vulnTimer > 0) actualDmg *= 1.5;
          target.hp -= actualDmg;
          
          if (p.hitSet) p.hitSet.add(target.id);

          // Apply special effects on hit based on projectile type
          if (p.type === 'EXPLOSIVE' || p.type === 'MISSILE') {
             this.enemies.forEach(e => {
                const edist = Math.sqrt((e.x - target!.x)**2 + (e.y - target!.y)**2);
                if (edist < (p.explosionRadius || (p.type === 'MISSILE' ? 40 : 50))) {
                   e.hp -= p.damage * 0.5;
                }
             });
             p.damage = 0;
          } else if (p.type === 'CHAIN' && (p.chainCount || 0) > 0) {
             p.chainCount! -= 1;
             p.targetId = 'random'; // will find new target next frame
          } else if (p.type === 'FRAG') {
             p.damage = 0;
          } else if (p.type !== 'PIERCE' && p.type !== 'LASER_BEAM') {
             p.damage = 0;
          }

          // Core specific specific on-hit (Vampire, Furnace, Frost, Silence)
          if (core.id.includes('vampire') || core.id.includes('bloodstone')) core.hp = Math.min(core.maxHp, core.hp + actualDmg * 0.1);
          if (core.id.includes('furnace')) { target.burnTimer = 3; target.burnDamage = core.attackDamage * 0.2; }
          if (core.id.includes('frost')) { target.slowTimer = 2; target.slowAmount = 0.5; }
          if (core.id.includes('time')) { if(Math.random()<0.1) target.freezeTimer = 2; }
          if (core.id.includes('curse')) { target.vulnTimer = 3; }

        } else {
          // Move towards target
          let spd = p.speed * deltaTime * 1000;
          if (p.type === 'LASER_BEAM') spd *= 2; 
          p.x += (dx / dist) * spd;
          p.y += (dy / dist) * spd;
        }
      } else if (p.type === 'PIERCE' || p.type === 'LASER_BEAM') {
         // Keep flying outwards in last known direction or straight out
         p.x += p.x > CORE_X ? 10 : -10;
         p.y += p.y > CORE_Y ? 10 : -10;
      } else {
         p.damage = 0;
      }
    });

    this.projectiles = this.projectiles.filter(p => p.damage > 0 && p.x > -100 && p.x < CANVAS_SIZE+100 && p.y > -100 && p.y < CANVAS_SIZE+100);
  }

  shootProjectiles(core: CoreStats) {
      let target = this.findNearestWithinRange(core.range);
      
      // Sniper targets BOSS if possible
      if (core.id.includes('sniper')) {
          const boss = this.enemies.find(e => e.type === 'BOSS');
          if (boss) target = boss;
      }

      if (!target && !['plasma-core', 'supernova-core'].includes(core.id)) return;

      let type: Projectile['type'] = 'NORMAL';
      let speed = 0.8;
      let dmg = core.attackDamage * (this.isUltActive && core.type === 'BASIC' ? 3 : 1);
      let specialConfig: Partial<Projectile> = { hitSet: new Set() };
      let count = 1;

      // Decide type
      if (core.id.includes('plasma') || core.id.includes('supernova')) {
          type = 'EXPLOSIVE'; specialConfig.explosionRadius = 80;
      } else if (core.id.includes('ballistic') || core.type === 'ECONOMIC') {
          type = 'PIERCE'; count = core.id.includes('shotgun') ? 3 : (core.id.includes('ballistic') ? 2 : 1);
      } else if (core.id.includes('laser') || core.id.includes('prism')) {
          type = 'LASER_BEAM'; speed = 2.0; count = core.id.includes('prism') ? 3 : 1;
      } else if (core.id.includes('lightning') || core.id.includes('chain-storm')) {
          type = 'CHAIN'; specialConfig.chainCount = core.id.includes('chain-storm') ? 6 : 3;
      } else if (core.id.includes('sniper')) {
          type = 'SNIPER'; speed = 1.5; dmg *= 2;
      }

      // BALLISTIC_AMP and PHOTON_AMP from Modules
      const ballisticCount = this.modules.filter(m => m.type === 'BALLISTIC_AMP').length;
      if (ballisticCount > 0) {
         count += ballisticCount;
         if (type === 'NORMAL') type = 'PIERCE';
      }
      
      const photonCount = this.modules.filter(m => m.type === 'PHOTON_AMP').length;
      if (photonCount > 0 && type === 'LASER_BEAM') {
         dmg *= (1 + 0.2 * photonCount);
      }

      if (target) {
         for (let i = 0; i < count; i++) {
            this.projectiles.push({
               id: Math.random().toString(36),
               x: count > 1 && type === 'PIERCE' ? CORE_X + (Math.random()*20-10) : CORE_X,
               y: count > 1 && type === 'PIERCE' ? CORE_Y + (Math.random()*20-10) : CORE_Y,
               targetId: target.id,
               damage: dmg,
               speed: speed,
               color: core.color,
               type: type,
               ...specialConfig
            });
         }
      }
  }

  triggerUltimate(core: CoreStats) {
    this.isUltActive = true;
    this.usedUltThisWave = true;
    this.ultTimer = 5; // default 5 seconds duration
    this.activeUltName = core.ultName?.toUpperCase() || null;

    const ult = this.activeUltName || '';

    if (ult.includes('BLACK HOLE') || ult.includes('EVENT HORIZON') || ult.includes('COLLAPSE')) {
       // 블랙홀: 적 흡입
       this.summons.push({
          id: Math.random().toString(36), type: 'BLACKHOLE',
          x: CORE_X, y: CORE_Y, damage: core.attackDamage * 10,
          speed: 0, radius: 400, lifeTime: 0, maxLifeTime: 5, color: '#111827', lastAttackTime: 0
       });
    } else if (ult.includes('LASER') || ult.includes('BEAM') || ult.includes('CUTTER') || ult.includes('DEATH RAY')) {
       // 궤도 레이저: 화면 횡단 초고화력 공격
       this.ultTimer = 2; // shrt duration
       this.summons.push({
           id: Math.random().toString(36), type: 'ORBITAL_LASER',
           x: CORE_X, y: CORE_Y, damage: core.attackDamage * 50,
           speed: 0, radius: CANVAS_SIZE, lifeTime: 0, maxLifeTime: 2, color: '#EF4444', lastAttackTime: 0
       });
    } else if (ult.includes('STORM') || ult.includes('MISSILE') || ult.includes('SWARM TACTIC') || ult.includes('BULLET HELL')) {
       // 미사일 폭풍
       this.ultTimer = 1;
       for (let i=0; i<30; i++) {
          const target = this.enemies[Math.floor(Math.random() * this.enemies.length)];
          this.projectiles.push({
             id: Math.random().toString(36), targetId: target ? target.id : 'CORE',
             x: Math.random() * CANVAS_SIZE, y: Math.random() * CANVAS_SIZE,
             damage: core.attackDamage * 5, speed: 4.0, color: '#F97316', type: 'MISSILE'
          });
       }
    } else if (ult.includes('TIME') || ult.includes('STASIS') || ult.includes('REWIND')) {
       // 시간 정지
       this.enemies.forEach(e => e.freezeTimer = 5);
       this.ultTimer = 5;
    } else if (ult.includes('EMP') || ult.includes('LIGHTNING') || ult.includes('SHOCKWAVE')) {
       // 전자기 폭풍
       this.ultTimer = 1;
       this.enemies.forEach(e => {
          e.hp -= core.attackDamage * 15;
          e.stunTimer = 2;
       });
    } else if (ult.includes('NEBULA') || ult.includes('PULSE') || ult.includes('BURST')) {
       // 성운 폭발 (코어 주변 광역 폭발)
       this.ultTimer = 1;
       this.enemies.forEach(e => {
          const dx = CORE_X - e.x;
          const dy = CORE_Y - e.y;
          const dist = Math.sqrt(dx*dx + dy*dy);
          if (dist < 300) { e.hp -= core.attackDamage * 30; }
       });
    } else if (ult.includes('SOLAR') || ult.includes('SUN') || ult.includes('FLARE') || ult.includes('PLASMA') || ult.includes('ERUPTION')) {
       // 태양섬광 (빛과 화염 피해)
       this.ultTimer = 1;
       this.enemies.forEach(e => {
          e.hp -= core.attackDamage * 20;
          e.burnTimer = 5;
          e.burnDamage = core.attackDamage * 2;
       });
    } else if (ult.includes('VOID') || ult.includes('SILENCE') || ult.includes('DOOM')) {
       // 공허 파동 (적 특수능력 제거 및 피해)
       this.ultTimer = 2;
       this.enemies.forEach(e => {
          e.hp -= core.attackDamage * 10;
          e.speed = Math.min(e.speed, 0.5); // 영구 감속 효과
          e.damage = Math.max(1, Math.floor(e.damage * 0.5)); // 공격력 감소
       });
    } else if (ult.includes('RIFT') || ult.includes('DIMENSION')) {
       // 차원 균열 (적 일부를 뒤로 되돌림)
       this.ultTimer = 1;
       this.enemies.forEach(e => {
          const angle = Math.random() * Math.PI * 2;
          e.x += Math.cos(angle) * 300;
          e.y += Math.sin(angle) * 300;
          e.hp -= core.attackDamage * 5;
       });
    } else if (ult.includes('NANO') || ult.includes('INFECTION')) {
       // 나노 범람 (적 전체 나노 감염)
       this.ultTimer = 5;
       this.enemies.forEach(e => {
          e.burnTimer = 8;
          e.burnDamage = core.attackDamage * 3;
       });
    } else if (ult.includes('DRONE') || ult.includes('HIVE') || ult.includes('ARMY')) {
       // 드론 출격
       for(let i=0; i<20; i++) {
          this.summons.push({
             id: Math.random().toString(36), type: 'DRONE',
             x: CORE_X, y: CORE_Y, damage: core.attackDamage * 2,
             speed: 3.0, radius: 0, lifeTime: 0, maxLifeTime: 10,
             color: core.color, lastAttackTime: 0
          });
       }
    } else if (ult.includes('JUDGEMENT') || ult.includes('EXECUTION') || ult.includes('SMITE') || ult.includes('ASSASSINATION')) {
       // 심판 포격 (보스와 엘리트 집중 타격 / 가장 체력 많은 적)
       this.ultTimer = 1;
       const targets = this.enemies.sort((a,b) => b.hp - a.hp).slice(0, 5);
       targets.forEach(t => t.hp -= core.attackDamage * 50);
    } else if (ult.includes('ZERO') || ult.includes('FREEZE') || ult.includes('BLIZZARD')) {
       // 절대영도 (전체 감속과 빙결)
       this.ultTimer = 1;
       this.enemies.forEach(e => {
          e.freezeTimer = 5;
          e.hp -= core.attackDamage * 10;
       });
    } else if (ult.includes('BARRIER') || ult.includes('SHIELD') || ult.includes('AEGIS') || ult.includes('CITADEL') || ult.includes('FORTRESS')) {
       // 방벽 전개 (대형 보호막 생성)
       this.ultTimer = 8;
       core.shield = Math.min((core.maxShield || 0) * 3, (core.shield || 0) + 500); // 일시적 대량 쉴드
    } else if (ult.includes('SUPERNOVA')) {
       // 초신성 폭발 (화면 전체 대폭발)
       this.ultTimer = 1;
       this.enemies.forEach(e => e.hp -= core.attackDamage * 60);
    } else {
       // 기본 궁극기 로직 (매치 안되는 경우)
       this.ultTimer = 2;
       this.enemies.forEach(e => e.hp -= core.attackDamage * 20);
    }
  }

  spawnEnemy(wave: number, core: CoreStats) {
    const angle = Math.random() * Math.PI * 2;
    const dist = CANVAS_SIZE / 2 + 50;
    
    // Choose type based on wave
    const rand = Math.random();
    let type: EnemyType = 'RUNNER';
    let hpMult = 1;
    let spdMult = 1;
    let dmgMult = 1;

    if (wave > 5 && rand < 0.2) {
       type = 'TANKER';
       hpMult = 4; spdMult = 0.5; dmgMult = 2;
    } else if (wave > 10 && rand < 0.4) {
       type = 'SHOOTER';
       hpMult = 1.5; spdMult = 0.7; dmgMult = 1.5;
    } else if (wave > 15 && rand < 0.6) {
       type = 'SWARM';
       hpMult = 0.5; spdMult = 1.5; dmgMult = 0.5;
    }

    let reward = Math.floor(1 + wave / 5);
    
    // Economic core features
    if (core.id.includes('greed')) {
       reward *= 3; hpMult *= 1.5; dmgMult *= 1.5;
    }
    if (core.id.includes('gold')) {
       reward *= 5; // Golden core pure reward
    }
    if (core.id.includes('harvest') && Math.random() < 0.1) {
       type = 'TANKER'; hpMult *= 2; reward *= 3; // Harvest forces more elites
    }

    this.enemies.push({
      id: Math.random().toString(36),
      type: type,
      x: CORE_X + Math.cos(angle) * dist,
      y: CORE_Y + Math.sin(angle) * dist,
      hp: Math.floor((10 + wave * 5) * hpMult),
      maxHp: Math.floor((10 + wave * 5) * hpMult),
      speed: (0.05 + Math.random() * 0.03) * spdMult,
      damage: Math.floor(5 + wave / 3) * dmgMult,
      reward: reward,
      angle: 0,
      radius: dist
    });
  }

  spawnBoss(wave: number, core: CoreStats) {
    const angle = Math.random() * Math.PI * 2;
    const dist = CANVAS_SIZE / 2 + 50;

    let reward = 50 + wave * 5;
    
    // Economic core features
    if (core.id.includes('greed')) reward *= 3;
    if (core.id.includes('gold')) reward *= 5;
    if (core.id.includes('harvest')) reward *= 4;

    this.enemies.push({
      id: 'BOSS_' + wave,
      type: 'BOSS',
      x: CORE_X + Math.cos(angle) * dist,
      y: CORE_Y + Math.sin(angle) * dist,
      hp: 200 + wave * 50,
      maxHp: 200 + wave * 50,
      speed: 0.02,
      damage: 15 + wave,
      reward: reward,
      angle: 0,
      radius: dist
    });
  }

  findNearestWithinRange(range: number) {
    const list = this.enemies.filter(e => {
        const dist = Math.sqrt((e.x - CORE_X) ** 2 + (e.y - CORE_Y) ** 2);
        return dist <= range;
    });
    return list.sort((a, b) => {
      const distA = Math.sqrt((a.x - CORE_X) ** 2 + (a.y - CORE_Y) ** 2);
      const distB = Math.sqrt((b.x - CORE_X) ** 2 + (b.y - CORE_Y) ** 2);
      return distA - distB;
    })[0];
  }

  render(ctx: CanvasRenderingContext2D, core: CoreStats) {
    ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

    // Draw grid
    ctx.strokeStyle = 'rgba(0, 240, 255, 0.03)';
    ctx.lineWidth = 1;
    for(let i=0; i<CANVAS_SIZE; i+=50) {
      ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, CANVAS_SIZE); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(CANVAS_SIZE, i); ctx.stroke();
    }

    // Ult effect background
    if (this.isUltActive) {
      if (core.type === 'CONTROL') {
         ctx.fillStyle = 'rgba(168, 85, 247, 0.1)';
         ctx.beginPath(); ctx.arc(CORE_X, CORE_Y, CANVAS_SIZE, 0, Math.PI*2); ctx.fill();
      } else if (core.type === 'DEFENSE') {
         ctx.fillStyle = 'rgba(34, 197, 94, 0.2)';
         ctx.beginPath(); ctx.arc(CORE_X, CORE_Y, core.range, 0, Math.PI*2); ctx.fill();
      }
    }

    // Draw Core
    ctx.shadowBlur = this.isUltActive ? 50 : 30;
    ctx.shadowColor = core.color;
    ctx.fillStyle = core.color;
    ctx.beginPath();
    ctx.arc(CORE_X, CORE_Y, 20 + Math.sin(Date.now() / 300) * 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Range circle
    ctx.strokeStyle = core.color;
    ctx.globalAlpha = 0.1;
    ctx.beginPath();
    ctx.arc(CORE_X, CORE_Y, core.range, 0, Math.PI * 2);
    ctx.stroke();
    ctx.globalAlpha = 1.0;

    // Draw Orbital Modules
    this.modules.forEach(m => {
      const mx = CORE_X + Math.cos(m.angle) * m.distance;
      const my = CORE_Y + Math.sin(m.angle) * m.distance;
      
      ctx.fillStyle = m.color;
      ctx.shadowBlur = 10;
      ctx.shadowColor = m.color;
      ctx.beginPath();
      ctx.arc(mx, my, m.type.includes('LENS') || m.type.includes('NEST') || m.type.includes('RING') ? 8 : 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
      
      ctx.strokeStyle = m.color;
      ctx.globalAlpha = 0.2;
      ctx.beginPath();
      ctx.moveTo(CORE_X, CORE_Y);
      ctx.lineTo(mx, my);
      ctx.stroke();
      ctx.globalAlpha = 1.0;
    });

    // Draw Summons
    this.summons.forEach(s => {
       ctx.fillStyle = s.color;
       ctx.shadowBlur = s.type === 'BLACKHOLE' ? 50 : 10;
       ctx.shadowColor = s.color;
       ctx.beginPath();
       if (s.type === 'BLACKHOLE') {
          ctx.globalAlpha = 0.8;
          ctx.arc(s.x, s.y, s.radius * 0.2, 0, Math.PI * 2);
          ctx.fill();
          ctx.globalAlpha = 0.2;
          ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
          ctx.fill();
          ctx.globalAlpha = 1.0;
       } else if (s.type === 'ORBITAL_LASER') {
          ctx.globalAlpha = 0.8;
          ctx.rect(s.x - 40, 0, 80, CANVAS_SIZE);
          ctx.fill();
          ctx.fillStyle = '#FFFFFF';
          ctx.rect(s.x - 10, 0, 20, CANVAS_SIZE);
          ctx.fill();
          ctx.globalAlpha = 1.0;
       } else if (s.type === 'TURRET') {
          ctx.rect(s.x - 8, s.y - 8, 16, 16);
          ctx.fill();
       } else if (s.type === 'DRONE' || s.type === 'SATELLITE') {
          ctx.moveTo(s.x, s.y - 6); ctx.lineTo(s.x+4, s.y+4); ctx.lineTo(s.x-4, s.y+4);
          ctx.fill();
       } else if (s.type === 'NANOBOT') {
          ctx.arc(s.x, s.y, 2, 0, Math.PI * 2);
          ctx.fill();
       }
       ctx.shadowBlur = 0;
    });

    // Draw Enemies
    this.enemies.forEach(e => {
      let color = '#A855F7';
      let size = 8;
      if (e.type === 'TANKER') { color = '#374151'; size = 12; }
      else if (e.type === 'SHOOTER') { color = '#a8a29e'; size = 7; } // Distinct color
      else if (e.type === 'SWARM') { color = '#22C55E'; size = 5; }
      else if (e.type === 'BOSS') { color = '#EF4444'; size = 20; }

      ctx.fillStyle = color;
      ctx.beginPath();
      // Boss has hex shape
      if (e.type === 'BOSS') {
         for(let i=0; i<6; i++) {
           const a = (i/6) * Math.PI*2;
           if(i===0) ctx.moveTo(e.x + Math.cos(a)*size, e.y + Math.sin(a)*size);
           else ctx.lineTo(e.x + Math.cos(a)*size, e.y + Math.sin(a)*size);
         }
      } else {
         ctx.arc(e.x, e.y, size, 0, Math.PI * 2);
      }
      ctx.fill();
      
      // Health bar
      ctx.fillStyle = '#1A1A1E';
      ctx.fillRect(e.x - 10, e.y - size - 10, 20, 3);
      ctx.fillStyle = color;
      ctx.fillRect(e.x - 10, e.y - size - 10, Math.max(0, (e.hp / e.maxHp)) * 20, 3);
    });

    // Draw Projectiles
    this.projectiles.forEach(p => {
      ctx.fillStyle = p.color;
      ctx.shadowBlur = 15;
      ctx.shadowColor = p.color;
      ctx.beginPath();
      if (p.type === 'ENEMY') {
         ctx.arc(p.x, p.y, 6, 0, Math.PI * 2);
      } else if (p.type === 'PIERCE') {
         ctx.moveTo(p.x, p.y - 10); ctx.lineTo(p.x+5, p.y+5); ctx.lineTo(p.x-5, p.y+5);
      } else {
         ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
      }
      ctx.fill();
      ctx.shadowBlur = 0;
    });
  }
}
