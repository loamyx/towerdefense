import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { GAME, TOWERS, TowerType, TOWER_VISUALS, DECORATIONS } from './data';
import { Tower } from './Tower';
import { Enemy } from './Enemy';
import { Projectile } from './Projectile';
import { Level, LevelData } from './Level';

export class Game {
  scene: THREE.Scene;
  camera: THREE.OrthographicCamera;
  renderer: THREE.WebGLRenderer;
  loader: GLTFLoader;
  models: Map<string, THREE.Group> = new Map();

  // Game state
  gold: number = GAME.startingGold;
  lives: number = GAME.startingLives;
  wave: number = 0;
  isRunning: boolean = false;

  // Entities
  towers: Tower[] = [];
  enemies: Enemy[] = [];
  projectiles: Projectile[] = [];

  // Level
  level: Level | null = null;
  path: THREE.Vector3[] = [];
  towerSpots: Map<string, THREE.Group> = new Map(); // key -> selection indicator

  // Input
  selectedTower: TowerType | null = null;
  selectedPlacedTower: Tower | null = null;
  raycaster: THREE.Raycaster;
  mouse: THREE.Vector2;
  groundPlane: THREE.Plane;

  // Wave management
  waveEnemies: string[] = [];
  spawnTimer: number = 0;
  waveInProgress: boolean = false;

  // Pause state
  isPaused: boolean = false;

  // Level data for restart
  currentLevelData: LevelData | null = null;

  // Clock
  clock: THREE.Clock;

  constructor(container: HTMLElement) {
    // Scene setup
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x87CEEB); // Sky blue

    // Add fog for atmosphere
    this.scene.fog = new THREE.Fog(0x87CEEB, 30, 60);

    // Orthographic camera for top-down view
    const aspect = window.innerWidth / window.innerHeight;
    const viewSize = 7; // Smaller view = more zoomed in
    this.camera = new THREE.OrthographicCamera(
      -viewSize * aspect, viewSize * aspect,
      viewSize, -viewSize,
      0.1, 1000
    );
    // Slight angle for better 3D feel
    this.camera.position.set(0, 15, 8);
    this.camera.lookAt(0, 0, 0);

    // Renderer
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(this.renderer.domElement);

    // Lighting - warm sunlight
    const ambient = new THREE.AmbientLight(0xffffff, 0.5);
    this.scene.add(ambient);

    const sun = new THREE.DirectionalLight(0xfff5e6, 1.0);
    sun.position.set(15, 30, 15);
    sun.castShadow = true;
    sun.shadow.mapSize.width = 2048;
    sun.shadow.mapSize.height = 2048;
    sun.shadow.camera.near = 0.5;
    sun.shadow.camera.far = 100;
    sun.shadow.camera.left = -30;
    sun.shadow.camera.right = 30;
    sun.shadow.camera.top = 30;
    sun.shadow.camera.bottom = -30;
    this.scene.add(sun);

    // Hemisphere light for natural feel
    const hemi = new THREE.HemisphereLight(0x87CEEB, 0x3d5c3d, 0.4);
    this.scene.add(hemi);

    // Loader
    this.loader = new GLTFLoader();

    // Input setup
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();
    this.groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);

    // Clock
    this.clock = new THREE.Clock();

    // Event listeners
    window.addEventListener('resize', () => this.onResize());
    container.addEventListener('click', (e) => this.onClick(e));
    window.addEventListener('keydown', (e) => this.onKeyDown(e));
    this.setupTowerButtons();
    this.setupUpgradePanel();
    this.setupPauseMenu();
  }

  setupTowerButtons() {
    const buttons = document.querySelectorAll('.tower-btn');
    buttons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const towerType = (btn as HTMLElement).dataset.tower as TowerType;

        // Deselect placed tower when selecting from menu
        this.deselectPlacedTower();

        if (this.selectedTower === towerType) {
          this.selectedTower = null;
          btn.classList.remove('selected');
        } else {
          buttons.forEach(b => b.classList.remove('selected'));
          this.selectedTower = towerType;
          btn.classList.add('selected');
        }
      });
    });
  }

  setupUpgradePanel() {
    document.getElementById('upgrade-btn')!.addEventListener('click', () => {
      this.upgradeTower();
    });

    document.getElementById('sell-btn')!.addEventListener('click', () => {
      this.sellTower();
    });

    document.getElementById('close-panel-btn')!.addEventListener('click', () => {
      this.deselectPlacedTower();
    });
  }

  setupPauseMenu() {
    document.getElementById('resume-btn')!.addEventListener('click', () => {
      this.togglePause();
    });

    document.getElementById('restart-btn')!.addEventListener('click', () => {
      this.restartLevel();
    });
  }

  onKeyDown(e: KeyboardEvent) {
    if (e.key === 'Escape') {
      if (this.selectedPlacedTower) {
        this.deselectPlacedTower();
      } else {
        this.togglePause();
      }
    }
  }

  selectPlacedTower(tower: Tower) {
    this.selectedPlacedTower = tower;
    this.selectedTower = null;

    // Clear tower menu selection
    document.querySelectorAll('.tower-btn').forEach(b => b.classList.remove('selected'));

    // Update and show upgrade panel
    this.updateUpgradePanel();
    document.getElementById('upgrade-panel')!.classList.add('visible');
  }

  deselectPlacedTower() {
    this.selectedPlacedTower = null;
    document.getElementById('upgrade-panel')!.classList.remove('visible');
  }

  updateUpgradePanel() {
    const tower = this.selectedPlacedTower;
    if (!tower) return;

    const baseStats = TOWERS[tower.type];
    const stats = tower.stats;

    document.getElementById('tower-name')!.textContent = baseStats.name;
    document.getElementById('tower-tier')!.textContent = `Tier ${tower.tier} / 3`;
    document.getElementById('stat-damage')!.textContent = stats.damage.toFixed(0);
    document.getElementById('stat-range')!.textContent = stats.range.toFixed(1);
    document.getElementById('stat-rate')!.textContent = `${stats.fireRate.toFixed(1)}s`;

    const upgradeBtn = document.getElementById('upgrade-btn') as HTMLButtonElement;
    const sellBtn = document.getElementById('sell-btn')!;

    if (tower.tier >= 3) {
      upgradeBtn.textContent = 'MAX LEVEL';
      upgradeBtn.disabled = true;
    } else {
      const cost = tower.upgradeCost;
      upgradeBtn.textContent = `Upgrade (${cost}g)`;
      upgradeBtn.disabled = this.gold < cost;
    }

    const sellValue = Math.floor(tower.totalInvested * GAME.sellRefundRate);
    sellBtn.textContent = `Sell (${sellValue}g)`;
  }

  async upgradeTower() {
    const tower = this.selectedPlacedTower;
    if (!tower || tower.tier >= 3) return;

    const cost = tower.upgradeCost;
    if (this.gold < cost) return;

    this.gold -= cost;
    tower.upgrade();

    // Rebuild tower model with new tier
    await this.buildTowerModel(tower);

    this.updateUpgradePanel();
    this.updateUI();
  }

  sellTower() {
    const tower = this.selectedPlacedTower;
    if (!tower) return;

    const sellValue = Math.floor(tower.totalInvested * GAME.sellRefundRate);
    this.gold += sellValue;

    // Remove tower from scene
    if (tower.modelGroup) {
      this.scene.remove(tower.modelGroup);
    }

    // Remove from towers array
    const index = this.towers.indexOf(tower);
    if (index > -1) {
      this.towers.splice(index, 1);
    }

    // Show the tower spot indicator again
    const grid = this.level?.data.grid;
    if (grid) {
      const offsetX = -(grid[0].length * GAME.tileSize) / 2 + GAME.tileSize / 2;
      const offsetZ = -(grid.length * GAME.tileSize) / 2 + GAME.tileSize / 2;
      const tileX = Math.round((tower.position.x - offsetX) / GAME.tileSize);
      const tileZ = Math.round((tower.position.z - offsetZ) / GAME.tileSize);
      const key = `${tileX},${tileZ}`;
      const indicator = this.towerSpots.get(key);
      if (indicator) indicator.visible = true;
    }

    this.deselectPlacedTower();
    this.updateUI();
  }

  togglePause() {
    this.isPaused = !this.isPaused;

    if (this.isPaused) {
      document.getElementById('pause-menu')!.classList.add('visible');
    } else {
      document.getElementById('pause-menu')!.classList.remove('visible');
    }
  }

  async restartLevel() {
    if (this.currentLevelData) {
      this.isPaused = false;
      document.getElementById('pause-menu')!.classList.remove('visible');
      this.deselectPlacedTower();
      await this.loadLevel(this.currentLevelData);
      this.start();
    }
  }

  async loadModel(name: string): Promise<THREE.Group> {
    if (this.models.has(name)) {
      return this.models.get(name)!.clone();
    }

    // Try multiple paths
    const paths = [`/assets/${name}.glb`, `/${name}.glb`];

    for (const path of paths) {
      try {
        const gltf = await this.loader.loadAsync(path);
        const model = gltf.scene;

        // Enable shadows on all meshes
        model.traverse((child) => {
          if (child instanceof THREE.Mesh) {
            child.castShadow = true;
            child.receiveShadow = true;
          }
        });

        this.models.set(name, model);
        return model.clone();
      } catch {
        continue;
      }
    }

    console.warn(`Model not found: ${name}`);
    const geo = new THREE.BoxGeometry(1, 1, 1);
    const mat = new THREE.MeshStandardMaterial({ color: 0xff00ff });
    const mesh = new THREE.Mesh(geo, mat);
    const group = new THREE.Group();
    group.add(mesh);
    return group;
  }

  async loadLevel(levelData: LevelData) {
    this.currentLevelData = levelData;
    this.level = new Level(levelData);

    // Clear existing
    while(this.scene.children.length > 0) {
      this.scene.remove(this.scene.children[0]);
    }

    // Re-add lights
    const ambient = new THREE.AmbientLight(0xffffff, 0.5);
    this.scene.add(ambient);
    const sun = new THREE.DirectionalLight(0xfff5e6, 1.0);
    sun.position.set(15, 30, 15);
    sun.castShadow = true;
    sun.shadow.mapSize.width = 2048;
    sun.shadow.mapSize.height = 2048;
    sun.shadow.camera.near = 0.5;
    sun.shadow.camera.far = 100;
    sun.shadow.camera.left = -30;
    sun.shadow.camera.right = 30;
    sun.shadow.camera.top = 30;
    sun.shadow.camera.bottom = -30;
    this.scene.add(sun);
    const hemi = new THREE.HemisphereLight(0x87CEEB, 0x3d5c3d, 0.4);
    this.scene.add(hemi);

    this.towers = [];
    this.enemies = [];
    this.projectiles = [];
    this.towerSpots.clear();

    // Reset state
    this.gold = levelData.startGold ?? GAME.startingGold;
    this.lives = levelData.lives ?? GAME.startingLives;
    this.wave = 0;
    this.updateUI();

    const grid = levelData.grid;
    const offsetX = -(grid[0].length * GAME.tileSize) / 2 + GAME.tileSize / 2;
    const offsetZ = -(grid.length * GAME.tileSize) / 2 + GAME.tileSize / 2;

    // First pass: identify path tiles and their directions
    const pathCells: { x: number; z: number; neighbors: string[] }[] = [];

    for (let z = 0; z < grid.length; z++) {
      for (let x = 0; x < grid[z].length; x++) {
        const cell = grid[z][x];
        if (cell === 'P' || cell === 'S' || cell === 'E') {
          const neighbors: string[] = [];
          if (grid[z - 1]?.[x] && 'PSE'.includes(grid[z - 1][x])) neighbors.push('N');
          if (grid[z + 1]?.[x] && 'PSE'.includes(grid[z + 1][x])) neighbors.push('S');
          if (grid[z]?.[x - 1] && 'PSE'.includes(grid[z][x - 1])) neighbors.push('W');
          if (grid[z]?.[x + 1] && 'PSE'.includes(grid[z][x + 1])) neighbors.push('E');
          pathCells.push({ x, z, neighbors });
        }
      }
    }

    // Build the map
    for (let z = 0; z < grid.length; z++) {
      for (let x = 0; x < grid[z].length; x++) {
        const cell = grid[z][x];
        const worldX = x * GAME.tileSize + offsetX;
        const worldZ = z * GAME.tileSize + offsetZ;

        let tileName = 'tile';
        let rotation = 0;

        // Find path info for this cell
        const pathInfo = pathCells.find(p => p.x === x && p.z === z);

        switch (cell) {
          case 'S':
            tileName = 'tile-spawn-round';
            // Rotate spawn to face path direction
            if (pathInfo?.neighbors.includes('E')) rotation = Math.PI / 2;
            else if (pathInfo?.neighbors.includes('S')) rotation = Math.PI;
            else if (pathInfo?.neighbors.includes('W')) rotation = -Math.PI / 2;
            break;

          case 'E':
            tileName = 'tile-end-round';
            // Rotate end to face incoming path
            if (pathInfo?.neighbors.includes('W')) rotation = Math.PI / 2;
            else if (pathInfo?.neighbors.includes('N')) rotation = Math.PI;
            else if (pathInfo?.neighbors.includes('E')) rotation = -Math.PI / 2;
            break;

          case 'P':
            if (pathInfo) {
              const n = pathInfo.neighbors;
              // Determine if corner or straight
              if ((n.includes('N') && n.includes('S')) || (n.includes('E') && n.includes('W'))) {
                // Straight path (N-S or E-W)
                tileName = 'tile-straight';
                // Rotate 90 degrees for E-W path
                if (n.includes('E') && n.includes('W')) rotation = Math.PI / 2;
              } else if (n.length >= 2) {
                // Corner - flip 180 degrees from previous attempt
                tileName = 'tile-corner-round';
                if (n.includes('S') && n.includes('E')) rotation = Math.PI;
                else if (n.includes('S') && n.includes('W')) rotation = -Math.PI / 2;
                else if (n.includes('N') && n.includes('W')) rotation = 0;
                else if (n.includes('N') && n.includes('E')) rotation = Math.PI / 2;
              } else {
                // Single connection or dead end, just use straight
                tileName = 'tile-straight';
              }
            }
            break;

          case 'T':
          case '.':
            // Grass tile - valid for tower placement
            tileName = 'tile';
            break;

          case '~':
            // Tree decoration
            tileName = 'tile-tree';
            rotation = Math.random() * Math.PI * 2;
            break;

          case '*':
            // Crystal
            tileName = 'tile-crystal';
            break;

          case '^':
            // Rock/hill
            tileName = 'tile-rock';
            rotation = Math.random() * Math.PI * 2;
            break;

          default:
            // Basic grass tile
            tileName = 'tile';
        }

        const tile = await this.loadModel(tileName);
        tile.position.set(worldX, 0, worldZ);
        tile.rotation.y = rotation;
        this.scene.add(tile);

        // Mark grass tiles as valid tower spots (no visible indicator)
        if (cell === 'T' || cell === '.') {
          const key = `${x},${z}`;
          // Create an invisible placeholder group for tracking
          const indicator = new THREE.Group();
          indicator.position.set(worldX, 0, worldZ);
          this.towerSpots.set(key, indicator);
        }
      }
    }

    // Add scattered decorations around edges
    await this.addDecorations(grid, offsetX, offsetZ);

    // Calculate path
    this.path = this.level.calculatePath(grid, GAME.tileSize, offsetX, offsetZ);
  }

  async addDecorations(grid: string[][], offsetX: number, offsetZ: number) {
    const decorationCount = 15;

    for (let i = 0; i < decorationCount; i++) {
      // Place decorations outside or on edge of map
      const edge = Math.random() < 0.5;
      let x: number, z: number;

      if (edge) {
        // On edge
        const side = Math.floor(Math.random() * 4);
        switch (side) {
          case 0: x = -1; z = Math.floor(Math.random() * grid.length); break;
          case 1: x = grid[0].length; z = Math.floor(Math.random() * grid.length); break;
          case 2: x = Math.floor(Math.random() * grid[0].length); z = -1; break;
          default: x = Math.floor(Math.random() * grid[0].length); z = grid.length; break;
        }
      } else {
        // Random position slightly outside
        x = Math.floor(Math.random() * (grid[0].length + 4)) - 2;
        z = Math.floor(Math.random() * (grid.length + 4)) - 2;
      }

      const worldX = x * GAME.tileSize + offsetX + (Math.random() - 0.5);
      const worldZ = z * GAME.tileSize + offsetZ + (Math.random() - 0.5);

      const decorName = DECORATIONS[Math.floor(Math.random() * DECORATIONS.length)];
      const decor = await this.loadModel(decorName);
      decor.position.set(worldX, 0, worldZ);
      decor.rotation.y = Math.random() * Math.PI * 2;
      decor.scale.setScalar(0.6 + Math.random() * 0.4);
      this.scene.add(decor);
    }
  }

  onClick(event: MouseEvent) {
    if (this.isPaused) return;

    this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    this.raycaster.setFromCamera(this.mouse, this.camera);
    const intersection = new THREE.Vector3();
    this.raycaster.ray.intersectPlane(this.groundPlane, intersection);

    if (!intersection) return;

    const grid = this.level?.data.grid;
    if (!grid) return;

    const offsetX = -(grid[0].length * GAME.tileSize) / 2 + GAME.tileSize / 2;
    const offsetZ = -(grid.length * GAME.tileSize) / 2 + GAME.tileSize / 2;

    const tileX = Math.round((intersection.x - offsetX) / GAME.tileSize);
    const tileZ = Math.round((intersection.z - offsetZ) / GAME.tileSize);
    const key = `${tileX},${tileZ}`;

    const worldX = tileX * GAME.tileSize + offsetX;
    const worldZ = tileZ * GAME.tileSize + offsetZ;

    // Check if clicking on an existing tower
    const clickedTower = this.towers.find(t =>
      Math.abs(t.position.x - worldX) < 0.5 &&
      Math.abs(t.position.z - worldZ) < 0.5
    );

    if (clickedTower) {
      this.selectPlacedTower(clickedTower);
      return;
    }

    // Deselect tower if clicking elsewhere
    if (this.selectedPlacedTower) {
      this.deselectPlacedTower();
    }

    // Try to place new tower
    if (!this.selectedTower) return;
    if (!this.towerSpots.has(key)) return;

    const cost = TOWERS[this.selectedTower].cost;
    if (this.gold < cost) return;

    this.placeTower(this.selectedTower, worldX, worldZ, key);
    this.gold -= cost;
    this.updateUI();
  }

  async placeTower(type: TowerType, x: number, z: number, spotKey: string) {
    const tower = new Tower(type, new THREE.Vector3(x, 0, z));

    // Hide selection indicator
    const indicator = this.towerSpots.get(spotKey);
    if (indicator) indicator.visible = false;

    // Build modular tower
    await this.buildTowerModel(tower);

    this.towers.push(tower);
  }

  async buildTowerModel(tower: Tower) {
    const visual = TOWER_VISUALS[tower.type];
    const tierPieces = visual.tiers[tower.tier - 1];

    // Clear existing models
    if (tower.modelGroup) {
      this.scene.remove(tower.modelGroup);
    }

    tower.modelGroup = new THREE.Group();
    tower.modelGroup.position.copy(tower.position);

    // Add tower structure (prebuilt models already include base)
    for (const pieceName of tierPieces) {
      const piece = await this.loadModel(pieceName);
      tower.modelGroup.add(piece);
    }

    // Add weapon on top
    const weapon = await this.loadModel(TOWERS[tower.type].model);
    weapon.position.y = 1.5 + (tower.tier - 1) * 0.3; // Higher for higher tiers
    weapon.scale.setScalar(0.8);
    tower.weaponModel = weapon;
    tower.modelGroup.add(weapon);

    this.scene.add(tower.modelGroup);
  }

  spawnEnemy(type: string) {
    if (this.path.length < 2) return;

    const enemyData = Enemy.getData(type);
    const enemy = new Enemy(type, this.path, this.wave);

    this.loadModel(enemyData.model).then(model => {
      model.position.copy(this.path[0]);
      model.position.y = 1.0; // Float above ground
      model.scale.setScalar(0.8);
      enemy.model = model;
      this.scene.add(model);
    });

    this.enemies.push(enemy);
  }

  startWave() {
    this.wave++;
    this.waveInProgress = true;
    this.waveEnemies = this.level?.generateWave(this.wave) ?? [];
    this.spawnTimer = 0;
    this.updateUI();
  }

  update(delta: number) {
    if (this.isPaused) return;

    // Wave spawning
    if (this.waveInProgress && this.waveEnemies.length > 0) {
      this.spawnTimer += delta;
      if (this.spawnTimer >= 1.0) {
        this.spawnTimer = 0;
        const enemyType = this.waveEnemies.shift()!;
        this.spawnEnemy(enemyType);
      }
    }

    // Check if wave complete
    if (this.waveInProgress && this.waveEnemies.length === 0 && this.enemies.length === 0) {
      this.waveInProgress = false;
      this.gold += 25 + this.wave * 5;
      this.updateUI();

      const maxWaves = this.currentLevelData?.maxWaves ?? 10;
      if (this.wave >= maxWaves) {
        // Victory!
        setTimeout(() => this.victory(), 1000);
      } else {
        setTimeout(() => {
          if (this.lives > 0 && this.isRunning) this.startWave();
        }, 3000);
      }
    }

    // Update enemies
    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const enemy = this.enemies[i];
      enemy.update(delta);

      // Animate enemy floating
      if (enemy.model) {
        enemy.model.position.y = 1.0 + Math.sin(Date.now() * 0.003 + i) * 0.1;
      }

      if (enemy.reachedEnd) {
        this.lives--;
        this.removeEnemy(i);
        this.updateUI();
        if (this.lives <= 0) {
          this.gameOver();
        }
      } else if (enemy.health <= 0) {
        this.gold += enemy.reward;
        this.removeEnemy(i);
        this.updateUI();
      }
    }

    // Update towers
    for (const tower of this.towers) {
      tower.update(delta, this.enemies, (proj) => {
        this.projectiles.push(proj);
        this.loadModel(TOWERS[tower.type].projectile).then(model => {
          model.position.copy(proj.position);
          model.scale.setScalar(0.3);
          proj.model = model;
          this.scene.add(model);
        });
      });
    }

    // Update projectiles
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const proj = this.projectiles[i];
      proj.update(delta);

      if (proj.isDead) {
        if (proj.model) this.scene.remove(proj.model);
        this.projectiles.splice(i, 1);
        continue;
      }

      for (const enemy of this.enemies) {
        if (enemy.health <= 0) continue;
        const dist = proj.position.distanceTo(enemy.position);
        if (dist < 0.8) {
          enemy.takeDamage(proj.damage);

          if (proj.splash > 0) {
            for (const other of this.enemies) {
              if (other === enemy) continue;
              const splashDist = proj.position.distanceTo(other.position);
              if (splashDist < proj.splash) {
                other.takeDamage(proj.damage * 0.5);
              }
            }
          }

          if (proj.pierce > 0) {
            proj.pierce--;
            if (proj.pierce <= 0) proj.isDead = true;
          } else {
            proj.isDead = true;
          }
          break;
        }
      }
    }
  }

  removeEnemy(index: number) {
    const enemy = this.enemies[index];
    if (enemy.model) this.scene.remove(enemy.model);
    this.enemies.splice(index, 1);
  }

  updateUI() {
    const goldEl = document.getElementById('gold')!;
    const livesEl = document.getElementById('lives')!;
    const waveEl = document.getElementById('wave')!;

    goldEl.innerHTML = `<span>Gold</span>${this.gold}`;
    livesEl.innerHTML = `<span>Lives</span>${this.lives}`;
    waveEl.innerHTML = `<span>Wave</span>${this.wave}`;
  }

  gameOver() {
    this.isRunning = false;
    // Save highest wave reached even on game over
    const currentLevel = this.currentLevelData?.name ?? 'Level 1';
    this.saveProgress(currentLevel, false);
    alert(`Game Over! You reached wave ${this.wave}.`);
  }

  victory() {
    this.isRunning = false;
    const currentLevel = this.currentLevelData?.name ?? 'Level 1';
    this.saveProgress(currentLevel, true);
    alert(`Victory! You completed ${currentLevel}!`);
  }

  // Save/Load progress
  saveProgress(levelName: string, completed: boolean = false) {
    const saved = this.loadSavedProgress();
    if (completed && !saved.completedLevels.includes(levelName)) {
      saved.completedLevels.push(levelName);
    }
    if (this.wave > (saved.highestWave[levelName] ?? 0)) {
      saved.highestWave[levelName] = this.wave;
    }
    localStorage.setItem('towerDefenseSave', JSON.stringify(saved));
  }

  loadSavedProgress(): { completedLevels: string[]; highestWave: Record<string, number> } {
    const data = localStorage.getItem('towerDefenseSave');
    if (data) {
      try {
        return JSON.parse(data);
      } catch {
        return { completedLevels: [], highestWave: {} };
      }
    }
    return { completedLevels: [], highestWave: {} };
  }

  isLevelCompleted(levelName: string): boolean {
    const saved = this.loadSavedProgress();
    return saved.completedLevels.includes(levelName);
  }

  onResize() {
    const aspect = window.innerWidth / window.innerHeight;
    const viewSize = 7;
    this.camera.left = -viewSize * aspect;
    this.camera.right = viewSize * aspect;
    this.camera.top = viewSize;
    this.camera.bottom = -viewSize;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  start() {
    this.isRunning = true;
    this.animate();
    setTimeout(() => this.startWave(), 2000);
  }

  animate = () => {
    if (!this.isRunning) return;
    requestAnimationFrame(this.animate);

    const delta = this.clock.getDelta();
    this.update(delta);
    this.renderer.render(this.scene, this.camera);
  };
}
