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
  id: number;
  name: string;
  type: string;
  category: 'Physical' | 'Special' | 'Status';
  power: number;
  accuracy: number;
  pp: number;
  description: string;
  priority: number;
  effect: string; // Effect to implement later
}

export interface PokemonAbility {
  id: number;
  name: string;
  description: string;
  effect: string; // Effect to implement later
}

export interface PokemonItem {
  id: number;
  name: string;
  description: string;
  effect: string; // Effect to implement later
}

export interface PokemonNature {
  id: number;
  name: string;
  effect: string; // Effect to implement later
}

export class Pokemon {
  id: number;
  name: string;
  types: string[];
  baseStats: PokemonStats;
  currentStats: PokemonStats;
  currentHp: number;
  level: number = 50; // Default level, to implement if in advance
  moves: PokemonMove[];
  ability: PokemonAbility;
  item: PokemonItem | null;
  nature: PokemonNature;
  status: string | null;
  statModifiers: Record<keyof PokemonStats, number>;
  isAlive: boolean = true;
  trainer: number | null = null; // Trainer ID, to implement later
  terrain: /*Terrain |*/ any = null; // Terrain, to implement later
  
  constructor(data: any) {
    this.id = data.id;
    this.name = data.name;
    this.types = data.types;
    this.baseStats = data.baseStats;
    this.level = 50;
    this.moves = data.moves || [];
    this.ability = data.ability;
    this.item = data.item || null;
    this.nature = data.nature;
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
    this.currentHp = this.currentStats.hp;
  }
  
  private calculateStats(): PokemonStats {
    // To develop later: Nature and EV/IV calculations
    return {
      hp: Math.floor(((2 * this.baseStats.hp + 31) * this.level) / 100) + this.level + 10,
      attack: Math.floor(((2 * this.baseStats.attack + 31) * this.level) / 100) + 5,
      defense: Math.floor(((2 * this.baseStats.defense + 31) * this.level) / 100) + 5,
      specialAttack: Math.floor(((2 * this.baseStats.specialAttack + 31) * this.level) / 100) + 5,
      specialDefense: Math.floor(((2 * this.baseStats.specialDefense + 31) * this.level) / 100) + 5,
      speed: Math.floor(((2 * this.baseStats.speed + 31) * this.level) / 100) + 5,
      accuracy: 100,
      evasion: 100
    };
  }
  
  // Other methods to implement later
}