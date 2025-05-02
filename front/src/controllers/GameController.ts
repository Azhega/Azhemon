import Store from '../utils/Store';
import EventBus from '../utils/EventBus';
import { ApiService } from '../services/ApiService.ts';
import { MainView } from '../views/MainView.ts';
import { Pokemon } from '../models/PokemonModel.ts';

export class GameController {
  private apiService: ApiService;
  private mainView: MainView;
  
  constructor() {
    this.apiService = new ApiService();
    this.mainView = new MainView();
    
    // Subscribe to events
    this.registerEventListeners();
  }
  
  initialize(): void {
    console.log('Initializing game...');

    this.mainView.initialize();

    this.loadInitialData().then(() => {
      this.switchScreen('menu');
    });
    this.switchScreen('menu');
  }
  
  private registerEventListeners(): void {
    // Menu events
    EventBus.on('menu:open-teambuilder', () => this.switchScreen('teambuilder'));
    EventBus.on('menu:start-battle', () => this.startBattle());

    // Teambuilder events
    EventBus.on('teambuilder:back-to-menu', () => this.switchScreen('menu'));
    EventBus.on('teambuilder:save-team', (team) => this.saveTeam(team));
    EventBus.on('teambuilder:open-pokemon-selector', (data) => this.openPokemonSelector(data.slotIndex));
  }
  
  private async loadInitialData(): Promise<void> {
    Store.setState({ game: { ...Store.getState().game, isLoading: true } });
    
    try {
      const pokemonSpecies = await this.apiService.getAll('pokemon_species');
      Store.setState({ pokemonSpecies });
      
      // Initialize teams and current team
      const teams = await this.apiService.getAll('teams');
      Store.setState({ 
        currentTeam: [null, null, null, null, null, null],
        savedTeams: teams
      });

      console.log('Initial data loaded successfully');
    } catch (error) {
      console.error('Error loading initial data:', error);
    } finally {
      Store.setState({ game: { ...Store.getState().game, isLoading: false  } });
    }
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
  
  private startBattle(): void {
    // Check if current team is empty
    const state = Store.getState();
    const currentTeam = state.currentTeam || [];
    
    if (!currentTeam.some((pokemon: Pokemon | null) => pokemon !== null)) {
      alert('Tu dois d\'abord créer une équipe !');
      this.switchScreen('teambuilder');
      return;
    }

    this.switchScreen('battle');
  }

  private saveTeam(team: any[]): void {
    // Check if the team is empty
    if (!team.some(pokemon => pokemon !== null)) {
      alert('Tu dois ajouter au moins un Pokémon à ton équipe !');
      return;
    }
    
    // Save team
    const currentState = Store.getState();
    const savedTeams = [...(currentState.savedTeams || [])];
    
    // Check if it's the first team being saved
    if (savedTeams.length === 0) {
      savedTeams.push([...team]);
    } else {
      // Erase the first team and replace it with the new one
      savedTeams[0] = [...team];
    }
    
    Store.setState({ savedTeams });
    alert('Équipe sauvegardée avec succès !');
  }

  private openPokemonSelector(slotIndex: number): void {
    // Will be implemented later
    // Add a test Pokemon for now
    
    const mockPokemon = {
      id: 25,
      name: 'Pikachu',
      types: ['Electric'],
      sprite: 'src/public/images/sprites/pikachu/pikachu_face.png',
    };
    
    const currentState = Store.getState();
    const currentTeam = [...(currentState.currentTeam || [null, null, null, null, null, null])];
    currentTeam[slotIndex] = mockPokemon;
    
    Store.setState({ currentTeam });
    
    alert(`Pokémon ajouté au slot ${slotIndex + 1} ! (Fonctionnalité de sélection complète à implémenter)`);
  }
}