import EventBus from '../utils/EventBus';
import Store from '../utils/Store';
import { BattleView } from '../views/BattleView';
import { Pokemon, PokemonMove } from '../models/PokemonModel';
import { TurnManager } from './TurnManager.ts';
import { BattleAction, BattleState, BattleTurn } from '../models/BattleModel.ts';
import { Pokedex } from '../data/pokedex.ts';
import { createBattlePokemon } from '../utils/PokemonFactory.ts';
import EffectManager from './EffectManager.ts';

export class BattleController {
  private battleView: BattleView | null;
  private turnManager: TurnManager | null;

  constructor() {
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
      log: [],
      context: null
    };
    
    Store.setState({ battle: battleState });
    
    this.battleView?.initialize();
    
    this.startBattle();
  }

  destroy(): void {
    // Remove event listeners
    EventBus.off('battle:start', this.startBattle);
    EventBus.off('battle:select-move', this.selectMove);
    EventBus.off('battle:switch-pokemon', this.switchPokemon);
    EventBus.off('battle:back-to-menu', this.exitBattle);

    // Clean up views
    if (this.battleView) {
        this.battleView.destroy();
        this.battleView = null;
    }

    this.turnManager = null;
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
    
    EventBus.emit('battle:turn-start', 1); // console.log('Turn started:', 1);

    // Register abilities and items effects for both Pokemon
    EffectManager.unregisterAllEffects();
    EffectManager.registerPokemonEffects(battleState.activePokemon.player);
    EffectManager.registerPokemonEffects(battleState.activePokemon.cpu);

    // Run onTurnStart effects
    EffectManager.applyTurnStartEffects(battleState);
    // Run onSwitch effects (as the battle kinda starts with a switch)
    EffectManager.applyOnSwitchEffects(battleState);

    this.battleView?.showActionSelection();
  }
  
  private selectMove(moveIndex: number): void {
    const state = Store.getState();
    const battleState = state.battle;
    const activePokemon = battleState.activePokemon.player;

    // Run onPreMove effects
    EffectManager.applyPreMoveEffects(battleState);

    if (moveIndex >= activePokemon.moves.length) {
      console.error('Invalid move index');
      return;
    }
    
    if (moveIndex === -1) {
      console.log('Struggle move selected');

      const playerAction: BattleAction = {
      type: 'struggle',
      user: 'player',
      target: 'cpu',
      data: {
        moveIndex: -1,
        move: null
      }};

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

    } else {
      const selectedMove = activePokemon.moves[moveIndex];
    
      const playerAction: BattleAction = {
        type: 'move',
        user: 'player',
        target: 'cpu',
        data: {
          moveIndex: moveIndex,
          move: selectedMove
        }
      };
      const state = Store.getState();
      const battleState = state.battle;
      const cpuPokemon = battleState.activePokemon.cpu;
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
    const state = Store.getState();
    console.log('Exiting battle...', state);
    console.log('Current Team : ', state.currentTeam);

    const currentTeam = state.currentTeam;

    // Reset Current Team
    const resetTeam = currentTeam.map((pokemon: Pokemon | null) => {
        if (pokemon) {
            // Create a new instance of the Pokemon class
            const resetPokemon = new Pokemon({
                ...pokemon,
                currentHp: pokemon.maxHp,
                moves: pokemon.moves.map((move: PokemonMove | null) => ({
                  ...move,
                  currentPP: move?.pp
                })),
                isAlive: true,
                status: null,
                terrain: null,
                statModifiers: {
                    hp: 0,
                    attack: 0,
                    defense: 0,
                    specialAttack: 0,
                    specialDefense: 0,
                    speed: 0,
                    accuracy: 0,
                    evasion: 0,
                },
            });

            // Recalculate stats
            resetPokemon.currentStats = resetPokemon.calculateStats();

            return resetPokemon;
        }
        return null;
    });

    console.log('Reset Team : ', resetTeam);

    // Update the state with the reset team
    Store.setState({
        currentTeam: resetTeam,
        battle: null,
    });

    EventBus.emit('screen:changed', 'menu');
}
  
  private generateCpuTeam(size: number): Pokemon[] {
    // WIP CPU team
    const pokemonSpecies = Pokedex;
    const cpuTeam: Pokemon[] = [];
    
    // Same team size as player
    for (let i = 0; i < size; i++) {
      const randomIndex = Math.floor(Math.random() * Object.keys(pokemonSpecies).length);
      const randomKey = Object.keys(pokemonSpecies)[randomIndex];
      
      // Create Pokemon object
      const cpuPokemon = createBattlePokemon(
        randomKey as keyof typeof Pokedex, 
        {
          nature: { 
            id: 2, name: 'Bizarre', description: 'Nature neutre',
            atk: 1.0, def: 1.0, spa: 1.0, spd: 1.0, spe: 1.0
          },
          moves: this.generateRandomMoves(),
          ability: { id: 0, name: 'Aucun', description: ''},
          item: null
        });
      cpuPokemon.key = randomKey;
      cpuPokemon.abilityKey = "sereneGrace"; // default abilitykey
      cpuPokemon.itemKey = "leftovers"; // default itemkey
      
      cpuTeam.push(cpuPokemon);
    }
    
    return cpuTeam;
  }
  
  private generateRandomMoves(): PokemonMove[] {
    // WIP Random moves
    const state = Store.getState();
    const cpuMoves = state.currentTeam[0].moves.map((move: PokemonMove) => ({
      ...move,
      currentPP: move.pp
    }));
    console.log('CPU Pokemon Moves : ', cpuMoves);
    return cpuMoves;
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

    if (cpuPokemon.moves.length === 0) {
      console.error('CPU Pokemon has no moves available');
      return {
        type: 'struggle',
        user: 'cpu',
        target: 'player',
        data: {}
      };
    }

    if (cpuPokemon.moves.every((move: PokemonMove) => move.currentPP <= 0)) {
      console.log('CPU Pokemon has no moves left');
      // Struggle if no moves available
      return {
        type: 'struggle',
        user: 'cpu',
        target: 'player',
        data: {}
      };
    }

    const randomMoveIndex = Math.floor(Math.random() * cpuPokemon.moves.length);
    const randomMove = cpuPokemon.moves[randomMoveIndex];
    cpuPokemon.moves[randomMoveIndex].currentPP -= 1;
    if (randomMove.currentPP === 0) {
      cpuPokemon.moves.splice(randomMoveIndex, 1);
    }
     
    console.log('CPU selected move:', randomMove);
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
  
  private executeTurn(turn: BattleTurn): void {
    this.turnManager?.executeTurn(turn, () => {
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
      
      this.battleView?.showBattleResult('lost');
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
      
      this.battleView?.showBattleResult('won');
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

    // Run onTurnStart effects
    EffectManager.applyTurnStartEffects(battleState);
    
    this.battleView?.showActionSelection();
  }
}