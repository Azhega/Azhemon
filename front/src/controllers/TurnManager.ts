import { BattleAction, BattleTurn } from '../models/BattleModel';
import { Pokemon } from '../models/PokemonModel';
import { BattleEngine } from './BattleEngine';
import EventBus from '../utils/EventBus';
import Store from '../utils/Store';
import EffectManager from './EffectManager';
import { Effect } from '../models/EffectModel';

export class TurnManager {
  private battleEngine: BattleEngine;
  
  constructor() {
    this.battleEngine = new BattleEngine();
  }
  
  executeTurn(turn: BattleTurn, callback: () => void): void {
    console.log(`Turn Manager : Executing turn ${turn.turnNumber} : `, turn);
    
    const battleState = Store.getState().battle;
    
    if (!battleState) {
      console.error('Battle state not initialized');
      callback();
      return;
    }
    
    // Determine priority
    const playerAction = turn.actions.player;
    const cpuAction = turn.actions.cpu;
    
    let firstAction: BattleAction;
    let secondAction: BattleAction;
    let firstIsPlayer: boolean;
    
    // Calculate priority based on action type and Pokémon stats
    const playerPriority = this.calculateActionPriority(playerAction, battleState.activePokemon.player);
    const cpuPriority = this.calculateActionPriority(cpuAction, battleState.activePokemon.cpu);
    
    if (playerPriority > cpuPriority) {
      firstAction = playerAction;
      secondAction = cpuAction;
      firstIsPlayer = true;
    } else if (cpuPriority > playerPriority) {
      firstAction = cpuAction;
      secondAction = playerAction;
      firstIsPlayer = false;
    } else {
      // Equal priority, check speed
      const playerSpeed = battleState.activePokemon.player.currentStats.speed;
      const cpuSpeed = battleState.activePokemon.cpu.currentStats.speed;
      
      if (playerSpeed > cpuSpeed) {
        firstAction = playerAction;
        secondAction = cpuAction;
        firstIsPlayer = true;
      } else if (cpuSpeed > playerSpeed) {
        firstAction = cpuAction;
        secondAction = playerAction;
        firstIsPlayer = false;
      } else {
        // If same speed, randomize
        if (Math.random() < 0.5) {
          firstAction = playerAction;
          secondAction = cpuAction;
          firstIsPlayer = true;
        } else {
          firstAction = cpuAction;
          secondAction = playerAction;
          firstIsPlayer = false;
        }
      }
    }
    
    /* 
    ============================================================================
    - EXECUTE FIRST ACTION
    ============================================================================
    */
    this.executeAction(firstAction, firstIsPlayer, () => {
      // Check if battle is over
      if (this.checkBattleOver()) {
        console.log('Battle is over');
        callback();
        return;
      }
      
      console.log('TurnManager : Battle is not over after first action');

      const firstActorPokemon = firstIsPlayer ? battleState.activePokemon.player : battleState.activePokemon.cpu;
      const secondActorPokemon = firstIsPlayer ? battleState.activePokemon.cpu : battleState.activePokemon.player;

      if (!this.checkIfPokemonIsAlive(firstActorPokemon, callback) ||
          !this.checkIfPokemonIsAlive(secondActorPokemon, callback)) {
        return;
      }

      /* 
      ============================================================================
      - EXECUTE SECOND ACTION
      ============================================================================
      */
      this.executeAction(secondAction, !firstIsPlayer, () => {
        // Check if battle is over
        if (this.checkBattleOver()) {
          console.log('Battle is over');
          callback();
          return;
        }
        console.log('TurnManager : Battle is not over after second action');

        if (!this.checkIfPokemonIsAlive(firstActorPokemon, callback) ||
            !this.checkIfPokemonIsAlive(secondActorPokemon, callback)) {
          return;
        }

        /*
        ========================================================================
        - HOOK : ON TURN END ===> AT THE END OF THE TURN
        - CHECK IF POKEMON ARE KO
        ========================================================================
        */
        this.applyTurnEndEffects(callback);
        this.checkIfCpuPokemonIsAlive(); // Make it switch if KO
        this.checkIfPlayerPokemonIsAlive(); // Make player switch if KO

        // this.checkBattleState();
        callback();
      });
    });
  }
  
  private calculateActionPriority(action: BattleAction, pokemon: Pokemon): number {
    switch (action.type) {
      case 'move':
        const moveSpeed = action.data.move.priority || 0;
        return this.battleEngine.calculatePriority('move', moveSpeed, pokemon.currentStats.speed);   
      case 'switch':
        return this.battleEngine.calculatePriority('switch', 0, pokemon.currentStats.speed);        
      default:
        return 0;
    }
  }
  
  private executeAction(action: BattleAction, isPlayer: boolean, callback: () => void): void {
    let battleState = Store.getState().battle;
    console.log('Turn Manager : Executing action:', action);
    
    if (!battleState) {
      console.error('Battle state not initialized');
      callback();
      return;
    }
    
    // Get active Pokemons
    const actor = isPlayer ? battleState.activePokemon.player : battleState.activePokemon.cpu;
    const target = isPlayer ? battleState.activePokemon.cpu : battleState.activePokemon.player;
    
    // Execute action based on type
    switch (action.type) {
      case 'move':
        console.log('Turn Manager : Executing Move Action');
        this.executeMove(action, isPlayer, actor, target, callback);
        break;

      case 'switch':
        console.log('Turn Manager : Executing Switch Action');
        this.executeSwitch(action, isPlayer, callback);
        break;
        
      case 'struggle':
        console.log('Turn Manager : Executing Struggle Action');
        this.executeStruggle(isPlayer, actor, target, callback);
        break;

      default:
        console.error(`Unknown action type: ${action.type}`);
        callback();
    }
  }
  
  private executeMove(action: BattleAction, isPlayer: boolean, actor: Pokemon, target: Pokemon, callback: () => void): void {
    /*
    ============================================================================
    - REGISTER MOVE EFFECTS ===> JUST BEFORE PREMOVE EFFECTS
    - MOVE EFFECTS WILL BE CLEARED AFTER POSTMOVE EFFECTS
    ============================================================================
    */
    EffectManager.registerMoveEffects(action.data.move.moveKey);

    /*
    ============================================================================
    - HOOK : ON PRE MOVE ===> BEFORE A MOVE IS EXECUTED
    ============================================================================
    */
    let battleState = Store.getState().battle;
    battleState.context = {
      ...battleState.context,
      damage: 0,
      attacker: actor,
      defender: target,
      move: action.data.move,
      moveType: action.data.move.type,
      pendingLogs: []
    };
    EffectManager.applyPreMoveEffects(battleState.context);
    Store.setState({
      battle: {
        ...battleState,
        log: [...battleState.log, ...(battleState.context.pendingLogs)]
      }
    });

    battleState.context.pendingLogs.length = 0;

    /*
    ============================================================================
    - BATTLE ENGINE : EXECUTE MOVE
    - HOOK : ON DAMAGE MODIFIER ===> WHEN CALCULATING DAMAGE
    ============================================================================
    */
    const move = action.data.move;
    const moveResult = this.battleEngine.executeMove(move, actor, target);
    console.log('Turn Manager : Move result:', moveResult);

    battleState = Store.getState().battle;
    // Update log
    Store.setState({
      battle: {
        ...battleState,
        log: [
          ...battleState.log,
          moveResult.message,
          ...(battleState.context.pendingLogs)
        ]
      }
    });

    battleState.context.pendingLogs.length = 0;
    
    setTimeout(() => {
      console.log('TurnManager : Target : ', target);
      
      // Check if target is KO
      if (target.currentHp <= 0) {
        target.isAlive = false;
        console.log('TurnManager : Target is KO');
        
        const faintMessage = `${target.name} est K.O. !`;
        
        battleState = Store.getState().battle;
        Store.setState({
          battle: {
            ...battleState,
            log: [...battleState.log, faintMessage]
          }
        });

        /*
        ========================================================================
        - HOOK : ON POST MOVE ===> AFTER A MOVE IS EXECUTED
        ========================================================================
        */
        EffectManager.applyPostMoveEffects(battleState.context);

        battleState = Store.getState().battle;
        Store.setState({
          battle: {
            ...battleState,
            log: [...battleState.log, ...(battleState.context.pendingLogs)]
          }
        });

        battleState.context.pendingLogs.length = 0;

        /*
        ========================================================================
        - UNREGISTER MOVE EFFECTS ===> RIGHT AFTER POSTMOVE EFFECTS
        ========================================================================
        */
        EffectManager.unregisterMoveEffects();
        
        console.log('Turn Manager : Continuing after target KO');
        // Timer before continuing
        setTimeout(callback, 1000);
      } else {
        // Continue normally
        battleState = Store.getState().battle;

        /*
        ========================================================================
        - HOOK : ON POST MOVE ===> AFTER A MOVE IS EXECUTED
        ========================================================================
        */
        EffectManager.applyPostMoveEffects(battleState.context);

        Store.setState({
          battle: {
            ...battleState,
            log: [...battleState.log, ...(battleState.context.pendingLogs)]
          }
        });

        battleState.context.pendingLogs.length = 0;

        /*
        ========================================================================
        - UNREGISTER MOVE EFFECTS ===> RIGHT AFTER POSTMOVE EFFECTS
        ========================================================================
        */
        EffectManager.unregisterMoveEffects();

        console.log('Turn Manager : Continuing, target alive');
        callback();
      }
    }, 1500);
  }

  private executeSwitch(action: BattleAction, isPlayer: boolean, callback: () => void): void {
    const battleState = Store.getState().battle;
    
    if (!battleState) {
      console.error('Battle state not initialized');
      callback();
      return;
    }
    
    const pokemonIndex = action.data.pokemonIndex;
    const team = isPlayer ? battleState.playerTeam : battleState.cpuTeam;
    
    if (pokemonIndex < 0 || pokemonIndex >= team.length) {
      console.error('Invalid pokemon index');
      callback();
      return;
    }
    
    const newPokemon = team[pokemonIndex];
    const oldPokemon = isPlayer ? battleState.activePokemon.player : battleState.activePokemon.cpu;
    
    // Update active Pokemon
    if (isPlayer) {
      battleState.activePokemon.player = newPokemon;
    } else {
      battleState.activePokemon.cpu = newPokemon;
    }
    
    // Message for switch
    const switchMessage = `${oldPokemon.name}, reviens ! ${newPokemon.name}, go !`;
    
    // Update log
    battleState.log = [...battleState.log, switchMessage];
    
    // Update state
    Store.setState({ battle: battleState });

    battleState.context.switchedPokemon = newPokemon;

    /*
    ============================================================================
    - HOOK : ON SWITCH ===> AFTER A POKEMON IS SWITCHED
    ============================================================================
    */
    EffectManager.applyOnSwitchEffects(battleState.context);
    
    Store.setState({
      battle: {
        ...battleState,
        log: [...battleState.log, ...(battleState.context.pendingLogs)]
      }
    });

    battleState.context.pendingLogs.length = 0;

    // Timer before continuing
    setTimeout(callback, 1000);
  }
  
  private executeStruggle(isPlayer: boolean, actor: Pokemon, target: Pokemon, callback: () => void): void {
    // "Lutte" used when no pp left on other moves"
    const struggleMove = {
      moveKey: 'struggle',
      id: 0,
      name: 'Lutte',
      type: 'Normal',
      category: 'Physique',
      power: 50,
      accuracy: 100,
      pp: 1,
      currentPP: 1,
      priority: 0,
      target: null,
      description: 'Utilisé quand aucune autre attaque n\'est disponible. Inflige des dégâts à l\'utilisateur.'
    };
    
    // Execute struggle move
    const moveResult = this.battleEngine.executeMove(struggleMove, actor, target);
    
    // Recoil damage
    if (moveResult.damage) {
      const recoilDamage = Math.max(1, Math.floor(moveResult.damage / 4));
      actor.currentHp = Math.max(0, actor.currentHp - recoilDamage);
      
      // Recoil message
      moveResult.message += ` ${actor.name} subit un contrecoup !`;
    }
    
    const battleState = Store.getState().battle;
    
    // Update log
    Store.setState({
      battle: {
        ...battleState,
        log: [...battleState.log, moveResult.message]
      }
    });
    
    // Timer before continuing
    setTimeout(() => {
      // Check if target is KO
      if (target.currentHp <= 0) {
        target.isAlive = false;
        const faintMessage = `${target.name} est K.O. !`;
        
        // Update log
        Store.setState({
          battle: {
            ...battleState,
            log: [...battleState.log, faintMessage]
          }
        });
      }
      
      // Check if actor is KO after recoil
      if (actor.currentHp <= 0) {
        actor.isAlive = false;
        const faintMessage = `${actor.name} est K.O. à cause du contrecoup !`;
        
        // Update log
        Store.setState({
          battle: {
            ...battleState,
            log: [...battleState.log, faintMessage]
          }
        });
      }
      
      // Timer before continuing
      setTimeout(callback, 1000);
    }, 1500);
  }
  
  private checkBattleOver(): boolean {
    const battleState = Store.getState().battle;

    if (!battleState) {
      console.error('Battle state not initialized');
      return true;
    }
    
    // Check if the player is defeated
    const isPlayerTeamDefeated = battleState.playerTeam.every((pokemon: Pokemon) => !pokemon.isAlive);
    
    // Check if the CPU is defeated
    const isCpuTeamDefeated = battleState.cpuTeam.every((pokemon: Pokemon) => !pokemon.isAlive);
    
    return isPlayerTeamDefeated || isCpuTeamDefeated;
  }
  
  private getStatName(stat: string): string {
    switch (stat) {
      case 'attack': return 'Attaque';
      case 'defense': return 'Défense';
      case 'specialAttack': return 'Attaque Spéciale';
      case 'specialDefense': return 'Défense Spéciale';
      case 'speed': return 'Vitesse';
      case 'accuracy': return 'Précision';
      case 'evasion': return 'Esquive';
      default: return stat;
    }
  }

  private waitForPlayerPokemonSelection(callback: () => void): void {
    // Listen for the player's selection event
    const onPokemonSelected = (selectedPokemonIndex: number) => {
      // Remove the event listener after selection
      EventBus.off('battle:pokemon-selected', onPokemonSelected);

      // Update the active Pokémon for the player
      const battleState = Store.getState().battle;
      const selectedPokemon = battleState.playerTeam[selectedPokemonIndex];

      if (selectedPokemon && selectedPokemon.isAlive) {
        battleState.activePokemon.player = selectedPokemon;

        // Update the state
        Store.setState({ battle: battleState });

        // Log the switch
        const switchMessage = `Le joueur envoie ${selectedPokemon.name} !`;
        Store.setState({
          battle: {
            ...battleState,
            log: [...battleState.log, switchMessage],
          },
        });

        // Run onSwitch effects
        const updatedBattleState = Store.getState().battle;
        updatedBattleState.context.switchedPokemon = selectedPokemon;
        EffectManager.applyOnSwitchEffects(updatedBattleState.context);

        const latestState = Store.getState();
        const latestBattleState = latestState.battle;
        Store.setState({
          battle: {
            ...latestBattleState,
            log: [...latestBattleState.log, latestBattleState.context.pendingLogs.shift() as string],
          },
        });

        // Continue execution
        callback();
      } else {
        console.error('Invalid Pokémon selection');
      }
    };

    EventBus.on('battle:pokemon-selected', onPokemonSelected);
  };

  private switchCpuPokemon(): void {
    const battleState = Store.getState().battle;

    // Find the next available Pokémon in the CPU's team
    const nextPokemon = battleState.cpuTeam.find((pokemon: Pokemon) => pokemon.isAlive);

    if (nextPokemon) {
      battleState.activePokemon.cpu = nextPokemon;

      // Update the state
      Store.setState({ battle: battleState });

      // Log the switch
      const switchMessage = `L'adversaire envoie ${nextPokemon.name} !`;
      Store.setState({
        battle: {
          ...battleState,
          log: [...battleState.log, switchMessage],
        },
      });
    } else {
      console.log('No available Pokémon for CPU, player wins');
    }
  };

  private checkIfPokemonIsAlive(pokemon: Pokemon, callback: () => void): boolean {
    let battleState = Store.getState().battle;
    if (pokemon.currentHp <= 0) {
      pokemon.isAlive = false;
      console.log(`TurnManager : ${pokemon.name} is KO`);
      const faintMessage = `${pokemon.name} est K.O. !`;

      Store.setState({
        battle: {
          ...battleState,
          log: [...battleState.log, faintMessage]
        }
      });

      if (pokemon === battleState.activePokemon.player) {
        console.log(`TurnManager : Player Pokemon is KO, player must select another Pokemon`);

        /*
        ========================================================================
        - HOOK : ON TURN END ===> AT THE END OF THE TURN
        ========================================================================
        */
        this.applyTurnEndEffects(callback);
        this.checkIfCpuPokemonIsAlive(); // Make it switch if KO
        
        // Event to show Pokemon selection for the player to select another Pokemon
        EventBus.emit('battle:show-pokemon-selection');

        // Wait for player to select a Pokémon
        this.waitForPlayerPokemonSelection(() => {
          callback();
        });
      } else if (pokemon === battleState.activePokemon.cpu) {
        console.log(`TurnManager : CPU Pokemon is KO, CPU must select another Pokemon`);

        /*
        ========================================================================
        - HOOK : ON TURN END ===> AT THE END OF THE TURN
        ========================================================================
        */
        this.applyTurnEndEffects(callback);
        this.checkIfPlayerPokemonIsAlive(); // Make player switch if KO

        // Automatically switch to the next available Pokémon for the CPU
        this.switchCpuPokemon();
        /*
        ============================================================================
        - HOOK : ON SWITCH ===> AFTER A POKEMON IS SWITCHED
        ============================================================================
        */
        EffectManager.applyOnSwitchEffects(battleState.context);
        
        battleState = Store.getState().battle;
        Store.setState({
          battle: {
            ...battleState,
            log: [...battleState.log, ...(battleState.context.pendingLogs)]
          }
        });

        battleState.context.pendingLogs.length = 0;

        callback();
      } else {
        console.error('Second Pokemon is not supported :', pokemon)
        callback();
      }
      return false;
    }
    console.log(`${pokemon.name} is alive`);
    return true;
  }

  private applyTurnEndEffects(callback: () => void): void {
    const battleState = Store.getState().battle;

    /*
    ========================================================================
    - HOOK : ON TURN END ===> AT THE END OF THE TURN
    ========================================================================
    */
    EffectManager.applyTurnEndEffects(battleState.context);

    Store.setState({
      battle: {
        ...battleState,
        log: [...battleState.log, ...(battleState.context.pendingLogs)]
      }
    });

    battleState.context.pendingLogs.length = 0;

    // Check again after turn end effects
    if (this.checkBattleOver()) {
      console.log('Battle is over');
      callback();
      return;
    }
  }

  private checkIfCpuPokemonIsAlive(): void {
    const battleState = Store.getState().battle;

    if (battleState.activePokemon.cpu.currentHp <= 0) {
      battleState.activePokemon.cpu.isAlive = false;
      const faintMessage = `${battleState.activePokemon.cpu.name} est K.O. !`;

      Store.setState({
        battle: {
          ...battleState,
          log: [...battleState.log, faintMessage]
        }
      });
      console.log('TurnManager : CPU Pokemon is KO after turn end effects, CPU must select another Pokemon');

      // Automatically switch to the next available Pokémon for the CPU
      this.switchCpuPokemon();
      /*
      ============================================================================
      - HOOK : ON SWITCH ===> AFTER A POKEMON IS SWITCHED
      ============================================================================
      */
      EffectManager.applyOnSwitchEffects(battleState.context);
      
      Store.setState({
        battle: {
          ...battleState,
          log: [...battleState.log, ...(battleState.context.pendingLogs)]
        }
      });

      battleState.context.pendingLogs.length = 0;
    }
  }

  private checkIfPlayerPokemonIsAlive(): void {
    const battleState = Store.getState().battle;

    if (battleState.activePokemon.player.currentHp <= 0) {
      battleState.activePokemon.player.isAlive = false;
      const faintMessage = `${battleState.activePokemon.player.name} est K.O. !`;

      Store.setState({
        battle: {
          ...battleState,
          log: [...battleState.log, faintMessage]
        }
      });
      console.log('TurnManager : Player Pokemon is KO after turn end effects, player must select another Pokemon');

      // Event to show Pokemon selection for the player to select another Pokemon
      EventBus.emit('battle:show-pokemon-selection');

      // Wait for player to select a Pokémon
      this.waitForPlayerPokemonSelection(() => {});
    }
  }
}