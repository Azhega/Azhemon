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
    this.showMenuScene();
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
  
  private showMenuScene(): void {
    Store.setState({ 
      game: { 
        ...Store.getState().game, 
        screen: 'menu' 
      } 
    });
  }

  private showTeamBuilderScene(): void {
    Store.setState({ 
      game: { 
        ...Store.getState().game, 
        screen: 'teambuilder' 
      } 
    });
  }

  private showBattleScene(): void {
    Store.setState({ 
      game: { 
        ...Store.getState().game, 
        screen: 'battle' 
      } 
    });
  }

  private enterTeambuilder(): void {
    console.log('Entering Teambuilder...');
    this.showTeamBuilderScene();
    // Enter teambuilder logic here
  }
  
  private startBattle(): void {
    console.log('Starting battle...');
    this.showBattleScene();
    // Start battle logic here
  }
}