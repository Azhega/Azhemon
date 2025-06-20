import { Pokemon } from '../models/PokemonModel';
import Store from '../utils/Store';

export const items = {
  leftovers: {
    id: 1,
    name: 'Restes',
    description: 'Restaure 1/16 des PV max du porteur à chaque tour',
    onTurnEnd: (context: any): void => {
      const battleState = Store.getState().battle;
      for (const pokemon of Object.values(battleState.activePokemon) as Pokemon[]) {
        if (pokemon.itemKey === 'leftovers' && pokemon.currentHp > 0 && pokemon.currentHp < pokemon.maxHp) {
          const healAmount = Math.floor(pokemon.maxHp / 16);
          
          context.pendingLogsAndEffects.push({
            log: `Restes ! ${pokemon.name} récupère des PV !`,
            effect: () => {
              pokemon.currentHp = Math.min(pokemon.maxHp, pokemon.currentHp + healAmount);
            }
          });
        }
      }
    }
  },
  rockyHelmet: {
    id: 2,
    name: 'Casque Brut',
    description: 'Inflige des dégâts au Pokémon qui touche le porteur avec une attaque Physique',
    onPostMove: (context: any): void => {
      if (context.defender.itemKey === 'rockyHelmet' && context.move.category === 'Physique' 
        && context.attacker.canAct === true && context.damage > 0) {
        const damage = Math.floor(context.defender.maxHp / 6);
        
        context.pendingLogsAndEffects.push({
          log: `${context.attacker.name} subit ${damage} points de dégâts à cause du Casque Brut de ${context.defender.name} !`,
          effect: () => {
            context.attacker.currentHp = Math.max(0, context.attacker.currentHp - damage);
          }
        });
      }
    }
  },
  lifeOrb: {
    id: 3,
    name: 'Orbe Vie',
    description: 'Augmente la puissance des attaques du porteur de 30%, mais lui inflge 10% de ses PV Max en dégâts de recul',
    onDamageModifier: (damage: number, context: any): number => {
      if (context.attacker.itemKey === 'lifeOrb' && context.move.category !== 'Statut' && context.effectiveness > 0) {
        const recoilDamage = Math.floor(context.attacker.maxHp / 10);
        
        context.pendingLogsAndEffects.push({
          log: `Orbe Vie ! ${context.attacker.name} subit un recul !`,
          effect: () => {
            context.attacker.currentHp = Math.max(0, context.attacker.currentHp - recoilDamage);
            if (context.attacker.currentHp <= 0) {
              context.attacker.isAlive = false;
            }
          }
        });
        
        return Math.floor(damage * 1.3);
      }
      return damage;
    }
  },
  airBalloon: {
    id: 4,
    name: 'Ballon',
    description: 'Immunise le porteur des attaques de type Sol. Le ballon éclate si le porteur subit une attaque',
    onDamageModifier: (damage: number, context: any): number => {
      if (context.defender.itemKey === 'airBalloon' && context.move.type === 'Sol') {
        context.pendingLogsAndEffects.push({
          log: `Ballon ! ${context.defender.name} est immunisé aux attaques Sol !`,
          effect: () => {
            context.defender.itemKey = null;
          }
        });

        return 0;
      } else if (context.defender.itemKey === 'airBalloon' && context.move.type !== 'Sol') {
        context.pendingLogsAndEffects.push({
          log: `Le ballon de ${context.defender.name} éclate !`,
          effect: () => {
            context.defender.itemKey = null;
          }
        });
      }
      return damage;
    }
  },
  focusSash: {
    id: 5,
    name: 'Ceinture Force',
    description: 'Le porteur ne peut pas être mis K.O. en un coup et survivra à 1 HP s\'il subit un coup fatal',
    onDamageModifier: (damage: number, context: any): number => {
      if (context.defender.itemKey === 'focusSash' && context.defender.currentHp 
        === context.defender.maxHp && damage >= context.defender.maxHp) {
        context.pendingLogsAndEffects.push({
          log: `Ceinture Force ! ${context.defender.name} survit à un coup fatal !`,
          effect: () => {
            context.defender.itemKey = null;
          }
        });
        return context.defender.maxHp - 1;
      }
      return damage;
    }
  }
}