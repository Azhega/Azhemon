import Store from '../utils/Store';
import EventBus from '../utils/EventBus';
import AuthService from '../services/AuthService';
import { ApiService } from '../services/ApiService';
import { MainView } from '../views/MainView';
import { LoginView } from '../views/LoginView';
import { Pokemon, PokemonAbility, PokemonItem, PokemonMove } from '../models/PokemonModel';
import { TeamBuilderView } from '../views/TeamBuilderView';
import { BattleView } from '../views/BattleView';
import { BattleController } from './BattleController';

export class GameController {
  private apiService: ApiService;
  private mainView: MainView;
  private loginView: LoginView | null = null;
  private teamBuilderView: TeamBuilderView | null = null;
  private battleView: BattleView | null = null;
  private battleController: BattleController | null = null;
  
  constructor() {
    this.apiService = new ApiService();
    this.mainView = new MainView();
    
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

    // Session events
    EventBus.on('auth:login-success', () => this.switchScreen('menu'));
    EventBus.on('auth:logout', () => this.switchScreen('login'));
  }

  private async checkAuthenticationStatus(): Promise<void> {
    const isAuthenticated = await AuthService.checkAuthStatus();
    
    if (isAuthenticated) {
      AuthService.startTokenValidation();
      this.switchScreen('menu');
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
    Store.setState({
      game: {
        ...Store.getState().game,
        screen: screen
      }
    });

    console.log('Store updated:', Store.getState());
    console.log('Store user username:', Store.getState().user.username);

    EventBus.emit('screen:changed', screen);

    if (screen === 'login') {
      if (!this.loginView) {
        this.loginView = new LoginView();
      } else {
        this.loginView.reset();
      }
    }

    if (screen === 'menu') {
      if (this.mainView && (this.mainView as any).menuView) {
        (this.mainView as any).menuView = null;
      }
      // MainView will create a new MenuView instance
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