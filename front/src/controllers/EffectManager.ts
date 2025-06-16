import { abilities } from '../data/abilities';
import { items } from '../data/items';
import { moves } from '../data/moves';
import { Pokemon } from '../models/PokemonModel';
import { status } from '../data/status';

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
  private static instance: EffectManager;
  // Map each hooks to an array of effect functions
  private hooks: Map<EffectHook, EffectFunction[]> = new Map();
  private moveHooks: Map<EffectHook, EffectFunction[]> = new Map();
  private registeredItemFunctions: Map<EffectHook, Set<Function>> = new Map();
  private registeredStatusFunctions: Map<EffectHook, Set<Function>> = new Map();

  private constructor() {}

  public static getInstance(): EffectManager {
    if (!EffectManager.instance) {
      EffectManager.instance = new EffectManager();
    }
    return EffectManager.instance;
  }
  
  public registerPokemonEffects(pokemon: Pokemon): void {
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
          if (!this.registeredItemFunctions.has(hook)) {
            this.registeredItemFunctions.set(hook, new Set());
          }
          const registeredFns = this.registeredItemFunctions.get(hook)!;
          if (!registeredFns.has(value as Function)) {
            registeredFns.add(value as Function);
            this.hooks.get(hook)!.push((value as Function).bind(itemObj));
          }
        }
      }
    }
  }
  
  public registerMoveEffects(moveKey: string) {
    const moveObj = moves[moveKey as keyof typeof moves];
    if (moveObj) {
      for (const key of Object.keys(moveObj)) {
        const value = moveObj[key as keyof typeof moveObj];
        if (typeof value === 'function') {
          const hook = key as EffectHook;
          if (!this.moveHooks.has(hook)) {
            this.moveHooks.set(hook, []);
          }
          this.moveHooks.get(hook)!.push((value as Function).bind(moveObj));
        }
      }
    }
  };

  public registerStatusEffects(pokemon: Pokemon): void {
    const statusObj = status[pokemon.statusKey as keyof typeof status];
    if (statusObj) {
      for (const key of Object.keys(statusObj)) {
        const value = statusObj[key as keyof typeof statusObj];
        if (typeof value === 'function') {
          const hook = key as EffectHook;
          if (!this.hooks.has(hook)) {
            this.hooks.set(hook, []);
          }
          if (!this.registeredStatusFunctions.has(hook)) {
            this.registeredStatusFunctions.set(hook, new Set());
          }
          const registeredFns = this.registeredStatusFunctions.get(hook)!;
          if (!registeredFns.has(value as Function)) {
            registeredFns.add(value as Function);
            this.hooks.get(hook)!.push((value as Function).bind(statusObj));
          }
        }
      }
    }
  }

  // To clear effects when a Pokemon leaves the battle
  public unregisterAllEffects() {
    this.hooks.clear();
  }

  public unregisterMoveEffects() {
    this.moveHooks.clear();
  }

  // To avoid duplicate item effects bugs
  public unregisterItemFunctions() {
    this.registeredItemFunctions.clear();
  }

  // To avoid duplicate status effects bugs
  public unregisterStatusFunctions() {
    this.registeredStatusFunctions.clear();
  }

  public resetEffects(firstPokemon: Pokemon, secondPokemon: Pokemon) {
    this.unregisterAllEffects();
    this.unregisterMoveEffects();
    this.unregisterItemFunctions();
    this.unregisterStatusFunctions();
    this.registerPokemonEffects(firstPokemon);
    this.registerPokemonEffects(secondPokemon);
    this.registerStatusEffects(firstPokemon);
    this.registerStatusEffects(secondPokemon);
  }

  public clearAllEffects() {
    this.unregisterAllEffects();
    this.unregisterMoveEffects();
    this.unregisterItemFunctions();
    this.unregisterStatusFunctions();
  }

  public runHook(hook: EffectHook, context: any): void {
    const functions = [
    ...(this.hooks.get(hook) || []),
    ...(this.moveHooks.get(hook) || [])
    ];
    for (const fn of functions) {
      try {
        fn(context);
      } catch (error) {
        console.error(`Error occurred while running hook "${hook}" for function ${fn}:`, error);
      } 
    }
  }

  public chainHook<T>(hook: EffectHook, initialValue: T, context: any): T {
    let value = initialValue;
    const functions = [
    ...(this.hooks.get(hook) || []),
    ...(this.moveHooks.get(hook) || [])
    ];
    for (const fn of functions) {
      try {
        if (typeof fn !== 'function') {
          throw new Error(`Hook "${hook}" is not a function`);
        }
      } catch (error) {
        console.error(`Error occurred while running hook "${hook}":`, error);
      }
      const result = fn(value, context);
      if (result !== undefined) {
        value = result;
      }
    }
    return value;
  }

  public applyTurnStartEffects(context: any) {
    this.runHook('onTurnStart', context);
  }
  public applyPreMoveEffects(context: any) {
    this.runHook('onPreMove', context);
  }
  public applyDamageModifierEffects(damage: number, context: any): number {
    return this.chainHook('onDamageModifier', damage, context);
  }
  public applyPostMoveEffects(context: any) {
    this.runHook('onPostMove', context);
  }
  public applyTurnEndEffects(context: any) {
    this.runHook('onTurnEnd', context);
  }
  public applyOnSwitchEffects(context: any) {
    this.runHook('onSwitch', context);
  }
}

export default EffectManager.getInstance();