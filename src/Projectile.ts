import * as THREE from 'three';

export class Projectile {
  position: THREE.Vector3;
  target: THREE.Vector3;
  direction: THREE.Vector3;
  speed: number = 15;
  damage: number;
  splash: number;
  pierce: number;
  isDead: boolean = false;
  lifetime: number = 3;
  model: THREE.Group | null = null;

  constructor(
    start: THREE.Vector3,
    target: THREE.Vector3,
    damage: number,
    splash: number = 0,
    pierce: number = 0
  ) {
    this.position = start.clone();
    this.target = target.clone();
    this.damage = damage;
    this.splash = splash;
    this.pierce = pierce;

    this.direction = new THREE.Vector3()
      .subVectors(target, start)
      .normalize();
  }

  update(delta: number) {
    this.lifetime -= delta;
    if (this.lifetime <= 0) {
      this.isDead = true;
      return;
    }

    this.position.add(
      this.direction.clone().multiplyScalar(this.speed * delta)
    );

    if (this.model) {
      this.model.position.copy(this.position);

      // Face direction of movement
      const angle = Math.atan2(this.direction.x, this.direction.z);
      this.model.rotation.y = angle;
    }
  }
}
