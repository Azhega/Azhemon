import EventBus from '../utils/EventBus';
import Store from '../utils/Store';
import { BattleView } from '../views/BattleView';
import { Pokemon, PokemonMove } from '../models/PokemonModel';
import { TurnManager } from './TurnManager.ts';
import { BattleAction, BattleState, BattleTurn } from '../models/BattleModel.ts';
import { Pokedex } from '../data/pokedex.ts';
import { items } from '../data/items.ts';
import { abilities } from '../data/abilities.ts';
import { moves } from '../data/moves.ts';
import { natures } from '../data/natures.ts';
import { cpuPokedex } from '../data/cpuPokedex.ts';
import { createBattlePokemon } from '../utils/PokemonFactory.ts';
import EffectManager from './EffectManager.ts';
import { PokemonAI } from './PokemonAI.ts';

export class BattleController {
  private battleView: BattleView | null;
  private turnManager: TurnManager | null;
  private ai: PokemonAI;

  constructor() {
    this.battleView = new BattleView();
    this.turnManager = new TurnManager();
    this.ai = new PokemonAI();

    this.registerEventListeners();
  }

  initialize(): void {
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

    /*
    ============================================================================
    - INITIAL CONTEXT DEFINITION
    ============================================================================
    */
    const context = {
      damage: null,
      move: null,
      moveType: null,
      attacker: null,
      defender: null,
      hits: false,
      effectiveness: null,
      critical: null,
      requestSwitch: false,
      pendingLogs: [],
    };

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
      context: context,
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
    let battleState = Store.getState().battle;
    
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

    /* 
    ============================================================================
    - CLEAR ALL EFFECTS FOR NEW BATTLE
    - REGISTER ABILITIES/ITEMS EFFECTS FOR BOTH POKEMON
    - THESE EFFECTS ARE RESET AT THE START OF EACH TURN
    ============================================================================
    */
    EffectManager.clearAllEffects();
    EffectManager.registerPokemonEffects(battleState.activePokemon.player);
    EffectManager.registerPokemonEffects(battleState.activePokemon.cpu);

    battleState = Store.getState().battle;
    console.log(`BattleController : ====== TURN START : ${battleState.turn} ======`);
    Store.setState({
      battle: {
        ...battleState,
        log: [...battleState.log, `===== Début du Tour ${battleState.turn} ! =====`]
      }
    });

    /*
    ============================================================================
    - HOOK : ON SWITCH ===> BEGINNING OF BATTLE
    ============================================================================
    */
    battleState = Store.getState().battle;
    battleState.context.switchedPokemon = battleState.activePokemon.player;
    battleState.context.opponentPokemon = battleState.activePokemon.cpu;
    EffectManager.applyOnSwitchEffects(battleState.context);
    Store.setState({
      battle: {
        ...battleState,
        log: [...battleState.log, ...battleState.context.pendingLogs]
      }
    });

    battleState.context.pendingLogs.length = 0;

    /*
    ============================================================================
    - HOOK : ON TURN START ===> BEGINNING OF BATTLE
    ============================================================================
    */
    // EffectManager.applyTurnStartEffects(battleState); I don't implement one yet

    this.battleView?.showActionSelection();
  }
  
  private selectMove(moveIndex: number): void {
    const battleState = Store.getState().battle;
    const activePokemon = battleState.activePokemon.player;

    if (moveIndex >= activePokemon.moves.length) {
      console.error('Invalid move index');
      return;
    }

    let moveType = 'move';
    let selectedMove = activePokemon.moves[moveIndex] || null; // To test with struggle
    if(moveIndex === -1) {
      moveType = 'struggle';
      console.log('Battle Controller : Struggle move selected');
    }

    const playerAction: BattleAction = {
        type: moveType,
        user: 'player',
        target: 'cpu',
        data: {
          moveIndex: moveIndex,
          move: selectedMove
        }
      };

    const cpuAction = this.ai.makeDecision(battleState.activePokemon.cpu, 
      battleState.activePokemon.player, battleState.cpuTeam);

    // Create turn
    const currentTurn: BattleTurn = {
      turnNumber: battleState.turn,
      actions: {
        player: playerAction,
        cpu: cpuAction.action
      }
    };

    console.log('BattleController : CPU Action Reasoning:', cpuAction.reasoning);
    
    this.executeTurn(currentTurn);
  }
  
  private switchPokemon(pokemonIndex: number): void {
    const battleState = Store.getState().battle;
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
    const cpuAction = this.ai.makeDecision(battleState.activePokemon.cpu, 
      battleState.activePokemon.player, battleState.cpuTeam);
    
    // Create turn
    const currentTurn: BattleTurn = {
      turnNumber: battleState.turn,
      actions: {
        player: playerAction,
        cpu: cpuAction.action
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
    const cpuTeam: Pokemon[] = [];
    
    // Same team size as player
    for (let i = 0; i < size; i++) {
      const randomIndex = Math.floor(Math.random() * Object.keys(cpuPokedex).length);
      const cpuPokemonKey = Object.keys(cpuPokedex)[randomIndex];
      const abilityKey = cpuPokedex[cpuPokemonKey as keyof typeof cpuPokedex].ability;
      const itemKey = cpuPokedex[cpuPokemonKey as keyof typeof cpuPokedex].item;
      const natureKey = cpuPokedex[cpuPokemonKey as keyof typeof cpuPokedex].nature;

      // Create Pokemon object
      const cpuPokemon = createBattlePokemon(
        cpuPokemonKey as keyof typeof cpuPokedex, 
        {
          nature: natures[natureKey as keyof typeof natures],
          moves: this.generateCpuMoves(cpuPokemonKey),
          ability: abilities[abilityKey as keyof typeof abilities],
          item: items[itemKey as keyof typeof items]
        });
      cpuPokemon.key = cpuPokemonKey;
      cpuPokemon.abilityKey = abilityKey;
      cpuPokemon.itemKey = itemKey;
      cpuPokemon.natureKey = natureKey;

      cpuTeam.push(cpuPokemon);
    }
    
    return cpuTeam;
  }
  
  private generateCpuMoves(cpuPokemonKey: string): PokemonMove[] {
    const cpuPokemonMoves = cpuPokedex[cpuPokemonKey as keyof typeof cpuPokedex].moves.map((moveKey: string) => {
      const baseMove = moves[moveKey as keyof typeof moves];
      return {
        ...baseMove,
        moveKey: baseMove.moveKey,
        currentPP: baseMove.pp,
        target: null
      }
    });

    return cpuPokemonMoves;
  }

  public generateAiAction(): BattleAction {
    const battleState = Store.getState().battle;
    
    if (!battleState) {
      throw new Error('Battle state not initialized');
    }
    
    const cpuPokemon = battleState.activePokemon.cpu;
    const playerPokemon = battleState.activePokemon.player;
    const cpuTeam = battleState.cpuTeam;
    
    const decision = this.ai.makeDecision(cpuPokemon, playerPokemon, cpuTeam);
    
    // Debug
    console.log(`BattleController : IA Decision Reasoning : ${decision.reasoning}`);
    
    return decision.action;
  }
  
  private executeTurn(turn: BattleTurn): void {
    this.turnManager?.executeTurn(turn, () => {
      // Callback after turn execution, check if battle over, otherwise next turn
      this.checkBattleState();
    });
  }
  
  private checkBattleState(): void {
    if (this.checkIfBattleOver()) {
      return;
    }

    this.startNextTurn();
  }

  private checkIfBattleOver(): boolean {
    const battleState = Store.getState().battle;
    
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
      return true;
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
      return true;
    }

    return false;
  }

  private startNextTurn(): void {
    let battleState = Store.getState().battle;

    // Battle continues
    Store.setState({
      battle: {
        ...battleState,
        turn: battleState.turn + 1
      }
    });

    // Prepare for next turn

    battleState.activePokemon.player.canAct = true;
    battleState.activePokemon.cpu.canAct = true;
    battleState.activePokemon.player.hasBeenDamaged = false;
    battleState.activePokemon.cpu.hasBeenDamaged = false;
    battleState.context.requestSwitch = false;

    /*
    ============================================================================
    - RESET ALL EFFECTS FOR NEW TURN
    - REGISTER EFFECTS FOR (NEW) ACTIVE POKEMON
    ============================================================================
    */
    EffectManager.resetEffects(battleState.activePokemon.player, battleState.activePokemon.cpu); 

    battleState = Store.getState().battle;
    console.log(`BattleController : ====== TURN START : ${battleState.turn} ======`);
    Store.setState({
      battle: {
        ...battleState,
        log: [...battleState.log, `===== Début du Tour ${battleState.turn} ! =====`]
      }
    });

    /*
    ============================================================================
    - HOOK : ON TURN START ===> BEGINNING OF TURN
    ============================================================================
    */
    // EffectManager.applyTurnStartEffects(battleState); I don't implemented one yet
    
    this.battleView?.showActionSelection();
  }
}