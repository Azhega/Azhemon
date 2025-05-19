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
    onDamageModifier: (damage:number, context: any): number => {
      console.log('context', context);
      if (context.defender.abilityKey === 'stormDrain' && context.moveType === 'Eau') {
        console.log('Defender has Storm Drain ! Absorbing water attack !');
        return 0; // Absorbs the damage
      }
      return context.damage;
    }
  },
  flashFire: {
    id: 3,
    name: 'Torche',
    description: 'Le Pokémon absorbe les capacités de type Feu et augmente la puissance des siennes',
    onDamageModifier: (context: any): number => {
      if (context.type === 'Fire') {
        return 0; // Absorbs the damage
      }
      return context.damage;
    }
  },
  swarm: {
    id: 4,
    name: 'Essaim',
    description: 'Augmente la puissance des attaques Insecte de 50% lorsque les PV du Pokémon sont inférieurs à 1/3 des PV max',
    onDamageModifier: (context: any): number => {
      if (context.type === 'Bug' && context.hp < context.maxHp / 3) {
        return context.damage * 1.5; // Increases damage by 50%
      }
      return context.damage;
    }
  },
  moldBreaker: {
    id: 5,
    name: 'Brise Moule',
    description: 'Le Pokémon ignore les talents adverses qui auraient un effet sur ses capacités',
    onDamageModifier: (context: any): number => {
      // Logic to ignore target's ability effects
      return context.damage;
    }
  },
  levitate: {
    id: 6,
    name: 'Lévitation',
    description: 'Le Pokémon flotte, ce qui l\'immunise contre les capacités de type Sol',
    onDamageModifier: (context: any): number => {
      if (context.type === 'Ground') {
        return 0; // Immune to Ground-type moves
      }
      return context.damage;
    }
  },
  sandStream: {
    id: 7,
    name: 'Sable Volant',
    description: 'Le Pokémon invoque une tempête de sable quand il entre au combat',
    onTurnStart: (context: any): string => {
      return 'Sandstorm'; // Sets the weather to Sandstorm
    }
  },
  poisonHeal: {
    id: 8,
    name: 'Soin-Poison',
    description: 'Quand le Pokémon est empoisonné, il regagne des PV au lieu d\'en perdre',
    onTurnEnd: (context: any): number => {
      if (context.status === 'Poisoned') {
        return context.hp + 1; // Regains HP instead of losing it
      }
      return context.hp;
    }
  },
  sniper: {
    id: 9,
    name: 'Sniper',
    description: 'Augmente la puissance des coups critiques de 50%',
    onDamageModifier: (context: any): number => {
      if (context.isCriticalHit) {
        return context.damage * 1.5; // Increases critical hit damage by 50%
      }
      return context.damage;
    }
  },
  moxie: {
    id: 10,
    name: 'Impudence',
    description: 'Quand le Pokémon met un ennemi K.O., son Attaque augmente',
    onPostMove: (context: any): number => {
      if (context.defeated) {
        return context.attack + 1; // Increases attack after defeating an opponent
      }
      return context.attack;
    }
  },
  waterAbsorb: {
    id: 11,
    name: 'Absorbe-Eau',
    description: 'Si le Pokémon est touché par une capacité Eau, il ne subit aucun dégât et regagne des PV à la place',
    onDamageModifier: (context: any): number => {
      if (context.type === 'Water') {
        context.defender.currentHp = Math.min(context.defender.maxHp, context.defender.currentHp + Math.floor(context.defender.maxHp / 4));
        return 0; // Absorbs the damage
      }
      return context.damage;
    }
  },
  regenerator: {
    id: 12,
    name: 'Régé-Force',
    description: 'Restaure un peu de PV si le Pokémon est retiré du combat',
    onSwitch: (context: any): number => {
      return context.hp + Math.floor(context.maxHp / 3); // Restores a third of max HP when switched out
    }
  },
  adaptability: {
    id: 13,
    name: 'Adaptabilité',
    description: 'Quand le Pokémon utilise une capacité du même type que lui, le bonus de puissance qu\'elle reçoit est encore plus important que normalement',
    onDamageModifier: (context: any): number => {
      if (context.sameType) {
        return context.damage * 1.5; // Increases damage when using STAB moves
      }
      return context.damage;
    }
  },
}