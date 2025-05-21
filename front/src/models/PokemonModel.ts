import { Effect } from './EffectModel.ts';

export interface PokemonStats {
  hp: number;
  attack: number;
  defense: number;
  specialAttack: number;
  specialDefense: number;
  speed: number;
  accuracy: number;
  evasion: number;
}

export interface PokemonMove {
  moveKey: string;
  id: number;
  name: string;
  type: string;
  category: 'Physical' | 'Special' | 'Status' | string;
  power: number;
  accuracy: number;
  pp: number;
  currentPP: number;
  description: string;
  priority: number;
  target: Pokemon | null;
}

export interface PokemonAbility {
  id: number;
  name: string;
  description: string;
}

export interface PokemonItem {
  id: number;
  name: string;
  description: string;
}

export interface PokemonNature {
  id: number;
  name: string;
  description: string;
  atk: number;
  def: number;
  spa: number;
  spd: number;
  spe: number;
}

export interface PokemonStatus {
  id: number;
  name: string;
  description: string;
  effects: Effect[]; // Effects to implement later
}

export class Pokemon {
  key: string;
  id: number;
  name: string;
  types: string[];
  baseStats: PokemonStats;
  initialCurrentStats: PokemonStats;
  currentStats: PokemonStats;
  currentHp: number;
  maxHp: number;
  level: number = 50; // Default level, to implement if in advance
  moves: (PokemonMove | null)[];
  possibleMoves: string[];
  ability: PokemonAbility;
  abilityKey: string;
  possibleAbilities: string[];
  item: PokemonItem | null;
  itemKey: string;
  nature: PokemonNature;
  natureKey: string;
  status: PokemonStatus | null;
  statModifiers: Record<keyof PokemonStats, number>;
  isAlive: boolean = true;
  trainer: number | null = null; // Trainer ID, to implement later
  terrain: /*Terrain |*/ any = null; // Terrain, to implement later
  
  constructor(data: any) {
    this.key = data.key;
    this.id = data.id;
    this.name = data.name;
    this.types = data.types;
    this.baseStats = data.baseStats;
    this.level = 50;
    this.moves = data.moves || [];
    this.possibleMoves = data.possibleMoves;
    this.ability = data.ability;
    this.abilityKey = data.abilityKey;
    this.possibleAbilities = data.possibleAbilities;
    this.item = data.item || null;
    this.itemKey = data.itemKey || null;
    this.nature = data.nature;
    this.natureKey = data.natureKey;
    this.status = null;
    
    // Initialize stat modifiers to 0
    this.statModifiers = {
      hp: 0,
      attack: 0,
      defense: 0,
      specialAttack: 0,
      specialDefense: 0,
      speed: 0,
      accuracy: 0,
      evasion: 0
    };
    
    // Calculate current stats based on base stats, level, and EV/IV later
    this.currentStats = this.calculateStats();
    this.initialCurrentStats = this.calculateStats();
    this.currentHp = this.currentStats.hp;
    this.maxHp = this.currentStats.hp;
  }
  
  public calculateStats(): PokemonStats {
    // To develop later: Nature and EV/IV calculations
    return {
      hp: Math.floor(((2 * this.baseStats.hp + 31) * this.level) / 100) + this.level + 10,
      attack: Math.floor((((2 * this.baseStats.attack + 31) * this.level) / 100) + 5) * this.nature.atk,
      defense: Math.floor((((2 * this.baseStats.defense + 31) * this.level) / 100) + 5) * this.nature.def,
      specialAttack: Math.floor((((2 * this.baseStats.specialAttack + 31) * this.level) / 100) + 5) * this.nature.spa,
      specialDefense: Math.floor((((2 * this.baseStats.specialDefense + 31) * this.level) / 100) + 5) * this.nature.spd,
      speed: Math.floor((((2 * this.baseStats.speed + 31) * this.level) / 100) + 5) * this.nature.spe,
      accuracy: 100,
      evasion: 100
    };
  }

  public calculateModifiedStats(): void {
    console.log('current stats before modifiers:', this.currentStats.attack);

    this.currentStats.attack = this.statModifiers.attack >= 0 ? 
      Math.floor(this.initialCurrentStats.attack * (1 + (this.statModifiers.attack * 0.5))) :
      Math.floor(this.initialCurrentStats.attack / (1 + (this.statModifiers.attack * 0.5)));

    this.currentStats.defense = this.statModifiers.defense >= 0 ?
      Math.floor(this.initialCurrentStats.defense * (1 + (this.statModifiers.defense * 0.5))) :
      Math.floor(this.initialCurrentStats.defense / (1 + (this.statModifiers.defense * 0.5)));

    this.currentStats.specialAttack = this.statModifiers.specialAttack >= 0 ?
      Math.floor(this.initialCurrentStats.specialAttack * (1 + (this.statModifiers.specialAttack * 0.5))) :
      Math.floor(this.initialCurrentStats.specialAttack / (1 + (this.statModifiers.specialAttack * 0.5)));

    this.currentStats.specialDefense = this.statModifiers.specialDefense >= 0 ?
      Math.floor(this.initialCurrentStats.specialDefense * (1 + (this.statModifiers.specialDefense * 0.5))) :
      Math.floor(this.initialCurrentStats.specialDefense / (1 + (this.statModifiers.specialDefense * 0.5)));

    this.currentStats.speed = this.statModifiers.speed >= 0 ?
      Math.floor(this.initialCurrentStats.speed * (1 + (this.statModifiers.speed * 0.5))) :
      Math.floor(this.initialCurrentStats.speed / (1 + (this.statModifiers.speed * 0.5)));

    console.log('current stats after modifiers:', this.currentStats.attack);
  }
}

export class PokemonTeam {
  members: (Pokemon | null)[] = [null, null, null, null, null, null];
  
  constructor(initialMembers?: (Pokemon | null)[]) {
    if (initialMembers) {
      this.members = [...initialMembers];
      while (this.members.length < 6) {
        this.members.push(null);
      }
    }
  }
  
  setPokemon(index: number, pokemon: Pokemon | null): void {
    if (index >= 0 && index < 6) {
      this.members[index] = pokemon;
    }
  }
  
  getPokemon(index: number): Pokemon | null {
    if (index >= 0 && index < 6) {
      return this.members[index];
    }
    return null;
  }
  
  toJSON(): (Pokemon | null)[] {
    return [...this.members];
  }
  
  isEmpty(): boolean {
    return !this.members.some(pokemon => pokemon !== null);
  }
}

export interface PokemonDataTable {
  [speciesName: string]: Pokemon;
}