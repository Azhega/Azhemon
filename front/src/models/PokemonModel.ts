import Store from '../utils/Store.ts';
import { PokemonStats, PokemonMove, PokemonAbility, 
  PokemonItem, PokemonNature, PokemonStatus } from './PokemonInterface.ts';

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
  statusKey: string | null = null;
  statModifiers: Record<keyof PokemonStats, number>;
  isAlive: boolean = true;
  trainer: number | null = null; // Trainer ID, to implement later
  terrain: /*Terrain |*/ any = null; // Terrain, to implement later
  canAct: boolean = true;
  hasBeenDamaged: boolean = false;
  slot: number;
  
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
    this.slot = data.slot;
    
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
    // To develop later: EV/IV calculations
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
    let battleState = Store.getState().battle;
    const clamp = (value: number, min: number, max: number) => {
      if (value > max) {
        console.log(`Modificateur ${value} est supérieur à la limite ${max}, ajusté à ${max}.`);
        const statMessage = `Limite de +6, la stat ne peut pas plus augmenter !`;
        battleState.context.pendingLogs.push(statMessage);
      } else if (value < min) {
        console.log(`Modificateur ${value} est inférieur à la limite ${min}, ajusté à ${min}.`);
        const statMessage = `Limite de -6, la stat ne peut pas plus diminuer !`;
        battleState.context.pendingLogs.push(statMessage);
      }
      return Math.max(min, Math.min(max, value));
    }

    const statKeys: (keyof PokemonStats)[] = [
      'attack', 'defense', 'specialAttack', 'specialDefense', 'speed', 'accuracy', 'evasion'
    ];

    statKeys.forEach(stat => {
      this.statModifiers[stat] = clamp(this.statModifiers[stat], -6, 6);

      // Calculate the stat based on the modifier
      const mod = this.statModifiers[stat];
      if (mod >= 0) {
        this.currentStats[stat] = Math.floor(this.initialCurrentStats[stat] * (1 + (mod * 0.5)));
      } else {
        this.currentStats[stat] = Math.floor(this.initialCurrentStats[stat] / (1 + (Math.abs(mod) * 0.5)));
      }
    });
  }

  public resetStats(): void {
    this.currentStats = { ...this.initialCurrentStats };
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
    this.canAct = true;
    this.hasBeenDamaged = false;
  }
}