import { BattleAction, BattleTurn, MoveResult, SwitchResult } from '../models/BattleModel';
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
      
      // Emit event for interface
      EventBus.emit('battle:message', statusEffect.message);
      
      // Timer before continuing
      setTimeout(callback, 1000);
      return;
    }
    
    // Execute action based on type
    switch (action.type) {
      case 'move':
        this.executeMove(action, isPlayer, actor, target, callback);
        break;
      // case 'switch' WIP

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
      // Emit message for interface
      if (moveResult.message) {
        EventBus.emit('battle:message', moveResult.message);
      }
      
      // Display any stat changes
      if (moveResult.statChanges && moveResult.statChanges.length > 0) {
        for (const statChange of moveResult.statChanges) {
          const changeDirection = statChange.change > 0 ? 'augmente' : 'diminue';
          const magnitude = Math.abs(statChange.change) === 1 ? '' : (Math.abs(statChange.change) === 2 ? 'beaucoup ' : 'énormément ');
          const targetName = statChange.target === 'player' ? battleState.activePokemon.player.name : battleState.activePokemon.cpu.name;
          const statName = this.getStatName(statChange.stat);
          
          const statMessage = `${targetName} : ${statName} ${changeDirection} ${magnitude}!`;
          EventBus.emit('battle:message', statMessage);
          
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
        EventBus.emit('battle:message', faintMessage);
        
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