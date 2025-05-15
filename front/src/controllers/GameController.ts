import Store from '../utils/Store';
import EventBus from '../utils/EventBus';
import { ApiService } from '../services/ApiService';
import { MainView } from '../views/MainView';
import { Pokemon, PokemonAbility, PokemonItem, PokemonMove } from '../models/PokemonModel';
import { TeamBuilderView } from '../views/TeamBuilderView';
import { BattleView } from '../views/BattleView';
import { BattleController } from './BattleController';

export class GameController {
  private apiService: ApiService;
  private mainView: MainView;
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

    this.loadInitialData().then(() => {
      this.switchScreen('menu');
    });
  }
  
  private registerEventListeners(): void {
    // Menu events
    EventBus.on('menu:open-teambuilder', () => this.switchScreen('teambuilder'));
    EventBus.on('menu:start-battle', () => this.startBattle());

    // Teambuilder events
    EventBus.on('teambuilder:back-to-menu', () => this.switchScreen('menu'));
    // EventBus.on('teambuilder:save-team', (team) => this.saveTeam(team));
    // EventBus.on('teambuilder:open-pokemon-selector', (data) => this.openPokemonSelector(data.slotIndex));
    // EventBus.on('teambuilder:select-pokemon', (data) => this.selectPokemon(data));
    // EventBus.on('teambuilder:select-item', (data) => this.selectItem(data));
    // EventBus.on('teambuilder:select-ability', (data) => this.selectAbility(data));
    // EventBus.on('teambuilder:select-move', (data) => this.selectMove(data));
    // EventBus.on('teambuilder:load-team', (teamIndex) => this.loadTeam(teamIndex));
  }
  
  private async loadInitialData(): Promise<void> {
    Store.setState({ game: { ...Store.getState().game, isLoading: true } });
    
    try {
      const pokemonSpecies = await this.apiService.getAll('pokemon_species');
      const items = await this.apiService.getAll('item');
      
      // Store data in the store
      Store.setState({ 
        pokemonSpecies: pokemonSpecies,
        availableItems: items,
        currentTeam: [null, null, null, null, null, null],
        savedTeams: []
      });

      console.log('Initial data loaded successfully');
      console.log('Store : ', Store.getState());
    } catch (error) {
      console.error('Error loading initial data:', error);
    } finally {
      Store.setState({ game: { ...Store.getState().game, isLoading: false } });
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
    const currentTeam = state.currentTeam || [];
    
    if (!currentTeam.some((pokemon: Pokemon | null) => pokemon !== null)) {
      alert('Tu dois d\'abord créer une équipe !');
      this.switchScreen('teambuilder');
      return;
    }

    this.switchScreen('battle');
  }

  // private async saveTeam(team: (any | null)[]): Promise<void> {
  //   if (!team.some(pokemon => pokemon !== null)) {
  //     alert('Tu dois ajouter au moins un Pokémon à ton équipe !');
  //     return;
  //   }

  //   for (const pokemon of team) {
  //     if (!pokemon) continue;
  //     if (pokemon.ability.id === 0) {
  //       alert('Un Pokémon doit avoir un talent !');
  //       return;
  //     }
  //     if (pokemon.moves.length === 0) {
  //       alert('Un Pokémon doit avoir au moins une attaque !');
  //       return; 
  //     }
  //   }
    
  //   const pokemonsPayload = team
  //     .map((pokemon, index) => {
  //       if (!pokemon) return null;

  //       return {
  //         slot: index + 1, 
  //         pokemon_species_id: pokemon.id,
  //         ability_id: pokemon.ability.id,
  //         item_id: pokemon.item?.id,
  //         nature_id: 1, // To implement later
  //         moves: (pokemon.moves || []).map((move: any, index: number) => ({
  //           slot: index + 1,
  //           move_id: move.id
  //         }))
  //       };
  //     })
  //     .filter(pokemon => pokemon !== null);
    
  //   const payload = {
  //     player_id: 1, //To implement later
  //     name: 'test', // To implement later
  //     pokemons: pokemonsPayload
  //   };
    
  //   try {
  //     const response = await this.apiService.post('create_team', payload);
  //     console.log('Team saved:', response);
  //     alert('Équipe sauvegardée avec succès !');
  //   } catch (error) {
  //     console.error('Erreur lors du saveTeam:', error);
  //     alert("Une erreur est survenue lors de la sauvegarde de l'équipe.");
  //   }
  // }
  

  // private openPokemonSelector(slotIndex: number): void {
  //   if (this.teamBuilderView) {
  //     EventBus.emit('teambuilder:show-pokemon-selector', { slotIndex });
  //   }
  // }

  // private selectPokemon(data: { slotIndex: number, pokemon: Pokemon }): void {
  //   const { slotIndex, pokemon } = data;
  //   const currentState = Store.getState();
  //   const currentTeam = [...(currentState.currentTeam || Array(6).fill(null))];
    
  //   const newPokemon = {
  //     ...pokemon,
  //     item: null,
  //     ability: pokemon.possibleAbilities[0]?.name || null,
  //     moves: [],
  //     evs: {
  //       hp: 0,
  //       attack: 0,
  //       defense: 0,
  //       spAttack: 0,
  //       spDefense: 0,
  //       speed: 0
  //     },
  //     nature: 'Docile' // Neutral nature
  //   };
    
  //   currentTeam[slotIndex] = newPokemon;
  //   Store.setState({ currentTeam });
  // }

  // private selectItem(data: { slotIndex: number, itemId: number }): void {
  //   const { slotIndex, itemId } = data;
  //   const currentState = Store.getState();
  //   const currentTeam = [...(currentState.currentTeam || [])];
  //   const availableItems = currentState.availableItems || [];
    
  //   if (currentTeam[slotIndex]) {
  //     const selectedItem = itemId === 0 ? null : availableItems.find((item: PokemonItem) => item.id === itemId);
      
  //     currentTeam[slotIndex] = {
  //       ...currentTeam[slotIndex],
  //       item: selectedItem ? selectedItem.name : null
  //     };
      
  //     Store.setState({ currentTeam });
  //   }
  // }

  // private selectAbility(data: { slotIndex: number, abilityId: number }): void {
  //   const { slotIndex, abilityId } = data;
  //   const currentState = Store.getState();
  //   const currentTeam = [...(currentState.currentTeam || [])];
    
  //   if (currentTeam[slotIndex]) {
  //     const pokemon = currentTeam[slotIndex];
  //     const pokemonData = currentState.pokemonSpecies.find((p: Pokemon) => p.id === pokemon.id);
  //     const selectedAbility = pokemonData?.possibleAbilities.find((ability: PokemonAbility) => ability.id === abilityId);
      
  //     if (selectedAbility) {
  //       currentTeam[slotIndex] = {
  //         ...currentTeam[slotIndex],
  //         ability: selectedAbility.name
  //       };
        
  //       Store.setState({ currentTeam });
  //     }
  //   }
  // }

  // private selectMove(data: { slotIndex: number, moveIndex: number, moveId: number }): void {
  //   const { slotIndex, moveIndex, moveId } = data;
  //   const currentState = Store.getState();
  //   const currentTeam = [...(currentState.currentTeam || [])];
  //   const availableMoves = currentState.availableMoves || [];
    
  //   if (currentTeam[slotIndex]) {
  //     const selectedMove = availableMoves.find((move: PokemonMove) => move.id === moveId);
      
  //     if (selectedMove) {
  //       const pokemon = currentTeam[slotIndex];
  //       const moves = [...(pokemon.moves || Array(4).fill(null))];
  //       moves[moveIndex] = selectedMove.name;
        
  //       currentTeam[slotIndex] = {
  //         ...pokemon,
  //         moves
  //       };
        
  //       Store.setState({ currentTeam });
  //     }
  //   }
  // }

  // private loadTeam(teamIndex: number): void {
  //   const currentState = Store.getState();
  //   const savedTeams = currentState.savedTeams || [];
    
  //   if (savedTeams[teamIndex]) {
  //     Store.setState({ currentTeam: [...savedTeams[teamIndex]] });
  //   }
  // }
}