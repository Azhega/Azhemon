import { abilities } from '../data/abilities';
import { items } from '../data/items';
import { moves } from '../data/moves';
import { Pokemon } from '../models/PokemonModel';
import State from '../utils/Store';
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
            console.log(`Registering ability hook : ${hook}`);
            this.hooks.set(hook, []);
          }
          console.log(`pushing ability hook ${abilityObj.name}: ${hook}`);
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
            console.log(`Registering item hook ${itemObj.name}: ${hook}`);
            this.hooks.set(hook, []);
          }
          if (!this.registeredItemFunctions.has(hook)) {
            this.registeredItemFunctions.set(hook, new Set());
          }
          const registeredFns = this.registeredItemFunctions.get(hook)!;
          if (!registeredFns.has(value as Function)) {
            registeredFns.add(value as Function);
            console.log(`pushing item hook ${itemObj.name}: ${hook}`);
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
            console.log(`Registering move hook ${moveObj.name}: ${hook}`);
            this.moveHooks.set(hook, []);
          }
          console.log(`pushing move hook ${moveObj.name}: ${hook}`);
          this.moveHooks.get(hook)!.push((value as Function).bind(moveObj));
        }
      }
    }
  };

  public registerStatusEffects(pokemon: Pokemon): void {
    // Register status effects
    const statusObj = status[pokemon.statusKey as keyof typeof status];
    if (statusObj) {
      for (const key of Object.keys(statusObj)) {
        const value = statusObj[key as keyof typeof statusObj];
        if (typeof value === 'function') {
          const hook = key as EffectHook;
          if (!this.hooks.has(hook)) {
            console.log(`Registering status hook : ${hook}`);
            this.hooks.set(hook, []);
          }
          if (!this.registeredStatusFunctions.has(hook)) {
            this.registeredStatusFunctions.set(hook, new Set());
          }
          const registeredFns = this.registeredStatusFunctions.get(hook)!;
          if (!registeredFns.has(value as Function)) {
            registeredFns.add(value as Function);
            console.log(`pushing status hook ${statusObj.name}: ${hook}`);
            this.hooks.get(hook)!.push((value as Function).bind(statusObj));
          }
        }
      }
    }
  }

  // To clear effects when a Pokemon leaves the battle
  public unregisterAllEffects() {
    console.log('hooks:', this.hooks);
    console.log('Unregistering all items/abilities/status effects', this.hooks);
    this.hooks.clear();
  }

  public unregisterMoveEffects() {
    console.log('moveHooks:', this.moveHooks);
    console.log('Unregistering all move effects : ', this.moveHooks);
    this.moveHooks.clear();
  }

  public unregisterItemFunctions() {
    console.log('registeredItemFunctions:', this.registeredItemFunctions);
    console.log('Unregistering all item functions');
    this.registeredItemFunctions.clear();
  }

  public unregisterStatusFunctions() {
    console.log('registeredStatusFunctions:', this.registeredStatusFunctions);
    console.log('Unregistering all status functions');
    this.registeredStatusFunctions.clear();
  }

  public resetEffects(firstPokemon: Pokemon, secondPokemon: Pokemon) {
    console.log('Resetting all effects');
    this.unregisterAllEffects();
    this.unregisterMoveEffects();
    this.unregisterItemFunctions();
    this.unregisterStatusFunctions();
    this.registerPokemonEffects(firstPokemon);
    this.registerPokemonEffects(secondPokemon);
    this.registerStatusEffects(firstPokemon);
    this.registerStatusEffects(secondPokemon);
  }

  public runHook(hook: EffectHook, context: any): any[] {
    const results: any[] = [];
    const functions = [
    ...(this.hooks.get(hook) || []),
    ...(this.moveHooks.get(hook) || [])
    ];
    console.log(`Running Hook for ${hook} with context :`, context);
    console.log(`Functions for ${hook}:`, functions);
    for (const fn of functions) {
      try {
        results.push(fn(context));
      } catch (error) {
        console.error(`Error occurred while running hook "${hook}" for function ${fn}:`, error);
      } 
    }
    return results;
  }

  public chainHook<T>(hook: EffectHook, initialValue: T, context: any): T {
    let value = initialValue;
    const functions = this.hooks.get(hook) || [];
    console.log(`Running chainHook for ${hook} with initial value:`, initialValue);
    console.log(`Functions for ${hook}:`, functions);
    for (const fn of functions) {
      console.log(`Running function:`, fn);
      try {
        if (typeof fn !== 'function') {
          throw new Error(`Hook "${hook}" is not a function`);
        }
      } catch (error) {
        console.error(`Error occurred while running hook "${hook}":`, error);
      }
      const result = fn(value, context);
      console.log('context:', context);
      console.log(`Result of function:`, result);
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
  public applyDamageModifierEffects(damage:number, context: any): number {
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