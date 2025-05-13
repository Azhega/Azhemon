import { Pokemon, PokemonMove } from '../models/PokemonModel';
import { MoveResult, BattleState, WeatherType } from '../models/BattleModel';
import Store from '../utils/Store';

const TYPE_CHART: Record<string, Record<string, number>> = {
  Normal: {
    Rock: 0.5,
    Ghost: 0,
    Steel: 0.5
  },
  Fire: {
    Fire: 0.5,
    Water: 0.5,
    Grass: 2,
    Ice: 2,
    Bug: 2,
    Rock: 0.5,
    Dragon: 0.5,
    Steel: 2
  },
  Water: {
    Fire: 2,
    Water: 0.5,
    Grass: 0.5,
    Ground: 2,
    Rock: 2,
    Dragon: 0.5
  },
  Electric: {
    Water: 2,
    Electric: 0.5,
    Grass: 0.5,
    Ground: 0,
    Flying: 2,
    Dragon: 0.5
  },
  Grass: {
    Fire: 0.5,
    Water: 2,
    Grass: 0.5,
    Poison: 0.5,
    Ground: 2,
    Flying: 0.5,
    Bug: 0.5,
    Rock: 2,
    Dragon: 0.5,
    Steel: 0.5
  },
  Ice: {
    Fire: 0.5,
    Water: 0.5,
    Grass: 2,
    Ice: 0.5,
    Ground: 2,
    Flying: 2,
    Dragon: 2,
    Steel: 0.5
  },
  Fighting: {
    Normal: 2,
    Ice: 2,
    Poison: 0.5,
    Flying: 0.5,
    Psychic: 0.5,
    Bug: 0.5,
    Rock: 2,
    Ghost: 0,
    Dark: 2,
    Steel: 2,
    Fairy: 0.5
  },
  Poison: {
    Grass: 2,
    Poison: 0.5,
    Ground: 0.5,
    Rock: 0.5,
    Ghost: 0.5,
    Steel: 0,
    Fairy: 2
  },
  Ground: {
    Fire: 2,
    Electric: 2,
    Grass: 0.5,
    Poison: 2,
    Flying: 0,
    Bug: 0.5,
    Rock: 2,
    Steel: 2
  },
  Flying: {
    Electric: 0.5,
    Grass: 2,
    Fighting: 2,
    Bug: 2,
    Rock: 0.5,
    Steel: 0.5
  },
  Psychic: {
    Fighting: 2,
    Poison: 2,
    Psychic: 0.5,
    Dark: 0,
    Steel: 0.5
  },
  Bug: {
    Fire: 0.5,
    Grass: 2,
    Fighting: 0.5,
    Poison: 0.5,
    Flying: 0.5,
    Psychic: 2,
    Ghost: 0.5,
    Dark: 2,
    Steel: 0.5,
    Fairy: 0.5
  },
  Rock: {
    Fire: 2,
    Ice: 2,
    Fighting: 0.5,
    Ground: 0.5,
    Flying: 2,
    Bug: 2,
    Steel: 0.5
  },
  Ghost: {
    Normal: 0,
    Psychic: 2,
    Ghost: 2,
    Dark: 0.5
  },
  Dragon: {
    Dragon: 2,
    Steel: 0.5,
    Fairy: 0
  },
  Dark: {
    Fighting: 0.5,
    Psychic: 2,
    Ghost: 2,
    Dark: 0.5,
    Fairy: 0.5
  },
  Steel: {
    Fire: 0.5,
    Water: 0.5,
    Electric: 0.5,
    Ice: 2,
    Rock: 2,
    Steel: 0.5,
    Fairy: 2
  },
  Fairy: {
    Fire: 0.5,
    Fighting: 2,
    Poison: 0.5,
    Dragon: 2,
    Dark: 2,
    Steel: 0.5
  }
};

export class BattleEngine {
  calculatePriority(actionType: string, moveSpeed?: number, pokemonSpeed?: number): number {
    let priority = 0;
    
    if (actionType === 'switch') {
      priority = 6;
    } else if (actionType === 'move' && moveSpeed !== undefined) {
      // Attack priority
      priority = moveSpeed;
    }
    
    // Add speed to priority
    if (pokemonSpeed !== undefined) {
      priority += (pokemonSpeed / 1000);
    }
    
    return priority;
  }
  
  // Calculate if the move hits
  calculateHit(move: PokemonMove, attacker: Pokemon, defender: Pokemon): boolean {
    // Attacks that always hit
    if (move.accuracy === 0) {
      return true;
    }
    
    // Basic calculation of hit chance
    const accuracy = attacker.currentStats.accuracy * (1 + attacker.statModifiers.accuracy / 3);
    const evasion = defender.currentStats.evasion * (1 + defender.statModifiers.evasion / 3);
    
    const hitChance = move.accuracy * (accuracy / evasion);
    const roll = Math.random() * 100;
    
    return roll <= hitChance;
  }
  
  calculateDamage(move: PokemonMove, attacker: Pokemon, defender: Pokemon, battleState: BattleState): {
    damage: number;
    effectiveness: number;
    critical: boolean;
  } {
    // No damage move
    if (move.power === 0) {
      return { damage: 0, effectiveness: 1, critical: false };
    }
    
    // Determine if the move is physical or special
    let attackStat: number;
    let defenseStat: number;
    
    if (move.category === 'Physical') {
      attackStat = attacker.currentStats.attack * (1 + attacker.statModifiers.attack / 3);
      defenseStat = defender.currentStats.defense * (1 + defender.statModifiers.defense / 3);
    } else if (move.category === 'Special') {
      attackStat = attacker.currentStats.specialAttack * (1 + attacker.statModifiers.specialAttack / 3);
      defenseStat = defender.currentStats.specialDefense * (1 + defender.statModifiers.specialDefense / 3);
    } else {
      // Status moves or other categories
      return { damage: 0, effectiveness: 1, critical: false };
    }
    
    // Critical hit chance (1/16)
    const critical = Math.random() < 0.0625;
    const critMod = critical ? 1.5 : 1.0;
    
    // STAB
    const stab = attacker.types.includes(move.type) ? 1.5 : 1.0;
    
    // Effectiveness
    const effectiveness = this.calculateTypeEffectiveness(move.type, defender.types);
    
    // Randomizer
    const randomMod = 0.85 + (Math.random() * 0.15);
    
    // Basic formula for damage calculation
    const baseDamage = ((((2 * attacker.level) / 5 + 2) * move.power * (attackStat / defenseStat)) / 50) + 2;
    
    // Final Damage
    const finalDamage = Math.floor(baseDamage * stab * effectiveness * critMod * randomMod);
    
    return {
      damage: finalDamage,
      effectiveness: effectiveness,
      critical: critical
    };
  }
  
  calculateTypeEffectiveness(moveType: string, defenderTypes: string[]): number {
    let effectiveness = 1.0;
    
    // Apply type effectiveness
    for (const defenderType of defenderTypes) {
      if (defenderType && TYPE_CHART[moveType] && TYPE_CHART[moveType][defenderType] !== undefined) {
        effectiveness *= TYPE_CHART[moveType][defenderType];
      }
    }
    
    return effectiveness;
  }
  
  executeMove(move: PokemonMove, attacker: Pokemon, defender: Pokemon): MoveResult {
    const battleState = Store.getState().battle;
    
    // Check if the move hits
    const hits = this.calculateHit(move, attacker, defender);
    
    if (!hits) {
      return {
        success: false,
        message: `${attacker.name} utilise ${move.name}, mais l'adversaire évite l'attaque !`
      };
    }
    
    // Calculate damage
    const damageResult = this.calculateDamage(move, attacker, defender, battleState);
    
    // Apply damage
    if (damageResult.damage > 0) {
      // HP cannot go below 0
      defender.currentHp = Math.max(0, defender.currentHp - damageResult.damage);
      
      // Check if the defender is knocked out
      if (defender.currentHp <= 0) {
        defender.isAlive = false;
      }
    }

    // Handle effects WIP (hardest part)
    const statChanges = this.applyMoveEffects(move, attacker, defender, battleState);
    
    // Result message
    let message = `${attacker.name} utilise ${move.name}`;
    
    if (damageResult.critical) {
      message += ' - Coup critique !';
    }
    
    if (damageResult.effectiveness > 1) {
      message += ' - C\'est super efficace !';
    } else if (damageResult.effectiveness < 1 && damageResult.effectiveness > 0) {
      message += ' - Ce n\'est pas très efficace...';
    } else if (damageResult.effectiveness === 0) {
      message += ' - Ça n\'affecte pas le Pokémon ennemi...';
    }
    
    return {
      success: true,
      damage: damageResult.damage,
      criticalHit: damageResult.critical,
      effectiveness: damageResult.effectiveness,
      statChanges: statChanges,
      message: message
    };
  }

// Apply effects WIP (hardest part)
  applyMoveEffects(move: PokemonMove, attacker: Pokemon, defender: Pokemon, battleState: BattleState): any[] {
    const statChanges = [];
    
    // If move has effects
    if (move.effects) {
      // For each effect (Because move can have multiple effects)
      for (const effect of move.effects) {
        // Chance of effect activation
        if (Math.random() * 100 <= (effect.chance || 100)) {
          
          // Status application
          if (effect.status) {
            // Check if the defender already has a status
            if (!defender.status) {
              defender.status = effect.status;
              statChanges.push({
                type: 'status',
                status: effect.status,
                target: defender === battleState.activePokemon.player ? 'player' : 'cpu'
              });
            }
          }
          
          // Stat changes
          if (effect.statChanges) {
            for (const statChange of effect.statChanges) {
              const targetPokemon = statChange.target === 'self' ? attacker : defender;
              const statKey = statChange.stat as keyof typeof targetPokemon.statModifiers;
              
              // Limiting stat changes to -6 to +6
              targetPokemon.statModifiers[statKey] = Math.max(-6, Math.min(6, targetPokemon.statModifiers[statKey] + statChange.value));
              
              statChanges.push({
                stat: statChange.stat,
                change: statChange.value,
                target: targetPokemon === battleState.activePokemon.player ? 'player' : 'cpu'
              });
            }
          }
        }
      }
    }
    
    return statChanges;
  }
  
  // Apply status effects before action
  applyStatusEffectsPreAction(pokemon: Pokemon): {canAct: boolean, message: string} {
    let canAct = true;
    let message = '';
    
    // If the Pokémon has a status
    if (pokemon.status) {
      switch (pokemon.status.name) {
        case 'paralysis':
          // 25% chance to be paralyzed
          if (Math.random() < 0.25) {
            canAct = false;
            message = `${pokemon.name} est paralysé et ne peut pas bouger !`;
          }
          break;
          
        case 'sleep':
          // WIP sleep mechanic
          // 33% chance to wake up for now
          if (Math.random() < 0.33) {
            pokemon.status = null;
            message = `${pokemon.name} se réveille !`;
          } else {
            canAct = false;
            message = `${pokemon.name} dort profondément !`;
          }
          break;
          
        case 'freeze':
          // 20% chance to thaw
          if (Math.random() < 0.2) {
            pokemon.status = null;
            message = `${pokemon.name} n'est plus gelé !`;
          } else {
            canAct = false;
            message = `${pokemon.name} est gelé !`;
          }
          break;
      }
    }
    
    return { canAct, message };
  }
  
  // Apply status effects after action
  applyStatusEffectsPostTurn(pokemon: Pokemon): string {
    let message = '';
    
    // If the Pokémon has a status
    if (pokemon.status) {
      switch (pokemon.status.name) {
        case 'burn':
          // Burn damage is 1/16 of max HP and divide attack by 2
          const burnDamage = Math.max(1, Math.floor(pokemon.baseStats.hp / 16));
          pokemon.currentHp = Math.max(0, pokemon.currentHp - burnDamage);
          message = `${pokemon.name} souffre de sa brûlure !`;
          
          if (pokemon.currentHp <= 0) {
            pokemon.isAlive = false;
          }
          break;
          
        case 'poison':
          // Poison damage is 1/8 of max HP (soft poison for now)
          const poisonDamage = Math.max(1, Math.floor(pokemon.baseStats.hp / 8));
          pokemon.currentHp = Math.max(0, pokemon.currentHp - poisonDamage);
          message = `${pokemon.name} souffre du poison !`;
          
          if (pokemon.currentHp <= 0) {
            pokemon.isAlive = false;
          }
          break;
      }
    }
    
    return message;
  }
}