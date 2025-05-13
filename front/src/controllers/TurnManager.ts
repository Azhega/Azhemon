import { BattleAction, BattleTurn } from '../models/BattleModel';
import { Pokemon } from '../models/PokemonModel';
import { BattleEngine } from './BattleEngine';
import EventBus from '../utils/EventBus';
import Store from '../utils/Store';

export class TurnManager {
  private battleEngine: BattleEngine;
  
  constructor() {
    this.battleEngine = new BattleEngine();
  }
  
  executeTurn(turn: BattleTurn, callback: () => void): void {
    console.log(`Executing turn ${turn.turnNumber}`);
    
    const state = Store.getState();
    const battleState = state.battle;
    
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
    
    // Execute first action
    this.executeAction(firstAction, firstIsPlayer, () => {
      // Check if battle is over
      if (this.checkBattleOver()) {
        callback();
        return;
      }
      
      // If second Pokemon is KO, skip to end
      const secondActorPokemon = firstIsPlayer ? battleState.activePokemon.cpu : battleState.activePokemon.player;
      if (!secondActorPokemon.isAlive) {
        callback();
        return;
      }
      
      // Execute second action
      this.executeAction(secondAction, !firstIsPlayer, () => {
        // End of turn effects
        this.applyEndTurnEffects();

        // Recall to indicate end of turn
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
    const state = Store.getState();
    const battleState = state.battle;
    
    if (!battleState) {
      console.error('Battle state not initialized');
      callback();
      return;
    }
    
    // Get active Pokemons
    const actor = isPlayer ? battleState.activePokemon.player : battleState.activePokemon.cpu;
    const target = isPlayer ? battleState.activePokemon.cpu : battleState.activePokemon.player;
    
    // Check status effects before action
    const statusEffect = this.battleEngine.applyStatusEffectsPreAction(actor);
    
    if (!statusEffect.canAct) {
      // Update log with status effect message
      Store.setState({
        battle: {
          ...battleState,
          log: [...battleState.log, statusEffect.message]
        }
      });
      
      // Timer before continuing
      setTimeout(callback, 1000);
      return;
    }
    
    // Execute action based on type
    switch (action.type) {
      case 'move':
        this.executeMove(action, isPlayer, actor, target, callback);
        break;

      case 'switch':
        this.executeSwitch(action, isPlayer, callback);
        break;
        
      case 'struggle':
        this.executeStruggle(isPlayer, actor, target, callback);
        break;

      default:
        console.error(`Unknown action type: ${action.type}`);
        callback();
    }
  }
  
  private executeMove(action: BattleAction, isPlayer: boolean, actor: Pokemon, target: Pokemon, callback: () => void): void {
    const move = action.data.move;
    const moveResult = this.battleEngine.executeMove(move, actor, target);
    console.log('Move result:', moveResult)
    const state = Store.getState();
    const battleState = state.battle;
    
    // Update log
    Store.setState({
      battle: {
        ...battleState,
        log: [...battleState.log, moveResult.message]
      }
    });
    
    setTimeout(() => {
      // Display any stat changes
      if (moveResult.statChanges && moveResult.statChanges.length > 0) {
        for (const statChange of moveResult.statChanges) {
          const changeDirection = statChange.change > 0 ? 'augmente' : 'diminue';
          const magnitude = Math.abs(statChange.change) === 1 ? '' : (Math.abs(statChange.change) === 2 ? 'beaucoup ' : 'énormément ');
          const targetName = statChange.target === 'player' ? battleState.activePokemon.player.name : battleState.activePokemon.cpu.name;
          const statName = this.getStatName(statChange.stat);
          
          const statMessage = `${targetName} : ${statName} ${changeDirection} ${magnitude}!`;
          
          // Update log
          Store.setState({
            battle: {
              ...battleState,
              log: [...battleState.log, statMessage]
            }
          });
        }
      }

      console.log('Target : ', target);
      
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
        
        // Timer before continuing
        setTimeout(callback, 1000);
      } else {
        // Continue normally
        callback();
      }
    }, 1500);
  }

  private executeSwitch(action: BattleAction, isPlayer: boolean, callback: () => void): void {
    const state = Store.getState();
    const battleState = state.battle;
    
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
    const updatedBattleState = { ...battleState };
    if (isPlayer) {
      updatedBattleState.activePokemon.player = newPokemon;
    } else {
      updatedBattleState.activePokemon.cpu = newPokemon;
    }
    
    // Message for switch
    const switchMessage = `${oldPokemon.name}, reviens ! ${newPokemon.name}, go !`;
    
    // Update log
    updatedBattleState.log = [...updatedBattleState.log, switchMessage];
    
    // Update state
    Store.setState({ battle: updatedBattleState });
    
    // Timer before continuing
    setTimeout(callback, 1000);
  }
  
  private executeStruggle(isPlayer: boolean, actor: Pokemon, target: Pokemon, callback: () => void): void {
    // "Lutte" used when no pp left on other moves"
    const struggleMove = {
      id: 0,
      name: 'Lutte',
      type: 'Normal',
      category: 'Physical',
      power: 50,
      accuracy: 100,
      pp: 1,
      currentPP: 1,
      priority: 0,
      target: null,
      effects: [],
      description: 'Utilisé quand aucune autre attaque n\'est disponible. Inflige des dégâts à l\'utilisateur.'
    };
    
    // Execute struggle move
    const moveResult = this.battleEngine.executeMove(struggleMove, actor, target);
    
    // Recoil damage
    if (moveResult.damage) {
      const recoilDamage = Math.max(1, Math.floor(moveResult.damage / 4));
      actor.currentHp = Math.max(0, actor.currentHp - recoilDamage);
      
      if (actor.currentHp <= 0) {
        actor.isAlive = false;
      }
      
      // Recoil message
      moveResult.message += ` ${actor.name} subit un contrecoup !`;
    }
    
    const state = Store.getState();
    const battleState = state.battle;
    
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
  
  private applyEndTurnEffects(): void {
    const state = Store.getState();
    const battleState = state.battle;
    
    if (!battleState) {
      console.error('Battle state not initialized');
      return;
    }
    
    // Apply end turn effects for the player's Pokémon
    if (battleState.activePokemon.player.isAlive) {
      const playerStatusMessage = this.battleEngine.applyStatusEffectsPostTurn(battleState.activePokemon.player);
      
      if (playerStatusMessage) {
        // Update log
        Store.setState({
          battle: {
            ...battleState,
            log: [...battleState.log, playerStatusMessage]
          }
        });
      }
      
      // Check if the Pokémon is KO after status effect
      if (battleState.activePokemon.player.currentHp <= 0) {
        battleState.activePokemon.player.isAlive = false;
        
        const faintMessage = `${battleState.activePokemon.player.name} est K.O. !`;
        
        // Update log
        Store.setState({
          battle: {
            ...battleState,
            log: [...battleState.log, faintMessage]
          }
        });
      }
    }
    
    // Apply end turn effects for the CPU's Pokémon
    if (battleState.activePokemon.cpu.isAlive) {
      const cpuStatusMessage = this.battleEngine.applyStatusEffectsPostTurn(battleState.activePokemon.cpu);
      
      if (cpuStatusMessage) {
        // Update log
        Store.setState({
          battle: {
            ...battleState,
            log: [...battleState.log, cpuStatusMessage]
          }
        });
      }
      
      // Check if the Pokémon is KO after status effect
      if (battleState.activePokemon.cpu.currentHp <= 0) {
        battleState.activePokemon.cpu.isAlive = false;
        
        const faintMessage = `${battleState.activePokemon.cpu.name} est K.O. !`;
        
        // Update log
        Store.setState({
          battle: {
            ...battleState,
            log: [...battleState.log, faintMessage]
          }
        });
      }
    }
  }
  
  private checkBattleOver(): boolean {
    const state = Store.getState();
    const battleState = state.battle;
    
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
}