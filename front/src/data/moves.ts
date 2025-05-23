import { status } from './status';

export const moves = {
  auraSphere: {
    moveKey: 'auraSphere',
    id: 1,
    name: 'Aurasphère',
    type: 'Combat',
    category: 'Spécial',
    power: 80,
    accuracy: 100,
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
    description: 'Peut brûler la cible'
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
    description: 'Peut baisser la Défense Spéciale de la cible'
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
    description: 'Peut paralyser la cible'
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
    description: 'Baisse la Défense et la Défense Spéciale du lanceur'
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
    description: 'Taux de critiques élevé, peut empoisonner la cible'
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
    description: 'Peut geler la cible'
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
    description: 'Peut baisser la Défense Spéciale de la cible'
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
    description: 'Peut paralyser, brûler ou geler la cible'
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
    description: 'Peut brûler la cible'
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
    description: 'Peut baisser la Défense Spéciale de la cible'
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
      if (!context.defender.statusKey || context.defender.statusKey === undefined) {
        // const moveMessage = `Feu Follet ! ${context.defender.name} est brûlé !`;
        // context.pendingLogs.push(moveMessage);
        console.log('Feu Follet !', context.defender.name, 'est brûlé !');
        context.defender.statusKey = 'burn';
        status['burn'].onApply(context.defender);
      } else {
        // const moveMessage = `Feu Follet ! ${context.defender.name} a déjà un statut !`;
        // context.pendingLogs.push(moveMessage);
        console.log('Feu Follet !', context.defender.name, 'a déjà un statut !');
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
      if (context.attacker.canAct === true) {
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
      if (!context.defender.statusKey) {
        console.log('Toxik !', context.defender.name, 'est empoisonné !');
        context.defender.statusKey = 'poison';
      } else {
        console.log('Toxik !', context.defender.name, 'a déjà un statut !');
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
      if (!context.defender.statusKey) {
        console.log('Hypnose !', context.defender.name, 'est endormi !');
        context.defender.statusKey = 'sleep';
      } else {
        console.log('Hypnose !', context.defender.name, 'a déjà un statut !');
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
      if (!context.defender.statusKey) {
        console.log('Vague Glace !', context.defender.name, 'est gelé !');
        context.defender.statusKey = 'freeze';
      } else {
        console.log('Vague Glace !', context.defender.name, 'a déjà un statut !');
      }
    }
  }
}