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
      if (context.defender.abilityKey === 'stormDrain' && context.moveType === 'Eau') {
        console.log('Defender has Storm Drain ! Absorbing water attack !');
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
        console.log('Defender has Flash Fire ! Absorbing fire attack !');
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
        console.log('Attacker has Swarm ! Increasing Bug move power !');
        return Math.floor(context.damage * 1.5);
      }
      return context.damage;
    }
  },
  moldBreaker: {
    id: 5,
    name: 'Brise Moule',
    description: 'Le Pokémon ignore les talents adverses qui auraient un effet sur ses capacités',
    onDamageModifier: (damage:number, context: any): number => {
      // Logic to ignore target's ability effects
      return context.damage;
    }
  },
  levitate: {
    id: 6,
    name: 'Lévitation',
    description: 'Le Pokémon flotte, ce qui l\'immunise contre les capacités de type Sol',
    onDamageModifier: (damage: number, context: any): number => {
      if (context.defender.abilityKey === 'levitate' && context.moveType === 'Sol') {
        console.log('Defender has Levitate ! Immunity to Ground moves !');
        return 0;
      }
      return context.damage;
    }
  },
  sandStream: {
    id: 7,
    name: 'Sable Volant',
    description: 'Le Pokémon invoque une tempête de sable quand il entre au combat',
    onTurnStart: (context: any): string => {
      return 'Sandstorm';
    }
  },
  poisonHeal: {
    id: 8,
    name: 'Soin-Poison',
    description: 'Quand le Pokémon est empoisonné, il regagne des PV au lieu d\'en perdre',
    onTurnEnd: (context: any): number => {
      if (context.status === 'Poisoned') {
        return context.hp + 1;
      }
      return context.hp;
    }
  },
  sniper: {
    id: 9,
    name: 'Sniper',
    description: 'Augmente la puissance des coups critiques de 50%',
    onDamageModifier: (damage: number, context: any): number => {
      if (context.attacker.abilityKey === 'sniper' && context.critical) {
        console.log('Attacker has Sniper ! Increasing critical hit damage !');
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
        console.log('Attacker has Moxie ! Increasing Attack after KO !');
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
        console.log('Defender has Water Absorb ! Absorbing water attack and healing !');
        context.defender.currentHp = Math.min(context.defender.maxHp, context.defender.currentHp + Math.floor(context.defender.maxHp / 5));
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
      if (context.switchedPokemon.abilityKey === 'regenerator') {
        console.log('Pokemon has Regenerator ! Healing on switch out !');
        context.switchedPokemon.currentHp = Math.min(context.switchedPokemon.maxHp, context.switchedPokemon.currentHp + Math.floor(context.switchedPokemon.maxHp / 3));
      }
    }
  },
  adaptability: {
    id: 13,
    name: 'Adaptabilité',
    description: 'Quand le Pokémon utilise une capacité du même type que lui, le bonus de puissance qu\'elle reçoit est encore plus important que normalement',
    onDamageModifier: (damage: number, context: any): number => {
      if (context.attacker.abilityKey === 'adaptability' && context.attacker.types.includes(context.moveType)) {
        console.log('Attacker has Adaptability ! Increasing STAB move power !');
        return Math.floor((context.damage / 1.5) * 2);
      }
      return context.damage;
    }
  },
}