import { Pokemon } from '../models/PokemonModel';

export type BattleStatus = 'initializing' | 'active' | 'won' | 'lost';
export type WeatherType = 'clear' | 'rain' | 'sun' | 'sandstorm' | 'hail' | 'fog'; // to implement later
export type TerrainType = 'none' | 'electric' | 'grassy' | 'misty' | 'psychic'; // to implement later
export type UserType = 'player' | 'cpu';
export type TargetType = 'player' | 'cpu' | 'self' | 'all';

export interface BattleState {
  turn: number;
  playerTeam: Pokemon[];
  cpuTeam: Pokemon[];
  activePokemon: {
    player: Pokemon | null;
    cpu: Pokemon;
  };
  leadSelected: boolean;
  weather: WeatherType | null; // to implement later
  terrain: TerrainType | null; // to implement later
  status: BattleStatus;
  log: string[];
  context: any;
}

export interface BattleAction {
  type: string;
  user: UserType;
  target: TargetType;
  data: any; // Specific data for the action (move, switch, etc.)
}

export interface BattleTurn {
  turnNumber: number;
  actions: {
    player: BattleAction;
    cpu: BattleAction;
  };
}

export interface MoveResult {
  success: boolean;
  damage?: number;
  criticalHit?: boolean;
  effectiveness?: number; // 0, 0.25, 0.5, 1, 2, 4
  message: string;
}

// For future feature : displaying teams state after battle
// export interface BattleResult {
//   winner: UserType | null;
//   playerTeamStatus: {
//     remainingPokemon: number;
//     totalDamageDealt: number;
//     totalDamageReceived: number;
//   };
//   cpuTeamStatus: {
//     remainingPokemon: number;
//     totalDamageDealt: number;
//     totalDamageReceived: number;
//   };
//   turns: number;
// }

export interface TerrainEffect { // to implement later
  name: TerrainType;
  duration: number;
  onTurnStart?: (battle: BattleState) => void;
  onTurnEnd?: (battle: BattleState) => void;
  onAttack?: (attacker: Pokemon, defender: Pokemon, damage: number) => number;
  onStatusApply?: (pokemon: Pokemon, status: string) => boolean;
  message: string;
}

export interface WeatherEffect { // to implement later
  name: WeatherType;
  duration: number;
  onTurnStart?: (battle: BattleState) => void;
  onTurnEnd?: (battle: BattleState) => void;
  onTypeEffectiveness?: (moveType: string, defenderTypes: string[], effectiveness: number) => number;
  onDamageCalculation?: (moveType: string, damage: number) => number;
  message: string;
}