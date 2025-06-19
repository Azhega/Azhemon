# Azhemon CPU AI Documentation

## Overview

The Azhemon battle system features an intelligent CPU opponent that makes strategic decisions during battles. This document explains how the AI evaluates situations and selects actions to provide a challenging gameplay experience.

## Decision Making Process

When it's the CPU's turn, the AI follows this decision-making flow:

1. **Evaluate current matchup** between its active Pokémon and your active Pokémon.
2. **Decide whether to switch** to a different Pokémon or use a move.
3. **If switching**, select the best counter Pokémon from the team.
4. **If staying in battle**, select the most effective move based on the situation.

## Matchup Evaluation

The AI uses a sophisticated scoring system that considers multiple factors to evaluate the current battle situation:

- **Attack Score**
  - *Type effectiveness*: How effective the CPU's Pokémon's types are against your Pokémon.
  - *Speed advantage*: CPU gets a 25% attack bonus if its Pokémon is faster.
- **Defense Score**
  - *Type resistance*: How well the CPU's Pokémon resists your Pokémon's types.
- **HP Ratio**
  - *Relative health*: Compares the percentage of remaining HP between both Pokémon.
  - *Speed bonus*: Additional 25% boost if the CPU's Pokémon is faster.

## Switching Logic

The AI decides whether to switch Pokémon based on:

- **Matchup comparison**: Calculates scores for each available Pokémon against your active Pokémon.
- **Stat boosts**: CPU is less likely to switch if its current Pokémon has accumulated positive stat changes.
- **Switch frequency penalty**: The AI avoids excessive switching through a penalty multiplier.
- **Threshold requirement**: The new Pokémon must have at least double the matchup score to trigger a switch.

After a Pokémon faints, the AI selects a replacement by evaluating matchup scores against your active Pokémon.

## Move Selection

When selecting a move, the AI:

- **Filters available moves**: Only considers moves with PP remaining.
- **Scores each move**: Based on multiple factors.
- **Introduces randomness**: To avoid predictable patterns.
- **Falls back to "Struggle"**: When no moves with PP remain.

### Attack Move Scoring Factors

- Type effectiveness (super effective moves score higher)
- STAB bonus (same-type attack bonus of 50%)
- Move power (higher base power increases score)
- Stat alignment (prefers moves that use the Pokémon's stronger attack stat)
- Type immunities (accounts for special immunities like Levitate)

### Status Move Scoring Factors

Status moves are evaluated based on:

- Current HP (higher HP makes status moves more attractive)
- Speed advantage (faster Pokémon benefit more from status moves)
- Status effect (scores higher if opponent has no status condition yet)
- Stat boosts (lower score if already has multiple stat boosts)
- Battle situation (favorable matchups make stat-boosting moves more attractive)

## Semi-Randomized Selection

To create more varied and unpredictable gameplay:

- Moves are sorted by score from highest to lowest.
- The AI doesn't always pick the highest-scoring move.
- The probability of selecting a lower-scored move depends on how close the scores are.

This creates a balance between optimal play and varied strategies.

## Debugging Features

The AI includes detailed reasoning for each decision, tracking:

- Why it chose to switch or use a move
- How each factor contributed to the decision
- Comparative scores between different options

This comprehensive system allows the CPU to make intelligent battle decisions that adapt to your team and strategy, providing a challenging and dynamic opponent.