import { Game } from './Game';
import { LevelData } from './Level';

// Level 1 - Forest Path (Easy)
const level1: LevelData = {
  name: 'Forest Path',
  grid: [
    ['~', '.', '.', '^', '.', '.', '.', '~', '.', '~'],
    ['.', '.', '.', '.', '.', '.', '.', '.', '.', '.'],
    ['S', 'P', 'P', 'P', 'P', 'P', '.', '.', '.', '.'],
    ['.', '.', '.', '~', '.', 'P', '.', '.', '.', '^'],
    ['^', '.', '.', '.', '.', 'P', '.', '.', '.', '.'],
    ['.', '.', '.', '^', '.', 'P', 'P', 'P', 'P', '.'],
    ['.', '.', '.', '.', '.', '.', '~', '.', 'P', '.'],
    ['~', '.', '.', '.', '.', '.', '.', '.', 'P', '.'],
    ['.', '*', '.', '.', '.', '.', '.', '.', 'P', '.'],
    ['.', '.', '~', '^', '.', '.', '.', '.', 'E', '~'],
  ],
  startGold: 200,
  lives: 20,
  maxWaves: 10,
};

// Level 2 - The Serpent (Medium)
const level2: LevelData = {
  name: 'The Serpent',
  grid: [
    ['S', 'P', 'P', 'P', 'P', 'P', 'P', 'P', '.', '~'],
    ['.', '.', '.', '~', '.', '.', '.', 'P', '.', '.'],
    ['.', '.', '.', '.', '.', '.', '.', 'P', '.', '.'],
    ['.', 'P', 'P', 'P', 'P', 'P', 'P', 'P', '.', '^'],
    ['.', 'P', '.', '^', '.', '.', '.', '.', '.', '.'],
    ['.', 'P', '.', '.', '.', '.', '~', '.', '.', '.'],
    ['.', 'P', 'P', 'P', 'P', 'P', 'P', 'P', 'P', '.'],
    ['.', '.', '.', '.', '~', '.', '.', '.', 'P', '.'],
    ['~', '.', '.', '.', '.', '.', '^', '.', 'P', '.'],
    ['^', '.', '*', '.', '.', '.', '.', '.', 'E', '~'],
  ],
  startGold: 250,
  lives: 15,
  maxWaves: 12,
};

// Level 3 - Crystal Canyon (Hard)
const level3: LevelData = {
  name: 'Crystal Canyon',
  grid: [
    ['*', '.', '.', 'S', '.', '.', '*', '.', '.', '*'],
    ['.', '.', '.', 'P', '.', '.', '.', '.', '.', '.'],
    ['.', '*', '.', 'P', '.', '.', '.', '*', '.', '.'],
    ['.', '.', '.', 'P', 'P', 'P', 'P', 'P', 'P', '.'],
    ['.', '.', '.', '.', '.', '*', '.', '.', 'P', '.'],
    ['.', '*', '.', '.', '.', '.', '.', '.', 'P', '.'],
    ['.', '.', 'P', 'P', 'P', 'P', 'P', 'P', 'P', '.'],
    ['.', '.', 'P', '.', '*', '.', '.', '.', '.', '.'],
    ['.', '.', 'P', '.', '.', '.', '*', '.', '.', '*'],
    ['*', '.', 'E', '.', '.', '*', '.', '.', '.', '*'],
  ],
  startGold: 300,
  lives: 10,
  maxWaves: 15,
};

// Level 4 - Twin Rivers (Expert)
const level4: LevelData = {
  name: 'Twin Rivers',
  grid: [
    ['~', 'S', '.', '.', '.', '.', '.', '.', 'S', '~'],
    ['.', 'P', '.', '.', '~', '~', '.', '.', 'P', '.'],
    ['.', 'P', '.', '.', '.', '.', '.', '.', 'P', '.'],
    ['.', 'P', 'P', 'P', '.', '.', 'P', 'P', 'P', '.'],
    ['.', '.', '.', 'P', '.', '.', 'P', '.', '.', '.'],
    ['.', '^', '.', 'P', '.', '.', 'P', '.', '^', '.'],
    ['.', '.', '.', 'P', 'P', 'P', 'P', '.', '.', '.'],
    ['.', '.', '.', '.', '.', 'P', '.', '.', '.', '.'],
    ['~', '.', '.', '^', '.', 'P', '.', '^', '.', '~'],
    ['^', '.', '.', '.', '.', 'E', '.', '.', '.', '^'],
  ],
  startGold: 350,
  lives: 10,
  maxWaves: 15,
};

// Level 5 - The Gauntlet (Nightmare)
const level5: LevelData = {
  name: 'The Gauntlet',
  grid: [
    ['S', 'P', '.', '.', '.', '.', '.', '.', '.', '^'],
    ['.', 'P', '.', '^', '.', '*', '.', '^', '.', '.'],
    ['.', 'P', 'P', 'P', 'P', 'P', 'P', 'P', 'P', '.'],
    ['.', '.', '.', '.', '.', '.', '.', '.', 'P', '.'],
    ['^', '.', '*', '.', '^', '.', '*', '.', 'P', '*'],
    ['.', '.', '.', '.', '.', '.', '.', '.', 'P', '.'],
    ['.', 'P', 'P', 'P', 'P', 'P', 'P', 'P', 'P', '.'],
    ['.', 'P', '.', '*', '.', '^', '.', '*', '.', '.'],
    ['.', 'P', '.', '.', '.', '.', '.', '.', '.', '^'],
    ['^', 'E', '*', '.', '^', '.', '*', '.', '^', '*'],
  ],
  startGold: 400,
  lives: 5,
  maxWaves: 20,
};

const levels = [level1, level2, level3, level4, level5];
let game: Game;

function showLevelSelect() {
  // Stop the current game
  if (game) {
    game.isRunning = false;
    game.isPaused = false;
  }
  document.getElementById('pause-menu')!.classList.remove('visible');

  const menu = document.getElementById('level-select')!;
  const container = document.getElementById('level-buttons')!;
  container.innerHTML = '';

  const saved = JSON.parse(localStorage.getItem('towerDefenseSave') || '{"completedLevels":[],"highestWave":{}}');

  levels.forEach((level, index) => {
    const btn = document.createElement('button');
    btn.className = 'level-btn';

    const isCompleted = saved.completedLevels.includes(level.name);
    const isUnlocked = index === 0 || saved.completedLevels.includes(levels[index - 1].name);

    if (isCompleted) btn.classList.add('completed');
    if (!isUnlocked) btn.classList.add('locked');

    const highestWave = saved.highestWave[level.name] || 0;
    const waveInfo = isCompleted ? '✓ Complete' : (highestWave > 0 ? `Best: Wave ${highestWave}` : `${level.maxWaves} waves`);

    btn.innerHTML = `
      <div class="level-num">${index + 1}</div>
      <div class="level-name">${level.name}</div>
      <div class="level-info">${waveInfo}</div>
    `;

    if (isUnlocked) {
      btn.addEventListener('click', () => startLevel(index));
    }

    container.appendChild(btn);
  });

  menu.classList.add('visible');
}

async function startLevel(index: number) {
  document.getElementById('level-select')!.classList.remove('visible');
  document.getElementById('pause-menu')!.classList.remove('visible');
  game.isPaused = false;

  await game.loadLevel(levels[index]);
  game.start();
}

async function main() {
  const container = document.getElementById('game')!;
  game = new Game(container);

  // Override victory to show level select
  const originalVictory = game.victory.bind(game);
  game.victory = () => {
    originalVictory();
    setTimeout(() => showLevelSelect(), 1500);
  };

  // Override game over to show level select
  const originalGameOver = game.gameOver.bind(game);
  game.gameOver = () => {
    originalGameOver();
    setTimeout(() => showLevelSelect(), 1500);
  };

  // Show level select on start
  showLevelSelect();
}

// Expose for HTML button
(window as any).showLevelSelect = showLevelSelect;

main().catch(console.error);
