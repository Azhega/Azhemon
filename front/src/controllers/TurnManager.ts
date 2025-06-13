import { BattleAction, BattleTurn } from '../models/BattleModel';
import { Pokemon } from '../models/PokemonModel';
import { BattleEngine } from './BattleEngine';
import EventBus from '../utils/EventBus';
import Store from '../utils/Store';
import EffectManager from './EffectManager';
import { PokemonAI } from './PokemonAI';
import BattleFlowManager from './BattleFlowManager';

export class TurnManager {
  private battleEngine: BattleEngine;
  private ai: PokemonAI;

  constructor() {
    this.battleEngine = new BattleEngine();
    this.ai = new PokemonAI();
  }

  public async executeTurn(turn: BattleTurn, callback: () => void): Promise<void> {
    console.log(`Turn Manager : Executing turn ${turn.turnNumber} : `, turn);
    
    const battleState = Store.getState().battle;
    
    if (!battleState) {
      console.error('Battle state not initialized');
      callback(); // BattleController.checkBattleState();
      return;
    }
    
    const { firstAction, secondAction, firstIsPlayer } = this.determineActionOrder(turn, battleState);
    
    try {
      await BattleFlowManager.executeWithDelay(
        'first-action',
        () => this.executeActionAsync(firstAction, firstIsPlayer),
        0
      );

      if (this.checkBattleOver()) {
        console.log('Battle is over after first action');
        callback(); // BattleController.checkBattleState();
        return;
      }

      const firstActorPokemon = firstIsPlayer ? battleState.activePokemon.player : battleState.activePokemon.cpu;
      const secondActorPokemon = firstIsPlayer ? battleState.activePokemon.cpu : battleState.activePokemon.player;

      if (!await this.checkIfPokemonIsAlive(firstActorPokemon, callback) || // BattleController.checkBattleState();
          !await this.checkIfPokemonIsAlive(secondActorPokemon, callback)) { // BattleController.checkBattleState();
        return;
      }

      await BattleFlowManager.executeWithDelay(
        'second-action',
        () => this.executeActionAsync(secondAction, !firstIsPlayer),
        0
      );

      if (this.checkBattleOver()) {
        console.log('Battle is over after second action');
        callback(); // BattleController.checkBattleState();
        return;
      }
      
      if (!await this.checkIfPokemonIsAlive(firstActorPokemon, callback) || // BattleController.checkBattleState();
          !await this.checkIfPokemonIsAlive(secondActorPokemon, callback)) { // BattleController.checkBattleState();
        return;
      }

      await this.applyTurnEndEffects(callback); // BattleController.checkBattleState();
      await this.handlePostTurnEndChecks(callback); // BattleController.checkBattleState();

      // Turn completed
      callback(); // BattleController.checkBattleState();

    } catch (error) {
      console.error('Error during turn execution:', error);
      callback(); // BattleController.checkBattleState();
    }
  }

  private async executeActionAsync(action: BattleAction, isPlayer: boolean): Promise<void> {
    return new Promise(async (resolve) => {
      await this.executeAction(action, isPlayer, resolve);
    });
  }

  // Handle post-turn-end checks (CPU/Player KO checks)
  private async handlePostTurnEndChecks(callback: () => void): Promise<void> {
    await this.checkIfCpuPokemonIsAlive(); // Make CPU switch if KO
    
    if (!await this.checkIfPlayerPokemonIsAlive(callback)) { // BattleController.checkBattleState();
      return; // Player needs to select new Pokemon
    }

    // Continue onto turn completion
  }

  private determineActionOrder(turn: BattleTurn, battleState: any) {
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

    return { firstAction, secondAction, firstIsPlayer };
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

  private async executeMove(action: BattleAction, actor: Pokemon, target: Pokemon, callback: () => void): Promise<void> {
    await BattleFlowManager.executeSequence([
      {
        name: 'register-move-effects',
        action: () => {
          /*
          ============================================================================
          - REGISTER MOVE EFFECTS ===> JUST BEFORE PREMOVE EFFECTS
          - MOVE EFFECTS WILL BE CLEARED AFTER POSTMOVE EFFECTS
          ============================================================================
          */
          EffectManager.registerMoveEffects(action.data.move.moveKey);
        },
        delay: 0
      },
      {
        name: 'on-pre-move-effects',
        action: async () => {
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
            pendingLogsAndEffects: []
          };
          EffectManager.applyPreMoveEffects(battleState.context);
          
          await this.displayLogsAndEffectsSequentially(battleState.context.pendingLogsAndEffects, 1000);
        },
        delay: 0
      },
      {
        name: 'execute-move',
        action: async () => {
          /*
          ============================================================================
          - BATTLE ENGINE : EXECUTE MOVE
          - HOOK : ON DAMAGE MODIFIER ===> WHEN CALCULATING DAMAGE
          ============================================================================
          */
          let battleState = Store.getState().battle;

          const move = action.data.move;
          const moveResult = this.battleEngine.executeMove(move, actor, target);
          console.log('Turn Manager : Move result:', moveResult);

          // UI Refresh to display moveResult.message
          battleState = Store.getState().battle;
          Store.setState({
            battle: {
              ...battleState,
              log: [
                ...battleState.log,
                moveResult.message
              ]
            }
          });

          // Delay for player to read the message
          await new Promise(resolve => setTimeout(resolve, 1000));

          // Determine move type and play animation
          const moveCategory = move.category;
          const attackerSide = actor === battleState.activePokemon.player ? 'player' : 'cpu';

          console.log('TurnManager: Emitting move animation event:', { moveCategory, attackerSide });

          // Create a Promise that resolves when animation completes
          const animationPromise = new Promise<void>((resolve) => {
            const onAnimationComplete = () => {
              EventBus.off('battle:animation-complete', onAnimationComplete);
              resolve();
            };
            EventBus.on('battle:animation-complete', onAnimationComplete);
            
            // Emit the animation event
            EventBus.emit('battle:play-move-animation', {
              moveCategory: moveCategory,
              attackerSide: attackerSide,
              moveType: move.type,
            });
          });

          // Wait for animation to complete
          await animationPromise;
          
          console.log('TurnManager: Animation completed, executing move');

          if (battleState.context.pendingDamage.damage > 0) {
            // Apply pending damage
            battleState = Store.getState().battle;
            this.battleEngine.applyPendingDamage(battleState);

            // UI refresh for HP bars decrease
            Store.setState({ battle: { ...battleState } });

            // Delay before effects
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
          
          await this.displayLogsAndEffectsSequentially(battleState.context.pendingLogsAndEffects, 1000);
        },
        delay: 0
      },
      {
        name: 'move-aftermath',
        action: () => {
          console.log('TurnManager : Target : ', target);
        
          // Check if target is KO
          if (target.currentHp <= 0) {
            target.isAlive = false;
          }

          console.log(`TurnManager : Target is ${target.isAlive ? 'ALIVE' : 'KO'} : `, target);
        },
        delay: 0
      },
      {
        name: 'post-move-effects',
        action: async () => {
          let battleState = Store.getState().battle;
          /*
          ========================================================================
          - HOOK : ON POST MOVE ===> AFTER A MOVE IS EXECUTED
          ========================================================================
          */
          EffectManager.applyPostMoveEffects(battleState.context);

          await this.displayLogsAndEffectsSequentially(battleState.context.pendingLogsAndEffects, 1000);
        },
        delay: 0
      },
      {
        name: 'u-turn-handling',
        action: async () => {
          let battleState = Store.getState().battle;
          if (battleState.context.requestSwitch) {
            if (battleState.context.attacker === battleState.activePokemon.player) {
              battleState.context.requestSwitch = false;
              console.log('U-TURN : PLAYER POKEMON SWITCH')
              EventBus.emit('battle:show-pokemon-selection');

              await this.waitForPlayerPokemonSelection();

              EffectManager.unregisterMoveEffects();
              console.log('Turn Manager : Continuing after U-turn');
              return;
            } else if (battleState.context.attacker === battleState.activePokemon.cpu) {
              battleState.context.requestSwitch = false;
              console.log('U-TURN : CPU POKEMON SWITCH')

              await this.switchCpuPokemon();

              EffectManager.unregisterMoveEffects();
              console.log('Turn Manager : Continuing after CPU U-turn');
              return;
            } else {
              console.error('U-TURN : Unknown attacker type');
              return;
            }
          } else {
            console.log('NO U-TURN : NO POKEMON SWITCH');
          }
        },
        delay: 0
      },
      {
        name: 'unregister-move-effects',
        action: () => {
          /*
          ========================================================================
          - UNREGISTER MOVE EFFECTS ===> RIGHT AFTER POSTMOVE EFFECTS
          ========================================================================
          */
          EffectManager.unregisterMoveEffects();

          console.log(`Turn Manager : Continuing, target is ${target.isAlive ? 'ALIVE' : 'KO'} : `);
        },
        delay: 0
      }
    ]);
    
    callback(); // BattleController.checkBattleState();
  }

  private async executeSwitch(action: BattleAction, isPlayer: boolean, callback: () => void): Promise<void> {
    await BattleFlowManager.executeSequence([
      {
        name: 'switch-pokemon',
        action: () => {
          let battleState = Store.getState().battle;
    
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
          
          const newPokemon: Pokemon = team[pokemonIndex];
          const oldPokemon: Pokemon = isPlayer ? battleState.activePokemon.player : battleState.activePokemon.cpu;
          oldPokemon.resetStats();
          
          // Update active Pokemon
          if (isPlayer) {
            battleState.activePokemon.player = newPokemon;
            EffectManager.resetEffects(battleState.activePokemon.player, battleState.activePokemon.cpu);
          } else {
            battleState.activePokemon.cpu = newPokemon;
            EffectManager.resetEffects(battleState.activePokemon.player, battleState.activePokemon.cpu);
          }

          // Context update
          battleState.context.switchedPokemon = newPokemon;
          battleState.context.opponentPokemon = isPlayer ? battleState.activePokemon.cpu : battleState.activePokemon.player;
          
          // Update log
          const switchMessage = `${oldPokemon.name}, reviens ! ${newPokemon.name}, go !`;
          battleState.log = [...battleState.log, switchMessage];
          
          // Update state
          Store.setState({ battle: battleState });
        },
        delay: 1000
      },
      {
        name: 'on-switch-effects',
        action: async () => {
          /*
          ============================================================================
          - HOOK : ON SWITCH ===> AFTER A POKEMON IS SWITCHED
          ============================================================================
          */
          let battleState = Store.getState().battle;
          
          EffectManager.applyOnSwitchEffects(battleState.context);
          
          await this.displayLogsAndEffectsSequentially(battleState.context.pendingLogsAndEffects, 1000);
        },
        delay: 0
      }
    ]);

    callback(); // BattleController.checkBattleState();
  }

  private async executeStruggle(actor: Pokemon, target: Pokemon, callback: () => void): Promise<void> {
    await BattleFlowManager.executeSequence([
      {
        name: 'execute-struggle',
        action: () => {
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
        },
        delay: 1000
      },
      {
        name: 'struggle-aftermath',
        action: () => {
          let battleState = Store.getState().battle;

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
        },
        delay : 1000
      }
    ]);
    
    callback(); // BattleController.checkBattleState();
  }

  private async executeAction(action: BattleAction, isPlayer: boolean, callback: () => void): Promise<void> {
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
        await this.executeMove(action, actor, target, callback);
        break;

      case 'switch':
        console.log('Turn Manager : Executing Switch Action');
        await this.executeSwitch(action, isPlayer, callback);
        break;
        
      case 'struggle':
        console.log('Turn Manager : Executing Struggle Action');
        await this.executeStruggle(actor, target, callback);
        break;

      default:
        console.error(`Unknown action type: ${action.type}`);
        callback();
    }
  }

  private checkBattleOver(): boolean {
    const battleState = Store.getState().battle;

    if (!battleState) {
      console.error('Battle state not initialized');
      return true;
    }
    
    const isPlayerTeamDefeated = battleState.playerTeam.every((pokemon: Pokemon) => !pokemon.isAlive);
    const isCpuTeamDefeated = battleState.cpuTeam.every((pokemon: Pokemon) => !pokemon.isAlive);
    
    return isPlayerTeamDefeated || isCpuTeamDefeated;
  }

  private async waitForPlayerPokemonSelection(): Promise<void> {
    return new Promise<void>((resolve) => {
      // Listen for the player's selection event
      const onPokemonSelected = async (selectedPokemonIndex: number) => {
        // Remove the event listener after selection
        EventBus.off('battle:pokemon-selected', onPokemonSelected);
        EventBus.emit('battle:hide-pokemon-selection');

        // Update the active Pokémon for the player
        let battleState = Store.getState().battle;
        const oldPokemon: Pokemon = battleState.activePokemon.player;
        oldPokemon.resetStats();

        const selectedPokemon: Pokemon = battleState.playerTeam[selectedPokemonIndex];

        if (selectedPokemon && selectedPokemon.isAlive) {
          battleState.activePokemon.player = selectedPokemon;
          EffectManager.resetEffects(battleState.activePokemon.player, battleState.activePokemon.cpu);

          // Update the state
          Store.setState({ battle: battleState });

          await BattleFlowManager.executeWithDelay(
            'player-switch-log',
            () => {
              // Log the switch
              const switchMessage = `Le joueur envoie ${selectedPokemon.name} !`;
              Store.setState({
                battle: {
                  ...battleState,
                  log: [...battleState.log, switchMessage],
                },
              });
            },
            1000
          );  

          /*
          ========================================================================
          - HOOK : ON SWITCH ===> AFTER A POKEMON IS SWITCHED
          ========================================================================
          */
          battleState = Store.getState().battle;
          battleState.context.switchedPokemon = selectedPokemon;
          battleState.context.opponentPokemon = battleState.activePokemon.cpu;
          EffectManager.applyOnSwitchEffects(battleState.context);

          await this.displayLogsAndEffectsSequentially(battleState.context.pendingLogsAndEffects, 1000)

          // Continue execution
          resolve();
        } else {
          console.error('Invalid Pokémon selection');
          resolve(); // Still resolve even on error to prevent hanging
        }
      };

      EventBus.on('battle:pokemon-selected', onPokemonSelected);
    });
    
  }

  private async switchCpuPokemon(): Promise<void> {
    let battleState = Store.getState().battle;
    const oldPokemon: Pokemon = battleState.activePokemon.cpu;
    oldPokemon.resetStats();

    // CPU AI calculates the best switch
    const nextPokemon = this.ai.switchAfterKo(battleState.activePokemon.player, battleState.cpuTeam).newCpuPokemon;

    if (nextPokemon) {
      battleState.activePokemon.cpu = nextPokemon;
      EffectManager.resetEffects(battleState.activePokemon.player, battleState.activePokemon.cpu);

      Store.setState({ battle: battleState });

      await BattleFlowManager.executeWithDelay(
        'cpu-switch-log',
        () => {
          // Log the switch
          const switchMessage = `L'adversaire envoie ${nextPokemon.name} !`;
          Store.setState({
            battle: {
              ...battleState,
              log: [...battleState.log, switchMessage],
            },
          });
        },
        1000
      );

      /*
      ============================================================================
      - HOOK : ON SWITCH ===> AFTER CPU POKEMON IS SWITCHED
      ============================================================================
      */
      battleState = Store.getState().battle;
      battleState.context.switchedPokemon = nextPokemon;
      battleState.context.opponentPokemon = battleState.activePokemon.player;
      EffectManager.applyOnSwitchEffects(battleState.context);

      await this.displayLogsAndEffectsSequentially(battleState.context.pendingLogsAndEffects, 1000)
    } else {
      console.log('No available Pokémon for CPU, player wins');
    }
  }

  private async checkIfPokemonIsAlive(pokemon: Pokemon, callback: () => void): Promise<boolean> {
    let battleState = Store.getState().battle;
    if (pokemon.currentHp <= 0) {
      await BattleFlowManager.executeWithDelay(
        'pokemon-fainted-message',
        () => {
          pokemon.isAlive = false;
          console.log(`TurnManager : ${pokemon.name} is KO`);
          const faintMessage = `${pokemon.name} est K.O. !`;

          Store.setState({
            battle: {
              ...battleState,
              log: [...battleState.log, faintMessage]
            }
          });
        },
        1000
      );

      if (pokemon === battleState.activePokemon.player) {
        console.log(`TurnManager : Player Pokemon is KO, player must select another Pokemon`);

        /*
        ========================================================================
        - HOOK : ON TURN END ===> AT THE END OF THE TURN
        ========================================================================
        */
        await this.applyTurnEndEffects(callback); // BattleController.checkBattleState();
        await this.checkIfCpuPokemonIsAlive(); // Make CPU switch if KO
        
        // Event to show Pokemon selection for the player to select another Pokemon
        EventBus.emit('battle:show-pokemon-selection');

        // Wait for player to select a Pokémon
        await this.waitForPlayerPokemonSelection();

        callback(); // BattleController.checkBattleState();
      } else if (pokemon === battleState.activePokemon.cpu) {
        console.log(`TurnManager : CPU Pokemon is KO, CPU must select another Pokemon`);

        /*
        ========================================================================
        - HOOK : ON TURN END ===> AT THE END OF THE TURN
        ========================================================================
        */
        await this.applyTurnEndEffects(callback); // BattleController.checkBattleState();

        if (!await this.checkIfPlayerPokemonIsAlive(callback)) { // Make player switch if KO // BattleController.checkBattleState();
          // Automatically switch to the next available Pokémon for the CPU
          await this.switchCpuPokemon();
          return false;
        }

        // Automatically switch to the next available Pokémon for the CPU
        await this.switchCpuPokemon();

        callback(); // BattleController.checkBattleState();
      } else {
        console.error('Second Pokemon is not supported :', pokemon)
        callback(); // BattleController.checkBattleState();
      }
      return false;
    }
    console.log(`${pokemon.name} is alive`);
    return true;
  }

  private async checkIfCpuPokemonIsAlive(): Promise<void> {
    const battleState = Store.getState().battle;

    if (battleState.activePokemon.cpu.currentHp <= 0) {
      battleState.activePokemon.cpu.isAlive = false;

      await BattleFlowManager.executeWithDelay(
        'cpu-pokemon-fainted-log',
        () => {
          const faintMessage = `${battleState.activePokemon.cpu.name} est K.O. !`;

          Store.setState({
            battle: {
              ...battleState,
              log: [...battleState.log, faintMessage]
            }
          });
          console.log('TurnManager : CPU Pokemon is KO after turn end effects, CPU must select another Pokemon');
        },
        1000
      );
      
      /*
      ==========================================================================
      - HOOK : ON SWITCH ===> AFTER CPU POKEMON IS SWITCHED
      ==========================================================================
      */
      await this.switchCpuPokemon();
    }
  }

  private async checkIfPlayerPokemonIsAlive(callback: () => void): Promise<boolean> {
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
      await this.waitForPlayerPokemonSelection();

      callback(); // BattleController.checkBattleState();
      return false;
    }
    return true;
  }

  private async applyTurnEndEffects(callback: () => void): Promise<void> {
    const battleState = Store.getState().battle;

    /*
    ========================================================================
    - HOOK : ON TURN END ===> AT THE END OF THE TURN
    ========================================================================
    */
    EffectManager.applyTurnEndEffects(battleState.context);

    await this.displayLogsAndEffectsSequentially(battleState.context.pendingLogsAndEffects, 1000);

    // Check again after turn end effects
    if (this.checkBattleOver()) {
      console.log('Battle is over');
      callback(); // BattleController.checkBattleState();
      return;
    }
  }

  public async displayLogsAndEffectsSequentially(
    logsAndEffects: Array<{ log: string; effect?: () => void }>, 
    delayBetweenLogs: number = 1000
  ): Promise<void> {
    if (logsAndEffects.length === 0) return;

    for (let i = 0; i < logsAndEffects.length; i++) {
      const logAndEffect = logsAndEffects[i];

      if (!logAndEffect) {
        return;
      }

      const log = logAndEffect.log;
      const effect = logAndEffect.effect;

      console.log(`DisplayLogsSequentially: logsAndEffects length: ${logsAndEffects.length}`);
      console.log('DisplayLogsSequentially: Current log :', log);
      console.log('DisplayLogsSequentially: Current effect :', effect);

      // Display the log message
      console.log(`DisplayLogsSequentially: Displaying log ${i + 1}:`, log);
      let battleState = Store.getState().battle;
      Store.setState({
        battle: {
          ...battleState,
          log: [...battleState.log, log]
        }
      });

      // Then execute the associated effect
      if (effect) {
        console.log(`DisplayLogsSequentially: Executing effect ${i + 1}:`, effect);
        try {
          // Small delay so player can read the message first
          await new Promise(resolve => setTimeout(resolve, 1000));
          effect();
          
          // Update the store to trigger UI refresh for HP bars
          let battleState = Store.getState().battle;
          Store.setState({
            battle: {
              ...battleState
            }
          });
        } catch (error) {
          console.error(`DisplayLogsSequentially: Error executing effect for log ${i + 1}:`, error);
        }
      }
      
      console.log(`DisplayLogsSequentially: Waiting ${delayBetweenLogs}ms before next log`);
      await new Promise(resolve => setTimeout(resolve, delayBetweenLogs));
      console.log(`DisplayLogsSequentially: Continuing to next log`);
    }

    console.log('DisplayLogsSequentially: Completion in progress');
    // Clear pending logs after all are displayed
    let battleState = Store.getState().battle;
    battleState.context.pendingLogsAndEffects.length = 0;
    console.log('DisplayLogsSequentially: Completed with effects');
  }
}