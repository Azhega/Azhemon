import './public/styles/main.css';
import './public/styles/login.css';
import './public/styles/teambuilder.css';
import './public/styles/battle.css';
import './public/styles/menu.css';
import { GameController } from './controllers/GameController.ts';

document.addEventListener('DOMContentLoaded', () => {
  const gameController = new GameController();
  gameController.initialize();
});
