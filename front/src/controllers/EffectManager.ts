import { abilities } from '../data/abilities';
import { items } from '../data/items';
import { moves } from '../data/moves';
import { Pokemon } from '../models/PokemonModel';

type EffectHook = 
  | 'onTurnStart'
  | 'onPreMove'
  | 'onDamageModifier'
  | 'onDamageTaken'
  | 'onPostMove'
  | 'onTurnEnd'
  | 'onSwitch';

type EffectFunction = (...args: any[]) => any;

export class EffectManager {
  // Map each hooks to an array of effect functions
  private hooks: Map<EffectHook, EffectFunction[]> = new Map();
  
  private registerPokemonEffects(pokemon: Pokemon): void {
    // Register ability effects
    const abilityObj = abilities[pokemon.abilityKey as keyof typeof abilities];
    if (abilityObj) {
      for (const key of Object.keys(abilityObj)) {
        const value = abilityObj[key as keyof typeof abilityObj];
        if (typeof value === 'function') {
          const hook = key as EffectHook;
          if (!this.hooks.has(hook)) {
            this.hooks.set(hook, []);
          }
          this.hooks.get(hook)!.push((value as Function).bind(abilityObj));
        }
      }
    }

    // Register item effects
    const itemObj = items[pokemon.itemKey as keyof typeof items];
    if (itemObj) {
      for (const key of Object.keys(itemObj)) {
        const value = itemObj[key as keyof typeof itemObj];
        if (typeof value === 'function') {
          const hook = key as EffectHook;
          if (!this.hooks.has(hook)) {
            this.hooks.set(hook, []);
          }
          this.hooks.get(hook)!.push((value as Function).bind(itemObj));
        }
      }
    }

    // Register moves effects
    pokemon.moves.map((move) => {
      if (move) {
        const moveObj = moves[move.moveKey as keyof typeof moves];
        if (moveObj) {
          for (const key of Object.keys(moveObj)) {
            const value = moveObj[key as keyof typeof moveObj];
            if (typeof value === 'function') {
              const hook = key as EffectHook;
              if (!this.hooks.has(hook)) {
                this.hooks.set(hook, []);
              }
              this.hooks.get(hook)!.push((value as Function).bind(moveObj));
            }
          }
        }
      }
    });
  }

  // To clear effects when a Pokemon leaves the battle
  public unregisterAllEffects() {
    this.hooks.clear();
  }

  public runHook(hook: EffectHook, ...args: any[]): any[] {
    const results: any[] = [];
    const functions = this.hooks.get(hook) || [];
    for (const fn of functions) {
      try {
        results.push(fn(...args));
      } catch (error) {
        console.error(`Error occurred while running hook "${hook}":`, error);
      } 
    }
    return results;
  }

  public chainHook<T>(hook: EffectHook, initialValue: T, ...args: any[]): T {
    let value = initialValue;
    const functions = this.hooks.get(hook) || [];
    for (const fn of functions) {
      try {
        if (typeof fn !== 'function') {
          throw new Error(`Hook "${hook}" is not a function`);
        }
      } catch (error) {
        console.error(`Error occurred while running hook "${hook}":`, error);
      }
      const result = fn(value, ...args);
      if (result !== undefined) {
        value = result;
      }
    }
    return value;
  }

  public applyTurnStartEffects(...args: any[]) {
    this.runHook('onTurnStart', ...args);
  }
  public applyPreMoveEffects(...args: any[]) {
    this.runHook('onPreMove', ...args);
  }
  public applyDamageModifierEffects(damage: number, ...args: any[]): number {
    return this.chainHook('onDamageModifier', damage, ...args);
  }
  public applyOnDamageTakenEffects(...args: any[]) {
    this.runHook('onDamageTaken', ...args);
  }
  public applyPostMoveEffects(...args: any[]) {
    this.runHook('onPostMove', ...args);
  }
  public applyTurnEndEffects(...args: any[]) {
    this.runHook('onTurnEnd', ...args);
  }
  public applyOnSwitchEffects(...args: any[]) {
    this.runHook('onSwitch', ...args);
  }
}