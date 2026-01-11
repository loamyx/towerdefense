import * as THREE from 'three';
import { WAVE_CONFIG, ENEMY_UNLOCK_WAVES, EnemyType } from './data';

export interface LevelData {
  name: string;
  grid: string[][];
  startGold?: number;
  lives?: number;
  maxWaves?: number; // Win after this many waves (default: 10)
}

export class Level {
  data: LevelData;

  constructor(data: LevelData) {
    this.data = data;
  }

  calculatePath(grid: string[][], tileSize: number, offsetX: number, offsetZ: number): THREE.Vector3[] {
    const path: THREE.Vector3[] = [];
    const visited = new Set<string>();

    // Find spawn point
    let startX = -1, startZ = -1;
    for (let z = 0; z < grid.length; z++) {
      for (let x = 0; x < grid[z].length; x++) {
        if (grid[z][x] === 'S') {
          startX = x;
          startZ = z;
          break;
        }
      }
    }

    if (startX === -1) return path;

    // BFS to find path
    const queue: { x: number; z: number; path: { x: number; z: number }[] }[] = [
      { x: startX, z: startZ, path: [{ x: startX, z: startZ }] }
    ];

    const directions = [
      { dx: 1, dz: 0 },
      { dx: -1, dz: 0 },
      { dx: 0, dz: 1 },
      { dx: 0, dz: -1 },
    ];

    while (queue.length > 0) {
      const current = queue.shift()!;
      const key = `${current.x},${current.z}`;

      if (visited.has(key)) continue;
      visited.add(key);

      const cell = grid[current.z]?.[current.x];

      if (cell === 'E') {
        // Found end, convert to world coordinates
        for (const point of current.path) {
          path.push(new THREE.Vector3(
            point.x * tileSize + offsetX,
            0,
            point.z * tileSize + offsetZ
          ));
        }
        return path;
      }

      // Explore neighbors
      for (const dir of directions) {
        const nx = current.x + dir.dx;
        const nz = current.z + dir.dz;
        const nkey = `${nx},${nz}`;

        if (visited.has(nkey)) continue;

        const neighbor = grid[nz]?.[nx];
        if (neighbor === 'P' || neighbor === 'E' || neighbor === 'S') {
          queue.push({
            x: nx,
            z: nz,
            path: [...current.path, { x: nx, z: nz }]
          });
        }
      }
    }

    return path;
  }

  generateWave(waveNumber: number): EnemyType[] {
    const enemies: EnemyType[] = [];
    const count = WAVE_CONFIG.baseEnemyCount + (waveNumber - 1) * WAVE_CONFIG.enemiesPerWave;

    // Get available enemy types for this wave
    const availableTypes = (Object.keys(ENEMY_UNLOCK_WAVES) as EnemyType[])
      .filter(type => ENEMY_UNLOCK_WAVES[type] <= waveNumber);

    for (let i = 0; i < count; i++) {
      // Weighted random - favor harder enemies as wave progresses
      let type: EnemyType;

      if (waveNumber >= 15 && Math.random() < 0.1) {
        type = 'ufo-d'; // 10% chance of boss after wave 15
      } else if (waveNumber >= 10 && Math.random() < 0.2) {
        type = 'ufo-c'; // 20% chance of tank after wave 10
      } else if (waveNumber >= 5 && Math.random() < 0.3) {
        type = 'ufo-b'; // 30% chance of fighter after wave 5
      } else {
        type = 'ufo-a'; // Default scout
      }

      // Make sure type is unlocked
      if (!availableTypes.includes(type)) {
        type = availableTypes[availableTypes.length - 1];
      }

      enemies.push(type);
    }

    return enemies;
  }
}
