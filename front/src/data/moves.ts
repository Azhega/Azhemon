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
    description: 'Taux de critiques élevé',
    onDamageModifier: (damage: number, context: any): number => {
      if (!context.critical) {
        const random = Math.random();
        console.log('Lame de Roc : random', random);
        if (random < 0.125) {
          context.critical = true;
          console.log('Lame de Roc : coup critique !');
          return Math.floor(damage * 1.5);
        }
      }
      return damage;
    }
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
    onDamageModifier: (damage: number, context: any): number => {
      if (!context.critical) {
        const random = Math.random();
        console.log('Poison-Croix : random', random);
        if (random < 0.125) {
          context.critical = true;
          console.log('Poison-Croix : coup critique !');
          return Math.floor(damage * 1.5);
        }
      }
      return damage;
    },
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
    description: 'Taux de critiques élevé',
    onDamageModifier: (damage: number, context: any): number => {
      if (!context.critical) {
        const random = Math.random();
        console.log('Tranche-Nuit : random', random);
        if (random < 0.125) {
          context.critical = true;
          console.log('Tranche-Nuit : coup critique !');
          return Math.floor(damage * 1.5);
        }
      }
      return damage;
    }
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
  },
  swordsDance: {
    moveKey: 'swordsDance',
    id: 25,
    name: 'Danse-Lames',
    type: 'Normal',
    category: 'Statut',
    power: 0,
    accuracy: 0,
    pp: 20,
    priority: 0,
    description: 'Augmente l\'attaque de l\'utilisateur de 2 niveaux',
    onPostMove: (context: any): void => {
      if (context.attacker.canAct === true && context.hits) {
        const moveMessage = `Danse-Lames ! L'attaque de ${context.attacker.name} augmente beaucoup !`;
        context.pendingLogs.push(moveMessage);
        console.log(moveMessage);
        context.attacker.statModifiers.attack += 2;
        context.attacker.calculateModifiedStats();
      }
    }
  },
  ironDefense: {
    moveKey: 'ironDefense',
    id: 26,
    name: 'Mur de Fer',
    type: 'Acier',
    category: 'Statut',
    power: 0,
    accuracy: 0,
    pp: 15,
    priority: 0,
    description: 'Augmente la défense de l\'utilisateur de 2 niveaux',
    onPostMove: (context: any): void => {
      if (context.attacker.canAct === true && context.hits) {
        const moveMessage = `Mur de Fer ! La défense de ${context.attacker.name} augmente beaucoup !`;
        context.pendingLogs.push(moveMessage);
        console.log(moveMessage);
        context.attacker.statModifiers.defense += 2;
        context.attacker.calculateModifiedStats();
      }
    }
  },
  nastyPlot: {
    moveKey: 'nastyPlot',
    id: 27,
    name: 'Machination',
    type: 'Ténèbres',
    category: 'Statut',
    power: 0,
    accuracy: 0,
    pp: 20,
    priority: 0,
    description: 'Augmente l\'attaque spéciale de l\'utilisateur de 2 niveaux',
    onPostMove: (context: any): void => {
      if (context.attacker.canAct === true && context.hits) {
        const moveMessage = `Machination ! L'attaque spéciale de ${context.attacker.name} augmente beaucoup !`;
        context.pendingLogs.push(moveMessage);
        console.log(moveMessage);
        context.attacker.statModifiers.specialAttack += 2;
        context.attacker.calculateModifiedStats();
      }
    }
  },
  amnesia: {
    moveKey: 'amnesia',
    id: 28,
    name: 'Amnésie',
    type: 'Psy',
    category: 'Statut',
    power: 0,
    accuracy: 0,
    pp: 20,
    priority: 0,
    description: 'Augmente la défense spéciale de l\'utilisateur de 2 niveaux',
    onPostMove: (context: any): void => {
      if (context.attacker.canAct === true && context.hits) {
        const moveMessage = `Amnésie ! La défense spéciale de ${context.attacker.name} augmente beaucoup !`;
        context.pendingLogs.push(moveMessage);
        console.log(moveMessage);
        context.attacker.statModifiers.specialDefense += 2;
        context.attacker.calculateModifiedStats();
      }
    }
  },
  agility: {
    moveKey: 'agility',
    id: 29,
    name: 'Hâte',
    type: 'Psy',
    category: 'Statut',
    power: 0,
    accuracy: 0,
    pp: 30,
    priority: 0,
    description: 'Augmente la vitesse de l\'utilisateur de 2 niveaux',
    onPostMove: (context: any): void => {
      if (context.attacker.canAct === true && context.hits) {
        const moveMessage = `Hâte ! La vitesse de ${context.attacker.name} augmente beaucoup !`;
        context.pendingLogs.push(moveMessage);
        console.log(moveMessage);
        context.attacker.statModifiers.speed += 2;
        context.attacker.calculateModifiedStats();
      }
    }
  },
  calmMind: {
    moveKey: 'calmMind',
    id: 30,
    name: 'Plénitude',
    type: 'Psy',
    category: 'Statut',
    power: 0,
    accuracy: 0,
    pp: 20,
    priority: 0,
    description: 'Augmente l\'attaque spéciale et la défense spéciale de l\'utilisateur de 1 niveau',
    onPostMove: (context: any): void => {
      if (context.attacker.canAct === true && context.hits) {
        const moveMessage = `Plénitude ! L'attaque spéciale et la défense spéciale de ${context.attacker.name} augmentent !`;
        context.pendingLogs.push(moveMessage);
        console.log(moveMessage);
        context.attacker.statModifiers.specialAttack += 1;
        context.attacker.statModifiers.specialDefense += 1;
        context.attacker.calculateModifiedStats();
      }
    }
  },
  charm: {
    moveKey: 'charm',
    id: 31,
    name: 'Charme',
    type: 'Fée',
    category: 'Statut',
    power: 0,
    accuracy: 100,
    pp: 20,
    priority: 0,
    description: 'Baisse l\'attaque de la cible de 2 niveaux',
    onPostMove: (context: any): void => {
      if (context.attacker.canAct === true && context.hits) {
        const moveMessage = `Charme ! L'attaque de ${context.defender.name} baisse beaucoup !`;
        context.pendingLogs.push(moveMessage);
        console.log(moveMessage);
        context.defender.statModifiers.attack -= 2;
        context.defender.calculateModifiedStats();
      }
    }
  },
  screech: {
    moveKey: 'screech',
    id: 32,
    name: 'Grincement',
    type: 'Normal',
    category: 'Statut',
    power: 0,
    accuracy: 85,
    pp: 40,
    priority: 0,
    description: 'Baisse la défense de la cible de 2 niveaux',
    onPostMove: (context: any): void => {
      if (context.attacker.canAct === true && context.hits) {
        const moveMessage = `Grincement ! La défense de ${context.defender.name} baisse beaucoup !`;
        context.pendingLogs.push(moveMessage);
        console.log(moveMessage);
        context.defender.statModifiers.defense -= 2;
        context.defender.calculateModifiedStats();
      }
    }
  },
  eerieImpulse: {
    moveKey: 'eerieImpulse',
    id: 33,
    name: 'Impulsion Étrange',
    type: 'Électrik',
    category: 'Statut',
    power: 0,
    accuracy: 100,
    pp: 15,
    priority: 0,
    description: 'Baisse l\'attaque spéciale de la cible de 2 niveaux',
    onPostMove: (context: any): void => {
      if (context.attacker.canAct === true && context.hits) {
        const moveMessage = `Impulsion Étrange ! L'attaque spéciale de ${context.defender.name} baisse beaucoup !`;
        context.pendingLogs.push(moveMessage);
        console.log(moveMessage);
        context.defender.statModifiers.specialAttack -= 2;
        context.defender.calculateModifiedStats();
      }
    }
  },
  fakeTears: {
    moveKey: 'fakeTears',
    id: 34,
    name: 'Croco Larme',
    type: 'Ténèbres',
    category: 'Statut',
    power: 0,
    accuracy: 100,
    pp: 20,
    priority: 0,
    description: 'Baisse la défense spéciale de la cible de 2 niveaux',
    onPostMove: (context: any): void => {
      if (context.attacker.canAct === true && context.hits) {
        const moveMessage = `Croco Larme ! La défense spéciale de ${context.defender.name} baisse beaucoup !`;
        context.pendingLogs.push(moveMessage);
        console.log(moveMessage);
        context.defender.statModifiers.specialDefense -= 2;
        context.defender.calculateModifiedStats();
      }
    }
  },
  metalSound: {
    moveKey: 'metalSound',
    id: 35,
    name: 'Strido-Son',
    type: 'Acier',
    category: 'Statut',
    power: 0,
    accuracy: 85,
    pp: 40,
    priority: 0,
    description: 'Baisse la défense spéciale de la cible de 2 niveaux',
    onPostMove: (context: any): void => {
      if (context.attacker.canAct === true && context.hits) {
        const moveMessage = `Strido-Son ! La défense spéciale de ${context.defender.name} baisse beaucoup !`;
        context.pendingLogs.push(moveMessage);
        console.log(moveMessage);
        context.defender.statModifiers.specialDefense -= 2;
        context.defender.calculateModifiedStats();
      }
    }
  },
  cottonSpore: {
    moveKey: 'cottonSpore',
    id: 36,
    name: 'Spore Coton',
    type: 'Plante',
    category: 'Statut',
    power: 0,
    accuracy: 100,
    pp: 40,
    priority: 0,
    description: 'Baisse la vitesse de la cible de 2 niveaux',
    onPostMove: (context: any): void => {
      if (context.attacker.canAct === true && context.hits) {
        const moveMessage = `Spore Coton ! La vitesse de ${context.defender.name} baisse beaucoup !`;
        context.pendingLogs.push(moveMessage);
        console.log(moveMessage);
        context.defender.statModifiers.speed -= 2;
        context.defender.calculateModifiedStats();
      }
    }
  },
  recover: {
    moveKey: 'recover',
    id: 37,
    name: 'Soin',
    type: 'Normal',
    category: 'Statut',
    power: 0,
    accuracy: 0,
    pp: 10,
    priority: 0,
    description: 'Restaure la moitié des PV max de l\'utilisateur',
    onPostMove: (context: any): void => {
      if (context.attacker.canAct === true && context.hits) {
        if (context.attacker.currentHp < context.attacker.maxHp) {
          const healAmount = Math.floor(context.attacker.maxHp / 2);
          context.attacker.currentHp = Math.min(context.attacker.currentHp + healAmount, context.attacker.maxHp);
          const moveMessage = `Soin ! ${context.attacker.name} récupère ${healAmount} PV !`;
          context.pendingLogs.push(moveMessage);
          console.log(moveMessage);
        } else {
          const moveMessage = `Soin ! Les PV de ${context.attacker.name} sont déjà au max !`;
          context.pendingLogs.push(moveMessage);
          console.log(moveMessage);
        }
      }
    }
  },
  drainPunch: {
    moveKey: 'drainPunch',
    id: 38,
    name: 'Vampi-poing',
    type: 'Combat',
    category: 'Physique',
    power: 75,
    accuracy: 100,
    pp: 10,
    priority: 0,
    description: 'Restaure la moitié des dégâts infligés à la cible',
    onPostMove: (context: any): void => {
      if (context.attacker.canAct === true && context.hits
        && context.attacker.currentHp < context.attacker.maxHp 
        && context.attacker.isAlive) {
        const healAmount = Math.ceil(context.damage / 2);
        context.attacker.currentHp = Math.min(context.attacker.currentHp + healAmount, context.attacker.maxHp);
        const moveMessage = `Vampipoing ! ${context.attacker.name} récupère ${healAmount} PV !`;
        context.pendingLogs.push(moveMessage);
        console.log(moveMessage);
      }
    }
  },
  gigaDrain: {
    moveKey: 'gigaDrain',
    id: 39,
    name: 'Giga-Sangsue',
    type: 'Plante',
    category: 'Spécial',
    power: 75,
    accuracy: 100,
    pp: 10,
    priority: 0,
    description: 'Restaure la moitié des dégâts infligés à la cible',
    onPostMove: (context: any): void => {
      if (context.attacker.canAct === true && context.hits
        && context.attacker.currentHp < context.attacker.maxHp 
        && context.attacker.isAlive) {
        const healAmount = Math.ceil(context.damage / 2);
        context.attacker.currentHp = Math.min(context.attacker.currentHp + healAmount, context.attacker.maxHp);
        const moveMessage = `Giga-Sangsue ! ${context.attacker.name} récupère ${healAmount} PV !`;
        context.pendingLogs.push(moveMessage);
        console.log(moveMessage);
      }
    }
  },
  headSmash: {
    moveKey: 'headSmash',
    id: 40,
    name: 'Fracass\'Tête',
    type: 'Roche',
    category: 'Physique',
    power: 150,
    accuracy: 80,
    pp: 5,
    priority: 0,
    description: 'Inflige des dégâts au lanceur égaux à la moitié des dégâts infligés à la cible',
    onPostMove: (context: any): void => {
      if (context.attacker.canAct === true && context.hits) {
        const recoilDamage = Math.floor(context.damage / 2);
        context.attacker.currentHp = Math.max(context.attacker.currentHp - recoilDamage, 0);
        const moveMessage = `Fracass\'Tête ! ${context.attacker.name} subit ${recoilDamage} points de dégâts de recul !`;
        context.pendingLogs.push(moveMessage);
        console.log(moveMessage);
      }
    }
  },
  wildCharge: {
    moveKey: 'wildCharge',
    id: 41,
    name: 'Éclair Fou',
    type: 'Électrik',
    category: 'Physique',
    power: 90,
    accuracy: 100,
    pp: 15,
    priority: 0,
    description: 'Inflige des dégâts au lanceur égaux à un quart des dégâts infligés à la cible',
    onPostMove: (context: any): void => {
      if (context.attacker.canAct === true && context.hits) {
        const recoilDamage = Math.floor(context.damage / 4);
        context.attacker.currentHp = Math.max(context.attacker.currentHp - recoilDamage, 0);
        const moveMessage = `Éclair Fou ! ${context.attacker.name} subit ${recoilDamage} points de dégâts de recul !`;
        context.pendingLogs.push(moveMessage);
        console.log(moveMessage);
      }
    }
  },
  flareBlitz: {
    moveKey: 'flareBlitz',
    id: 42,
    name: 'Boutefeu',
    type: 'Feu',
    category: 'Physique',
    power: 120,
    accuracy: 100,
    pp: 15,
    priority: 0,
    description: 'Inflige des dégâts au lanceur égaux à un tiers des dégâts infligés à la cible, peut brûler la cible',
    onPostMove: (context: any): void => {
      if (context.attacker.canAct === true && context.hits) {
        const recoilDamage = Math.floor(context.damage / 3);
        context.attacker.currentHp = Math.max(context.attacker.currentHp - recoilDamage, 0);
        const moveMessage = `Boutefeu ! ${context.attacker.name} subit ${recoilDamage} points de dégâts de recul !`;
        context.pendingLogs.push(moveMessage);
        console.log(moveMessage);

        const random = Math.random();
        console.log('Boutefeu : random', random);
        if (random < 0.1 && !context.defender.types.includes('Feu') 
          && context.defender.isAlive && context.defender.statusKey === null) {
          const burnMessage = `Boutefeu ! ${context.defender.name} est brûlé !`;
          context.pendingLogs.push(burnMessage);
          console.log(burnMessage);
          context.defender.statusKey = 'burn';
          status['burn'].onApply(context.defender);
        }
      }
    }
  },
  braveBird: {
    moveKey: 'braveBird',
    id: 43,
    name: 'Rapace',
    type: 'Vol',
    category: 'Physique',
    power: 120,
    accuracy: 100,
    pp: 15,
    priority: 0,
    description: 'Inflige des dégâts au lanceur égaux à un tiers des dégâts infligés à la cible',
    onPostMove: (context: any): void => {
      if (context.attacker.canAct === true && context.hits) {
        const recoilDamage = Math.floor(context.damage / 3);
        context.attacker.currentHp = Math.max(context.attacker.currentHp - recoilDamage, 0);
        const moveMessage = `Rapace ! ${context.attacker.name} subit ${recoilDamage} points de dégâts de recul !`;
        context.pendingLogs.push(moveMessage);
        console.log(moveMessage);
      }
    }
  },
  aquaJet: {
    moveKey: 'aquaJet',
    id: 44,
    name: 'Aqua-Jet',
    type: 'Eau',
    category: 'Physique',
    power: 40,
    accuracy: 100,
    pp: 20,
    priority: 1,
    description: 'Priorité +1'
  },
  bulletPunch: {
    moveKey: 'bulletPunch',
    id: 45,
    name: 'Pisto-Poing',
    type: 'Acier',
    category: 'Physique',
    power: 40,
    accuracy: 100,
    pp: 30,
    priority: 1,
    description: 'Priorité +1'
  },
  machPunch: {
    moveKey: 'machPunch',
    id: 46,
    name: 'Mach Punch',
    type: 'Combat',
    category: 'Physique',
    power: 40,
    accuracy: 100,
    pp: 30,
    priority: 1,
    description: 'Priorité +1',
  },
  shadowSneak: {
    moveKey: 'shadowSneak',
    id: 47,
    name: 'Ombre Portée',
    type: 'Spectre',
    category: 'Physique',
    power: 40,
    accuracy: 100,
    pp: 30,
    priority: 1,
    description: 'Priorité +1'
  },
  iceShard: {
    moveKey: 'iceShard',
    id: 48,
    name: 'Éclats Glace',
    type: 'Glace',
    category: 'Physique',
    power: 40,
    accuracy: 100,
    pp: 30,
    priority: 1,
    description: 'Priorité +1'
  },
  extremeSpeed: {
    moveKey: 'extremeSpeed',
    id: 49,
    name: 'Vitesse Extrême',
    type: 'Normal',
    category: 'Physique',
    power: 80,
    accuracy: 100,
    pp: 5,
    priority: 2,
    description: 'Priorité +2'
  },
  avalanche: {
    moveKey: 'avalanche',
    id: 50,
    name: 'Avalanche',
    type: 'Glace',
    category: 'Physique',
    power: 60,
    accuracy: 100,
    pp: 10,
    priority: -4,
    description: 'Double les dégâts si l\'utilisateur a été touché par une attaque lors du tour précédent',
    onDamageModifier: (damage: number, context: any): number => {
      if (context.attacker.hasBeenDamaged) {
        console.log('Avalanche : coup double !');
        return damage * 2;
      }
      
      return damage;
    }
  },
  revenge: {
    moveKey: 'revenge',
    id: 51,
    name: 'Vendetta',
    type: 'Combat',
    category: 'Physique',
    power: 60,
    accuracy: 100,
    pp: 10,
    priority: -4,
    description: 'Double les dégâts si l\'utilisateur a été touché par une attaque lors du tour précédent',
    onDamageModifier: (damage: number, context: any): number => {
      if (context.attacker.hasBeenDamaged) {
        console.log('Vendetta : coup double !');
        return damage * 2;
      }
      
      return damage;
    }
  }
}