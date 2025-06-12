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
          context.pendingLogsAndEffects.push({
            log: `Talent Garde Magik ! ${pokemon.name} se soigne de son statut !`,
            effect: () => {
              status[pokemon.statusKey as keyof typeof status].onRemove(pokemon);
            }
          });
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
        context.pendingLogsAndEffects.push({
          log: `Talent Lavabo ! ${context.defender.name} absorbe les dégâts Eau et augmente son Attaque Spéciale !`,
          effect: () => {
            context.defender.statModifiers.specialAttack += 1;
            context.defender.calculateModifiedStats();
          }
        });
        context.hits = false;
        return 0;
      }
      return damage;
    }
  },
  flashFire: {
    id: 3,
    name: 'Torche',
    description: 'Le Pokémon absorbe les capacités de type Feu et augmente son Attaque Spéciale',
    onDamageModifier: (damage: number, context: any): number => {
      if (context.defender.abilityKey === 'flashFire' && context.moveType === 'Feu') {
        context.pendingLogsAndEffects.push({
          log: `Talent Torche ! ${context.defender.name} absorbe les dégâts Feu et augmente son Attaque Spéciale !`,
          effect: () => {
            context.defender.statModifiers.specialAttack += 1;
            context.defender.calculateModifiedStats();
          }
        });
        context.hits = false;
        return 0;
      }
      return damage;
    }
  },
  swarm: {
    id: 4,
    name: 'Essaim',
    description: 'Augmente la puissance des attaques Insecte de 50% lorsque les PV du Pokémon sont inférieurs à 1/3 des PV max',
    onDamageModifier: (damage: number, context: any): number => {
      if (context.attacker.abilityKey === 'swarm' && context.moveType === 'Insecte' 
        && context.attacker.currentHp < context.attacker.maxHp / 3) {
        context.pendingLogsAndEffects.push({
          log: `Talent Essaim ! ${context.attacker.name} augmente ses dégâts Insecte !`
        });
        return Math.floor(context.damage * 1.5);
      }
      return damage;
    }
  },
  intimidate: {
    id: 5,
    name: 'Intimidation',
    description: 'Le Pokémon baisse l\'attaque de l\'adversaire lorsqu\'il entre au combat',
    onSwitch: (context: any): void => {
      if (context.switchedPokemon) {
        if (context.switchedPokemon.abilityKey === 'intimidate') {
          context.pendingLogsAndEffects.push({
            log: `Talent Intimidation ! ${context.switchedPokemon.name} baisse l'attaque de son adversaire !`,
            effect: () => {
              context.opponentPokemon.statModifiers.attack -= 1;
              context.opponentPokemon.calculateModifiedStats();
            }
          });
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
        context.pendingLogsAndEffects.push({
          log: `Talent Lévitation ! ${context.defender.name} est immunisé contre les attaques de type Sol !`
        });
        context.hits = false;
        return 0;
      }
      return damage;
    }
  },
  roughSkin: {
    id: 7,
    name: 'Peau Dure',
    description: 'Blesse l\'attaquant lorsque le Pokémon subit une attaque directe.',
    onPostMove: (context: any): void => {
      if (context.defender.abilityKey === 'roughSkin' && context.move.category === 'Physique' 
        && context.attacker.canAct === true && context.damage > 0) {
        context.pendingLogsAndEffects.push({
          log: `Talent Peau Dure ! ${context.defender.name} blesse son attaquant !`,
          effect: () => {
            const damage = Math.floor(context.defender.maxHp / 8);
            context.attacker.currentHp = Math.max(0, context.attacker.currentHp - damage);
          }
        });
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
          context.pendingLogsAndEffects.push({
            log: `Talent Soin-Poison ! ${pokemon.name} récupère des PV !`,
            effect: () => {
              console.log('PoisonHeal before : ', pokemon.name, pokemon.currentHp);
              pokemon.currentHp = Math.min(
                pokemon.maxHp,
                pokemon.currentHp + Math.floor(pokemon.maxHp / 8)
              );
              console.log('PoisonHeal after : ', pokemon.name, pokemon.currentHp);
            }
          });
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
        context.pendingLogsAndEffects.push({
          log: `Talent Sniper ! ${context.attacker.name} augmente les dégâts de ses coups critiques !`
        });
        return context.damage * 1.5;
      }
      return damage;
    }
  },
  moxie: {
    id: 10,
    name: 'Impudence',
    description: 'Quand le Pokémon met un ennemi K.O., son Attaque augmente',
    onPostMove: (context: any): void => {
      if (context.attacker.abilityKey === 'moxie' && context.defender.isAlive === false) {
        context.pendingLogsAndEffects.push({
          log: `Talent Impudence ! ${context.attacker.name} augmente son attaque !`,
          effect: () => {
            context.attacker.statModifiers.attack += 1;
            context.attacker.calculateModifiedStats();
          }
        });
      }
    }
  },
  waterAbsorb: {
    id: 11,
    name: 'Absorbe-Eau',
    description: 'Si le Pokémon est touché par une capacité Eau, il ne subit aucun dégât et regagne des PV à la place',
    onDamageModifier: (damage: number, context: any): number => {
      if (context.defender.abilityKey === 'waterAbsorb' && context.moveType === 'Eau') {
        context.pendingLogsAndEffects.push({
          log: `Talent Absorbe-Eau ! ${context.defender.name} absorbe les dégâts Eau et récupère des PV !`,
          effect: () => {
            context.hits = false;
            context.defender.currentHp = Math.min(context.defender.maxHp, 
              context.defender.currentHp + Math.floor(context.defender.maxHp / 5));
          }
        });
        context.hits = false;
        return 0;
      }
      return damage;
    }
  },
  regenerator: {
    id: 12,
    name: 'Régé-Force',
    description: 'Restaure un peu de PV si le Pokémon est retiré du combat',
    onSwitch: (context: any): void => {
      if (context.switchedPokemon) {
        if (context.switchedPokemon.abilityKey === 'regenerator' && context.switchedPokemon.currentHp < context.switchedPokemon.maxHp) {
          context.pendingLogsAndEffects.push({
            log: `Talent Régé-Force ! ${context.switchedPokemon.name} récupère des PV après un switch !`,
            effect: () => {
              context.switchedPokemon.currentHp = Math.min(context.switchedPokemon.maxHp,
                context.switchedPokemon.currentHp + Math.floor(context.switchedPokemon.maxHp / 3));
            }
          });
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
        context.pendingLogsAndEffects.push({
          log: `Talent Adaptabilité ! ${context.attacker.name} augmente ses dégâts de STAB !`
        });
        return Math.floor((context.damage / 1.5) * 2);
      }
      return damage;
    }
  },
  static: {
    id: 14,
    name: 'Statik',
    description: 'Si le Pokémon est touché par une capacité de contact, il a 30% de chances d\'être paralysé',
    onPostMove: (context: any): void => {
      if (context.defender.abilityKey === 'static' && context.move.category === 'Physique' 
        && context.attacker.canAct === true && context.damage > 0) {
        const random = Math.random();
        if (random < 0.3 && context.attacker.statusKey === null 
          && !context.attacker.types.includes('Électrik') && context.attacker.isAlive) {
          context.pendingLogsAndEffects.push({
            log: `Talent Statik ! ${context.attacker.name} est paralysé !`,
            effect: () => {
              context.attacker.statusKey = 'paralysis';
              status['paralysis'].onApply(context.attacker);
            }
          });
        }
      }
    }
  },
  flameBody: {
    id: 15,
    name: 'Corps Ardent',
    description: 'Si le Pokémon est touché par une capacité de contact, il a 30% de chances d\'être brûlé',
    onPostMove: (context: any): void => {
      if (context.defender.abilityKey === 'flameBody' && context.move.category === 'Physique' 
        && context.attacker.canAct === true && context.damage > 0) {
        const random = Math.random();
        if (random < 0.3 && context.attacker.statusKey === null 
          && !context.attacker.types.includes('Feu') && context.attacker.isAlive) {
          context.pendingLogsAndEffects.push({
            log: `Talent Corps Ardent ! ${context.attacker.name} est brûlé !`,
            effect: () => {
              context.attacker.statusKey = 'burn';
              status['burn'].onApply(context.attacker);
            }
          });
        }
      }
    }
  }
}