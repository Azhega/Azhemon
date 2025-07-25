import EffectManager from '../controllers/EffectManager';
import Store from '../utils/Store';
import { Pokemon } from '../models/PokemonModel';

export const status = {
  burn: {
    id: 1,
    name: 'Brûlure',
    description: 'Le Pokémon subit des dégâts chaque tour et sa puissance d\'attaque est réduite de 50%.',
    onApply: (pokemon: any) => {
      pokemon.currentStats.attack = Math.floor(pokemon.currentStats.attack * 0.5);
      pokemon.status = status['burn'];
      EffectManager.registerStatusEffects(pokemon);
    },
    onRemove: (pokemon: any) => {
      pokemon.currentStats.attack = Math.floor(pokemon.currentStats.attack * 2);
      pokemon.status = null;
      pokemon.statusKey = null;
    },
    onTurnEnd: (context: any) => {
      const battleState = Store.getState().battle;
      for (const pokemon of Object.values(battleState.activePokemon) as Pokemon[]) {
        if (pokemon.statusKey === 'burn' && pokemon.currentHp > 0 && pokemon.abilityKey !== 'magicGuard') { // To avoid bugs
          context.pendingLogsAndEffects.push({
            log: `Brûlure ! ${pokemon.name} subit des dégâts !`,
            effect: () => {
              pokemon.currentHp = Math.max(
                0, pokemon.currentHp - Math.floor(pokemon.maxHp / 16)
              );
            }
          });
        }
      }
    }
  },
  paralysis: {
    id: 2,
    name: 'Paralysie',
    description: 'Le Pokémon a 25% de chances de ne pas pouvoir agir chaque tour et sa vitesse est réduite de 50%.',
    onApply: (pokemon: any) => {
      pokemon.currentStats.speed = Math.floor(pokemon.currentStats.speed * 0.5);
      pokemon.status = status['paralysis'];
      EffectManager.registerStatusEffects(pokemon);
    },
    onRemove: (pokemon: any) => {
      pokemon.currentStats.speed = Math.floor(pokemon.currentStats.speed * 2);
      pokemon.status = null;
      pokemon.statusKey = null;
    },
    onPreMove: (context: any) => {
      const random = Math.random();
      if (context.attacker.statusKey === 'paralysis' && random < 0.25) {
        context.attacker.canAct = false;
        context.pendingLogsAndEffects.push({
          log: `${context.attacker.name} est paralysé et ne peut pas agir !`,
        });
      } else if (context.attacker.statusKey === 'paralysis' && random > 0.25){
        context.attacker.canAct = true;
        context.pendingLogsAndEffects.push({
          log: `${context.attacker.name} est paralysé mais peut agir !`
        });
      }
    }
  },
  poison: {
    id: 3,
    name: 'Poison',
    description: 'Le Pokémon subit des dégâts chaque tour.',
    onApply: (pokemon: any) => {
      pokemon.status = status['poison'];
      EffectManager.registerStatusEffects(pokemon);
    },
    onRemove: (pokemon: any) => {
      pokemon.status = null;
      pokemon.statusKey = null;
    },
    onTurnEnd: (context: any) => {
      const battleState = Store.getState().battle;
      for (const pokemon of Object.values(battleState.activePokemon) as Pokemon[]) {
        if (pokemon.statusKey === 'poison' && pokemon.currentHp > 0 && 
          pokemon.abilityKey !== 'poisonHeal' && pokemon.abilityKey !== 'magicGuard') { // To avoid bugs
          context.pendingLogsAndEffects.push({
            log: `Poison ! ${pokemon.name} subit des dégâts !`,
            effect: () => {
              pokemon.currentHp = Math.max(
                0,
                pokemon.currentHp - Math.floor(pokemon.maxHp / 8)
              );
            }
          });
        }
      }
    }
  },
  sleep: {
    id: 4,
    name: 'Sommeil',
    description: 'Le Pokémon ne peut pas agir pendant 1 à 3 tours.',
    onApply: (pokemon: any) => {
      pokemon.status = status['sleep'];
      pokemon.status.sleepTurns = 1; // Initial sleep turns
      EffectManager.registerStatusEffects(pokemon);
    },
    onRemove: (pokemon: any) => {
      pokemon.status = null;
      pokemon.statusKey = null;
    },
    onPreMove: (context: any) => {
      if (context.attacker.statusKey === 'sleep') {
        context.attacker.status.sleepTurns = context.attacker.status.sleepTurns || 1;
        if (((context.attacker.status.sleepTurns > 1 && Math.random() < 0.5)) || context.attacker.status.sleepTurns > 3) {
          context.attacker.status = null;
          context.attacker.statusKey = null;
          context.attacker.canAct = true;
          context.pendingLogsAndEffects.push({
            log: `${context.attacker.name} se réveille !`
          });
        } else {
          context.pendingLogsAndEffects.push({
            log: `${context.attacker.name} est endormi et ne peut pas agir !`
          });
          context.attacker.canAct = false;
          context.attacker.status.sleepTurns += 1;
        }
      }
    }
  },
  freeze: {
    id: 5,
    name: 'Gel',
    description: 'Le Pokémon ne peut pas agir tant qu\'il est gelé.',
    onApply: (pokemon: any) => {
      pokemon.status = status['freeze'];
      EffectManager.registerStatusEffects(pokemon);
    },
    onRemove: (pokemon: any) => {
      pokemon.status = null;
      pokemon.statusKey = null;
    },
    onPreMove: (context: any) => {
      if (context.attacker.statusKey === 'freeze') {
        const random = Math.random();
        if (random < 0.2) { // 20% chance to thaw
          context.attacker.status = null;
          context.attacker.statusKey = null;
          context.attacker.canAct = true;
          context.pendingLogsAndEffects.push({
            log: `${context.attacker.name} n'est plus gelé !`
          });
        } else {
          context.attacker.canAct = false;
          context.attacker.status.sleepTurns += 1;
          context.pendingLogsAndEffects.push({
            log: `${context.attacker.name} est gelé et ne peut pas agir !`
          });
        }
      }
    }
  }
}