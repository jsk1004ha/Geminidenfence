import { Enemy, Projectile, CoreStats, OrbitalModule, EnemyType } from '../types';
import { CORE_X, CORE_Y, CANVAS_SIZE } from '../constants';

export class GameEngine {
  enemies: Enemy[] = [];
  projectiles: Projectile[] = [];
  modules: OrbitalModule[] = [];
  lastShotTime: number = 0;
  spawnedThisWave: number = 0;
  isUltActive: boolean = false;
  ultTimer: number = 0;
  usedUltThisWave: boolean = false;
  
  constructor() {}

  update(core: CoreStats, deltaTime: number, wave: number, artifacts: string[], onEnemyKill: (reward: number, isBoss: boolean, byUlt: boolean) => void, onCoreDamage: (dmg: number) => void, onWaveComplete: () => void) {
    if (this.isUltActive) {
      this.ultTimer -= deltaTime;
      if (this.ultTimer <= 0) {
        this.isUltActive = false;
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

      if (m.type === 'LASER') {
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
      } else if (m.type === 'LENS') {
        // Slow aura
        this.enemies.forEach(e => {
           const dist = Math.sqrt((mx - e.x)**2 + (my - e.y)**2);
           if (dist < 100 && e.type !== 'BOSS') {
             e.x -= (e.x - mx) * 0.5 * deltaTime;
             e.y -= (e.y - my) * 0.5 * deltaTime;
           }
        });
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

    // Core Regen
    if (core.hp < core.maxHp) {
      core.hp = Math.min(core.maxHp, core.hp + core.regen * deltaTime);
    }

    // 4. Core Shooting
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
          if (p.type === 'EXPLOSIVE') {
             this.enemies.forEach(e => {
                const edist = Math.sqrt((e.x - target!.x)**2 + (e.y - target!.y)**2);
                if (edist < (p.explosionRadius || 50)) {
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

  triggerUltimate() {
    this.isUltActive = true;
    this.usedUltThisWave = true;
    this.ultTimer = 5; // 5 seconds duration
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
      ctx.arc(mx, my, m.type === 'LENS' ? 8 : 5, 0, Math.PI * 2);
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
