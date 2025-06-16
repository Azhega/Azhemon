import EventBus from '../../utils/EventBus';
import Store from '../../utils/Store';
import { Pokemon } from '../../models/PokemonModel';
import { PokemonMove } from '../../interfaces/PokemonInterface';
import { BattleState } from '../../interfaces/BattleInterface';
import { AudioManager } from '../../controllers/AudioManager';

export class BattleView {
  private isInitialized: boolean = false;
  private battleContainer: HTMLElement | null = null;
  private playerField: HTMLElement | null = null;
  private cpuField: HTMLElement | null = null;
  private battleLog: HTMLElement | null = null;
  private actionMenu: HTMLElement | null = null;
  private moveMenu: HTMLElement | null = null;
  private teamMenu: HTMLElement | null = null;
  private audioManager: AudioManager;
  private unsubscribe: () => void = () => {};
  
  constructor() {
    this.audioManager = AudioManager.getInstance();
    this.registerEventListeners();
  }
  
  initialize(): void {
    this.isInitialized = true;
    
    this.createBattleContainer();
    
    // Create battle field (CPU side and player side)
    this.createBattleField();
    
    this.createBattleLog();
    
    this.createActionMenu();

    this.createSoundToggle();

    this.createExitButton();
    
    this.render();

    this.audioManager.playBattleMusic();
  }

  destroy(): void {
    // Remove event listeners
    EventBus.off('battle:show-pokemon-selection');
    EventBus.off('battle:hide-pokemon-selection');
    EventBus.off('battle:play-move-animation');

    // Unsubscribe from the store
    if (this.unsubscribe) {
        this.unsubscribe();
        this.unsubscribe = () => {};
    }

    // Remove DOM elements
    if (this.battleContainer) {
        this.battleContainer.remove();
        this.battleContainer = null;
    }

    // Clear references to other elements
    this.playerField = null;
    this.cpuField = null;
    this.battleLog = null;
    this.actionMenu = null;
    this.moveMenu = null;
    this.teamMenu = null;
    this.isInitialized = false;

    this.audioManager.stopCurrentMusic();
  }
  
  private registerEventListeners(): void {
    EventBus.on('battle:show-pokemon-selection', (data?: any) => this.showTeamSelection(true, data?.leadSelection));
    EventBus.on('battle:hide-pokemon-selection', () => this.hideTeamSelection());

    EventBus.on('battle:play-move-animation', async (data: { 
      moveCategory: 'Physique' | 'Spécial' | 'Statut',
      attackerSide: 'player' | 'cpu',
      moveType: string
    }) => {
      console.log('BattleView: Received animation event:', data);
      await this.playMoveAnimation(data.moveCategory, data.attackerSide, data.moveType);
    });

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
    if (!this.battleContainer) { 
      console.error('Battle container not found');
      return;
    }

    this.battleLog = document.createElement('div');
    this.battleLog.className = 'battle-log';
    this.battleContainer.appendChild(this.battleLog);
  }
  
  private createActionMenu(): void {
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
  
  private createSoundToggle(): void {
    if (!this.battleContainer) {
      console.error('Battle container not found');
      return;
    }

    const soundToggle = document.createElement('div');
    soundToggle.className = 'sound-toggle';
    
    const soundIcon = document.createElement('div');
    soundIcon.className = 'sound-icon';
    soundIcon.textContent = '🔊';  // Default to sound on
    
    soundToggle.appendChild(soundIcon);
    
    soundToggle.addEventListener('click', () => {
      // Toggle mute state
      const isMuted = this.audioManager.toggleMute();

      soundIcon.textContent = isMuted ? '🔇' : '🔊';
      
      // Add animation class
      soundToggle.classList.add('clicked');
      
      // Remove animation class after animation completes
      setTimeout(() => {
        soundToggle.classList.remove('clicked');
      }, 300);
    });
    
    this.battleContainer.appendChild(soundToggle);
  }

  private createExitButton(): void {
    if (!this.battleContainer) {
      console.error('Battle container not found');
      return;
    }

    const exitButton = document.createElement('button');
    exitButton.className = 'exit-button';
    exitButton.textContent = 'Quitter';

    exitButton.addEventListener('click', () => {
      this.unsubscribe();
      EventBus.emit('battle:exit-battle'); // BattleController.exitBattle();
      this.audioManager.stopCurrentMusic();
      this.audioManager.playMenuMusic();
    });

    this.battleContainer.appendChild(exitButton);
  }

  private render(): void {
    if (!this.isInitialized) {
      console.error('Battle view not initialized');
      return;
    }

    const battleState = Store.getState().battle;
    
    if (!battleState) {
      console.error('Battle state not initialized');
      return;
    }
    
    this.renderPokemon(battleState);
    this.renderBattleLog(battleState);
  }

  private renderPokemon(battleState: BattleState): void {
    if (!this.playerField || !this.cpuField) {
      console.error('Player or CPU field not found');
      return;
    }

    if (!battleState.leadSelected) {
      // Clear existing content
      this.playerField.innerHTML = '';
      this.cpuField.innerHTML = '';
      return;
    }
    
    // Get active Pokemon
    const playerPokemon = battleState.activePokemon.player;
    const cpuPokemon = battleState.activePokemon.cpu;
    
    // Check if Pokemon changed before clearing
    const currentPlayerPokemonSlot = this.playerField.dataset.pokemonSlot;
    const currentCpuPokemonSlot = this.cpuField.dataset.pokemonSlot;

    if (currentPlayerPokemonSlot !== String(playerPokemon?.slot)) {
      this.playerField.innerHTML = '';
      this.playerField.dataset.pokemonSlot = String(playerPokemon?.slot);
    }

    if (currentCpuPokemonSlot !== String(cpuPokemon?.slot)) {
      this.cpuField.innerHTML = '';
      this.cpuField.dataset.pokemonSlot = String(cpuPokemon.slot);
    }
    
    this.renderPokemonSprite(this.playerField, playerPokemon!, 'player');
    this.renderPokemonSprite(this.cpuField, cpuPokemon, 'cpu');
  }

  private renderPokemonSprite(container: HTMLElement, pokemon: Pokemon, side: 'player' | 'cpu'): void {
    console.log(`BattleView : Rendering ${side} Pokemon:`, pokemon);
    // Check if elements already exist
    let spriteContainer = container.querySelector('.pokemon-battle-sprite') as HTMLElement;
    let dataContainer = container.querySelector('.pokemon-data') as HTMLElement;
    
    // Create sprite container only if it doesn't exist
    if (!spriteContainer) {
      spriteContainer = document.createElement('div');
      spriteContainer.className = 'pokemon-battle-sprite';
      container.appendChild(spriteContainer);
    }

    // Set sprite image based on pokemon name and side
    const spriteUrl = side === 'player' 
      ? `/src/public/images/sprites/${pokemon.name.toLowerCase()}/${pokemon.name.toLowerCase()}_back.gif`
      : `/src/public/images/sprites/${pokemon.name.toLowerCase()}/${pokemon.name.toLowerCase()}_face.gif`;    
    spriteContainer.style.backgroundImage = `url('${spriteUrl}')`;
    
    // Create data container only if it doesn't exist
    if (!dataContainer) {
      dataContainer = document.createElement('div');
      dataContainer.className = `pokemon-data ${side}-data`;
      container.appendChild(dataContainer);
      
      // Create static structure once
      const nameLevel = document.createElement('div');
      nameLevel.className = 'name-level';
      dataContainer.appendChild(nameLevel);
      
      const hpText = document.createElement('div');
      hpText.className = 'hp-text';
      dataContainer.appendChild(hpText);
      
      const hpBar = document.createElement('div');
      hpBar.className = 'hp-bar';
      
      const hpFill = document.createElement('div');
      hpFill.className = 'hp-fill';
      
      hpBar.appendChild(hpFill);
      dataContainer.appendChild(hpBar);
    }
    
    // Update existing elements
    const nameLevel = dataContainer.querySelector('.name-level') as HTMLElement;
    const hpText = dataContainer.querySelector('.hp-text') as HTMLElement;
    const hpFill = dataContainer.querySelector('.hp-fill') as HTMLElement;
    
    // Update name and level
    nameLevel.innerHTML = `<strong>${pokemon.name}</strong> Nv. ${pokemon.level}`;
    
    // Update status condition
    const existingStatus = nameLevel.querySelector('.status-icon');
    if (existingStatus) {
      existingStatus.remove();
    }
    
    if (pokemon.status) {
      const statusIcon = document.createElement('span');
      statusIcon.className = `${pokemon.statusKey === 'paralysis' ? 'status-icon status-par' 
      : `status-icon status-${pokemon.statusKey?.toLowerCase().replace(/[aeiou]/g, "")}`}`;
      statusIcon.innerHTML = `${pokemon.statusKey === 'paralysis' ? 'PAR' 
      : pokemon.statusKey?.toUpperCase().replace(/[AEIOU]/g, "")}`;
      nameLevel.appendChild(statusIcon);
    }
    
    // Update HP text
    hpText.textContent = `PV: ${pokemon.currentHp}/${pokemon.maxHp}`;
    
    // Update HP Bar width
    const hpPercentage = (pokemon.currentHp / pokemon.maxHp) * 100;
    
    // Remove existing HP level classes
    hpFill.classList.remove('hp-high', 'hp-medium', 'hp-low');
    
    // Add appropriate HP level class
    if (hpPercentage > 50) {
      hpFill.classList.add('hp-high');
    } else if (hpPercentage > 20) {
      hpFill.classList.add('hp-medium');
    } else {
      hpFill.classList.add('hp-low');
    }
    
    // Animated HP Bar
    hpFill.style.width = `${hpPercentage}%`;
  }
  
  private renderBattleLog(battleState: BattleState): void {
    if (!this.battleLog) {
      console.error('Battle log not found');
      return;
    }

    // Clear existing content
    this.battleLog.innerHTML = '';

    if (!battleState.leadSelected) {
      this.battleLog.innerHTML = '<h2>Choisissez un Pokémon !</h2>';
      return;
    }
    
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
    const battleState = Store.getState().battle;
    const playerPokemon = battleState.activePokemon.player;

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
    fightButton.className = 'battle-action-button';
    fightButton.textContent = 'Attaque';
    fightButton.onclick = () => {
      if (playerPokemon.moves.every((move: PokemonMove) => move.currentPP <= 0)) {
        console.log('No moves available, using struggle');
        if (this.actionMenu?.style.display) {
          const buttons = this.actionMenu.querySelectorAll('button');
          buttons.forEach(button => button.style.display = 'none');
        } 
        EventBus.emit('battle:select-move', { moveIndex: -1 });
        return;
      }
      this.showMoveSelection();
    }
    this.actionMenu.appendChild(fightButton);
    
    const pokemonButton = document.createElement('button');
    pokemonButton.className = 'battle-action-button';
    pokemonButton.textContent = 'Pokémon';
    pokemonButton.onclick = () => this.showTeamSelection(false);
    this.actionMenu.appendChild(pokemonButton);
  }

  private showMoveSelection(): void {
    if (!this.actionMenu || !this.moveMenu) {
      console.error('Action or move menu not found');
      return;
    }

    const battleState = Store.getState().battle;

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
        if (move.currentPP <= 0) {
          console.log('No more PP left for this move');
          return;
        }
        move.currentPP--;
        EventBus.emit('battle:select-move', { moveIndex: index });
        if (this.moveMenu) {
          const buttons = this.moveMenu.querySelectorAll('button');
          buttons.forEach(button => button.style.display = 'none');
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
    backButton.className = 'battle-back-button';
    backButton.textContent = 'Retour';
    backButton.style.gridColumn = '1 / -1';
    backButton.onclick = () => this.showActionSelection();
    this.moveMenu.appendChild(backButton);
  }
  
  private showTeamSelection(activePokemonFainted: boolean, leadSelection: boolean = false): void {
    if (!this.isInitialized) {
      return;
    }

    if (!this.actionMenu || !this.teamMenu) {
      console.error('Action or team menu not found', this.actionMenu, this.teamMenu);
      return;
    }
    
    const battleState = Store.getState().battle;
    
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
      const hpPercentage = (pokemon.currentHp / pokemon.maxHp) * 100;
      const borderColor = hpPercentage > 50 ? '#44ff44' : hpPercentage > 20 ? '#ffff44' : '#ff4444';
      teamButton.style.borderLeft = `5px solid ${borderColor}`;
      
      teamButton.innerHTML = `
        ${pokemon.name} Nv.${pokemon.level}<br>
        <small>PV: ${pokemon.currentHp}/${pokemon.maxHp}</small>
        ${isActive && isAlive ? '<br><small>(Actif)</small>' : ''}
        ${!isAlive ? '<br><small>(K.O.)</small>' : ''}
      `;
      
      if (leadSelection) {
        teamButton.onclick = () => {
          EventBus.emit('battle:lead-selected', { pokemonIndex: index });
          if (this.teamMenu) {
            // this.teamMenu.style.display = 'none';
            const buttons = this.teamMenu.querySelectorAll('button');
            buttons.forEach(button => button.style.display = 'none');
          }
        };
      } else if (!activePokemonFainted) {
        teamButton.onclick = () => {
          EventBus.emit('battle:switch-pokemon', { pokemonIndex: index });
          if (this.teamMenu) {
            // this.teamMenu.style.display = 'none';
            const buttons = this.teamMenu.querySelectorAll('button');
            buttons.forEach(button => button.style.display = 'none');
          }
        };
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
      backButton.className = 'battle-back-button';
      backButton.textContent = 'Retour';
      backButton.style.gridColumn = '1 / -1';
      backButton.onclick = () => this.showActionSelection();
      this.teamMenu.appendChild(backButton);
    }
  }

  private hideTeamSelection(): void {
    if (this.teamMenu) {
      const buttons = this.teamMenu.querySelectorAll('button');
      buttons.forEach(button => button.style.display = 'none');
    }
  }

  showBattleResult(result: 'won' | 'lost'): void {
    if (!this.actionMenu || !this.moveMenu || !this.teamMenu) {
      console.error('Action, move or team menu not found');
      return;
    }

    // Remove any existing result container
    if (this.battleContainer) {
      const existingResult = this.battleContainer.querySelector('.battle-result');
      if (existingResult) {
        existingResult.remove();
      }
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
    returnButton.className = 'back-to-menu-button';
    returnButton.textContent = 'Retour au menu';
    returnButton.onclick = () => {
      this.unsubscribe();
      EventBus.emit('battle:exit-battle'); // BattleController.exitBattle();
      this.audioManager.stopCurrentMusic();
      this.audioManager.playMenuMusic();
    }
    resultContainer.appendChild(returnButton);
    
    if (this.battleContainer) {
      this.battleContainer.appendChild(resultContainer);
      this.audioManager.playVictoryMusic();
    }
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

  public async playMoveAnimation(moveCategory: 'Physique' | 'Spécial' | 'Statut', 
    attackerSide: 'player' | 'cpu', moveType: string): Promise<void> {
    console.log('BattleView: Playing animation:', { moveCategory, attackerSide, moveType });

    return new Promise((resolve) => {
      const container = attackerSide === 'player' ? this.playerField : this.cpuField;
      const sprite = container?.querySelector('.pokemon-battle-sprite') as HTMLElement;
      
      if (!sprite) {
        console.warn('BattleView: No sprite found for', attackerSide);
        EventBus.emit('battle:animation-complete'); // For TurnManager to continue
        resolve();
        return;
      }

      const onComplete = () => {
        console.log('BattleView: Animation completed, emitting event');
        EventBus.emit('battle:animation-complete'); // For TurnManager to continue
        resolve();
      };

      console.log('BattleView: Found sprite, playing animation type:', moveCategory);

      switch (moveCategory) {
        case 'Physique':
          console.log('BattleView: Playing physical attack');
          this.playPhysicalAttack(sprite, onComplete);
          break;
        case 'Spécial':
          console.log('BattleView: Playing special attack');
          this.playSpecialAttack(sprite, attackerSide, moveType || 'normal', onComplete);
          break;
        case 'Statut':
          console.log('BattleView: Playing status attack');
          this.playStatusAttack(sprite, onComplete);
          break;
        default:
          console.warn('BattleView: Unknown move type:', moveCategory);
          onComplete();
      }
    });
  }

  // Adding and removing the class once will play the animation
  private playPhysicalAttack(sprite: HTMLElement, callback: () => void): void {
    console.log('BattleView: Adding physical-attack class to sprite');
    sprite.classList.add('physical-attack');
    
    setTimeout(() => {
      console.log('BattleView: Removing physical-attack class from sprite');
      sprite.classList.remove('physical-attack');
      callback();
    }, 800);
  }

  // Adding and removing the class once will play the animation
  private playSpecialAttack(sprite: HTMLElement, attackerSide: 'player' | 'cpu', moveType: string, callback: () => void): void {
    console.log('BattleView: Starting special attack animation for type:', moveType);
  
    // Start attacker animation
    sprite.classList.add('special-attack');
    
    // Create energy ball with type color
    const energyBall = document.createElement('div');
    const typeColor = this.getTypeColor(moveType);
    
    // Add type class and set custom properties for the gradient
    energyBall.className = `energy-ball`;
    energyBall.style.setProperty('--type-color-primary', typeColor);
    energyBall.style.setProperty('--type-color-secondary', this.adjustColor(typeColor, 30)); // Lighter version
    
    // Apply the custom background with type colors
    energyBall.style.background = `radial-gradient(circle, var(--type-color-secondary), var(--type-color-primary))`;
    energyBall.style.boxShadow = `0 0 20px var(--type-color-primary)`;
    
    console.log('BattleView: Created energy ball with color:', typeColor);
    
    // Position energy ball at attacker
    const spriteRect = sprite.getBoundingClientRect();
    const containerRect = sprite.closest('.battle-field')?.getBoundingClientRect();
    
    if (containerRect) {
      energyBall.style.left = `${spriteRect.left - containerRect.left + spriteRect.width/2}px`;
      energyBall.style.top = `${spriteRect.top - containerRect.top + spriteRect.height/2}px`;
      
      // Calculate target position
      const targetSide = attackerSide === 'player' ? 'cpu' : 'player';
      const targetContainer = targetSide === 'player' ? this.playerField : this.cpuField;
      const targetSprite = targetContainer?.querySelector('.pokemon-battle-sprite') as HTMLElement;
      
      if (targetSprite) {
        const targetRect = targetSprite.getBoundingClientRect();
        const targetX = targetRect.left - containerRect.left + targetRect.width/2 - (spriteRect.left - containerRect.left + spriteRect.width/2);
        const targetY = targetRect.top - containerRect.top + targetRect.height/2 - (spriteRect.top - containerRect.top + spriteRect.height/2);
        
        energyBall.style.setProperty('--target-x', `${targetX}px`);
        energyBall.style.setProperty('--target-y', `${targetY}px`);
      }
      
      sprite.closest('.battle-field')?.appendChild(energyBall);
    }
    
    setTimeout(() => {
      console.log('BattleView: Cleaning up special attack animation');
      sprite.classList.remove('special-attack');
      energyBall.remove();
      callback();
    }, 1000);
  }

  private adjustColor(color: string, amount: number): string {
    // Remove # if present
    color = color.replace('#', '');
    
    // Parse the color
    const r = parseInt(color.substring(0, 2), 16);
    const g = parseInt(color.substring(2, 4), 16);
    const b = parseInt(color.substring(4, 6), 16);
    
    // Adjust each channel
    const newR = Math.min(255, r + amount);
    const newG = Math.min(255, g + amount);
    const newB = Math.min(255, b + amount);
    
    // Convert back to hex
    return `#${newR.toString(16).padStart(2, '0')}${newG.toString(16).padStart(2, '0')}${newB.toString(16).padStart(2, '0')}`;
  }

  // Adding and removing the class once will play the animation
  private playStatusAttack(sprite: HTMLElement, callback: () => void): void {
    console.log('BattleView: Adding status-attack class to sprite');
    sprite.classList.add('status-attack');
    
    setTimeout(() => {
      console.log('BattleView: Removing status-attack class from sprite');
      sprite.classList.remove('status-attack');
      callback();
    }, 600);
  }
}