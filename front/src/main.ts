import './assets/styles/main.css';
import { GameController } from './controllers/GameController.ts';

document.addEventListener('DOMContentLoaded', () => {
  const gameController = new GameController();
  gameController.initialize();
});
