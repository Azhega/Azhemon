import { Pokemon } from "../models/PokemonModel";
import Store from "../utils/Store";
import { status } from "./status";

export const abilities = {
  magicGuard: {
    id: 1,
    name: 'Garde Magik',
    description: 'Soigne le Pokémon des statuts à chaque fin de tour',
    onTurnEnd: (context: any): void => {
      const battleState = Store.getState().battle;
      console.log('battleState : ', battleState);
      for (const pokemon of Object.values(battleState.activePokemon) as Pokemon[]) {
        if (pokemon.abilityKey === 'magicGuard' && pokemon.statusKey) {
          const abilityMessage = `Talent Garde Magik ! ${pokemon.name} se soigne de son statut !`;
          context.pendingLogs.push(abilityMessage);
          status[pokemon.statusKey as keyof typeof status].onRemove(pokemon);
        }
      }
    }
  },
  stormDrain: {
    id: 2,
    name: 'Lavabo',
    description: 'Le Pokémon absorbe les attaques de type Eau et les neutralise tout en augmentant son Attaque Spéciale',
    onDamageModifier: (damage:number, context: any): number => {
      if (context.defender.abilityKey === 'stormDrain' && context.moveType === 'Eau') {
        const abilityMessage = `Talent Lavabo ! ${context.defender.name} absorbe les dégâts Eau !`;
        context.pendingLogs.push(abilityMessage);
        return 0;
      }
      return context.damage;
    }
  },
  flashFire: {
    id: 3,
    name: 'Torche',
    description: 'Le Pokémon absorbe les capacités de type Feu et augmente la puissance des siennes',
    onDamageModifier: (damage: number, context: any): number => {
      if (context.defender.abilityKey === 'flashFire' && context.moveType === 'Feu') {
        const abilityMessage = `Talent Torche ! ${context.defender.name} absorbe les dégâts Feu !`;
        context.pendingLogs.push(abilityMessage);
        return 0;
      }
      return context.damage;
    }
  },
  swarm: {
    id: 4,
    name: 'Essaim',
    description: 'Augmente la puissance des attaques Insecte de 50% lorsque les PV du Pokémon sont inférieurs à 1/3 des PV max',
    onDamageModifier: (damage: number, context: any): number => {
      if (context.attacker.abilityKey === 'swarm' && context.moveType === 'Insecte' 
        && context.attacker.currentHp < context.attacker.maxHp / 3) {
        const abilityMessage = `Talent Essaim ! ${context.attacker.name} augmente ses dégâts Insecte !`;
        context.pendingLogs.push(abilityMessage);
        return Math.floor(context.damage * 1.5);
      }
      return context.damage;
    }
  },
  intimidate: {
    id: 5,
    name: 'Intimidation',
    description: 'Le Pokémon baisse l\'attaque de l\'adversaire lorsqu\'il entre au combat',
    onSwitch: (context: any): void => {
      if (context.switchedPokemon) {
        if (context.switchedPokemon.abilityKey === 'intimidate') {
          const abilityMessage = `Talent Intimidation ! ${context.switchedPokemon.name} baisse l'attaque de son adversaire !`;
          context.pendingLogs.push(abilityMessage);
          context.opponentPokemon.statModifiers.attack -= 1;
          context.opponentPokemon.calculateModifiedStats();
        }
      }
    }
  },
  levitate: {
    id: 6,
    name: 'Lévitation',
    description: 'Le Pokémon flotte, ce qui l\'immunise contre les capacités de type Sol',
    onDamageModifier: (damage: number, context: any): number => {
      if (context.defender.abilityKey === 'levitate' && context.moveType === 'Sol') {
        const abilityMessage = `Talent Lévitation ! ${context.defender.name} est immunisé contre les attaques de type Sol !`;
        context.pendingLogs.push(abilityMessage);
        return 0;
      }
      return context.damage;
    }
  },
  roughSkin: {
    id: 7,
    name: 'Peau Dure',
    description: 'Blesse l\'attaquant lorsque le Pokémon subit une attaque directe.',
    onPostMove: (context: any): void => {
      if (context.defender.abilityKey === 'roughSkin' && context.move.category === 'Physique' 
        && context.attacker.canAct === true && context.damage > 0) {
        const abilityMessage = `Talent Peau Dure de ${context.defender.name} ! ${context.attacker.name} subit des dégâts !`;
        context.pendingLogs.push(abilityMessage);
        const damage = Math.floor(context.defender.maxHp / 8);
        context.attacker.currentHp = Math.max(0, context.attacker.currentHp - damage);
        console.log(`${context.attacker.name} subit ${damage} points de dégâts à cause du talent Peau Dure !`);
      }
    }
  },
  poisonHeal: {
    id: 8,
    name: 'Soin-Poison',
    description: 'Quand le Pokémon est empoisonné, il regagne des PV au lieu d\'en perdre',
    onTurnEnd: (context: any): void => {
      const battleState = Store.getState().battle;
      console.log('battleState : ', battleState);
      for (const pokemon of Object.values(battleState.activePokemon) as Pokemon[]) {
        if (pokemon.abilityKey === 'poisonHeal' && pokemon.statusKey === 'poison' 
          && pokemon.currentHp > 0 && pokemon.currentHp < pokemon.maxHp) {
          const abilityMessage = `Soin-Poison ! ${pokemon.name} récupère des PV au lieu d'en perdre !`;
          context.pendingLogs.push(abilityMessage);
          console.log('PoisonHeal before : ', pokemon.name, pokemon.currentHp);
          pokemon.currentHp = Math.min(
            pokemon.maxHp,
            pokemon.currentHp + Math.floor(pokemon.maxHp / 8)
          );
          console.log('PoisonHeal after : ', pokemon.name, pokemon.currentHp);
        }
      }
    }
  },
  sniper: {
    id: 9,
    name: 'Sniper',
    description: 'Augmente la puissance des coups critiques de 50%',
    onDamageModifier: (damage: number, context: any): number => {
      if (context.attacker.abilityKey === 'sniper' && context.critical) {
        const abilityMessage = `Talent Sniper ! ${context.attacker.name} augmente les dégâts de ses coups critiques !`;
        context.pendingLogs.push(abilityMessage);
        return context.damage * 1.5;
      }
      return context.damage;
    }
  },
  moxie: {
    id: 10,
    name: 'Impudence',
    description: 'Quand le Pokémon met un ennemi K.O., son Attaque augmente',
    onPostMove: (context: any): void => {
      if (context.attacker.abilityKey === 'moxie' && context.defender.isAlive === false) {
        const abilityMessage = `Talent Impudence ! ${context.attacker.name} augmente son attaque de 1 !`;
        context.pendingLogs.push(abilityMessage);
        context.attacker.statModifiers.attack += 1;
        context.attacker.calculateModifiedStats();
      }
    }
  },
  waterAbsorb: {
    id: 11,
    name: 'Absorbe-Eau',
    description: 'Si le Pokémon est touché par une capacité Eau, il ne subit aucun dégât et regagne des PV à la place',
    onDamageModifier: (damage: number, context: any): number => {
      if (context.defender.abilityKey === 'waterAbsorb' && context.moveType === 'Eau') {
        const abilityMessage = `Talent Absorbe-Eau ! ${context.defender.name} absorbe les dégâts Eau et récupère des PV !`;
        context.pendingLogs.push(abilityMessage);
        context.defender.currentHp = Math.min(context.defender.maxHp, 
          context.defender.currentHp + Math.floor(context.defender.maxHp / 5));
        return 0;
      }
      return context.damage;
    }
  },
  regenerator: {
    id: 12,
    name: 'Régé-Force',
    description: 'Restaure un peu de PV si le Pokémon est retiré du combat',
    onSwitch: (context: any): void => {
      if (context.switchedPokemon) {
        if (context.switchedPokemon.abilityKey === 'regenerator') {
          const abilityMessage = `Talent Régé-Force ! ${context.switchedPokemon.name} récupère des PV après un switch !`;
          context.pendingLogs.push(abilityMessage);
          context.switchedPokemon.currentHp = Math.min(context.switchedPokemon.maxHp, 
            context.switchedPokemon.currentHp + Math.floor(context.switchedPokemon.maxHp / 3));
        }
      }
    }
  },
  adaptability: {
    id: 13,
    name: 'Adaptabilité',
    description: 'Quand le Pokémon utilise une capacité du même type que lui, le bonus de puissance qu\'elle reçoit est encore plus important que normalement',
    onDamageModifier: (damage: number, context: any): number => {
      if (context.attacker.abilityKey === 'adaptability' && context.attacker.types.includes(context.moveType)) {
        const abilityMessage = `Talent Adaptabilité ! ${context.attacker.name} augmente ses dégâts de STAB !`;
        context.pendingLogs.push(abilityMessage);
        return Math.floor((context.damage / 1.5) * 2);
      }
      return context.damage;
    }
  },
}