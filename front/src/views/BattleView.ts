import EventBus from '../utils/EventBus';
import Store from '../utils/Store';
import { Pokemon, PokemonMove } from '../models/PokemonModel';
import { BattleState } from '../models/BattleModel';

export class BattleView {
  private isInitialized: boolean = false;
  private battleContainer: HTMLElement | null = null;
  private playerField: HTMLElement | null = null;
  private cpuField: HTMLElement | null = null;
  private battleLog: HTMLElement | null = null;
  private actionMenu: HTMLElement | null = null;
  private moveMenu: HTMLElement | null = null;
  private teamMenu: HTMLElement | null = null;
  private unsubscribe: () => void = () => {};
  
  constructor() {
    this.registerEventListeners();
  }
  
  initialize(): void {
    this.isInitialized = true;
    console.log('Initializing battle view...');
    
    this.createBattleContainer();
    
    // Create battle field (CPU side and player side)
    this.createBattleField();
    
    this.createBattleLog();
    
    this.createActionMenu();
    
    this.render();
  }
  
  private registerEventListeners(): void {
    EventBus.on('battle:turn-start', (turnNumber) => this.onTurnStart(turnNumber));
    EventBus.on('battle:show-pokemon-selection', () => this.showTeamSelection(true));

    // Store changes
    const unsubscribe = Store.subscribe(() => {
      if (this.isInitialized) {
        this.render();
      }
    });

    this.unsubscribe = unsubscribe;
  }

  // When the player selects a Pokémon, emit the selection event
  onPokemonSelected(selectedPokemonIndex: number): void {
    EventBus.emit('battle:pokemon-selected', selectedPokemonIndex);
  }
  
  private createBattleContainer(): void {
    // Remove existing container if it exists
    const existingContainer = document.getElementById('battle-container');
    if (existingContainer) {
      existingContainer.remove();
    }
    
    // Create new container
    const battleScreen = document.getElementById('battle-screen');
    this.battleContainer = document.createElement('div');
    this.battleContainer.id = 'battle-container';
    this.battleContainer.className = 'battle-container';
    battleScreen?.appendChild(this.battleContainer);
  }
  
  private createBattleField(): void {
    console.log('Creating battle field...');
    if (!this.battleContainer) {
      console.error('Battle container not found');
      return;
    }

    // Create battle field container
    const battleField = document.createElement('div');
    battleField.className = 'battle-field';
    this.battleContainer.appendChild(battleField);
    
    // Create CPU field
    this.cpuField = document.createElement('div');
    this.cpuField.className = 'cpu-field';
    battleField.appendChild(this.cpuField);
    
    // Create player field
    this.playerField = document.createElement('div');
    this.playerField.className = 'player-field';
    battleField.appendChild(this.playerField);
  }

  private createBattleLog(): void {
    console.log('Creating battle log...');
    if (!this.battleContainer) { 
      console.error('Battle container not found');
      return;
    }

    this.battleLog = document.createElement('div');
    this.battleLog.className = 'battle-log';
    this.battleContainer.appendChild(this.battleLog);
  }
  
  private createActionMenu(): void {
    console.log('Creating action menu...');
    if (!this.battleContainer) {
      console.error('Battle container not found');
      return;
    }

    // Action menu
    this.actionMenu = document.createElement('div');
    this.actionMenu.className = 'action-menu';
    this.battleContainer.appendChild(this.actionMenu);
    
    // Move menu (initially hidden)
    this.moveMenu = document.createElement('div');
    this.moveMenu.className = 'move-menu';
    this.moveMenu.style.display = 'none';
    this.battleContainer.appendChild(this.moveMenu);
    
    // Team menu (initially hidden)
    this.teamMenu = document.createElement('div');
    this.teamMenu.className = 'team-menu';
    this.teamMenu.style.display = 'none';
    this.battleContainer.appendChild(this.teamMenu);
  }
  
  private render(): void {
    if (!this.isInitialized) {
      console.error('Battle view not initialized');
      return;
    }

    console.log('Rendering battle view...');
    const state = Store.getState();
    const battleState = state.battle;
    
    if (!battleState) {
      console.error('Battle state not initialized');
      return;
    }
    
    this.renderPokemon(battleState);
    this.renderBattleLog(battleState);
  }

  private renderPokemon(battleState: BattleState): void {
    console.log('Rendering Pokemon...');
    console.log('Battle state:', battleState);
    console.log('Player field:', this.playerField);
    console.log('CPU field:', this.cpuField);
    if (!this.playerField || !this.cpuField) {
      console.error('Player or CPU field not found');
      return;
    }

    // Clear existing content
    this.playerField.innerHTML = '';
    this.cpuField.innerHTML = '';
    
    // Get active Pokemon
    const playerPokemon = battleState.activePokemon.player;
    const cpuPokemon = battleState.activePokemon.cpu;
    
    this.renderPokemonSprite(this.playerField, playerPokemon, 'player');
    this.renderPokemonSprite(this.cpuField, cpuPokemon, 'cpu');
  }

  private renderPokemonSprite(container: HTMLElement, pokemon: Pokemon, side: 'player' | 'cpu'): void {
    console.log(`Rendering ${side} Pokemon:`, pokemon);
    // Create sprite container
    const spriteContainer = document.createElement('div');
    spriteContainer.className = 'pokemon-battle-sprite';
    
    // Set sprite image based on pokemon name and side
    const spriteUrl = side === 'player' 
      ? `/src/public/images/sprites/${pokemon.name.toLowerCase()}/${pokemon.name.toLowerCase()}_back.png`
      : `/src/public/images/sprites/${pokemon.name.toLowerCase()}/${pokemon.name.toLowerCase()}_face.png`;
      
    spriteContainer.style.backgroundImage = `url('${spriteUrl}')`;
    container.appendChild(spriteContainer);
    
    // Create data container
    const dataContainer = document.createElement('div');
    dataContainer.className = `pokemon-data ${side}-data`;
    
    // Pokemon name and level
    const nameLevel = document.createElement('div');
    nameLevel.innerHTML = `<strong>${pokemon.name}</strong> Nv. ${pokemon.level}`;
    
    // Status condition
    if (pokemon.status) {
      const statusIcon = document.createElement('span');
      statusIcon.className = `status-icon status-${pokemon.status.name.substring(0, 3)}`;
      nameLevel.appendChild(statusIcon);
    }
    
    dataContainer.appendChild(nameLevel);
    
    // HP display
    const hpText = document.createElement('div');
    hpText.textContent = `PV: ${pokemon.currentHp}/${pokemon.maxHp}`;
    dataContainer.appendChild(hpText);
    
    // HP bar
    const hpBar = document.createElement('div');
    hpBar.className = 'hp-bar';
    
    const hpPercentage = (pokemon.currentHp / pokemon.maxHp) * 100;
    const hpColor = hpPercentage > 50 ? '#44ff44' : hpPercentage > 20 ? '#ffff44' : '#ff4444';
    
    const hpFill = document.createElement('div');
    hpFill.className = 'hp-fill';
    hpFill.style.width = `${hpPercentage}%`;
    hpFill.style.backgroundColor = hpColor;
    
    hpBar.appendChild(hpFill);
    dataContainer.appendChild(hpBar);
    
    container.appendChild(dataContainer);
  }
  
  private renderBattleLog(battleState: BattleState): void {
    console.log('Rendering battle log...');
    console.log('Battle state:', battleState);
    console.log('Battle log:', this.battleLog);
    if (!this.battleLog) {
      console.error('Battle log not found');
      return;
    }

    // Clear existing content
    this.battleLog.innerHTML = '';
    
    // Add all log entries
    battleState.log.forEach(entry => {
      const logEntry = document.createElement('p');
      logEntry.textContent = entry;
      this.battleLog?.appendChild(logEntry);
    });
    
    // Scroll to bottom
    this.battleLog.scrollTop = this.battleLog.scrollHeight;
  }

  showActionSelection(): void {
    console.log('Showing action selection...');
    if (!this.actionMenu || !this.moveMenu || !this.teamMenu) {
      console.error('Action, move or team menu not found');
      return;
    }
    
    // Show action menu, hide other menus
    this.actionMenu.style.display = 'grid';
    this.moveMenu.style.display = 'none';
    this.teamMenu.style.display = 'none';
    
    // Clear existing content
    this.actionMenu.innerHTML = '';
    
    // Add action buttons
    const fightButton = document.createElement('button');
    fightButton.className = 'action-button';
    fightButton.textContent = 'Combat';
    fightButton.onclick = () => this.showMoveSelection();
    this.actionMenu.appendChild(fightButton);
    
    const pokemonButton = document.createElement('button');
    pokemonButton.className = 'action-button';
    pokemonButton.textContent = 'Pokémon';
    pokemonButton.onclick = () => this.showTeamSelection(false);
    this.actionMenu.appendChild(pokemonButton);
  }

  private showMoveSelection(): void {
    console.log('Showing move selection...');
    if (!this.actionMenu || !this.moveMenu) {
      console.error('Action or move menu not found');
      return;
    }
    
    const state = Store.getState();
    const battleState = state.battle;
    
    if (!battleState) {
      console.error('Battle state not initialized');
      return;
    }

    const playerPokemon = battleState.activePokemon.player;
    
    // Hide action menu, show move menu
    this.actionMenu.style.display = 'none';
    this.moveMenu.style.display = 'grid';
    
    // Clear existing content
    this.moveMenu.innerHTML = '';
    
    // Add move buttons
    playerPokemon.moves.forEach((move: PokemonMove, index: number) => {
      const moveButton = document.createElement('button');
      moveButton.className = 'move-button';
      moveButton.style.backgroundColor = this.getTypeColor(move.type);
      moveButton.innerHTML = `${move.name}<br><small>${move.type} | PP: ${move.currentPP}/${move.pp}</small>`;
      moveButton.onclick = () => {
        EventBus.emit('battle:select-move', { moveIndex: index });
        if (this.moveMenu) {
          this.moveMenu.style.display = 'none';
        }
      }
      this.moveMenu?.appendChild(moveButton);
    });
    
    // Add empty buttons to fill remaining slots
    const remainingSlots = 4 - playerPokemon.moves.length;
    for (let i = 0; i < remainingSlots; i++) {
      const emptyButton = document.createElement('button');
      emptyButton.className = 'move-button';
      emptyButton.disabled = true;
      emptyButton.textContent = '--';
      this.moveMenu.appendChild(emptyButton);
    }
    
    // Add back button
    const backButton = document.createElement('button');
    backButton.className = 'back-button';
    backButton.textContent = 'Retour';
    backButton.style.gridColumn = '1 / span 2';
    backButton.onclick = () => this.showActionSelection();
    this.moveMenu.appendChild(backButton);
  }
  
  private showTeamSelection(activePokemonFainted: boolean): void {
    if (!this.actionMenu || !this.teamMenu) {
      console.error('Action or team menu not found');
      return;
    }
    
    const state = Store.getState();
    const battleState = state.battle;
    
    if (!battleState) {
      console.error('Battle state not initialized');
      return;
    }

    const playerTeam = battleState.playerTeam;
    
    // Hide action menu, show team menu
    this.actionMenu.style.display = 'none';
    this.teamMenu.style.display = 'grid';
    if (this.moveMenu) {
      this.moveMenu.style.display = 'none';
    }
    
    // Clear existing content
    this.teamMenu.innerHTML = '';
    
    // Add team buttons
    playerTeam.forEach((pokemon: Pokemon, index: number) => {
      const teamButton = document.createElement('button');
      teamButton.className = 'team-button';
      
      // Disable button if pokemon is active or not alive
      const isActive = pokemon === battleState.activePokemon.player;
      const isAlive = pokemon.isAlive;
      
      if (isActive || !isAlive) {
        teamButton.disabled = true;
        teamButton.style.opacity = '0.5';
      }
      
      // HP percentage for color
      const hpPercentage = (pokemon.currentHp / pokemon.baseStats.hp) * 100;
      const borderColor = hpPercentage > 50 ? '#44ff44' : hpPercentage > 20 ? '#ffff44' : '#ff4444';
      teamButton.style.borderLeft = `5px solid ${borderColor}`;
      
      teamButton.innerHTML = `
        ${pokemon.name} Nv.${pokemon.level}<br>
        <small>PV: ${pokemon.currentHp}/${pokemon.baseStats.hp}</small>
        ${isActive ? '<br><small>(Actif)</small>' : ''}
        ${!isAlive ? '<br><small>(K.O.)</small>' : ''}
      `;
      
      if (!activePokemonFainted) {
        teamButton.onclick = () => {
          EventBus.emit('battle:switch-pokemon', { pokemonIndex: index });
          if (this.teamMenu) {
            this.teamMenu.style.display = 'none';
          }
        }
      } else {
        teamButton.onclick = () => this.onPokemonSelected(index);
      }
      
      this.teamMenu?.appendChild(teamButton);
    });
    
    // Add empty slots if team has less than 6 pokemon
    const remainingSlots = 6 - playerTeam.length;
    for (let i = 0; i < remainingSlots; i++) {
      const emptyButton = document.createElement('button');
      emptyButton.className = 'team-button';
      emptyButton.disabled = true;
      emptyButton.textContent = '--';
      this.teamMenu.appendChild(emptyButton);
    }
    
    if (!activePokemonFainted) {
      // Add back button
      const backButton = document.createElement('button');
      backButton.className = 'back-button';
      backButton.textContent = 'Retour';
      backButton.style.gridColumn = '1 / span 2';
      backButton.onclick = () => this.showActionSelection();
      this.teamMenu.appendChild(backButton);
    }
  }

  showBattleResult(result: 'won' | 'lost'): void {
    if (!this.actionMenu || !this.moveMenu || !this.teamMenu) {
      console.error('Action, move or team menu not found');
      return;
    }
    
    // Hide all menus
    this.actionMenu.style.display = 'none';
    this.moveMenu.style.display = 'none';
    this.teamMenu.style.display = 'none';
    
    // Create result screen
    const resultContainer = document.createElement('div');
    resultContainer.className = 'battle-result';
    resultContainer.style.backgroundColor = result === 'won' ? '#4caf50' : '#f44336';
    resultContainer.style.color = 'white';
    resultContainer.style.padding = '20px';
    resultContainer.style.display = 'flex';
    resultContainer.style.flexDirection = 'column';
    resultContainer.style.alignItems = 'center';
    resultContainer.style.justifyContent = 'center';
    
    const resultText = document.createElement('h2');
    resultText.textContent = result === 'won' ? 'Victoire !' : 'Défaite...';
    resultContainer.appendChild(resultText);
    
    const returnButton = document.createElement('button');
    returnButton.className = 'action-button';
    returnButton.textContent = 'Retour au menu';
    returnButton.style.marginTop = '20px';
    returnButton.onclick = () => {
      this.unsubscribe();
      EventBus.emit('battle:back-to-menu');
    }
    resultContainer.appendChild(returnButton);
    
    if (this.battleContainer) {
      this.battleContainer.appendChild(resultContainer);
    }
  }
  
  private onTurnStart(turnNumber: number): void {
    console.log(`Turn ${turnNumber} started`);
    // Additional turn start logic can be added here
  }

  private getTypeColor(type: string): string {
    const typeColors: Record<string, string> = {
      Normal: '#A8A878',
      Feu: '#F08030',
      Eau: '#6890F0',
      Électrik: '#F8D030',
      Plante: '#78C850',
      Glace: '#98D8D8',
      Combat: '#C03028',
      Poison: '#A040A0',
      Sol: '#E0C068',
      Vol: '#A890F0',
      Psy: '#F85888',
      Insecte: '#A8B820',
      Roche: '#B8A038',
      Spectre: '#705898',
      Dragon: '#7038F8',
      Ténèbres: '#705848',
      Acier: '#B8B8D0',
      Fée: '#EE99AC'
    };
    
    return typeColors[type] || '#888888';
  }
}