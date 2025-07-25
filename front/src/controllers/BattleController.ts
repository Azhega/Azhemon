import EventBus from '../utils/EventBus';
import Store from '../utils/Store';
import { BattleView } from '../views/battle/BattleView.ts';
import { Pokemon } from '../models/PokemonModel';
import { PokemonMove } from '../interfaces/PokemonInterface.ts'
import { TurnManager } from './TurnManager.ts';
import { BattleAction, BattleState, BattleTurn } from '../interfaces/BattleInterface.ts';
import { items } from '../data/items.ts';
import { abilities } from '../data/abilities.ts';
import { moves } from '../data/moves.ts';
import { natures } from '../data/natures.ts';
import { cpuPokedex } from '../data/cpuPokedex.ts';
import { createBattlePokemon } from '../utils/PokemonFactory.ts';
import EffectManager from './EffectManager.ts';
import { PokemonAI } from './PokemonAI.ts';
import BattleFlowManager from './BattleFlowManager.ts';

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
    
    const playerTeam = state.currentBattleTeam || [];
    if (!playerTeam.some((pokemon: Pokemon | null) => pokemon !== null)) {
      console.error('No Pokémon in player team');
      EventBus.emit('battle:error', 'Tu dois avoir au moins un Pokémon dans ton équipe !');
      return;
    }
    
    const validPlayerTeam = playerTeam.filter((pokemon: Pokemon | null) => pokemon !== null);
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
      defenderInitialHp: null,
      hits: false,
      effectiveness: null,
      critical: null,
      requestSwitch: false,
      pendingLogsAndEffects: [],
      pendingDamage: {}
    };

    // Initialize battle state
    const battleState: BattleState = {
      turn: 0,
      playerTeam: validPlayerTeam,
      cpuTeam: cpuTeam,
      activePokemon: {
        player: null,
        cpu: cpuTeam[0]
      },
      leadSelected: false,
      weather: null, // to implement later
      terrain: null, // to implement later
      status: 'initializing',
      log: [],
      context: context,
    };
    
    Store.setState({ battle: battleState });
    
    this.battleView?.initialize();
    
    // Show lead selection
    EventBus.emit('battle:show-pokemon-selection', { leadSelection: true });
  }

  destroy(): void {
    // Remove event listeners
    EventBus.off('battle:select-move');
    EventBus.off('battle:switch-pokemon');
    EventBus.off('battle:exit-battle');
    EventBus.off('battle:lead-selected');

    // Clean up views
    if (this.battleView) {
        this.battleView.destroy();
        this.battleView = null;
    }

    this.turnManager = null;
  }
  
  private registerEventListeners(): void {
    // Battle events
    EventBus.on('battle:select-move', (data) => this.selectMove(data.moveIndex));
    EventBus.on('battle:switch-pokemon', (data) => this.switchPokemon(data.pokemonIndex));
    EventBus.on('battle:exit-battle', () => this.exitBattle());
    EventBus.on('battle:lead-selected', (data) => this.setLeadPokemon(data.pokemonIndex));
  }

  private setLeadPokemon(pokemonIndex: number): void {
    const battleState = Store.getState().battle;
    const selectedPokemon: Pokemon = battleState.playerTeam[pokemonIndex];
    if (!selectedPokemon || !selectedPokemon.isAlive) {
      EventBus.emit('battle:error', 'Sélection invalide.');
      return;
    }
    battleState.activePokemon.player = selectedPokemon;
    battleState.leadSelected = true;
    Store.setState({ battle: battleState });
    this.startBattle();
  }
  
  private async startBattle(): Promise<void> {
    let battleState = Store.getState().battle;
    
    if (!battleState) {
      console.error('Battle state not initialized');
      return;
    }

    await BattleFlowManager.executeSequence([
      {
        name: 'battle-initialization',
        action: () => {
          Store.setState({
            battle: {
              ...battleState,
              status: 'active',
              turn: 1,
              log: [...battleState.log, 'La bataille commence !']
            }
          });
        },
        delay: 0,
        message: 'Initialisation du combat...'
      },
      {
        name: 'clear-register-effects',
        action: () => {
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
          Store.setState({
            battle: {
              ...battleState,
              log: [...battleState.log, `===== Début du Tour ${battleState.turn} ! =====`]
            }
          });
        },
        delay: 500,
        message: 'Initialisation des effets...'
      },
      {
        name: 'lead-effects',
        action: async () => {
          /*
          ============================================================================
          - HOOK : ON SWITCH ===> BEGINNING OF BATTLE
          ============================================================================
          */
          battleState = Store.getState().battle;
          battleState.context.switchedPokemon = battleState.activePokemon.player;
          battleState.context.opponentPokemon = battleState.activePokemon.cpu;
          EffectManager.applyOnSwitchEffects(battleState.context);
          
          await this.turnManager?.displayLogsAndEffectsSequentially(battleState.context.pendingLogsAndEffects, 1000);
        },
        delay: 0
      },
      {
        name: 'on-turn-start-effects',
        action: async () => {
          /*
          ============================================================================
          - HOOK : ON TURN START ===> BEGINNING OF BATTLE
          ============================================================================
          */
          EffectManager.applyTurnStartEffects(battleState.context);

          await this.turnManager?.displayLogsAndEffectsSequentially(battleState.context.pendingLogsAndEffects, 1000);
        },
        delay: 0
      }
    ]);

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
      return;
    }
    
    if (!selectedPokemon.isAlive) {
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

    const currentBattleTeam = state.currentBattleTeam;

    // Reset Current Team
    const resetTeam = currentBattleTeam.map((pokemon: Pokemon | null) => {
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

    // Update the state with the reset team
    Store.setState({
      currentBattleTeam: resetTeam,
      battle: null,
    });

    EventBus.emit('battle:back-to-menu'); // GameController.switchScreen('menu');
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
          item: items[itemKey as keyof typeof items],
          slot: i
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

  private async startNextTurn(): Promise<void> {
    let battleState = Store.getState().battle;

    await BattleFlowManager.executeSequence([
      {
        name: 'turn-preparation',
        action: () => {
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

          battleState.context = {
            damage: null,
            move: null,
            moveType: null,
            attacker: null,
            defender: null,
            defenderInitialHp: null,
            hits: false,
            effectiveness: null,
            critical: null,
            requestSwitch: false,
            pendingLogsAndEffects: [],
            pendingDamage: {}
          };
        },
        delay: 0,
        message: 'Préparation du prochain tour...'
      },
      {
        name: 'reset-effects',
        action: () => {
          /*
          ============================================================================
          - RESET ALL EFFECTS FOR NEW TURN
          - REGISTER EFFECTS FOR (NEW) ACTIVE POKEMON
          ============================================================================
          */
          EffectManager.resetEffects(battleState.activePokemon.player, battleState.activePokemon.cpu);
          
          battleState = Store.getState().battle;
          Store.setState({
            battle: {
              ...battleState,
              log: [...battleState.log, `===== Début du Tour ${battleState.turn} ! =====`]
            }
          });
        },
        delay: 0,
        message: `Tour ${battleState.turn + 1} !`
      },
      {
        name: 'on-turn-start-effects',
        action: async () => {
          /*
          ============================================================================
          - HOOK : ON TURN START ===> BEGINNING OF TURN
          ============================================================================
          */
          EffectManager.applyTurnStartEffects(battleState);

          await this.turnManager?.displayLogsAndEffectsSequentially(battleState.context.pendingLogsAndEffects, 1000);
        },
        delay: 0,
        message: 'Effets de début de tour appliqués...'
      }
    ]);

    this.battleView?.showActionSelection();
  }
}