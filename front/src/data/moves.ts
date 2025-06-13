import { status } from './status';
import { TurnManager } from '../controllers/TurnManager';
import Store from '../utils/Store';
import EventBus from '../utils/EventBus'; 
import { Pokemon } from '../models/PokemonModel';
import { Effect } from '../models/EffectModel';

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
            context.pendingLogsAndEffects.push({
              log: `Ébullition ! ${context.defender.name} est brûlé !`,
              effect: () => {
                context.defender.statusKey = 'burn';
                status['burn'].onApply(context.defender);
              }
            });
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
          context.pendingLogsAndEffects.push({
            log: `Ball'ombre ! La Défense Spéciale de ${context.defender.name} baisse !`,
            effect: () => {
              context.defender.statModifiers.specialDefense -= 1;
              context.defender.calculateModifiedStats();
            }
          });
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
          if (random < 0.1 && (!context.defender.types.includes('Électrik') || !context.defender.types.includes('Sol')) && context.defender.isAlive) {
            context.pendingLogsAndEffects.push({
              log: `Tonnerre ! ${context.defender.name} est paralysé !`,
              effect: () => {
                context.defender.statusKey = 'paralysis';
                status['paralysis'].onApply(context.defender);
              }
            });
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
          context.pendingLogsAndEffects.push({
            log: `Lame de Roc ! Coup critique !`          
          });
          context.critical = true;
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
        context.pendingLogsAndEffects.push({
          log: `Close Combat ! La Défense et la Défense Spéciale de ${context.attacker.name} baissent !`,
          effect: () => {
            context.attacker.statModifiers.defense -= 1;
            context.attacker.statModifiers.specialDefense -= 1;
            context.attacker.calculateModifiedStats();
          }
        });
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
          context.pendingLogsAndEffects.push({
            log: `Poison-Croix ! Coup critique !`
          });
          context.critical = true;
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
          context.pendingLogsAndEffects.push({
            log: `Poison-Croix ! ${context.defender.name} est empoisonné !`,
            effect: () => {
              context.defender.statusKey = 'poison';
              status['poison'].onApply(context.defender);
            }
          });
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
            context.pendingLogsAndEffects.push({
              log: `Laser Glace ! ${context.defender.name} est gelé !`,
              effect: () => {
                context.defender.statusKey = 'freeze';
                status['freeze'].onApply(context.defender);
              }
            });
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
          context.pendingLogsAndEffects.push({
            log: `Psyko ! La Défense Spéciale de ${context.defender.name} baisse !`,
            effect: () => {
              context.defender.statModifiers.specialDefense -= 1;
              context.defender.calculateModifiedStats();
            }
          });
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
          context.pendingLogsAndEffects.push({
            log: `Triplattaque ! ${context.defender.name} est gelé !`,
            effect: () => {
              context.defender.statusKey = 'freeze';
              status['freeze'].onApply(context.defender);
            }
          });
        } else if ((random > 0.067 && random < 0.133) && !context.defender.types.includes('Feu') && context.defender.isAlive) {
          context.pendingLogsAndEffects.push({
            log: `Triplattaque ! ${context.defender.name} est brûlé !`,
            effect: () => {
              context.defender.statusKey = 'burn';
              status['burn'].onApply(context.defender);
            }
          });
        } else if ((random > 0.133 && random < 0.2) && !context.defender.types.includes('Électrik') && context.defender.isAlive) {
          context.pendingLogsAndEffects.push({
            log: `Triplattaque ! ${context.defender.name} est paralysé !`,
            effect: () => {
              context.defender.statusKey = 'paralysis';
              status['paralysis'].onApply(context.defender);
            }
          });
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
          context.pendingLogsAndEffects.push({
            log: `Lance-Flammes ! ${context.defender.name} est brûlé !`,
            effect: () => {
              context.defender.statusKey = 'burn';
              status['burn'].onApply(context.defender);
            }
          });
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
          context.pendingLogsAndEffects.push({
            log: `Éco-Sphère ! La Défense Spéciale de ${context.defender.name} baisse !`,
            effect: () => {
              context.defender.statModifiers.specialDefense -= 1;
              context.defender.calculateModifiedStats();
            }
          });
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
          context.pendingLogsAndEffects.push({
            log: `Tranche-Nuit : coup critique !`
          });
          context.critical = true;
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
    flags: { statusEffect: true },
    onPostMove: (context: any): void => {
      if (context.attacker.canAct === true && context.hits) {
        if (context.defender.types.includes('Feu')) {
          context.pendingLogsAndEffects.push({
            log: `Feu Follet ! ${context.defender.name} est immunisé !`
          });
          return;
        }
        if (!context.defender.statusKey || context.defender.statusKey === undefined) {
          context.pendingLogsAndEffects.push({
            log: `Feu Follet ! ${context.defender.name} est brûlé !`,
            effect: () => {
              context.defender.statusKey = 'burn';
              status['burn'].onApply(context.defender);
            }
          });
        } else {
          context.pendingLogsAndEffects.push({
            log: `Feu Follet ! ${context.defender.name} a déjà un statut !`
          });
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
    flags: { statusEffect: true },
    onPostMove: (context: any): void => {
      if (context.attacker.canAct === true && context.hits) {
        if (context.defender.types.includes('Électrik')) {
          context.pendingLogsAndEffects.push({
            log: `Cage-Éclair ! ${context.defender.name} est immunisé !`
          });
          return;
        }
        if (context.defender.statusKey === null || context.defender.statusKey === undefined) {
          context.pendingLogsAndEffects.push({
            log: `Cage-Éclair ! ${context.defender.name} est paralysé !`,
            effect: () => {
              context.defender.statusKey = 'paralysis';
              status['paralysis'].onApply(context.defender);
            }
          });
        } else {
          context.pendingLogsAndEffects.push({
            log: `Cage-Éclair ! ${context.defender.name} a déjà un statut !`
          });
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
    flags: { statusEffect: true },
    onPostMove: (context: any): void => {
      if (context.attacker.canAct === true && context.hits) {
        if (context.defender.types.includes('Poison') || context.defender.types.includes('Acier')) {
          context.pendingLogsAndEffects.push({
            log: `Toxic ! ${context.defender.name} est immunisé !`
          });
          return;
        }
        if (context.defender.statusKey === null || context.defender.statusKey === undefined) {
          context.pendingLogsAndEffects.push({
            log: `Toxic ! ${context.defender.name} est empoisonné !`,
            effect: () => {
              context.defender.statusKey = 'poison';
              status['poison'].onApply(context.defender);
            }
          });
        } else {
          context.pendingLogsAndEffects.push({
            log: `Toxic ! ${context.defender.name} a déjà un statut !`
          });
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
    flags: { statusEffect: true },
    onPostMove: (context: any): void => {
      if (context.attacker.canAct === true && context.hits) {
        if (context.defender.statusKey === null || context.defender.statusKey === undefined) {
          context.pendingLogsAndEffects.push({
            log: `Hypnose ! ${context.defender.name} est endormi !`,
            effect: () => {
              context.defender.statusKey = 'sleep';
              status['sleep'].onApply(context.defender);
            }
          });
        } else {
          context.pendingLogsAndEffects.push({
            log: `Hypnose ! ${context.defender.name} a déjà un statut !`
          });
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
    flags: { statusEffect: true },
    onPostMove: (context: any): void => {
      if (context.attacker.canAct === true && context.hits) {
        if (context.defender.types.includes('Glace')) {
          context.pendingLogsAndEffects.push({
            log: `Vague Glace ! ${context.defender.name} est immunisé !`
          });
          return;
        }
        if (context.defender.statusKey === null || context.defender.statusKey === undefined) {
          context.pendingLogsAndEffects.push({
            log: `Vague Glace ! ${context.defender.name} est gelé !`,
            effect: () => {
              context.defender.statusKey = 'freeze';
              status['freeze'].onApply(context.defender);
            }
          });
        } else {
          context.pendingLogsAndEffects.push({
            log: `Vague Glace ! ${context.defender.name} a déjà un statut !`
          });
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
    flags: { statEffect: true },
    onPostMove: (context: any): void => {
      if (context.attacker.canAct === true && context.hits) {
        context.pendingLogsAndEffects.push({
          log: `Danse-Lames ! L'attaque de ${context.attacker.name} augmente beaucoup !`,
          effect: () => {
            context.attacker.statModifiers.attack += 2;
            context.attacker.calculateModifiedStats();
          }
        });
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
    flags: { statEffect: true },
    onPostMove: (context: any): void => {
      if (context.attacker.canAct === true && context.hits) {
        context.pendingLogsAndEffects.push({
          log: `Mur de Fer ! La défense de ${context.attacker.name} augmente beaucoup !`,
          effect: () => {
            context.attacker.statModifiers.defense += 2;
            context.attacker.calculateModifiedStats();
          }
        });
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
    flags: { statEffect: true },
    onPostMove: (context: any): void => {
      if (context.attacker.canAct === true && context.hits) {
        context.pendingLogsAndEffects.push({
          log: `Machination ! L'attaque spéciale de ${context.attacker.name} augmente beaucoup !`,
          effect: () => {
            context.attacker.statModifiers.specialAttack += 2;
            context.attacker.calculateModifiedStats();
          }
        });
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
    flags: { statEffect: true },
    onPostMove: (context: any): void => {
      if (context.attacker.canAct === true && context.hits) {
        context.pendingLogsAndEffects.push({
          log: `Amnésie ! La défense spéciale de ${context.attacker.name} augmente beaucoup !`,
          effect: () => {
            context.attacker.statModifiers.specialDefense += 2;
            context.attacker.calculateModifiedStats();
          }
        });
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
    flags: { statEffect: true },
    onPostMove: (context: any): void => {
      if (context.attacker.canAct === true && context.hits) {
        context.pendingLogsAndEffects.push({
          log: `Hâte ! La vitesse de ${context.attacker.name} augmente beaucoup !`,
          effect: () => {
            context.attacker.statModifiers.speed += 2;
            context.attacker.calculateModifiedStats();
          }
        });
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
    flags: { statEffect: true },
    onPostMove: (context: any): void => {
      if (context.attacker.canAct === true && context.hits) {
        context.pendingLogsAndEffects.push({
          log: `Plénitude ! L'attaque spéciale et la défense spéciale de ${context.attacker.name} augmentent !`,
          effect: () => {
            context.attacker.statModifiers.specialAttack += 1;
            context.attacker.statModifiers.specialDefense += 1;
            context.attacker.calculateModifiedStats();
          }
        });
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
    flags: { statEffect: true },
    onPostMove: (context: any): void => {
      if (context.attacker.canAct === true && context.hits) {
        context.pendingLogsAndEffects.push({
          log: `Charme ! L'attaque de ${context.defender.name} baisse beaucoup !`,
          effect: () => {
            context.defender.statModifiers.attack -= 2;
            context.defender.calculateModifiedStats();
          }
        });
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
    flags: { statEffect: true },
    onPostMove: (context: any): void => {
      if (context.attacker.canAct === true && context.hits) {
        context.pendingLogsAndEffects.push({
          log: `Grincement ! La défense de ${context.defender.name} baisse beaucoup !`,
          effect: () => {
            context.defender.statModifiers.defense -= 2;
            context.defender.calculateModifiedStats();
          }
        });
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
    flags: { statEffect: true },
    onPostMove: (context: any): void => {
      if (context.attacker.canAct === true && context.hits) {
        context.pendingLogsAndEffects.push({
          log: `Impulsion Étrange ! L'attaque spéciale de ${context.defender.name} baisse beaucoup !`,
          effect: () => {
            context.defender.statModifiers.specialAttack -= 2;
            context.defender.calculateModifiedStats();
          }
        });
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
    flags: { statEffect: true },
    onPostMove: (context: any): void => {
      if (context.attacker.canAct === true && context.hits) {
        context.pendingLogsAndEffects.push({
          log: `Croco Larme ! La défense spéciale de ${context.defender.name} baisse beaucoup !`,
          effect: () => {
            context.defender.statModifiers.specialDefense -= 2;
            context.defender.calculateModifiedStats();
          }
        });
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
    flags: { statEffect: true },
    onPostMove: (context: any): void => {
      if (context.attacker.canAct === true && context.hits) {
        context.pendingLogsAndEffects.push({
          log: `Strido-Son ! La défense spéciale de ${context.defender.name} baisse beaucoup !`,
          effect: () => {
            context.defender.statModifiers.specialDefense -= 2;
            context.defender.calculateModifiedStats();
          }
        });
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
    flags: { statEffect: true },
    onPostMove: (context: any): void => {
      if (context.attacker.canAct === true && context.hits) {
        context.pendingLogsAndEffects.push({
          log: `Spore Coton ! La vitesse de ${context.defender.name} baisse beaucoup !`,
          effect: () => {
            context.defender.statModifiers.speed -= 2;
            context.defender.calculateModifiedStats();
          }
        });
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
    flags: { healEffect: true },
    onPostMove: (context: any): void => {
      if (context.attacker.canAct === true && context.hits) {
        if (context.attacker.currentHp < context.attacker.maxHp) {
          const healAmount = Math.floor(context.attacker.maxHp / 2);

          context.pendingLogsAndEffects.push({
            log: `Soin ! ${context.attacker.name} récupère ${healAmount} PV !`,
            effect: () => {
              context.attacker.currentHp = Math.min(context.attacker.currentHp + healAmount, context.attacker.maxHp);
            }
          });
        } else {
          context.pendingLogsAndEffects.push({
            log: `Soin ! Les PV de ${context.attacker.name} sont déjà au max !`,
          });
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
        && (context.attacker.isAlive || context.attacker.currentHp <= 0)) {
        const healAmount = Math.ceil(context.damage / 2);

        context.pendingLogsAndEffects.push({
          log: `Vampipoing ! ${context.attacker.name} récupère ${healAmount} PV !`,
          effect: () => {
            context.attacker.currentHp = Math.min(context.attacker.currentHp + healAmount, context.attacker.maxHp);
          }
        });
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
        && (context.attacker.isAlive || context.attacker.currentHp <= 0)) {
        const healAmount = Math.ceil(context.damage / 2);

        context.pendingLogsAndEffects.push({
          log: `Giga-Sangsue ! ${context.attacker.name} récupère ${healAmount} PV !`,
          effect: () => {
            context.attacker.currentHp = Math.min(context.attacker.currentHp + healAmount, context.attacker.maxHp);
          }
        });
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
        const actualDamage = Math.max(0, context.defenderInitialHp - context.defender.currentHp);
        const recoilDamage = Math.floor(actualDamage / 2);

        context.pendingLogsAndEffects.push({
          log: `Fracass'Tête ! ${context.attacker.name} subit ${recoilDamage} points de dégâts de recul !`,
          effect: () => {
            context.attacker.currentHp = Math.max(context.attacker.currentHp - recoilDamage, 0);
          }
        });
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
        const actualDamage = Math.max(0, context.defenderInitialHp - context.defender.currentHp);
        const recoilDamage = Math.floor(actualDamage / 4);

        context.pendingLogsAndEffects.push({
          log: `Éclair Fou ! ${context.attacker.name} subit ${recoilDamage} points de dégâts de recul !`,
          effect: () => {
            context.attacker.currentHp = Math.max(context.attacker.currentHp - recoilDamage, 0);
          }
        });
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
        const actualDamage = Math.max(0, context.defenderInitialHp - context.defender.currentHp);
        const recoilDamage = Math.floor(actualDamage / 2);
        context.attacker.currentHp = Math.max(context.attacker.currentHp - recoilDamage, 0);
        context.pendingLogsAndEffects.push({
          log: `Boutefeu ! ${context.attacker.name} subit ${recoilDamage} points de dégâts de recul !`,
          effect: () => {
            const actualDamage = Math.max(0, context.defenderInitialHp - context.defender.currentHp);
            const recoilDamage = Math.floor(actualDamage / 2);
            context.attacker.currentHp = Math.max(context.attacker.currentHp - recoilDamage, 0);
          }
        });

        const random = Math.random();
        console.log('Boutefeu : random', random);
        if (random < 0.1 && !context.defender.types.includes('Feu') 
          && context.defender.isAlive && context.defender.statusKey === null) {
          context.pendingLogsAndEffects.push({
            log: `Boutefeu ! ${context.defender.name} est brûlé !`,
            effect: () => {
              context.defender.statusKey = 'burn';
              status['burn'].onApply(context.defender);
            }
          });
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
        const actualDamage = Math.max(0, context.defenderInitialHp - context.defender.currentHp);
        const recoilDamage = Math.floor(actualDamage / 2);

        context.pendingLogsAndEffects.push({
          log: `Rapace ! ${context.attacker.name} subit ${recoilDamage} points de dégâts de recul !`,
          effect: () => {
            context.attacker.currentHp = Math.max(context.attacker.currentHp - recoilDamage, 0);
          }
        });
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
        context.pendingLogsAndEffects.push({
          log: `Avalanche : Puissance augmentée !`
        });
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
        context.pendingLogsAndEffects.push({
          log: `Vendetta : Puissance augmentée !`
        });
        return damage * 2;
      }
      
      return damage;
    }
  },
  u_turn: {
    moveKey: 'u_turn',
    id: 52,
    name: 'Demi-Tour',
    type: 'Insecte',
    category: 'Physique',
    power: 70,
    accuracy: 100,
    pp: 20,
    priority: 0,
    description: 'Permet de changer de Pokémon après l\'attaque',
    onPostMove: (context: any): void => {
      if (context.attacker.canAct === true && context.hits && context.attacker.isAlive) {
        const battleState = Store.getState().battle;
        let team: any[] = [];
        if (battleState.playerTeam.some((p: Pokemon) => p === context.attacker)) {
          team = battleState.playerTeam;
        } else if (battleState.cpuTeam.some((p: Pokemon) => p === context.attacker)) {
          team = battleState.cpuTeam;
        }

        const aliveCount = team.filter((p: Pokemon) => p.isAlive && p !== context.attacker).length;

        if (aliveCount > 0) {
          context.pendingLogsAndEffects.push({
            log: `Demi-Tour ! ${context.attacker.name} change de Pokémon !`
          });

          context.requestSwitch = true;
        }
      }
    }
  },
  earthPower: {
    moveKey: 'earthPower',
    id: 53,
    name: 'Telluriforce',
    type: 'Sol',
    category: 'Spécial',
    power: 90,
    accuracy: 100,
    pp: 10,
    priority: 0,
    description: 'Peut baisser la Défense Spéciale de la cible',
    onPostMove: (context: any): void => {
      if (context.attacker.canAct === true && context.hits) {
        const random = Math.random();
        console.log('Telluriforce : random', random);
        if (random < 0.1 && context.defender.isAlive) {
          context.pendingLogsAndEffects.push({
            log: `Telluriforce ! La Défense Spéciale de ${context.defender.name} baisse !`,
            effect: () => {
              context.defender.statModifiers.specialDefense -= 1;
              context.defender.calculateModifiedStats();
            }
          });
        }
      }
    }
  }
}