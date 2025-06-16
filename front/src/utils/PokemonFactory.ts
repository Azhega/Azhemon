import { Pokedex } from '../data/pokedex';
import { Pokemon } from '../models/PokemonModel';
import { PokemonAbility, PokemonMove, PokemonItem, PokemonNature } from '../interfaces/PokemonInterface';

export function createBattlePokemon(
  speciesName: keyof typeof Pokedex,
  options: { nature: PokemonNature; moves: PokemonMove[]; 
      ability: PokemonAbility; item: PokemonItem | null; slot: number
    }
): Pokemon {
  const data = Pokedex[speciesName];
  if (!data) throw new Error(`Species ${speciesName} not found in Pokedex`);
  return new Pokemon({
    key: speciesName,
    ...data,
    nature: options.nature,
    moves: options.moves,
    ability: options.ability,
    item: options.item || null,
    slot: options.slot
  });
}