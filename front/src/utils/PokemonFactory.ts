import { Pokedex } from '../data/pokedex';
import { Pokemon, PokemonAbility, PokemonMove, PokemonItem } from '../models/PokemonModel';

export function createBattlePokemon(
  speciesName: keyof typeof Pokedex,
  options: { nature: any; moves: PokemonMove[]; ability: PokemonAbility; item: PokemonItem | null }
): Pokemon {
  const data = Pokedex[speciesName];
  if (!data) throw new Error(`Species ${speciesName} not found in Pokedex`);
  return new Pokemon({
    ...data,
    nature: options.nature,
    moves: options.moves,
    ability: options.ability,
    item: options.item || null
  });
}