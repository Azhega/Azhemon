import { status } from './status';

export const moves = {
  auraSphere: {
    moveKey: 'auraSphere',
    id: 1,
    name: 'Aurasphère',
    type: 'Combat',
    category: 'Spécial',
    power: 80,
    accuracy: 0,
    pp: 20,
    priority: 0,
    description: 'N\'échoue jamais',
  },
  airSlash: {
    moveKey: 'airSlash',
    id: 2,
    name: 'Lame d\'air',
    type: 'Vol',
    category: 'Spécial',
    power: 75,
    accuracy: 95,
    pp: 15,
    priority: 0,
    description: ''
  },
  dazzlingGleam: {
    moveKey: 'dazzlingGleam',
    id: 3,
    name: 'Éclat Magique',
    type: 'Fée',
    category: 'Spécial',
    power: 80,
    accuracy: 100,
    pp: 10,
    priority: 0,
    description: ''
  },
  scald: {
    moveKey: 'scald',
    id: 4,
    name: 'Ébullition',
    type: 'Eau',
    category: 'Spécial',
    power: 80,
    accuracy: 100,
    pp: 15,
    priority: 0,
    description: 'Peut brûler la cible',
    onPostMove: (context: any): void => {
      if (context.attacker.canAct === true && context.hits) {
        const random = Math.random();
        console.log('Ébullition : random', random);
        if (context.defender.statusKey === null || context.defender.statusKey === undefined) {
          if (random < 0.3 && !context.defender.types.includes('Feu') && context.defender.isAlive) {
            const moveMessage = `Ébullition ! ${context.defender.name} est brûlé !`;
            context.pendingLogs.push(moveMessage);
            console.log(moveMessage);
            context.defender.statusKey = 'burn';
            status['burn'].onApply(context.defender);
          }
        }
      }
    }
  },
  shadowBall: {
    moveKey: 'shadowBall',
    id: 5,
    name: 'Ball\'ombre',
    type: 'Spectre',
    category: 'Spécial',
    power: 80,
    accuracy: 100,
    pp: 15,
    priority: 0,
    description: 'Peut baisser la Défense Spéciale de la cible',
    onPostMove: (context: any): void => {
      if (context.attacker.canAct === true && context.hits) {
        const random = Math.random();
        console.log('Ball\'ombre : random', random);
        if (random < 0.2 && context.defender.isAlive) {
          const moveMessage = `Ball'ombre ! La Défense Spéciale de ${context.defender.name} baisse !`;
          context.pendingLogs.push(moveMessage);
          console.log(moveMessage);
          context.defender.statModifiers.specialDefense -= 1;
          context.defender.calculateModifiedStats();
        }
      }
    }
  },
  x_scissor: {
    moveKey: 'x_scissor',
    id: 6,
    name: 'Plaie-Croix',
    type: 'Insecte',
    category: 'Physique',
    power: 80,
    accuracy: 100,
    pp: 15,
    priority: 0,
    description: ''
  },
  dragonClaw: {
    moveKey: 'dragonClaw',
    id: 7,
    name: 'Draco-Griffe',
    type: 'Dragon',
    category: 'Physique',
    power: 80,
    accuracy: 100,
    pp: 15,
    priority: 0,
    description: ''
  },
  thunderbolt: {
    moveKey: 'thunderbolt',
    id: 8,
    name: 'Tonnerre',
    type: 'Électrik',
    category: 'Spécial',
    power: 80,
    accuracy: 100,
    pp: 15,
    priority: 0,
    description: 'Peut paralyser la cible',
    onPostMove: (context: any): void => {
      if (context.attacker.canAct === true && context.hits) {
        const random = Math.random();
        console.log('Tonnerre : random', random);
        if (context.defender.statusKey === null || context.defender.statusKey === undefined) {
          if (random < 0.1 && !context.defender.types.includes('Électrik') && context.defender.isAlive) {
            const moveMessage = `Tonnerre ! ${context.defender.name} est paralysé !`;
            context.pendingLogs.push(moveMessage);
            console.log(moveMessage);
            context.defender.statusKey = 'paralysis';
            status['paralysis'].onApply(context.defender);
          }
        }
      }
    }
  },
  stoneEdge: {
    moveKey: 'stoneEdge',
    id: 9,
    name: 'Lame de Roc',
    type: 'Roche',
    category: 'Physique',
    power: 100,
    accuracy: 80,
    pp: 5,
    priority: 0,
    description: 'Taux de critiques élevé'
  },
  closeCombat: {
    moveKey: 'closeCombat',
    id: 10,
    name: 'Close Combat',
    type: 'Combat',
    category: 'Physique',
    power: 120,
    accuracy: 100,
    pp: 5,
    priority: 0,
    description: 'Baisse la Défense et la Défense Spéciale du lanceur',
    onPostMove: (context: any): void => {
      if (context.attacker.canAct === true && context.hits) {
        const moveMessage = `Close Combat ! La Défense et la Défense Spéciale de ${context.attacker.name} baissent !`;
        context.pendingLogs.push(moveMessage);
        console.log(moveMessage);
        context.attacker.statModifiers.defense -= 1;
        context.attacker.statModifiers.specialDefense -= 1;
        context.attacker.calculateModifiedStats();
      }
    }
  },
  crossPoison: {
    moveKey: 'crossPoison',
    id: 11,
    name: 'Poison-Croix',
    type: 'Poison',
    category: 'Physique',
    power: 70,
    accuracy: 100,
    pp: 15,
    priority: 0,
    description: 'Taux de critiques élevé, peut empoisonner la cible',
    onPostMove: (context: any): void => {
      if (context.attacker.canAct === true && context.hits) {
        const random = Math.random();
        console.log('Poison-Croix : random', random);
        if (random < 0.1 && context.defender.statusKey === null && context.defender.isAlive) {
          const moveMessage = `Poison-Croix ! ${context.defender.name} est empoisonné !`;
          context.pendingLogs.push(moveMessage);
          console.log(moveMessage);
          context.defender.statusKey = 'poison';
          status['poison'].onApply(context.defender);
        }
      }
    }
  },
  iceBeam: {
    moveKey: 'iceBeam',
    id: 12,
    name: 'Laser Glace',
    type: 'Glace',
    category: 'Spécial',
    power: 90,
    accuracy: 100,
    pp: 10,
    priority: 0,
    description: 'Peut geler la cible',
    onPostMove: (context: any): void => {
      if (context.attacker.canAct === true && context.hits) {
        const random = Math.random();
        console.log('Laser Glace : random', random);
        if (context.defender.statusKey === null || context.defender.statusKey === undefined) {
          if (random < 0.1 && !context.defender.types.includes('Glace') && context.defender.isAlive) {
            const moveMessage = `Laser Glace ! ${context.defender.name} est gelé !`;
            context.pendingLogs.push(moveMessage);
            console.log(moveMessage);
            context.defender.statusKey = 'freeze';
            status['freeze'].onApply(context.defender);
          }
        }
      }
    }
  },
  psychic: {
    moveKey: 'psychic',
    id: 13,
    name: 'Psyko',
    type: 'Psy',
    category: 'Spécial',
    power: 90,
    accuracy: 100,
    pp: 10,
    priority: 0,
    description: 'Peut baisser la Défense Spéciale de la cible',
    onPostMove: (context: any): void => {
      if (context.attacker.canAct === true && context.hits) {
        const random = Math.random();
        console.log('Psyko : random', random);
        if (random < 0.1 && context.defender.isAlive) {
          const moveMessage = `Psyko ! La Défense Spéciale de ${context.defender.name} baisse !`;
          context.pendingLogs.push(moveMessage);
          console.log(moveMessage);
          context.defender.statModifiers.specialDefense -= 1;
          context.defender.calculateModifiedStats();
        }
      }
    }
  },
  triAttack: {
    moveKey: 'triAttack',
    id: 14,
    name: 'Triplattaque',
    type: 'Normal',
    category: 'Spécial',
    power: 80,
    accuracy: 100,
    pp: 10,
    priority: 0,
    description: 'Peut paralyser, brûler ou geler la cible',
    onPostMove: (context: any): void => {
      if (context.attacker.canAct === true && context.hits 
        && (context.defender.statusKey === null || context.defender.statusKey === undefined)) {
        const random = Math.random();
        console.log('Triplattaque : random', random);
        if (random < 0.067 && !context.defender.types.includes('Glace') && context.defender.isAlive) {
          const moveMessage = `Triplattaque ! ${context.defender.name} est gelé !`;
          context.pendingLogs.push(moveMessage);
          console.log(moveMessage);
          context.defender.statusKey = 'freeze';
          status['freeze'].onApply(context.defender);
        } else if ((random > 0.067 && random < 0.133) && !context.defender.types.includes('Feu') && context.defender.isAlive) {
          const moveMessage = `Triplattaque ! ${context.defender.name} est brûlé !`;
          context.pendingLogs.push(moveMessage);
          console.log(moveMessage);
          context.defender.statusKey = 'burn';
          status['burn'].onApply(context.defender);
        } else if ((random > 0.133 && random < 0.2) && !context.defender.types.includes('Électrik') && context.defender.isAlive) {
          const moveMessage = `Triplattaque ! ${context.defender.name} est paralysé !`;
          context.pendingLogs.push(moveMessage);
          console.log(moveMessage);
          context.defender.statusKey = 'paralysis';
          status['paralysis'].onApply(context.defender);
        }
      }
    }
  },
  flameThrower: {
    moveKey: 'flameThrower',
    id: 15,
    name: 'Lance-Flammes',
    type: 'Feu',
    category: 'Spécial',
    power: 95,
    accuracy: 100,
    pp: 15,
    priority: 0,
    description: 'Peut brûler la cible',
    onPostMove: (context: any): void => {
      if (context.attacker.canAct === true && context.hits) {
        const random = Math.random();
        console.log('Lance-Flammes : random', random);
        if (random < 0.1 && !context.defender.types.includes('Feu') && context.defender.isAlive) {
          const moveMessage = `Lance-Flammes ! ${context.defender.name} est brûlé !`;
          context.pendingLogs.push(moveMessage);
          console.log(moveMessage);
          context.defender.statusKey = 'burn';
          status['burn'].onApply(context.defender);
        }
      }
    }
  },
  energyBall: {
    moveKey: 'energyBall',
    id: 16,
    name: 'Éco-Sphère',
    type: 'Plante',
    category: 'Spécial',
    power: 80,
    accuracy: 100,
    pp: 10,
    priority: 0,
    description: 'Peut baisser la Défense Spéciale de la cible',
    onPostMove: (context: any): void => {
      if (context.attacker.canAct === true && context.hits) {
        const random = Math.random();
        console.log('Éco-Sphère : random', random);
        if (random < 0.1 && context.defender.isAlive) {
          const moveMessage = `Éco-Sphère ! La Défense Spéciale de ${context.defender.name} baisse !`;
          context.pendingLogs.push(moveMessage);
          console.log(moveMessage);
          context.defender.statModifiers.specialDefense -= 1;
          context.defender.calculateModifiedStats();
        }
      }
    }
  },
  earthquake: {
    moveKey: 'earthquake',
    id: 17,
    name: 'Séisme',
    type: 'Sol',
    category: 'Physique',
    power: 100,
    accuracy: 100,
    pp: 10,
    priority: 0,
    description: ''
  },
  nightSlash: {
    moveKey: 'nightSlash',
    id: 18,
    name: 'Tranche-Nuit',
    type: 'Ténèbres',
    category: 'Physique',
    power: 70,
    accuracy: 100,
    pp: 15,
    priority: 0,
    description: 'Taux de critiques élevé'
  },
  ironHead: {
    moveKey: 'ironHead',
    id: 19,
    name: 'Tête de Fer',
    type: 'Acier',
    category: 'Physique',
    power: 80,
    accuracy: 100,
    pp: 15,
    priority: 0,
    description: ''
  },
  will_o_wisp: {
    moveKey: 'will_o_wisp',
    id: 20,
    name: 'Feu Follet',
    type: 'Feu',
    category: 'Statut',
    power: 0,
    accuracy: 100,
    pp: 15,
    priority: 0,
    description: 'Brûle la cible',
    onPostMove: (context: any): void => {
      if (context.attacker.canAct === true && context.hits) {
        if (context.defender.types.includes('Feu')) {
          const moveMessage = `Feu Follet ! ${context.defender.name} est immunisé !`;
          context.pendingLogs.push(moveMessage);
          console.log(moveMessage);
          return;
        }
        if (!context.defender.statusKey || context.defender.statusKey === undefined) {
          const moveMessage = `Feu Follet ! ${context.defender.name} est brûlé !`;
          context.pendingLogs.push(moveMessage);
          console.log(moveMessage);
          context.defender.statusKey = 'burn';
          status['burn'].onApply(context.defender);
        } else {
          const moveMessage = `Feu Follet ! ${context.defender.name} a déjà un statut !`;
          context.pendingLogs.push(moveMessage);
          console.log(moveMessage);
        }
      }
    }
  },
  thunderWave: {
    moveKey: 'thunderWave',
    id: 21,
    name: 'Cage-Éclair',
    type: 'Électrik',
    category: 'Statut',
    power: 0,
    accuracy: 100,
    pp: 15,
    priority: 0,
    description: 'Paralyse la cible',
    onPostMove: (context: any): void => {
      if (context.attacker.canAct === true && context.hits) {
        if (context.defender.types.includes('Électrik')) {
          const moveMessage = `Cage-Éclair ! ${context.defender.name} est immunisé !`;
          context.pendingLogs.push(moveMessage);
          console.log(moveMessage);
          return;
        }
        if (context.defender.statusKey === null || context.defender.statusKey === undefined) {
          const moveMessage = `Cage-Éclair ! ${context.defender.name} est paralysé !`;
          context.pendingLogs.push(moveMessage);
          console.log(moveMessage);
          context.defender.statusKey = 'paralysis';
          status['paralysis'].onApply(context.defender);
        } else {
          const moveMessage = `Cage-Éclair ! ${context.defender.name} a déjà un statut !`;
          context.pendingLogs.push(moveMessage);
          console.log(moveMessage);
        }
      }
    }
  },
  toxic: {
    moveKey: 'toxic',
    id: 22,
    name: 'Toxik',
    type: 'Poison',
    category: 'Statut',
    power: 0,
    accuracy: 100,
    pp: 15,
    priority: 0,
    description: 'Empoisonne la cible',
    onPostMove: (context: any): void => {
      if (context.attacker.canAct === true && context.hits) {
        if (context.defender.types.includes('Poison') || context.defender.types.includes('Acier')) {
          const moveMessage = `Toxic ! ${context.defender.name} est immunisé !`;
          context.pendingLogs.push(moveMessage);
          console.log(moveMessage);
          return;
        }
        if (context.defender.statusKey === null || context.defender.statusKey === undefined) {
          const moveMessage = `Toxic ! ${context.defender.name} est empoisonné !`;
          context.pendingLogs.push(moveMessage);
          console.log(moveMessage);
          context.defender.statusKey = 'poison';
          status['poison'].onApply(context.defender);
        } else {
          const moveMessage = `Toxic ! ${context.defender.name} a déjà un statut !`;
          context.pendingLogs.push(moveMessage);
          console.log(moveMessage);
        }
      }
    }
  },
  hypnosis: {
    moveKey: 'hypnosis',
    id: 23,
    name: 'Hypnose',
    type: 'Psy',
    category: 'Statut',
    power: 0,
    accuracy: 100,
    pp: 15,
    priority: 0,
    description: 'Endort la cible',
    onPostMove: (context: any): void => {
      if (context.attacker.canAct === true && context.hits) {
        if (context.defender.statusKey === null || context.defender.statusKey === undefined) {
          const moveMessage = `Hypnose ! ${context.defender.name} est endormi !`;
          context.pendingLogs.push(moveMessage);
          console.log(moveMessage);
          context.defender.statusKey = 'sleep';
          status['sleep'].onApply(context.defender);
        } else {
          const moveMessage = `Hypnose ! ${context.defender.name} a déjà un statut !`;
          context.pendingLogs.push(moveMessage);
          console.log(moveMessage);
        }
      }
    }
  },
  iceWave: {
    moveKey: 'iceWave',
    id: 24,
    name: 'Vague Glace',
    type: 'Glace',
    category: 'Statut',
    power: 0,
    accuracy: 100,
    pp: 10,
    priority: 0,
    description: 'Gèle la cible',
    onPostMove: (context: any): void => {
      if (context.attacker.canAct === true && context.hits) {
        if (context.defender.types.includes('Glace')) {
          const moveMessage = `Vague Glace ! ${context.defender.name} est immunisé !`;
          context.pendingLogs.push(moveMessage);
          console.log(moveMessage);
          return;
        }
        if (context.defender.statusKey === null || context.defender.statusKey === undefined) {
          const moveMessage = `Vague Glace ! ${context.defender.name} est gelé !`;
          context.pendingLogs.push(moveMessage);
          console.log(moveMessage);
          context.defender.statusKey = 'freeze';
          status['freeze'].onApply(context.defender);
        } else {
          const moveMessage = `Vague Glace ! ${context.defender.name} a déjà un statut !`;
          context.pendingLogs.push(moveMessage);
          console.log(moveMessage);
        }
      }
    }
  }
}