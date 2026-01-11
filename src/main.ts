import { Game } from './Game';
import { LevelData } from './Level';

// Level 1 - Forest Path with decorations
// Legend: S=spawn, E=end, P=path, ~=tree, *=crystal, ^=rock, .=grass (buildable)
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

async function main() {
  const container = document.getElementById('game')!;
  const game = new Game(container);

  // Load level
  await game.loadLevel(level1);

  // Start game loop
  game.start();
}

main().catch(console.error);
