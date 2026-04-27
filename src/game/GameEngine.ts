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

  update(core: CoreStats, deltaTime: number, wave: number, artifacts: string[], onEnemyKill: (reward: number, isBoss: boolean, byUlt: boolean, enemy?: Enemy, method?: string) => void, onCoreDamage: (dmg: number) => void, onWaveComplete: () => void) {
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
    const moduleDamageMult = (artifacts.includes('art_6') ? 1.5 : 1) * (artifacts.includes('ga_20') ? 1.2 : 1);
    const slowMult = artifacts.includes('ga_8') ? 1.1 : 1;
    const burnMult = artifacts.includes('ga_9') ? 1.2 : 1;
    const reflectMult = artifacts.includes('ga_10') ? 1.3 : 1;
    const statusDurationMult = artifacts.includes('ga_13') ? 1.2 : 1;
    const summonMult = artifacts.includes('ga_11') ? 1.15 : 1;
    const blackholePullMult = artifacts.includes('ga_3') ? 1.2 : 1;

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
              onEnemyKill(e.reward, e.type === 'BOSS', false, e, 'MODULE');
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
               e.slowTimer = 1.0 * statusDurationMult;
               e.slowAmount = Math.max(e.slowAmount || 0, 0.2 * slowMult);
            }
         });
      } else if (m.type === 'DRONE_NEST') {
         m.lastActionTime = (m.lastActionTime || 0) + deltaTime;
         if (m.lastActionTime > 3) {
            this.summons.push({
               id: Math.random().toString(36), type: 'DRONE',
               x: mx, y: my, damage: m.damage * summonMult, speed: 2.0 * summonMult, radius: 0, lifeTime: 0, maxLifeTime: 10,
               color: m.color, lastAttackTime: 0
            });
            m.lastActionTime = 0;
         }
      } else if (m.type === 'FLAME_NOZZLE') {
         this.enemies.forEach(e => {
            const dist = Math.sqrt((mx - e.x)**2 + (my - e.y)**2);
            if (dist < 60) {
               e.burnTimer = 2.0 * statusDurationMult;
               e.burnDamage = m.damage * burnMult;
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
                   onEnemyKill(target.reward, target.type === 'BOSS', false, target, 'MODULE');
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
               onEnemyKill(e.reward, false, false, e, 'EXECUTE');
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
      
      // Elite / Special Mechanics
      if (enemy.regen && enemy.regen > 0) {
         enemy.hp = Math.min(enemy.maxHp, enemy.hp + enemy.regen * deltaTime);
      }
      if (enemy.type === 'SHIELDER' && enemy.shield !== undefined && enemy.maxShield !== undefined && enemy.shield < enemy.maxShield) {
         // Regent shield out of combat or slowly
         enemy.shield += enemy.maxShield * 0.05 * deltaTime;
      }

      // Blinker mechanic
      if (enemy.type === 'BLINKER') {
         enemy.blinkTimer = (enemy.blinkTimer || 0) + deltaTime;
         if (enemy.blinkTimer > 3) {
            const dx = CORE_X - enemy.x;
            const dy = CORE_Y - enemy.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist > 100) {
               enemy.x += (dx / dist) * 100;
               enemy.y += (dy / dist) * 100;
            }
            enemy.blinkTimer = 0;
         }
      }
      
      // Charger / Dasher mechanics
      if (enemy.type === 'CHARGER' || enemy.type === 'DASHER' || enemy.type === 'LIGHTNING_BUG') {
         enemy.dashCooldown = (enemy.dashCooldown || 0) + deltaTime;
         const threshold = enemy.type === 'LIGHTNING_BUG' ? 1.5 : (enemy.type === 'DASHER' ? 2 : 4);
         if (enemy.dashCooldown > threshold) {
            const dx = CORE_X - enemy.x;
            const dy = CORE_Y - enemy.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist > 50) {
               const dashDist = enemy.type === 'LIGHTNING_BUG' ? 150 : 80;
               enemy.x += (dx / dist) * Math.min(dist, dashDist);
               enemy.y += (dy / dist) * Math.min(dist, dashDist);
            }
            // phase dash makes them momentarily invincible
            if (enemy.type === 'LIGHTNING_BUG') { enemy.invincibleTimer = 0.5; }
            enemy.dashCooldown = 0;
         }
      }

      // Ghost / Phase mechanics
      if (enemy.type === 'GHOST' || enemy.type === 'PHASE') {
         enemy.phaseTimer = (enemy.phaseTimer || 0) + deltaTime;
         if (enemy.phaseTimer > 5) {
            enemy.invincibleTimer = enemy.type === 'GHOST' ? 2.0 : 1.0;
            enemy.phaseTimer = 0;
         }
      }
      if (enemy.invincibleTimer && enemy.invincibleTimer > 0) {
         enemy.invincibleTimer -= deltaTime;
      }

      // Illusion mechanics
      if (enemy.type === 'ILLUSION' || enemy.type === 'AFTERIMAGE' || enemy.type === 'BOSS_CLONE_AIDE') {
         enemy.illusionTimer = (enemy.illusionTimer || 0) + deltaTime;
         if (enemy.illusionTimer > 7 && this.enemies.length < 50) {
            // Spawn clone
            this.enemies.push({
               ...enemy,
               id: Math.random().toString(36), hp: enemy.maxHp * 0.2, maxHp: enemy.maxHp * 0.2, type: 'CLONE_ILLUSION', name: 'ILLUSION CLONE'
            });
            enemy.illusionTimer = 0;
         }
      }

      // Nest mechanics
      if (enemy.type === 'NEST') {
         enemy.summonTimer = (enemy.summonTimer || 0) + deltaTime;
         if (enemy.summonTimer > 5) {
            // Spawn swarm
            this.enemies.push({
               id: Math.random().toString(36), type: 'SWARM', name: 'SWARM', isBoss: false,
               x: enemy.x + (Math.random()-0.5)*20, y: enemy.y + (Math.random()-0.5)*20,
               hp: 5, maxHp: 5, speed: 1.5, damage: 1, reward: 0, angle: 0, radius: 5, defense: 0
            });
            enemy.summonTimer = 0;
         }
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
        // Ranged enemies
        const rangedTypes = new Set([
          'SHOOTER','SNIPER','JAMMER','MORTAR','ELECTROMANCER','POISON_SNIPER','FROST_SNIPER','CURSE_CASTER','VOID_SNIPER','SPLIT_ARTILLERY','SUPPORT_GUNNER'
        ]);
        const isRanged = rangedTypes.has(enemy.type);
        const range = enemy.type === 'SNIPER' ? 350 : (enemy.type === 'MORTAR' ? 300 : 220);

        if (isRanged && dist < range) {
           enemy.shootTimer = (enemy.shootTimer || 0) + deltaTime * 1000;
              const shootInterval = enemy.type === 'SNIPER' ? 4000 : (enemy.type === 'MORTAR' ? 3000 : 2000);
              if (enemy.shootTimer > shootInterval) {
              const projDmg = enemy.type === 'SNIPER' ? enemy.damage * 3 : (enemy.type === 'MORTAR' ? enemy.damage * 2 : enemy.damage);
              const projColor = enemy.type === 'JAMMER' || enemy.type === 'CURSE_CASTER' ? '#A855F7' : '#FF4D00';
              this.projectiles.push({
                id: Math.random().toString(36),
                x: enemy.x, y: enemy.y, targetId: 'CORE',
                damage: projDmg, speed: enemy.type === 'SNIPER' ? 0.8 : 0.3,
                color: projColor, type: 'ENEMY'
              });
              enemy.shootTimer = 0;
           }
        } else if (enemy.type === 'GOLD_SLIME') {
           // Run away from core
           let speedMult = this.isUltActive && core.type === 'DEFENSE' ? 0.2 : 1; 
           speedMult *= enemiesSpeedMult;
           if (enemy.slowTimer && enemy.slowTimer > 0) speedMult *= (1 - (enemy.slowAmount || 0));
           if ((enemy.freezeTimer && enemy.freezeTimer > 0) || (enemy.stunTimer && enemy.stunTimer > 0)) speedMult = 0;
           
           enemy.x -= (dx / dist) * enemy.speed * deltaTime * 60 * speedMult;
           enemy.y -= (dy / dist) * enemy.speed * deltaTime * 60 * speedMult;
           
           // If they get too far, they "escape"
           if (dist > CANVAS_SIZE) enemy.hp = 0; // dies without dropping reward
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

          if (enemy.type === 'SKIMMER' && dist > 150) {
             const angleToCore = Math.atan2(dy, dx);
             const skimAngle = angleToCore + Math.PI / 4 * (enemy.id.charCodeAt(0)%2===0?1:-1);
             enemy.x += Math.cos(skimAngle) * enemy.speed * deltaTime * 60 * speedMult;
             enemy.y += Math.sin(skimAngle) * enemy.speed * deltaTime * 60 * speedMult;
          } else {
             enemy.x += (dx / dist) * enemy.speed * deltaTime * 60 * speedMult;
             enemy.y += (dy / dist) * enemy.speed * deltaTime * 60 * speedMult;
          }
          if (enemy.prefix === '분노한' && enemy.hp < enemy.maxHp * 0.5) enemy.speed *= 1.001;
        }
      } else {
        // Hit Core
        if (enemy.type === 'THIEF') {
           // Thief steals coins instead of doing damage
           // Handled in main app or just reduce reward
           onCoreDamage(1); // minimal damage
           enemy.hp = 0; // Dies when hitting core
        } else {
           const actualDmg = Math.max(1, enemy.damage - core.defense);
           onCoreDamage(actualDmg);
           
           // REFLECTOR Module
           const reflectorCount = this.modules.filter(m => m.type === 'REFLECTOR').length;
           if (reflectorCount > 0) {
              enemy.hp -= actualDmg * reflectorCount * 2 * reflectMult;
              if (enemy.hp <= 0 && enemy.maxHp > 0) {
                onEnemyKill(enemy.reward, enemy.type === 'BOSS', false, enemy, 'REFLECT');
                enemy.maxHp = -1;
              }
           }

           // ABSORPTION_RING Module
           const absorbCount = this.modules.filter(m => m.type === 'ABSORPTION_RING').length;
           if (absorbCount > 0 && core.hp < core.maxHp) {
              core.hp = Math.min(core.maxHp, core.hp + absorbCount * 2);
           }

           if (enemy.type === 'BACKFLOW') {
             onCoreDamage(2);
           }
           if (!enemy.isBoss && enemy.type !== 'BOSS') {
             enemy.hp = 0;
           } else {
             // Boss just keeps dealing damage over time
             enemy.x -= (dx / dist) * 10;
             enemy.y -= (dy / dist) * 10;
           }
        }
      }
    });

    // Clean up dead enemies, award points if ult killed them
    this.enemies = this.enemies.filter(e => {
       if (e.hp <= 0 && e.maxHp > 0) {
         if ((e.prefix === '분열하는' || ['EGG_SACK','SPLITTER','ARMORED_SPIDER'].includes(e.type)) && this.enemies.length < 120) {
           for (let i = 0; i < 2; i++) {
             this.enemies.push({
               id: Math.random().toString(36),
               type: 'SWARM',
               name: 'SWARM',
               isBoss: false,
               x: e.x + (Math.random() - 0.5) * 30,
               y: e.y + (Math.random() - 0.5) * 30,
               hp: Math.max(2, e.maxHp * 0.2),
               maxHp: Math.max(2, e.maxHp * 0.2),
               speed: 1.3,
               damage: Math.max(1, e.damage * 0.5),
               reward: Math.max(0, Math.floor(e.reward * 0.3)),
               angle: 0,
               radius: 5,
               defense: 0
             });
           }
         }
         if (e.prefix === '화염의') {
           this.enemies.forEach(n => {
             const dist = Math.sqrt((n.x - e.x) ** 2 + (n.y - e.y) ** 2);
             if (dist < 80) n.hp -= e.maxHp * 0.1;
           });
         }
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

         const method = this.isUltActive ? 'ULT' : (e.burnTimer && e.burnTimer > 0 ? 'BURN' : 'PROJECTILE');
         onEnemyKill(e.reward, e.type === 'BOSS', this.isUltActive, e, method);
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
                  if (target.hp <= 0 && target.maxHp > 0) {
                    onEnemyKill(target.reward, target.type === 'BOSS', false, target, 'SUMMON');
                    target.maxHp = -1;
                  }
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
                    e.x -= (e.x - s.x) * 2 * blackholePullMult * deltaTime;
                    e.y -= (e.y - s.y) * 2 * blackholePullMult * deltaTime;
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
          if (target.evasion && Math.random() < target.evasion) {
             // Avoided
             if (p.type !== 'PIERCE' && p.type !== 'LASER_BEAM') p.damage = 0;
          } else {
              let actualDmg = p.damage;
              if (target.defense) actualDmg = Math.max(1, actualDmg - target.defense);
              
              if (target.shield !== undefined && target.shield > 0) {
                  if (target.shield >= actualDmg) {
                      target.shield -= actualDmg;
                      actualDmg = 0;
                  } else {
                      actualDmg -= target.shield;
                      target.shield = 0;
                  }
              }

              if (actualDmg > 0) {
                 if (target.vulnTimer && target.vulnTimer > 0) actualDmg *= 1.5;
                 target.hp -= actualDmg;
                 if (target.reflect && target.reflect > 0) {
                    onCoreDamage(Math.max(1, actualDmg * target.reflect * 0.2));
                 }
              }
              
              if (p.hitSet) p.hitSet.add(target.id);

              // Apply special effects on hit based on projectile type
              if (p.type === 'EXPLOSIVE' || p.type === 'MISSILE') {
                 this.enemies.forEach(e => {
                    const edist = Math.sqrt((e.x - target!.x)**2 + (e.y - target!.y)**2);
                    if (edist < (p.explosionRadius || (p.type === 'MISSILE' ? 40 : 50))) {
                       let splDmg = p.damage * 0.5;
                       if (e.defense) splDmg = Math.max(1, splDmg - e.defense);
                       if (e.shield !== undefined && e.shield > 0) {
                          e.shield = Math.max(0, e.shield - splDmg);
                          splDmg = 0; // simplistic, assume shield absorbs
                       }
                       e.hp -= splDmg;
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
          }
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
    
    let baseHp = 10 + wave * 5;
    let baseSpd = 0.05 + Math.random() * 0.03;
    let baseDmg = 5 + Math.floor(wave / 3);
    let reward = Math.floor(1 + wave / 5);
    const enemyCatalog = [
      { t: 'WALKER', w: 1, h: 1, s: 1, d: 1 }, { t: 'RUNNER', w: 1, h: 0.55, s: 1.5, d: 0.6 }, { t: 'CRAWLER', w: 1, h: 0.8, s: 0.7, d: 0.8 },
      { t: 'TANKER', w: 4, h: 3.8, s: 0.55, d: 1.7 }, { t: 'SWARM', w: 6, h: 0.35, s: 1.8, d: 0.3 }, { t: 'BRUTE', w: 10, h: 2.8, s: 0.9, d: 2.3 },
      { t: 'CHARGER', w: 10, h: 1.5, s: 0.9, d: 1.8 }, { t: 'SLASHER', w: 10, h: 1.2, s: 1.2, d: 2.5 }, { t: 'VULTURE', w: 12, h: 1.1, s: 1.3, d: 1.6 },
      { t: 'STONEBACK', w: 8, h: 2.1, s: 0.6, d: 1.1 }, { t: 'SPRINTER', w: 8, h: 0.35, s: 2.2, d: 0.5 }, { t: 'BLINKER', w: 15, h: 0.9, s: 1.1, d: 1.0 },
      { t: 'SKIMMER', w: 12, h: 0.85, s: 1.6, d: 1.1 }, { t: 'DASHER', w: 15, h: 1.0, s: 1.1, d: 1.2 }, { t: 'GHOST', w: 18, h: 0.8, s: 1.1, d: 1.0 },
      { t: 'EVADER', w: 15, h: 0.8, s: 1.2, d: 1.1 }, { t: 'PHASE', w: 20, h: 0.7, s: 1.5, d: 1.1 }, { t: 'NEEDLE', w: 18, h: 0.5, s: 2.3, d: 1.8 },
      { t: 'LIGHTNING_BUG', w: 22, h: 0.45, s: 2.5, d: 0.7 }, { t: 'ILLUSION', w: 25, h: 1.0, s: 1.0, d: 1.0 },
      { t: 'ARMORED', w: 14, h: 2.2, s: 0.55, d: 1.1 }, { t: 'SHIELDER', w: 16, h: 1.6, s: 0.7, d: 1.0 }, { t: 'IRON_BEETLE', w: 20, h: 2.5, s: 0.45, d: 1.3 },
      { t: 'CRYSTAL', w: 22, h: 1.8, s: 0.7, d: 1.1 }, { t: 'REGENERATOR', w: 24, h: 1.6, s: 0.8, d: 1.0 }, { t: 'BARRIER_GUARD', w: 25, h: 1.5, s: 0.8, d: 1.0 },
      { t: 'FORTRESS_BUG', w: 28, h: 3.0, s: 0.35, d: 1.2 }, { t: 'ARMORED_SPIDER', w: 30, h: 2.2, s: 0.7, d: 1.4 },
      { t: 'SHOOTER', w: 8, h: 1.0, s: 0.7, d: 1.4 }, { t: 'SNIPER', w: 15, h: 0.9, s: 0.55, d: 2.0 }, { t: 'MORTAR', w: 20, h: 1.2, s: 0.5, d: 2.2 },
      { t: 'ELECTROMANCER', w: 20, h: 1.2, s: 0.7, d: 1.3 }, { t: 'POISON_SNIPER', w: 22, h: 1.1, s: 0.6, d: 1.3 }, { t: 'FROST_SNIPER', w: 24, h: 1.1, s: 0.6, d: 1.3 },
      { t: 'CURSE_CASTER', w: 26, h: 1.1, s: 0.6, d: 1.1 }, { t: 'VOID_SNIPER', w: 28, h: 1.1, s: 0.6, d: 1.8 }, { t: 'SPLIT_ARTILLERY', w: 30, h: 1.3, s: 0.55, d: 1.8 },
      { t: 'SUPPORT_GUNNER', w: 30, h: 1.2, s: 0.7, d: 0.9 },
      { t: 'EGG_SACK', w: 16, h: 1.5, s: 0.5, d: 0.8 }, { t: 'NEST', w: 25, h: 3.0, s: 0.2, d: 0.5 }, { t: 'HIVE_MOTHER', w: 28, h: 2.3, s: 0.5, d: 1.2 },
      { t: 'SPLITTER', w: 24, h: 1.6, s: 0.8, d: 1.0 }, { t: 'PARASITE', w: 27, h: 0.9, s: 1.2, d: 1.2 }, { t: 'HATCHER', w: 30, h: 1.5, s: 0.7, d: 1.1 },
      { t: 'SPORE', w: 30, h: 1.2, s: 0.8, d: 1.0 }, { t: 'SWARM_MAGE', w: 34, h: 1.4, s: 0.7, d: 1.0 }, { t: 'MULTIPLIER', w: 36, h: 2.0, s: 0.6, d: 1.1 },
      { t: 'RIFT_BROODER', w: 38, h: 1.8, s: 0.6, d: 1.2 },
      { t: 'JAMMER', w: 20, h: 1.5, s: 0.5, d: 1.1 }, { t: 'HACKER', w: 24, h: 1.1, s: 0.8, d: 1.0 }, { t: 'SLOW_CASTER', w: 24, h: 1.2, s: 0.7, d: 1.0 },
      { t: 'SILENCER', w: 27, h: 1.3, s: 0.7, d: 1.0 }, { t: 'ABSORBER', w: 30, h: 1.5, s: 0.6, d: 1.1 }, { t: 'CORROSIVE', w: 30, h: 1.3, s: 0.7, d: 1.2 },
      { t: 'DISTORTER', w: 33, h: 1.4, s: 0.7, d: 1.0 }, { t: 'DISTRIBUTOR', w: 35, h: 1.6, s: 0.7, d: 1.0 }, { t: 'CLOAKER', w: 36, h: 1.2, s: 0.8, d: 1.0 },
      { t: 'BACKFLOW', w: 36, h: 1.3, s: 0.8, d: 1.3 },
      { t: 'THIEF', w: 30, h: 0.9, s: 2.0, d: 0.5 }, { t: 'TAX_COLLECTOR', w: 35, h: 1.2, s: 0.8, d: 1.0 }, { t: 'GREED_BUG', w: 35, h: 1.3, s: 0.9, d: 1.1 },
      { t: 'VAULT_BEAST', w: 36, h: 4.5, s: 0.4, d: 2.0 }, { t: 'FAKE_TREASURE', w: 38, h: 1.2, s: 0.9, d: 1.0 }, { t: 'DEBTOR', w: 40, h: 1.4, s: 0.8, d: 1.2 },
      { t: 'GOLD_SLIME', w: 32, h: 10, s: 1.2, d: 0 }, { t: 'REWARD_PREDATOR', w: 42, h: 1.6, s: 0.7, d: 1.2 }, { t: 'TRIBUTE_COLLECTOR', w: 42, h: 1.8, s: 0.7, d: 1.3 },
      // Additional spec-complete variants (aliases / boss aides / elemental set)
      { t: 'AFTERIMAGE', w: 24, h: 0.9, s: 1.6, d: 1.1 }, { t: 'SHELL_BEAST', w: 26, h: 2.0, s: 0.6, d: 1.2 },
      { t: 'FORCE_FIELD', w: 28, h: 1.9, s: 0.7, d: 1.1 }, { t: 'HEAVY_ARMOR_SPIDER', w: 30, h: 2.2, s: 0.7, d: 1.4 },
      { t: 'MIMIC_TREASURE', w: 38, h: 1.2, s: 1.0, d: 1.0 }, { t: 'MINING_SABOTEUR', w: 40, h: 1.3, s: 0.8, d: 1.1 },
      { t: 'OFFERING_COLLECTOR', w: 42, h: 1.9, s: 0.7, d: 1.3 },
      { t: 'BOSS_SHIELD_AIDE', w: 30, h: 1.5, s: 0.8, d: 0.8 }, { t: 'BOSS_HEAL_AIDE', w: 30, h: 1.3, s: 0.9, d: 0.8 },
      { t: 'BOSS_RAGE_AIDE', w: 32, h: 1.4, s: 0.9, d: 1.0 }, { t: 'BOSS_SPEED_AIDE', w: 32, h: 1.2, s: 1.2, d: 0.8 },
      { t: 'BOSS_RIFT_AIDE', w: 34, h: 1.4, s: 0.8, d: 1.0 }, { t: 'BOSS_SILENCE_AIDE', w: 34, h: 1.3, s: 0.9, d: 1.0 },
      { t: 'BOSS_RESONANCE_AIDE', w: 36, h: 1.5, s: 0.8, d: 1.1 }, { t: 'BOSS_VOID_AIDE', w: 36, h: 1.4, s: 0.9, d: 1.1 },
      { t: 'BOSS_SACRIFICE_AIDE', w: 38, h: 1.5, s: 0.8, d: 1.1 }, { t: 'BOSS_CLONE_AIDE', w: 38, h: 1.4, s: 0.9, d: 1.0 },
      { t: 'FLAME_ELEMENTAL', w: 24, h: 1.1, s: 1.0, d: 1.1 }, { t: 'FROST_ELEMENTAL', w: 24, h: 1.1, s: 0.9, d: 1.1 },
      { t: 'LIGHTNING_ELEMENTAL', w: 26, h: 1.0, s: 1.2, d: 1.1 }, { t: 'DARK_ELEMENTAL', w: 26, h: 1.2, s: 1.0, d: 1.2 },
      { t: 'LIGHT_ELEMENTAL', w: 28, h: 1.2, s: 1.0, d: 1.2 }, { t: 'TOXIC_ELEMENTAL', w: 28, h: 1.1, s: 1.0, d: 1.1 },
      { t: 'METAL_ELEMENTAL', w: 30, h: 1.8, s: 0.7, d: 1.2 }, { t: 'GHOST_ELEMENTAL', w: 30, h: 1.0, s: 1.1, d: 1.0 },
      { t: 'VOID_ELEMENTAL', w: 32, h: 1.4, s: 0.9, d: 1.3 }, { t: 'NEBULA_ELEMENTAL', w: 34, h: 1.5, s: 1.0, d: 1.3 },
      // Canonical names requested in the spec
      { t: 'GHOST_RUNNER', w: 18, h: 0.8, s: 1.1, d: 1.0 }, { t: 'PHASE_BUG', w: 20, h: 0.7, s: 1.5, d: 1.1 },
      { t: 'SHIELD_BEARER', w: 16, h: 1.6, s: 0.7, d: 1.0 }, { t: 'IRONCLAD_BUG', w: 20, h: 2.5, s: 0.45, d: 1.3 },
      { t: 'FORTRESS_WORM', w: 28, h: 3.0, s: 0.35, d: 1.2 }, { t: 'HEAVY_ARMORED_SPIDER', w: 30, h: 2.2, s: 0.7, d: 1.4 },
      { t: 'NEST_MONSTER', w: 25, h: 3.0, s: 0.2, d: 0.5 }, { t: 'SWARM_SUMMONER', w: 34, h: 1.4, s: 0.7, d: 1.0 },
      { t: 'RIFT_SCATTERER', w: 38, h: 1.8, s: 0.6, d: 1.2 }, { t: 'THIEF_RAT', w: 30, h: 0.9, s: 2.0, d: 0.5 }
    ];
    const hiddenPool = [
      { t: 'VOID_WATCHER', cond: !this.usedUltThisWave && wave >= 35, h: 2.2, s: 1.2, d: 1.5 },
      { t: 'TIME_RELIC', cond: core.id.includes('time') && wave >= 30, h: 1.8, s: 1.1, d: 1.3 },
      { t: 'GRAVITY_DEVOURER', cond: core.id.includes('gravity') && wave >= 30, h: 2.0, s: 1.0, d: 1.4 },
      { t: 'GOLD_WRAITH', cond: core.type === 'ECONOMIC' && wave >= 30, h: 1.5, s: 2.0, d: 1.0 },
      { t: 'SILENT_STAR', cond: core.id.includes('silence') && wave >= 35, h: 2.0, s: 1.0, d: 1.6 },
      { t: 'MIRROR_HUNTER', cond: core.id.includes('copy') && wave >= 35, h: 1.8, s: 1.2, d: 1.4 },
      { t: 'COLLAPSE_BEAST', cond: core.id.includes('overheat') && wave >= 35, h: 2.2, s: 1.0, d: 1.8 },
      { t: 'NAMELESS_SHADOW', cond: core.id.includes('nameless') && wave >= 35, h: 2.0, s: 1.1, d: 1.5 },
      { t: 'ABYSS_EYE', cond: wave >= 45, h: 2.4, s: 1.0, d: 1.8 },
      { t: 'OMEGA_SHARD', cond: core.id.includes('omega') && wave >= 45, h: 2.5, s: 1.0, d: 2.0 }
    ];
    let availablePool: any[] = enemyCatalog.filter(e => wave >= e.w);
    hiddenPool.filter(h => h.cond).forEach(h => { if (Math.random() < 0.04) availablePool.push(h); });
    const picked = availablePool[Math.floor(Math.random() * availablePool.length)] || enemyCatalog[0];
    let type = picked.t;
    let hpMult = picked.h;
    let spdMult = picked.s;
    let dmgMult = picked.d;

    let finalHp = baseHp * hpMult;
    let finalSpd = baseSpd * spdMult;
    let finalDmg = baseDmg * dmgMult;
    
    let isElite = false;
    let prefix = '';
    let defense = 0; let shield = 0; let maxShield = 0;
    let evasion = 0; let regen = 0; let reflect = 0;

    // Elite generation
    if (wave > 15 && Math.random() < 0.14) {
       isElite = true;
       const prefixes = ['거대한','재빠른','분열하는','반사하는','재생하는','무장한','은폐한','분노한','흡수하는','저주받은','황금의','공허의','빙결의','화염의','전격의','심연의','복제하는','도망치는','봉쇄하는','오메가'];
       prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
       
       if (prefix === '거대한') { finalHp *= 3; finalSpd *= 0.8; }
       if (prefix === '재빠른') { finalSpd *= 2; }
       if (prefix === '무장한') { defense = Math.floor(wave / 2); finalHp *= 1.5; }
       if (prefix === '황금의') { reward *= 5; finalHp *= 2; }
       if (prefix === '재생하는') { regen = finalHp * 0.05; }
       if (prefix === '은폐한') { evasion = 0.3; }
       if (prefix === '반사하는') { reflect = 0.25; }
       if (prefix === '저주받은') { finalDmg *= 1.3; }
       if (prefix === '빙결의') { finalSpd *= 0.9; }
       if (prefix === '전격의') { finalSpd *= 1.3; defense += Math.floor(wave / 3); }
       if (prefix === '심연의') { finalHp *= 1.8; finalDmg *= 1.5; }
       if (prefix === '오메가') { finalHp *= 2.2; finalDmg *= 1.8; defense += Math.floor(wave / 2); evasion = 0.2; regen = finalHp * 0.03; }
    }

    if (['ARMORED','IRON_BEETLE','FORTRESS_BUG','VAULT_BEAST','TRIBUTE_COLLECTOR'].includes(type)) defense += Math.floor(wave / 3);
    if (type === 'SHIELDER') { maxShield = finalHp; shield = finalHp; }
    if (['BARRIER_GUARD','VOID_WATCHER','OMEGA_SHARD'].includes(type)) { maxShield = finalHp * 0.8; shield = maxShield; }
    if (['EVADER','GHOST','CLOAKER'].includes(type)) evasion = Math.max(evasion, 0.2);
    if (['REGENERATOR','HIVE_MOTHER'].includes(type)) regen = Math.max(regen, finalHp * 0.02);
    if (type === 'CRYSTAL') reflect = Math.max(reflect, 0.2);
    if (type === 'GOLD_SLIME') { reward *= 10; }
    
    // Economic core features
    if (core.id.includes('greed')) { reward *= 3; finalHp *= 1.5; finalDmg *= 1.5; }
    if (core.id.includes('gold')) { reward *= 5; }
    if (core.id.includes('harvest') && Math.random() < 0.1) { type = 'TANKER'; finalHp *= 2; reward *= 3; }

    this.enemies.push({
      id: Math.random().toString(36),
      type: type,
      name: prefix ? `${prefix} ${type}` : type,
      prefix: prefix,
      isBoss: false,
      isElite: isElite,
      x: CORE_X + Math.cos(angle) * dist,
      y: CORE_Y + Math.sin(angle) * dist,
      hp: Math.floor(finalHp),
      maxHp: Math.floor(finalHp),
      defense: defense,
      shield: shield,
      maxShield: maxShield,
      evasion: evasion,
      regen: regen,
      reflect: reflect,
      speed: Math.min(finalSpd, 1.0),
      damage: Math.floor(finalDmg),
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
      name: `Wave ${wave} Boss`,
      isBoss: true,
      x: CORE_X + Math.cos(angle) * dist,
      y: CORE_Y + Math.sin(angle) * dist,
      hp: 200 + wave * 50,
      maxHp: 200 + wave * 50,
      speed: 0.02,
      damage: 15 + wave,
      defense: Math.floor(wave / 2),
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
      
      // Determine color and size
      if (e.type === 'TANKER') { color = '#374151'; size = 12; }
      else if (e.type === 'BRUTE') { color = '#7F1D1D'; size = 15; }
      else if (e.type === 'SHOOTER' || e.type === 'SNIPER') { color = '#a8a29e'; size = e.type === 'SNIPER' ? 10 : 7; }
      else if (e.type === 'SWARM') { color = '#22C55E'; size = 5; }
      else if (e.type === 'ARMORED') { color = '#64748B'; size = 12; }
      else if (e.type === 'SHIELDER') { color = '#06B6D4'; size = 10; }
      else if (e.type === 'NEST') { color = '#C084FC'; size = 14; }
      else if (e.type === 'JAMMER') { color = '#8B5CF6'; size = 9; }
      else if (e.type === 'THIEF') { color = '#10B981'; size = 7; }
      else if (e.type === 'GOLD_SLIME') { color = '#FBED4A'; size = 12; }
      else if (e.type === 'BLINKER') { color = '#D946EF'; size = 8; }
      else if (e.type === 'BOSS') { color = '#EF4444'; size = 20; }
      
      if (e.isElite) {
         size += 3;
         ctx.shadowBlur = 15;
         ctx.shadowColor = '#F59E0B'; // Elite aura
      }

      ctx.fillStyle = color;
      ctx.beginPath();
      // Boss has hex shape
      if (e.type === 'BOSS') {
         for(let i=0; i<6; i++) {
           const a = (i/6) * Math.PI*2;
           if(i===0) ctx.moveTo(e.x + Math.cos(a)*size, e.y + Math.sin(a)*size);
           else ctx.lineTo(e.x + Math.cos(a)*size, e.y + Math.sin(a)*size);
         }
      } else if (e.type === 'ARMORED' || e.type === 'TANKER') {
         // Rectangle
         ctx.rect(e.x - size, e.y - size, size * 2, size * 2);
      } else if (e.type === 'NEST' || e.type === 'SWARM') {
         // Star or bumpy shape
         for(let i=0; i<8; i++) {
            const a = (i/8) * Math.PI*2;
            const r = i%2===0 ? size : size*0.5;
            if(i===0) ctx.moveTo(e.x + Math.cos(a)*r, e.y + Math.sin(a)*r);
            else ctx.lineTo(e.x + Math.cos(a)*r, e.y + Math.sin(a)*r);
         }
      } else {
         ctx.arc(e.x, e.y, size, 0, Math.PI * 2);
      }
      ctx.fill();
      ctx.shadowBlur = 0; // reset
      
      // Draw shield if present
      if (e.shield !== undefined && e.shield > 0) {
         ctx.strokeStyle = '#22D3EE';
         ctx.lineWidth = 2;
         ctx.beginPath();
         ctx.arc(e.x, e.y, size + 4, 0, Math.PI * 2);
         ctx.stroke();
         ctx.lineWidth = 1;
      }

      // Health bar
      ctx.fillStyle = '#1A1A1E';
      ctx.fillRect(e.x - 10, e.y - size - 10, 20, 3);
      ctx.fillStyle = color;
      ctx.fillRect(e.x - 10, e.y - size - 10, Math.max(0, (e.hp / e.maxHp)) * 20, 3);
      
      // Shield bar
      if (e.shield !== undefined && e.shield > 0 && e.maxShield) {
         ctx.fillStyle = '#22D3EE';
         ctx.fillRect(e.x - 10, e.y - size - 13, Math.max(0, (e.shield / e.maxShield)) * 20, 2);
      }

      // Name for Elite/Boss
      if ((e.isElite || e.isBoss) && e.name) {
         ctx.fillStyle = '#FFFFFF';
         ctx.font = '10px sans-serif';
         ctx.textAlign = 'center';
         ctx.fillText(e.name, e.x, e.y - size - 16);
      }
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
