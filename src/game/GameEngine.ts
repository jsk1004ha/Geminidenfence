import { Enemy, Projectile, CoreStats, OrbitalModule } from '../types';
import { CORE_X, CORE_Y, CANVAS_SIZE } from '../constants';

export class GameEngine {
  enemies: Enemy[] = [];
  projectiles: Projectile[] = [];
  modules: OrbitalModule[] = [];
  lastShotTime: number = 0;
  
  constructor() {}

  update(core: CoreStats, deltaTime: number, wave: number, onEnemyKill: (reward: number) => void, onCoreDamage: (dmg: number) => void, onWaveComplete: () => void) {
    // 1. Spawn logic
    const targetEnemyCount = 10 + Math.floor(wave * 2);
    const totalSpawnedInWave = this.spawnedThisWave;
    
    if (this.enemies.length === 0 && totalSpawnedInWave >= targetEnemyCount) {
       onWaveComplete();
       this.spawnedThisWave = 0;
       return;
    }

    if (totalSpawnedInWave < targetEnemyCount && this.enemies.length < 5 + Math.floor(wave / 2)) {
      this.spawnEnemy(wave);
      this.spawnedThisWave++;
    }

    // 2. Update Modules
    this.modules.forEach(m => {
      m.angle += m.rotationSpeed * deltaTime;
      
      const mx = CORE_X + Math.cos(m.angle) * m.distance;
      const my = CORE_Y + Math.sin(m.angle) * m.distance;

      // Close combat for orbiters
      this.enemies.forEach(e => {
        const dx = mx - e.x;
        const dy = my - e.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 15) {
          e.hp -= m.damage * deltaTime;
          if (e.hp <= 0) onEnemyKill(e.reward);
        }
      });
    });

    // 3. Update Enemies
    this.enemies.forEach(enemy => {
      const dx = CORE_X - enemy.x;
      const dy = CORE_Y - enemy.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      if (dist > 30) {
        enemy.x += (dx / dist) * enemy.speed * deltaTime * 60;
        enemy.y += (dy / dist) * enemy.speed * deltaTime * 60;
      } else {
        // Hit Core
        const actualDmg = Math.max(1, enemy.damage - core.defense);
        onCoreDamage(actualDmg);
        enemy.hp = 0; // Destroy after hit
      }
    });

    // Handle Core Regen
    if (core.hp < core.maxHp) {
      core.hp = Math.min(core.maxHp, core.hp + core.regen * deltaTime);
    }

    this.enemies = this.enemies.filter(e => e.hp > 0);

    // 4. Shooting logic
    this.lastShotTime += deltaTime * 1000;
    if (this.lastShotTime >= core.attackSpeed) {
      const target = this.findNearestWithinRange(core.range);
      if (target) {
        this.projectiles.push({
          id: Math.random().toString(36),
          x: CORE_X,
          y: CORE_Y,
          targetId: target.id,
          damage: core.attackDamage,
          speed: 0.8,
          color: core.color,
          type: 'NORMAL'
        });
        this.lastShotTime = 0;
      }
    }

    // 5. Update Projectiles
    this.projectiles.forEach(p => {
      const target = this.enemies.find(e => e.id === p.targetId);
      if (!target) {
        p.damage = 0; // Orphaned bullet
        return;
      }
      
      const dx = target.x - p.x;
      const dy = target.y - p.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      if (dist < 15) {
        target.hp -= p.damage;
        if (target.hp <= 0) onEnemyKill(target.reward);
        p.damage = 0;
      } else {
        p.x += (dx / dist) * p.speed * deltaTime * 1000;
        p.y += (dy / dist) * p.speed * deltaTime * 1000;
      }
    });
    this.projectiles = this.projectiles.filter(p => p.damage > 0);
  }

  spawnedThisWave: number = 0;

  spawnEnemy(wave: number) {
    const angle = Math.random() * Math.PI * 2;
    const dist = CANVAS_SIZE / 2 + 50;
    this.enemies.push({
      id: Math.random().toString(36),
      type: 'runner',
      x: CORE_X + Math.cos(angle) * dist,
      y: CORE_Y + Math.sin(angle) * dist,
      hp: 20 + wave * 5,
      maxHp: 20 + wave * 5,
      speed: 0.05 + Math.random() * 0.05,
      damage: 5 + Math.floor(wave / 5),
      reward: 1 + Math.floor(wave / 10),
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
    ctx.strokeStyle = 'rgba(0, 240, 255, 0.05)';
    ctx.lineWidth = 1;
    for(let i=0; i<CANVAS_SIZE; i+=40) {
      ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, CANVAS_SIZE); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(CANVAS_SIZE, i); ctx.stroke();
    }

    // Draw Core
    ctx.shadowBlur = 30;
    ctx.shadowColor = core.color;
    ctx.fillStyle = core.color;
    ctx.beginPath();
    ctx.arc(CORE_X, CORE_Y, 20 + Math.sin(Date.now() / 300) * 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Range circle
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.beginPath();
    ctx.arc(CORE_X, CORE_Y, core.range, 0, Math.PI * 2);
    ctx.stroke();

    // Draw Orbital Modules
    this.modules.forEach(m => {
      const mx = CORE_X + Math.cos(m.angle) * m.distance;
      const my = CORE_Y + Math.sin(m.angle) * m.distance;
      
      ctx.fillStyle = '#00F0FF';
      ctx.shadowBlur = 10;
      ctx.shadowColor = '#00F0FF';
      ctx.beginPath();
      ctx.arc(mx, my, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
      
      // Module connector
      ctx.strokeStyle = 'rgba(0, 240, 255, 0.2)';
      ctx.beginPath();
      ctx.moveTo(CORE_X, CORE_Y);
      ctx.lineTo(mx, my);
      ctx.stroke();
    });

    // Draw Enemies
    this.enemies.forEach(e => {
      ctx.fillStyle = '#A855F7';
      ctx.beginPath();
      ctx.arc(e.x, e.y, 8, 0, Math.PI * 2);
      ctx.fill();
      
      // Health bar
      ctx.fillStyle = '#1A1A1E';
      ctx.fillRect(e.x - 10, e.y - 15, 20, 3);
      ctx.fillStyle = '#A855F7';
      ctx.fillRect(e.x - 10, e.y - 15, Math.max(0, (e.hp / e.maxHp)) * 20, 3);
    });

    // Draw Projectiles
    this.projectiles.forEach(p => {
      ctx.fillStyle = p.color;
      ctx.shadowBlur = 15;
      ctx.shadowColor = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
    });
  }
}
