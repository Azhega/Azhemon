import EffectManager from '../controllers/EffectManager';

export const status = {
  burn: {
    id: 1,
    name: 'Brûlure',
    description: 'Le Pokémon subit des dégâts chaque tour et sa puissance d\'attaque est réduite de 50%.',
    onApply: (pokemon: any) => {
      pokemon.currentStats.attack = Math.floor(pokemon.currentStats.attack * 0.5);
      console.log(`${pokemon.name} est brûlé !`);
    },
    onRemove: (pokemon: any) => {
      pokemon.currentStats.attack = Math.floor(pokemon.currentStats.attack * 2);
      console.log(`${pokemon.name} n'est plus brûlé !`);
    },
    onTurnEnd: (pokemon: any) => {
      pokemon.currentHp -= Math.floor(pokemon.maxHp / 8);
      console.log(`${pokemon.name} subit des dégâts de brûlure !`);
    }
  },
  paralysis: {
    id: 2,
    name: 'Paralysie',
    description: 'Le Pokémon a 25% de chances de ne pas pouvoir agir chaque tour et sa vitesse est réduite de 50%.',
    onApply: (pokemon: any) => {
      pokemon.currentStats.speed = Math.floor(pokemon.currentStats.speed * 0.5);
      console.log(`${pokemon.name} est paralysé !`);
      pokemon.status = status['paralysis'];
      EffectManager.registerStatusEffects(pokemon);
    },
    onRemove: (pokemon: any) => {
      pokemon.currentStats.speed = Math.floor(pokemon.currentStats.speed * 2);
      console.log(`${pokemon.name} n'est plus paralysé !`);
      pokemon.status = null;
      // EffectManager.resetEffects(pokemon); IDK how to handle this, will check later
    },
    onPreMove: (context: any) => {
      console.log('onPreMove paralysis', context);
      const random = Math.random();
      if (context.attacker.statusKey === 'paralysis' && random < 0.25) {
        console.log('random act false', random);
        context.attacker.canAct = false;
        console.log('onPreMove: attack canAct', context.attacker.canAct);
        console.log(`${context.attacker.name} est paralysé et ne peut pas agir !`);
      } else {
        console.log('random act true', random);
        context.attacker.canAct = true;
      }
    }
  },
  poison: {
    id: 3,
    name: 'Poison',
    description: 'Le Pokémon subit des dégâts chaque tour.',
    onTurnEnd: (pokemon: any) => {
      pokemon.currentHp -= Math.floor(pokemon.maxHp / 8);
      console.log(`${pokemon.name} subit des dégâts de poison !`);
    }
  },
  sleep: {
    id: 4,
    name: 'Sommeil',
    description: 'Le Pokémon ne peut pas agir pendant 1 à 3 tours.',
    onPreMove: (context: any) => {
      context.pokemon.status.sleepTurns = context.pokemon.status.sleepTurns || 1;
      if ((context.pokemon.status.sleepTurns > 1 && Math.random() < 0.5) || context.pokemon.status.sleepTurns > 3) {
        context.pokemon.status = null;
        context.pokemon.status.sleepTurns = 0;
        context.pokemon.canAct = true;
        console.log(`${context.pokemon.name} se réveille !`);
      } else {
        context.pokemon.canAct = false;
        context.pokemon.status.sleepTurns += 1;
        console.log(`${context.pokemon.name} est endormi et ne peut pas agir !`);
      }
    }
  },
  freeze: {
    id: 5,
    name: 'Gel',
    description: 'Le Pokémon ne peut pas agir tant qu\'il est gelé.',
    onPreMove: (context: any) => {
      if (Math.random() < 0.2) {
        context.pokemon.canAct = true;
        console.log(`${context.pokemon.name} est libéré du gel !`);
      } else {
        context.pokemon.canAct = false;
        console.log(`${context.pokemon.name} est gelé et ne peut pas agir !`);
      }
    }
  }
}