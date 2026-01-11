// Tower definitions
export const TOWERS = {
  turret: {
    name: 'Turret',
    cost: 50,
    damage: 10,
    range: 3,
    fireRate: 0.2, // seconds between shots
    splash: 0,
    model: 'weapon-turret',
    projectile: 'weapon-ammo-bullet',
  },
  cannon: {
    name: 'Cannon',
    cost: 100,
    damage: 40,
    range: 4,
    fireRate: 1.0,
    splash: 1.5,
    model: 'weapon-cannon',
    projectile: 'weapon-ammo-cannonball',
  },
  ballista: {
    name: 'Ballista',
    cost: 75,
    damage: 20,
    range: 5,
    fireRate: 0.6,
    splash: 0,
    pierce: 3, // hits up to 3 enemies
    model: 'weapon-ballista',
    projectile: 'weapon-ammo-arrow',
  },
  catapult: {
    name: 'Catapult',
    cost: 150,
    damage: 60,
    range: 4,
    fireRate: 2.0,
    splash: 2.5,
    model: 'weapon-catapult',
    projectile: 'weapon-ammo-boulder',
  },
} as const;

export type TowerType = keyof typeof TOWERS;

// Upgrade multipliers per tier
export const UPGRADES = [
  { damageMultiplier: 1.0, rangeMultiplier: 1.0, costMultiplier: 0 },    // Tier 1 (base)
  { damageMultiplier: 1.5, rangeMultiplier: 1.1, costMultiplier: 1.0 },  // Tier 2
  { damageMultiplier: 2.0, rangeMultiplier: 1.25, costMultiplier: 1.5 }, // Tier 3
];

// Enemy definitions
export const ENEMIES = {
  'ufo-a': {
    name: 'Scout',
    health: 30,
    speed: 2.5,
    reward: 10,
    model: 'enemy-ufo-a',
  },
  'ufo-b': {
    name: 'Fighter',
    health: 60,
    speed: 2.0,
    reward: 20,
    model: 'enemy-ufo-b',
  },
  'ufo-c': {
    name: 'Tank',
    health: 120,
    speed: 1.2,
    reward: 35,
    model: 'enemy-ufo-c',
  },
  'ufo-d': {
    name: 'Boss',
    health: 200,
    speed: 1.5,
    reward: 50,
    model: 'enemy-ufo-d',
  },
} as const;

export type EnemyType = keyof typeof ENEMIES;

// Wave configuration
export const WAVE_CONFIG = {
  baseEnemyCount: 6,
  enemiesPerWave: 2,        // additional enemies per wave
  healthMultiplierPerWave: 0.15,
  spawnInterval: 1.0,       // seconds between enemy spawns
  waveCooldown: 5.0,        // seconds between waves
  waveBonus: 25,            // gold bonus for completing a wave
};

// When each enemy type unlocks
export const ENEMY_UNLOCK_WAVES: Record<EnemyType, number> = {
  'ufo-a': 1,
  'ufo-b': 5,
  'ufo-c': 10,
  'ufo-d': 15,
};

// Game settings
export const GAME = {
  startingGold: 200,
  startingLives: 20,
  sellRefundRate: 0.6,
  tileSize: 1, // world units per tile - tiles are 1 unit
};

// Tower visual configurations - pieces to stack per tier
// Using prebuilt tower models for simplicity
export const TOWER_VISUALS = {
  turret: {
    base: 'tower-round-base',
    tiers: [
      ['tower-round-build-a'], // Tier 1 - small
      ['tower-round-build-c'], // Tier 2 - medium
      ['tower-round-build-f'], // Tier 3 - tall
    ],
  },
  cannon: {
    base: 'tower-round-base',
    tiers: [
      ['tower-round-build-b'],
      ['tower-round-build-d'],
      ['tower-round-build-f', 'tower-round-crystals'],
    ],
  },
  ballista: {
    base: 'tower-round-base',
    tiers: [
      ['tower-square-build-a'],
      ['tower-square-build-c'],
      ['tower-square-build-f'],
    ],
  },
  catapult: {
    base: 'tower-round-base',
    tiers: [
      ['tower-square-build-b'],
      ['tower-square-build-d'],
      ['tower-square-build-f'],
    ],
  },
};

// Tile mapping for level building
export const TILE_TYPES = {
  grass: 'tile',
  path: 'tile-straight',
  spawn: 'tile-spawn-round',
  end: 'tile-end-round',
  cornerNE: 'tile-corner-round', // rotation 0
  cornerSE: 'tile-corner-round', // rotation 90
  cornerSW: 'tile-corner-round', // rotation 180
  cornerNW: 'tile-corner-round', // rotation 270
  tree: 'tile-tree',
  treeDouble: 'tile-tree-double',
  crystal: 'tile-crystal',
  rock: 'tile-rock',
  hill: 'tile-hill',
};

// Decoration assets for scattering
export const DECORATIONS = [
  'detail-crystal',
  'detail-crystal-large',
  'detail-rocks',
  'detail-rocks-large',
  'detail-tree',
  'detail-tree-large',
];
