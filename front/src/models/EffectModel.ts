import { PokemonStatus } from './PokemonModel.ts';

export class Effect {
  id: string;
  name: string;
  description: string;
  duration: number; // Duration in turns
  type: string; // e.g., "buff", "debuff", "status"
  target: string; // e.g., "self", "opponent", "team"
  chance: number; // Chance of applying the effect
  status: PokemonStatus; // e.g., "burn", "freeze", "paralyze"
  statChanges: StatChange[]; // Stat changes, e.g., { attack: -1, defense: 2 }
  effectFunction: (target: any) => void; // Function to apply the effect

  constructor(
    id: string,
    name: string,
    description: string,
    duration: number,
    type: string,
    target: string,
    chance: number,
    status: PokemonStatus,
    statChanges: StatChange[],
    effectFunction: (target: any) => void
  ) {
    this.id = id;
    this.name = name;
    this.description = description;
    this.duration = duration;
    this.type = type;
    this.target = target;
    this.chance = chance;
    this.status = status;
    this.statChanges = statChanges;
    this.effectFunction = effectFunction;
  }
}

interface StatChange {
  stat: string;
  value: number;
  target: 'self' | 'opponent';
}