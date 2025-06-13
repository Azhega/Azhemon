import Store from '../utils/Store';
import EventBus from '../utils/EventBus';
import AuthService from '../services/AuthService';
import { MainView } from '../views/MainView';
import { LoginView } from '../views/LoginView';
import { Pokemon } from '../models/PokemonModel';
import { TeamBuilderView } from '../views/TeamBuilderView';
import { BattleController } from './BattleController';
import { AudioManager } from './AudioManager';

export class GameController {
  private mainView: MainView;
  private loginView: LoginView | null = null;
  private teamBuilderView: TeamBuilderView | null = null;
  private battleController: BattleController | null = null;
  private audioManager: AudioManager;

  constructor() {
    this.mainView = new MainView();
    this.audioManager = AudioManager.getInstance();
    this.audioManager.initialize();

    // Subscribe to events
    this.registerEventListeners();
  }
  
  initialize(): void {
    console.log('Initializing game...');

    this.mainView.initialize();

    this.loadInitialData().then(async () => {
      await this.checkAuthenticationStatus();
    });
  }
  
  private registerEventListeners(): void {
    // Menu events
    EventBus.on('menu:open-teambuilder', () => this.switchScreen('teambuilder'));
    EventBus.on('menu:start-battle', () => this.startBattle());

    // Teambuilder events
    EventBus.on('teambuilder:back-to-menu', () => this.switchScreen('menu'));

    EventBus.on('battle:back-to-menu', () => this.switchScreen('menu'));

    // Session events
    EventBus.on('auth:login-success', () => this.switchScreen('menu'));
    EventBus.on('auth:logout', () => this.switchScreen('login'));
  }

  private async checkAuthenticationStatus(): Promise<void> {
    const isAuthenticated = await AuthService.checkAuthStatus();
    
    if (isAuthenticated) {
      AuthService.startTokenValidation();
      this.switchScreen('menu');
      this.audioManager.playMenuMusic();
    } else {
      this.switchScreen('login');
    }
  }
  
  private async loadInitialData(): Promise<void> {
    Store.setState({ game: { ...Store.getState().game, isLoading: true } });
    
    try {
      Store.setState({ 
        currentTeam: [null, null, null, null, null, null],
        currentBattleTeam: [null, null, null, null, null, null]
      });

      console.log('current Team initialized successfully');
      console.log('Store : ', Store.getState());
    } catch (error) {
      console.error('Error loading initial data:', error);
    } finally {
      Store.setState({ game: { ...Store.getState().game, isLoading: false } });
    }
  }

  switchScreen(screen: 'menu' | 'teambuilder' | 'battle' | 'login'): void {
    const previousScreen = Store.getState().game.screen;
    console.log(`Switching screen from ${previousScreen} to ${screen}`);

    Store.setState({
      game: {
        ...Store.getState().game,
        screen: screen
      }
    });

    console.log('Store updated:', Store.getState());
    console.log('Store user username:', Store.getState().user.username);

    // MainView.updateScreen(screen);
    EventBus.emit('screen:changed', screen);

    if (screen === 'login') {
      this.audioManager.stopCurrentMusic();
      if (!this.loginView) {
        this.loginView = new LoginView();
      } else {
        this.loginView.reset();
      }
    }

    if (screen === 'menu' || screen === 'teambuilder') {
      if (previousScreen === 'login') {
        this.audioManager.playMenuMusic();
        EventBus.emit('menu:toggle-music-mute');
      }
    }

    if (screen === 'teambuilder' && !this.teamBuilderView) {
      this.teamBuilderView = new TeamBuilderView();
    }

    if (screen === 'battle') {
      if (this.battleController) {
        this.battleController.destroy();
        this.battleController = null;
      }

      this.battleController = new BattleController();
      this.battleController.initialize();
    }
  }
  
  private startBattle(): void {
    const state = Store.getState();
    const currentBattleTeam = state.currentBattleTeam || [];
    
    if (!currentBattleTeam.some((pokemon: Pokemon | null) => pokemon !== null)) {
      alert('Tu dois d\'abord créer une équipe !');
      this.switchScreen('teambuilder');
      return;
    }

    this.switchScreen('battle');
  }
}