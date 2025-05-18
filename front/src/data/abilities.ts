import { Pokemon } from "../models/PokemonModel";

export const abilities = {
  sereneGrace: {
    id: 1,
    name: 'Sérénité',
    description: 'Double les chances d\'activation des effets secondaires'
  },
  stormDrain: {
    id: 2,
    name: 'Lavabo',
    description: 'Le Pokémon absorbe les attaques de type Eau et les neutralise tout en augmentant son Attaque Spéciale',
    onDamageModifier: (damage: number, type: string): number => {
      if (type === 'Water') {
        return 0; // Absorbs the damage
      }
      return damage;
    }
  },
  flashFire: {
    id: 3,
    name: 'Torche',
    description: 'Le Pokémon absorbe les capacités de type Feu et augmente la puissance des siennes',
    onDamageModifier: (damage: number, type: string): number => {
      if (type === 'Fire') {
        return 0; // Absorbs the damage
      }
      return damage;
    }
  },
  swarm: {
    id: 4,
    name: 'Essaim',
    description: 'Augmente la puissance des attaques Insecte de 50% lorsque les PV du Pokémon sont inférieurs à 1/3 des PV max',
    onDamageModifier: (damage: number, type: string, hp: number, maxHp: number): number => {
      if (type === 'Bug' && hp < maxHp / 3) {
        return damage * 1.5; // Increases damage by 50%
      }
      return damage;
    }
  },
  moldBreaker: {
    id: 5,
    name: 'Brise Moule',
    description: 'Le Pokémon ignore les talents adverses qui auraient un effet sur ses capacités',
    onDamageModifier: (damage: number, type: string, targetAbility: string): number => {
      // Logic to ignore target's ability effects
      return damage;
    }
  },
  levitate: {
    id: 6,
    name: 'Lévitation',
    description: 'Le Pokémon flotte, ce qui l\'immunise contre les capacités de type Sol',
    onDamageModifier: (damage: number, type: string): number => {
      if (type === 'Ground') {
        return 0; // Immune to Ground-type moves
      }
      return damage;
    }
  },
  sandStream: {
    id: 7,
    name: 'Sable Volant',
    description: 'Le Pokémon invoque une tempête de sable quand il entre au combat',
    onTurnStart: (weather: string): string => {
      return 'Sandstorm'; // Sets the weather to Sandstorm
    }
  },
  poisonHeal: {
    id: 8,
    name: 'Soin-Poison',
    description: 'Quand le Pokémon est empoisonné, il regagne des PV au lieu d\'en perdre',
    onTurnEnd: (status: string, hp: number): number => {
      if (status === 'Poisoned') {
        return hp + 1; // Regains HP instead of losing it
      }
      return hp;
    }
  },
  sniper: {
    id: 9,
    name: 'Sniper',
    description: 'Augmente la puissance des coups critiques de 50%',
    onDamageModifier: (damage: number, isCriticalHit: boolean): number => {
      if (isCriticalHit) {
        return damage * 1.5; // Increases critical hit damage by 50%
      }
      return damage;
    }
  },
  moxie: {
    id: 10,
    name: 'Impudence',
    description: 'Quand le Pokémon met un ennemi K.O., son Attaque augmente',
    onPostMove: (attack: number, defeated: boolean): number => {
      if (defeated) {
        return attack + 1; // Increases attack after defeating an opponent
      }
      return attack;
    }
  },
  waterAbsorb: {
    id: 11,
    name: 'Absorbe-Eau',
    description: 'Si le Pokémon est touché par une capacité Eau, il ne subit aucun dégât et regagne des PV à la place',
    onDamageModifier: (damage: number, type: string, defender: Pokemon): number => {
      if (type === 'Water') {
        defender.currentHp = Math.min(defender.maxHp, defender.currentHp + Math.floor(defender.maxHp / 4));
        return 0; // Absorbs the damage
      }
      return damage;
    }
  },
  regenerator: {
    id: 12,
    name: 'Régé-Force',
    description: 'Restaure un peu de PV si le Pokémon est retiré du combat',
    onSwitch: (hp: number, maxHp: number): number => {
      return hp + Math.floor(maxHp / 3); // Restores a third of max HP when switched out
    }
  },
  adaptability: {
    id: 13,
    name: 'Adaptabilité',
    description: 'Quand le Pokémon utilise une capacité du même type que lui, le bonus de puissance qu\'elle reçoit est encore plus important que normalement',
    onDamageModifier: (damage: number, sameType: boolean): number => {
      if (sameType) {
        return damage * 1.5; // Increases damage when using STAB moves
      }
      return damage;
    }
  },
}