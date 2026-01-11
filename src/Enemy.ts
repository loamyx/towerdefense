import * as THREE from 'three';
import { ENEMIES, EnemyType, WAVE_CONFIG } from './data';

export class Enemy {
  type: EnemyType;
  position: THREE.Vector3;
  health: number;
  maxHealth: number;
  speed: number;
  reward: number;
  model: THREE.Group | null = null;

  path: THREE.Vector3[];
  pathIndex: number = 0;
  reachedEnd: boolean = false;

  constructor(type: string, path: THREE.Vector3[], wave: number) {
    this.type = type as EnemyType;
    this.path = path;
    this.position = path[0].clone();

    const data = ENEMIES[this.type];
    const healthMultiplier = 1 + (wave - 1) * WAVE_CONFIG.healthMultiplierPerWave;

    this.maxHealth = Math.floor(data.health * healthMultiplier);
    this.health = this.maxHealth;
    this.speed = data.speed;
    this.reward = data.reward;
  }

  static getData(type: string) {
    return ENEMIES[type as EnemyType];
  }

  takeDamage(amount: number) {
    this.health -= amount;
  }

  update(delta: number) {
    if (this.pathIndex >= this.path.length - 1) {
      this.reachedEnd = true;
      return;
    }

    const target = this.path[this.pathIndex + 1];
    const direction = new THREE.Vector3()
      .subVectors(target, this.position)
      .normalize();

    const moveDistance = this.speed * delta;
    this.position.add(direction.multiplyScalar(moveDistance));

    // Check if reached waypoint
    if (this.position.distanceTo(target) < 0.1) {
      this.pathIndex++;
    }

    // Update model position
    if (this.model) {
      this.model.position.copy(this.position);
      this.model.position.y = 0.5;

      // Face direction of movement
      const angle = Math.atan2(direction.x, direction.z);
      this.model.rotation.y = angle;
    }
  }
}
