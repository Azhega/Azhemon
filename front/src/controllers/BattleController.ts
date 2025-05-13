import EventBus from '../utils/EventBus';
import Store from '../utils/Store';
import { BattleEngine } from './BattleEngine.ts';
import { BattleView } from '../views/BattleView';
import { Pokemon } from '../models/PokemonModel';
import { TurnManager } from './TurnManager.ts';
import { BattleAction, BattleState, BattleTurn } from '../models/BattleModel.ts';

export class BattleController {
  private battleEngine: BattleEngine;
  private battleView: BattleView;
  private turnManager: TurnManager;
  
  constructor() {
    this.battleEngine = new BattleEngine();
    this.battleView = new BattleView();
    this.turnManager = new TurnManager();
    
    this.registerEventListeners();
  }
  
  initialize(): void {
    console.log('Initializing battle controller...');
    const state = Store.getState();
    
    const playerTeam = state.currentTeam || [];
    if (!playerTeam.some((pokemon: Pokemon | null) => pokemon !== null)) {
      console.error('No Pokémon in player team');
      EventBus.emit('battle:error', 'Tu dois avoir au moins un Pokémon dans ton équipe !');
      return;
    }
    
    const validPlayerTeam = playerTeam.filter((pokemon: Pokemon | null) => pokemon !== null);
    
    // Generate a CPU team (to implement later)
    const cpuTeam = this.generateCpuTeam(validPlayerTeam.length);
    
    // Initialize battle state
    const battleState: BattleState = {
      turn: 0,
      playerTeam: validPlayerTeam,
      cpuTeam: cpuTeam,
      activePokemon: {
        player: validPlayerTeam[0],
        cpu: cpuTeam[0]
      },
      weather: null, // to implement later
      terrain: null, // to implement later
      status: 'initializing',
      log: []
    };
    
    Store.setState({ battle: battleState });
    
    this.battleView.initialize();
    
    this.startBattle();
  }
  
  private registerEventListeners(): void {
    // Battle events
    EventBus.on('battle:start', () => this.startBattle());
    EventBus.on('battle:select-move', (data) => this.selectMove(data.moveIndex));
    EventBus.on('battle:switch-pokemon', (data) => this.switchPokemon(data.pokemonIndex));
    EventBus.on('battle:back-to-menu', () => this.exitBattle());
  }
  
  private startBattle(): void {
    const state = Store.getState();
    const battleState = state.battle;
    
    if (!battleState) {
      console.error('Battle state not initialized');
      return;
    }
    
    Store.setState({
      battle: {
        ...battleState,
        status: 'active',
        turn: 1,
        log: [...battleState.log, 'La bataille commence !']
      }
    });
    
    EventBus.emit('battle:turn-start', 1);
    
    this.battleView.showActionSelection();
  }
  
  private selectMove(moveIndex: number): void {
    const state = Store.getState();
    const battleState = state.battle;
    const activePokemon = battleState.activePokemon.player;
    
    if (moveIndex < 0 || moveIndex >= activePokemon.moves.length) {
      console.error('Invalid move index');
      return;
    }
    
    const selectedMove = activePokemon.moves[moveIndex];
    
    // Create player action
    const playerAction: BattleAction = {
      type: 'move',
      user: 'player',
      target: 'cpu',
      data: {
        moveIndex: moveIndex,
        move: selectedMove
      }
    };
    
    // Generate CPU action
    const cpuAction = this.generateCpuAction();
    
    // Create turn
    const currentTurn: BattleTurn = {
      turnNumber: battleState.turn,
      actions: {
        player: playerAction,
        cpu: cpuAction
      }
    };
    
    console.log('Executing turn:', currentTurn);
    this.executeTurn(currentTurn);
  }
  
  private switchPokemon(pokemonIndex: number): void {
    const state = Store.getState();
    const battleState = state.battle;
    const playerTeam = battleState.playerTeam;
    
    if (pokemonIndex < 0 || pokemonIndex >= playerTeam.length) {
      console.error('Invalid pokemon index');
      return;
    }
    
    const selectedPokemon = playerTeam[pokemonIndex];
    
    if (selectedPokemon === battleState.activePokemon.player) {
      console.log('This Pokémon is already active');
      return;
    }
    
    if (!selectedPokemon.isAlive) {
      console.log('This Pokémon is fainted');
      return;
    }
    
    // Create player action
    const playerAction: BattleAction = {
      type: 'switch',
      user: 'player',
      target: 'self',
      data: {
        pokemonIndex: pokemonIndex,
        pokemon: selectedPokemon
      }
    };
    
    // Generate CPU action
    const cpuAction = this.generateCpuAction();
    
    // Create turn
    const currentTurn: BattleTurn = {
      turnNumber: battleState.turn,
      actions: {
        player: playerAction,
        cpu: cpuAction
      }
    };
    
    this.executeTurn(currentTurn);
  }
  
  private exitBattle(): void {
    Store.setState({ battle: null });
    EventBus.emit('screen:change', 'menu');
  }
  
  private generateCpuTeam(size: number): Pokemon[] {
    // WIP CPU team
    const state = Store.getState();
    const pokemonSpecies = state.pokemonSpecies || [];
    const cpuTeam: Pokemon[] = [];
    
    // Same team size as player
    for (let i = 0; i < size; i++) {
      const randomIndex = Math.floor(Math.random() * pokemonSpecies.length);
      const species = pokemonSpecies[randomIndex];
      
      // Create Pokemon object
      const cpuPokemon = new Pokemon({
        id: species.id,
        name: species.name,
        types: [species.first_type, species.second_type],
        baseStats: {
          hp: species.hp,
          attack: species.atk,
          defense: species.def,
          specialAttack: species.spe_atk,
          specialDefense: species.spe_def,
          speed: species.speed,
          accuracy: 100,
          evasion: 100
        },
        moves: this.generateRandomMoves(species),
        ability: this.generateRandomAbility(species),
        item: null,
        status: null,
        nature: { id: 1, name: 'Docile', description: 'Nature neutre', effects: [] }
      });
      
      cpuTeam.push(cpuPokemon);
    }
    
    return cpuTeam;
  }
  
  private generateRandomMoves(species: any): any[] {
    // WIP Random moves
    const state = Store.getState();
    return state.currentTeam[0].moves;
  }
  
  private generateRandomAbility(species: any): any {
    // WIP Random ability
    return {
      id: 1,
      name: 'Talent par défaut',
      description: 'Un talent par défaut',
      effects: []
    };
  }
  
  private generateCpuAction(): BattleAction {
    // WIP CPU action
    const state = Store.getState();
    const battleState = state.battle;
    const cpuPokemon = battleState.activePokemon.cpu;
    
    if (cpuPokemon.moves.length > 0) {
      const randomMoveIndex = Math.floor(Math.random() * cpuPokemon.moves.length);
      const randomMove = cpuPokemon.moves[randomMoveIndex];
      
      return {
        type: 'move',
        user: 'cpu',
        target: 'player',
        data: {
          moveIndex: randomMoveIndex,
          move: randomMove
        }
      };
    }
    
    // Struggle if no moves available
    return {
      type: 'struggle',
      user: 'cpu',
      target: 'player',
      data: {}
    };
  }
  
  private executeTurn(turn: BattleTurn): void {
    this.turnManager.executeTurn(turn, () => {
      // Callback after turn execution
      this.checkBattleState();
    });
  }
  
  private checkBattleState(): void {
    const state = Store.getState();
    const battleState = state.battle;
    
    // Check if any team is defeated
    const isPlayerTeamDefeated = battleState.playerTeam.every((pokemon: Pokemon) => !pokemon.isAlive);
    const isCpuTeamDefeated = battleState.cpuTeam.every((pokemon: Pokemon) => !pokemon.isAlive);
    
    if (isPlayerTeamDefeated) {
      Store.setState({
        battle: {
          ...battleState,
          status: 'lost',
          log: [...battleState.log, 'Vous avez perdu le combat !']
        }
      });
      
      this.battleView.showBattleResult('lost');
      return;
    }
    
    if (isCpuTeamDefeated) {
      Store.setState({
        battle: {
          ...battleState,
          status: 'won',
          log: [...battleState.log, 'Vous avez gagné le combat !']
        }
      });
      
      this.battleView.showBattleResult('won');
      return;
    }
    
    // Battle continues
    Store.setState({
      battle: {
        ...battleState,
        turn: battleState.turn + 1
      }
    });
    
    // Prepare for next turn
    EventBus.emit('battle:turn-start', battleState.turn + 1);
    
    this.battleView.showActionSelection();
  }
}