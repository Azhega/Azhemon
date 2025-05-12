import EventBus from '../utils/EventBus';
import Store from '../utils/Store';
import { Pokemon, PokemonMove } from '../models/PokemonModel';
import { BattleState } from '../models/BattleModel';

export class BattleView {
  private battleContainer: HTMLElement | null = null;
  private playerField: HTMLElement | null = null;
  private cpuField: HTMLElement | null = null;
  private battleLog: HTMLElement | null = null;
  private actionMenu: HTMLElement | null = null;
  private moveMenu: HTMLElement | null = null;
  private teamMenu: HTMLElement | null = null;
  
  constructor() {
    this.registerEventListeners();
  }
  
  initialize(): void {
    console.log('Initializing battle view...');
    
    this.createBattleContainer();
    
    // Create battle field (CPU side and player side)
    this.createBattleField();
    
    this.createBattleLog();
    
    this.createActionMenu();
    
    this.render();
  }
  
  private registerEventListeners(): void {
    // Store changes
    Store.subscribe(() => this.render());
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
    spriteContainer.className = 'pokemon-sprite';
    
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
    hpText.textContent = `PV: ${pokemon.currentHp}/${pokemon.baseStats.hp}`;
    dataContainer.appendChild(hpText);
    
    // HP bar
    const hpBar = document.createElement('div');
    hpBar.className = 'hp-bar';
    
    const hpPercentage = (pokemon.currentHp / pokemon.baseStats.hp) * 100;
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
}