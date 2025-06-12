import { Pokemon, PokemonMove } from '../models/PokemonModel';
import { MoveResult, BattleState, WeatherType } from '../models/BattleModel';
import Store from '../utils/Store';
import EffectManager from './EffectManager';

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
    console.log('BattleEngine : Hit chance:', hitChance, 'Roll:', roll, 'Accuracy:', accuracy, 'Evasion:', evasion);
    return roll <= hitChance;
  }
  
  calculateDamage(move: PokemonMove, attacker: Pokemon, defender: Pokemon, battleState: BattleState): {
    damage: number;
    effectiveness: number;
    critical: boolean;
  } {
    // No damage move
    if (move.power === 0) {
      const context = {
        ...battleState.context,
        move: move,
        moveType: move.type,
        attacker: attacker,
        defender: defender,
        hits: true
      }
      battleState.context = context;

      return { damage: 0, effectiveness: 1, critical: false };
    }
    console.log('Battle Engine : Move power : ', move.power);
    // Determine if the move is physical or special
    let attackStat: number;
    let defenseStat: number;
    
    if (move.category === 'Physique') {
      attackStat = attacker.currentStats.attack
      defenseStat = defender.currentStats.defense
    } else if (move.category === 'Spécial') {
      attackStat = attacker.currentStats.specialAttack
      defenseStat = defender.currentStats.specialDefense
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
    const baseDamage = Math.max((((((2 * attacker.level) / 5 + 2) * move.power * (attackStat / defenseStat)) / 50) + 2), 1);

    // Final Damage
    let finalDamage = Math.ceil(baseDamage * stab * effectiveness * critMod * randomMod);
    console.log('BattleEngine : Base Damage:', baseDamage, 'Final Damage:', finalDamage, 'CriticalMod:', critMod, 'Effectiveness:', effectiveness, 'STAB:', stab, 'RandomMod:', randomMod);

    const context = {
      ...battleState.context,
      damage: finalDamage,
      move: move,
      moveType: move.type,
      attacker: attacker,
      defender: defender,
      defenderInitialHp: defender.currentHp,
      hits: true,
      effectiveness: effectiveness,
      critical: critical,
      pendingLogsAndEffects: []
    }

    battleState.context = context;

    /*
    ============================================================================
    - HOOK : ON DAMAGE MODIFIER ===> WHEN CALCULATING DAMAGE
    ============================================================================
    */
    finalDamage = EffectManager.applyDamageModifierEffects(finalDamage, context);
    console.log('BattleEngine : Final Damage after hooks:', finalDamage);

    return {
      damage: finalDamage,
      effectiveness: effectiveness,
      critical: context.critical
    };
  }
  
  calculateTypeEffectiveness(moveType: string, defenderTypes: string[]): number {
    let effectiveness = 1.0;
    const moveTypeName = this.getTypeName(moveType);
    
    // Apply type effectiveness
    for (let defenderType of defenderTypes) {
      defenderType = this.getTypeName(defenderType);
      if (defenderType && TYPE_CHART[moveTypeName] && TYPE_CHART[moveTypeName][defenderType] !== undefined) {
        effectiveness *= TYPE_CHART[moveTypeName][defenderType];
      }
    }
    
    return effectiveness;
  }

  getTypeName(type: string): string {
    const typeNames: Record<string, string> = {
      Normal: 'Normal',
      Feu: 'Fire',
      Eau: 'Water',
      Électrik: 'Electric',
      Plante: 'Grass',
      Glace: 'Ice',
      Combat: 'Fighting',
      Poison: 'Poison',
      Sol: 'Ground',
      Vol: 'Flying',
      Psy: 'Psychic',
      Insecte: 'Bug',
      Roche: 'Rock',
      Spectre: 'Ghost',
      Dragon: 'Dragon',
      Ténèbres: 'Dark',
      Acier: 'Steel',
      Fée: 'Fairy'
    };
    
    return typeNames[type];
  }
  
  executeMove(move: PokemonMove, attacker: Pokemon, defender: Pokemon): MoveResult {
    let battleState = Store.getState().battle;
    if (!attacker.canAct) {
      battleState.context.hits = false;

      return {
        success: false,
        message: `${attacker.name} ne peut pas agir !`
      };
    }
    
    // Check if the move hits
    const hits = this.calculateHit(move, attacker, defender);
    console.log('BattleEngine : Hits :', hits);
    
    if (!hits) {
      battleState.context.hits = false;

      return {
        success: false,
        message: `${attacker.name} utilise ${move.name}, mais l'adversaire évite l'attaque !`
      };
    }
    
    battleState = Store.getState().battle;
    // Calculate damage
    const damageResult = this.calculateDamage(move, attacker, defender, battleState);
    
    // Store damage to apply later (for animation and delay purposes)
    battleState.context.pendingDamage = {
      target: defender,
      damage: damageResult.damage,
      applied: false
    };
    
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
      message: message
    };
  }

  public applyPendingDamage(battleState: any): void {
    if (battleState.context.pendingDamage && !battleState.context.pendingDamage.applied) {
      const { target, damage } = battleState.context.pendingDamage;
      
      if (damage > 0) {
        console.log('BattleEngine : Applying stored damage:', damage, 'to', target.name);
        console.log('BattleEngine : HP before:', target.currentHp);
        
        target.currentHp = Math.max(0, target.currentHp - damage);
        target.hasBeenDamaged = true;
        
        console.log('BattleEngine : HP after:', target.currentHp);
        
        if (target.currentHp <= 0) {
          target.isAlive = false;
        }
      }
      
      battleState.context.pendingDamage.applied = true;
    }
  }
}