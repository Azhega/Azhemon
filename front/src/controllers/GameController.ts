import Store from '../utils/Store';
import EventBus from '../utils/EventBus';
import { ApiService } from '../services/ApiService.ts';

export class GameController {
  private apiService: ApiService;
  
  constructor() {
    this.apiService = new ApiService();
    
    // Subscribe to events
    this.registerEventListeners();
  }
  
  initialize(): void {
    console.log('Initializing game...');
    this.loadInitialData();
    this.switchScreen('menu');
  }
  
  private registerEventListeners(): void {
    // Registering an event listener for the menu
    EventBus.on('menu:enter-teambuilder', () => {
      this.enterTeambuilder();
    });

    EventBus.on('menu:start-battle', () => {
      this.startBattle();
    });
  }
  
  private async loadInitialData(): Promise<void> {
    Store.setState({ game: { ...Store.getState().game, isLoading: true } });
    
    try {
      const pokemonSpecies = await this.apiService.getAll('pokemon_species');
      Store.setState({ pokemonSpecies });
      
      console.log('Initial data loaded successfully');
    } catch (error) {
      console.error('Error loading initial data:', error);
    } finally {
      Store.setState({ game: { ...Store.getState().game, isLoading: true } });
    }
  }

  private enterTeambuilder(): void {
    console.log('Entering Teambuilder...');
    this.switchScreen('teambuilder');
    // Enter teambuilder logic here
  }
  
  private startBattle(): void {
    console.log('Starting battle...');
    this.switchScreen('battle');
    // Start battle logic here
  }

  switchScreen(screen: 'menu' | 'teambuilder' | 'battle'): void {
    Store.setState({
      game: {
        ...Store.getState().game,
        currentScreen: screen
      }
    });

    EventBus.emit('screen:changed', screen);
  }
}