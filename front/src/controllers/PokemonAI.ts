// CPU AI Intelligence for Battle Decisions
import { Pokemon, PokemonMove } from '../models/PokemonModel';
import { BattleAction } from '../models/BattleModel';
import { BattleEngine } from './BattleEngine.ts';

export interface AIDecision {
  action: BattleAction;
  reasoning: string; // Debug
}

export class PokemonAI {
  private BattleEngine: BattleEngine;
  private reasoning: string[] = []; // Debug

  constructor() {
    this.BattleEngine = new BattleEngine();
  }

  private switchCounter: number = 0; // To limit switch frequency
  
  public makeDecision(cpuPokemon: Pokemon, playerPokemon: Pokemon, cpuTeam: Pokemon[]): AIDecision {
    this.reasoning = []; // Reset reasoning for each decision
    // Step 1: Check if switch is a good option
    this.reasoning.push(`CPU Decision: Evaluating switch for ${cpuPokemon.name} against ${playerPokemon.name}`);
    const shouldSwitch = this.shouldSwitch(cpuPokemon, playerPokemon, cpuTeam);
    
    if (shouldSwitch.shouldSwitch) {
      this.switchCounter++;
      this.reasoning.push(`CPU Decision: Switching to ${cpuTeam[shouldSwitch.bestPokemonIndex!].name} (score: ${shouldSwitch.bestScore})`);
      return {
        action: {
          type: 'switch',
          user: 'cpu',
          target: 'player',
          data: { pokemonIndex: shouldSwitch.bestPokemonIndex! }
        },
        reasoning: this.reasoning.join('\n')
      };
    }
    
    // Step 2: Choose a move
    this.reasoning.push(`CPU Decision: No switch, evaluating moves for ${cpuPokemon.name} against ${playerPokemon.name}`);
    this.switchCounter = Math.max(0, this.switchCounter - 1);
    const bestMove = this.selectBestMove(cpuPokemon, playerPokemon);
    bestMove.move!.currentPP = Math.max(0, bestMove.move!.currentPP! - 1);

    this.reasoning.push(`CPU Decision: Best move for ${cpuPokemon.name} against ${playerPokemon.name} is ${bestMove.move!.name} (score: ${bestMove.score})`);
    return {
      action: {
        type: 'move',
        user: 'cpu',
        target: 'player',
        data: { move: bestMove.move }
      },
      reasoning: this.reasoning.join('\n')
    };
  }
  
  private calculateMatchupScore(cpuPokemon: Pokemon, playerPokemon: Pokemon): number {
    const atkScore = this.calculateAttackScore(cpuPokemon, playerPokemon);
    this.reasoning.push(`CPU Decision: atkScore for ${cpuPokemon.name} against ${playerPokemon.name} : ${atkScore}`);
    const defScore = this.calculateDefenseScore(cpuPokemon, playerPokemon);
    this.reasoning.push(`CPU Decision: defScore for ${cpuPokemon.name} against ${playerPokemon.name} : ${defScore}`);
    const hpRatio = this.calculateHpRatio(cpuPokemon, playerPokemon);
    this.reasoning.push(`CPU Decision: hpRatio for ${cpuPokemon.name} against ${playerPokemon.name} : ${hpRatio}`);

    this.reasoning.push(`CPU Decision: Final MUScore for ${cpuPokemon.name} against ${playerPokemon.name} : ${(atkScore + defScore) * hpRatio}`);
    return (atkScore + defScore) * hpRatio;
  }
  
  private calculateAttackScore(cpuPokemon: Pokemon, playerPokemon: Pokemon): number {
    this.reasoning.push(`CPU Decision: Calculating atkScore for ${cpuPokemon.name} against ${playerPokemon.name}`);
    let attackScore = 1;
    
    for (const cpuPokemonType of cpuPokemon.types) {
      const effectiveness = this.BattleEngine.calculateTypeEffectiveness(cpuPokemonType, playerPokemon.types);
      attackScore *= effectiveness;
    }

    this.reasoning.push(`CPU Decision: Type effectiveness : ${cpuPokemon.name} against ${playerPokemon.name} : ${attackScore}`);

    // Outspeed bonus
    if (cpuPokemon.currentStats.speed > playerPokemon.currentStats.speed) {
      attackScore *= 1.25;
      this.reasoning.push(`CPU Decision: Outspeed bonus : ${cpuPokemon.currentStats.speed} > ${playerPokemon.currentStats.speed}`);
    }

    return attackScore;
  }

  private calculateDefenseScore(cpuPokemon: Pokemon, playerPokemon: Pokemon): number {
    this.reasoning.push(`CPU Decision: Calculating defScore for ${cpuPokemon.name} against ${playerPokemon.name}`);
    let defenseScore = 1;

    for (const playerPokemonType of playerPokemon.types) {
      const effectiveness = this.BattleEngine.calculateTypeEffectiveness(playerPokemonType, cpuPokemon.types);
      defenseScore *= effectiveness;
    }

    if (defenseScore === 0) {
      this.reasoning.push(`CPU Decision: Defense score is 0, setting to 0.1 to avoid division by zero`);
      defenseScore = 0.1;
    }

    this.reasoning.push(`CPU Decision: Type effectiveness : ${playerPokemon.name} against ${cpuPokemon.name} : ${defenseScore}`);
    this.reasoning.push(`CPU Decision: Final defScore : ${1 / defenseScore}`);

    // Return the inverse for defense score
    return 1 / defenseScore;
  }

  private calculateHpRatio(cpuPokemon: Pokemon, playerPokemon: Pokemon): number {
    this.reasoning.push(`CPU Decision: Calculating hpRatio for ${cpuPokemon.name} against ${playerPokemon.name}`);
    const cpuHpRatio = cpuPokemon.currentHp / cpuPokemon.maxHp;
    const playerHpRatio = playerPokemon.currentHp / playerPokemon.maxHp;

    let ratio = cpuHpRatio - playerHpRatio + 1;

    this.reasoning.push(`CPU Decision: cpuHpRatio: ${cpuHpRatio}, playerHpRatio: ${playerHpRatio}, ratio: ${ratio}`);

    // Outspeed bonus
    if (cpuPokemon.currentStats.speed > playerPokemon.currentStats.speed) {
      ratio *= 1.25;
      this.reasoning.push(`CPU Decision: Outspeed bonus, new ratio: ${ratio}`);
    }

    return Math.min(2, ratio);
  }
  
  private shouldSwitch(cpuCurrentPokemon: Pokemon, playerPokemon: Pokemon, cpuTeam: Pokemon[]): {
    shouldSwitch: boolean;
    bestPokemonIndex?: number;
    bestScore?: number;
  } {
    this.reasoning.push(`CPU Decision: Calculating CURRENT MUScore for ${cpuCurrentPokemon.name} against ${playerPokemon.name}`);
    let currentScore = this.calculateMatchupScore(cpuCurrentPokemon, playerPokemon);
    if (Object.values(cpuCurrentPokemon.statModifiers).some(boost => boost >= 2)) {
      currentScore *= 2;
    }

    let bestScore = 0;
    let bestPokemonIndex = -1;

    cpuTeam.forEach((cpuPokemon, index) => {
      if (cpuPokemon === cpuCurrentPokemon || !cpuPokemon.isAlive) return;

      this.reasoning.push(`CPU Decision: Calculating MUScore for ${cpuPokemon.name} against ${playerPokemon.name}`);
      const score = this.calculateMatchupScore(cpuPokemon, playerPokemon);
      if (score > bestScore) {
        bestScore = score;
        bestPokemonIndex = index;
        this.reasoning.push(`CPU Decision: New best score for ${cpuPokemon.name} : ${bestScore}`);
      }
    });
    
    // Multiplier to limit switch frequency
    const switchPenalty = Math.max(0.5, 1 - (this.switchCounter * 0.1));
    bestScore *= switchPenalty;

    this.reasoning.push(`CPU Decision: bestScore with switchPenalty = ${switchPenalty} : ${bestScore}`);

    const shouldSwitch = bestScore >= currentScore * 2;

    this.reasoning.push(`CPU Decision: shouldSwitch : ${shouldSwitch} (currentScore: ${currentScore}, bestScore: ${bestScore})`);
    
    return {
      shouldSwitch,
      bestPokemonIndex: shouldSwitch ? bestPokemonIndex : undefined,
      bestScore: shouldSwitch ? bestScore : undefined
    };
  }
  
  private selectBestMove(cpuPokemon: Pokemon, playerPokemon: Pokemon): {
    move: PokemonMove | null;
    score: number;
  } {
    const availableMoves = cpuPokemon.moves.filter(move => move?.currentPP! > 0);
    
    if (availableMoves.length === 0) {
      this.reasoning.push(`CPU Decision: No available moves for ${cpuPokemon.name}, using Struggle`);
      return {
        move: this.getStruggleMove(),
        score: 0
      };
    }
    
    this.reasoning.push(`CPU Decision: Calculating scores for moves of ${cpuPokemon.name} against ${playerPokemon.name}`);
    const moveScores = availableMoves.map(move => ({
      move,
      score: this.calculateMoveScore(move!, cpuPokemon, playerPokemon)
    }));
    
    // Sort by move score descending
    moveScores.sort((a, b) => b.score - a.score);
    this.reasoning.push(`CPU Decision: Move scores calculated: ${moveScores.map(ms => `${ms.move!.name} (${ms.score})`).join(', ')}`);
    
    return this.selectMove(moveScores);
  }
  
  private calculateMoveScore(move: PokemonMove, cpuPokemon: Pokemon, playerPokemon: Pokemon): number {
    this.reasoning.push(`CPU Decision: Calculating score for move ${move.name} (${move.moveKey}) of ${cpuPokemon.name} against ${playerPokemon.name}`);
    if (!move.power || move.power === 0 || move.category === 'Statut') {
      // Status move
      return this.calculateStatusMoveScore(move, cpuPokemon, playerPokemon);
    }
    
    // Attack move
    return this.calculateAttackMoveScore(move, cpuPokemon, playerPokemon);
  }
  
  private calculateAttackMoveScore(move: PokemonMove, cpuPokemon: Pokemon, playerPokemon: Pokemon): number {
    this.reasoning.push(`CPU Decision: Calculating attack move score for ${move.name} (${move.moveKey}) of ${cpuPokemon.name} against ${playerPokemon.name}`);
    const typeEffectiveness = this.BattleEngine.calculateTypeEffectiveness(move.type, playerPokemon.types);
    let typeMult = typeEffectiveness >= 2 ? 2 : -2;

    const immunityMult = playerPokemon.abilityKey === 'levitate' && move.type === 'Sol' ? 0 : 1;

    // Multiplier based on move category aligned with stats
    const isPhysical = move.category === 'Physique';
    const statRatio = isPhysical ?
      cpuPokemon.currentStats.specialAttack / cpuPokemon.currentStats.attack :
      cpuPokemon.currentStats.attack / cpuPokemon.currentStats.specialAttack;

    let statMult = 1;
    if (statRatio <= 0.75) statMult = 2;
    else if (statRatio <= 0.875) statMult = 1.5;
    
    const attackScore = (typeMult * statMult) + Math.floor(move.power / 5);
    this.reasoning.push(`CPU Decision: Attack score for ${move.name} (${move.moveKey}) : ${attackScore} (typeMult: ${typeMult}, statMult: ${statMult})`);
    
    let finalScore = attackScore;
    
    // STAB (Same Type Attack Bonus)
    if (cpuPokemon.types.includes(move.type)) {
      finalScore *= 1.5;
      this.reasoning.push(`CPU Decision: STAB bonus applied for ${move.name}`);
    }

    this.reasoning.push(`CPU Decision: Move Score for ${move.name} (${move.moveKey}) : ${finalScore}`);

    finalScore *= typeEffectiveness * immunityMult;

    this.reasoning.push(`CPU Decision: Final Move Score after applying typeEffectiveness for ${move.name} (${move.moveKey}) : ${finalScore}`);
    
    return finalScore;
  }
  
  private calculateStatusMoveScore(move: PokemonMove, cpuPokemon: Pokemon, playerPokemon: Pokemon): number {
    // WIP Status Move Score, don't know how to handle it yet
    // For now, return a fixed score
    this.reasoning.push(`CPU Decision: Status Move : ${move.name} (${move.moveKey}) of ${cpuPokemon.name} against ${playerPokemon.name}`);

    let moveScore = 5;

    const outspeedMult = cpuPokemon.currentStats.speed > playerPokemon.currentStats.speed ? 1.5 : 1;

    if (move.flags?.statusEffect) {
      let hpMult = cpuPokemon.currentHp > cpuPokemon.maxHp / 1.6 ? 2 : 0.5;
      let effectivenessMult = this.BattleEngine.calculateTypeEffectiveness(move.type, playerPokemon.types);
      let immunityMult = playerPokemon.types.includes(move.type) ? 0 : 1;
      let abilityMult = playerPokemon.abilityKey === 'magicGuard' ? 0 : 1;  
      let statusMult = !playerPokemon.statusKey ? 4 : 0;
      moveScore *= hpMult * effectivenessMult * immunityMult * statusMult * abilityMult * outspeedMult;
      this.reasoning.push(
        `CPU Decision: Status Move Score for ${move.name} (${move.moveKey}) : 
        ${moveScore} (hpMult: ${hpMult}, effectivenessMult: ${effectivenessMult}, 
        immunityMult: ${immunityMult}, statusMult: ${statusMult}, abilityMult: ${abilityMult}, 
        outspeedMult: ${outspeedMult})`
      );
    } else if (move.flags?.statEffect) {
      let statMult = 1.2;
      if (Object.values(cpuPokemon.statModifiers).some(boost => boost >= 2)) {
        statMult = 0.5;
      }

      let hpMult = cpuPokemon.currentHp > cpuPokemon.maxHp / 1.2 ? 2 : 0.5;
      let matchupMult = this.calculateMatchupScore(cpuPokemon, playerPokemon) > 4 ? 2 : 1;
      moveScore *= statMult * hpMult * matchupMult * outspeedMult;
      this.reasoning.push(
        `CPU Decision: Stat Effect Move Score for ${move.name} (${move.moveKey}) : 
        ${moveScore} (hpMult: ${hpMult}, matchupMult: ${matchupMult}, 
        statMult: ${statMult}, outspeedMult: ${outspeedMult})`
      );
    } else if (move.flags?.healEffect) {
      let healMult = cpuPokemon.currentHp < cpuPokemon.maxHp / 2 ? 2 : 1;
      moveScore *= healMult * outspeedMult;
      this.reasoning.push(
        `CPU Decision: Heal Effect Move Score for ${move.name} (${move.moveKey}) : 
        ${moveScore} (healMult: ${healMult}, outspeedMult: ${outspeedMult})`
      );
    }

    return moveScore;
  }
  
  private selectMove(moveScores: Array<{move: PokemonMove | null, score: number}>): {
    move: PokemonMove | null;
    score: number;
  } {
    this.reasoning.push(`CPU Decision: Selecting move from scores`);

    for (let i = 0 ; i < "moveScores".length ; i++) {
      if (i === moveScores.length - 1) {
        this.reasoning.push(`CPU Decision: Last move reached, selecting it: ${moveScores[i].move!.name} (${moveScores[i].score})`);
        // Last move, always take it
        return moveScores[i];
      }
      
      // The chance to advance to next move is proportional to how close the scores are to each other
      if ((Math.random() * 100) > Math.round((moveScores[i+1].score/moveScores[i].score) * 50)) {
        this.reasoning.push(`CPU Decision: Selected move: ${moveScores[i].move!.name} (${moveScores[i].score})`);
        return moveScores[i];
      }

      this.reasoning.push(`CPU Decision: Move ${moveScores[i].move!.name} (${moveScores[i].score}) not selected, moving to next`);
      
      // Advance to next move
    }
    
    this.reasoning.push(`CPU Decision: Fallback : ${moveScores[0].move!.name} (${moveScores[0].score})`);
    // Fallback
    return moveScores[0];
  }
  
  private getStruggleMove(): PokemonMove {
    return {
      moveKey: 'struggle',
      id: 0,
      name: 'Lutte',
      type: 'Normal',
      category: 'Physique',
      power: 50,
      accuracy: 100,
      pp: 1,
      currentPP: 1,
      priority: 0,
      description: 'Utilisé quand aucune autre attaque n\'est disponible, infligeant des dégâts de recul à l\'utilisateur.',
    };
  }

  public switchAfterKo(playerPokemon: Pokemon, cpuTeam: Pokemon[]): {
    newCpuPokemon: Pokemon;
    bestScore?: number;
  } {
    let bestScore = 0;
    let newCpuPokemon: Pokemon = cpuTeam[0]; // Default to first Pokémon

    cpuTeam.forEach((cpuPokemon) => {
      if (!cpuPokemon.isAlive) return;

      this.reasoning.push(`CPU Decision: Calculating MUScore for ${cpuPokemon.name} against ${playerPokemon.name}`);
      const score = this.calculateMatchupScore(cpuPokemon, playerPokemon);
      if (score > bestScore) {
        bestScore = score;
        newCpuPokemon = cpuPokemon;
        this.reasoning.push(`CPU Decision: New best score for ${cpuPokemon.name} : ${bestScore}`);
      }
    });

    this.reasoning.push(`CPU Decision: Switch to ${newCpuPokemon.name} (bestScore: ${bestScore})`);

    console.log(this.reasoning.join('\n')); // Debug output

    return {
      newCpuPokemon: newCpuPokemon,
      bestScore: bestScore
    };
  }
}