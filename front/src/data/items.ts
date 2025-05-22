import { Pokemon } from '../models/PokemonModel';
import Store from '../utils/Store';

export const items = {
  leftovers: {
    id: 1,
    name: 'Restes',
    description: 'Restaure 1/16 des PV max du porteur à chaque tour',
    onTurnEnd: (context: any): void => {
      const state = Store.getState();
      const battleState = state.battle;
      console.log('battleState : ', battleState);
      for (const pokemon of Object.values(battleState.activePokemon) as Pokemon[]) {
        if (pokemon.itemKey === 'leftovers') {
          const itemMessage = `Restes ! ${pokemon.name} récupère des PV !`;
          // context.pendingLogs.push(itemMessage);
          console.log('leftovers before : ', pokemon.name, pokemon.currentHp);
          pokemon.currentHp = Math.min(
            pokemon.maxHp,
            pokemon.currentHp + Math.floor(pokemon.maxHp / 16)
          );
          console.log('leftovers after : ', pokemon.name, pokemon.currentHp);
        }
      }
    }
  },
  rockyHelmet: {
    id: 2,
    name: 'Casque Brut',
    description: 'Inflige des dégâts au Pokémon qui touche le porteur avec une attaque Physique',
    onPostMove: (context: any): void => {
      if (context.defender.itemKey === 'rockyHelmet' && context.move.category === 'Physique') {
        const damage = Math.floor(context.defender.maxHp / 6);
        context.attacker.currentHp = Math.max(0, context.attacker.currentHp - damage);
        console.log(`${context.attacker.name} subit ${damage} points de dégâts à cause du Casque Brut !`);
      }
    }
  },
  lifeOrb: {
    id: 3,
    name: 'Orbe Vie',
    description: 'Augmente la puissance des attaques du porteur de 30%, mais lui inflge 10% de ses PV Max en dégâts de recul',
    onDamageModifier: (damage: number, context: any): number => {
      if (context.attacker.itemKey === 'lifeOrb' && context.move.category !== 'Statut') {
        const itemMessage = `Orbe Vie ! ${context.attacker.name} augmente ses dégâts de 30% !`;
        // context.pendingLogs.push(itemMessage);
        console.log('lifeOrb before : damage , hp : ', context.attacker.name, damage, context.attacker.currentHp);
        damage = Math.floor(damage * 1.3);
        context.attacker.currentHp = Math.max(0, context.attacker.currentHp - Math.floor(context.attacker.maxHp / 10));
        console.log('lifeOrb after : damage , hp : ', context.attacker.name, damage, context.attacker.currentHp);
      }
      return damage;
    },
  },
  airBalloon: {
    id: 4,
    name: 'Ballon',
    description: 'Immunise le porteur des attaques de type Sol. Le ballon éclate si le porteur subit une attaque'
  },
  focusSash: {
    id: 5,
    name: 'Ceinture Force',
    description: 'Le porteur ne peut pas être mis K.O. en un coup et survivra à 1 HP s\'il subit un coup fatal'
  }
}