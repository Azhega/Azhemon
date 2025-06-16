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
  category: 'Physique' | 'Spécial' | 'Statut' | string;
  power: number;
  accuracy: number;
  pp: number;
  currentPP: number;
  description: string;
  priority: number;
  flags?: MoveFlags;
}

export interface MoveFlags {
  statusEffect?: boolean;
  statEffect?: boolean;
  healEffect?: boolean;
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
  sleepTurns?: number;
}