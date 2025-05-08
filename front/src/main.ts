import './public/styles/main.css';
import './public/styles/teambuilder.css';
import { GameController } from './controllers/GameController.ts';

document.addEventListener('DOMContentLoaded', () => {
  const gameController = new GameController();
  gameController.initialize();
});
