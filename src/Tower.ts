import * as THREE from 'three';
import { TOWERS, UPGRADES, TowerType } from './data';
import { Enemy } from './Enemy';
import { Projectile } from './Projectile';

export class Tower {
  type: TowerType;
  position: THREE.Vector3;
  tier: number = 1;
  cooldown: number = 0;
  totalInvested: number;

  modelGroup: THREE.Group | null = null;
  weaponModel: THREE.Object3D | null = null;

  constructor(type: TowerType, position: THREE.Vector3) {
    this.type = type;
    this.position = position.clone();
    this.totalInvested = TOWERS[type].cost;
  }

  get stats() {
    const base = TOWERS[this.type];
    const upgrade = UPGRADES[this.tier - 1];
    return {
      damage: base.damage * upgrade.damageMultiplier,
      range: base.range * upgrade.rangeMultiplier,
      fireRate: base.fireRate,
      splash: base.splash ?? 0,
      pierce: (base as any).pierce ?? 0,
    };
  }

  get upgradeCost(): number {
    if (this.tier >= UPGRADES.length) return 0;
    return Math.floor(TOWERS[this.type].cost * UPGRADES[this.tier].costMultiplier);
  }

  upgrade(): boolean {
    if (this.tier >= UPGRADES.length) return false;
    const cost = this.upgradeCost; // Get cost before incrementing tier
    this.tier++;
    this.totalInvested += cost;
    return true;
  }

  findTarget(enemies: Enemy[]): Enemy | null {
    let closest: Enemy | null = null;
    let closestDist = Infinity;

    for (const enemy of enemies) {
      if (enemy.health <= 0) continue;
      const dist = this.position.distanceTo(enemy.position);
      if (dist <= this.stats.range && dist < closestDist) {
        closest = enemy;
        closestDist = dist;
      }
    }

    return closest;
  }

  update(delta: number, enemies: Enemy[], onShoot: (proj: Projectile) => void) {
    this.cooldown -= delta;

    const target = this.findTarget(enemies);

    // Rotate weapon to face target
    if (this.weaponModel && target) {
      const dir = new THREE.Vector3()
        .subVectors(target.position, this.position)
        .normalize();
      const angle = Math.atan2(dir.x, dir.z);
      this.weaponModel.rotation.y = angle;
    }

    if (this.cooldown <= 0 && target) {
      this.shoot(target, onShoot);
      this.cooldown = this.stats.fireRate;
    }
  }

  shoot(target: Enemy, onShoot: (proj: Projectile) => void) {
    // Get weapon world position for projectile spawn
    const spawnPos = this.position.clone();
    if (this.weaponModel) {
      const worldPos = new THREE.Vector3();
      this.weaponModel.getWorldPosition(worldPos);
      spawnPos.copy(worldPos);
    } else {
      spawnPos.y += 1.5;
    }

    const projectile = new Projectile(
      spawnPos,
      target.position.clone().add(new THREE.Vector3(0, 0.5, 0)),
      this.stats.damage,
      this.stats.splash,
      this.stats.pierce
    );
    onShoot(projectile);
  }
}
